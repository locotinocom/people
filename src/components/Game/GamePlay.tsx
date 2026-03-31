import { Swiper, SwiperSlide } from "swiper/react"
import SingleSlide from "./SingleSlide"
import MultiSlide from "./MultiSlide"
import { useSlideManager } from "@context/SlideManagerContext"
import { useRef, useEffect, useState, useMemo, memo } from "react"
// Redux
import { useAppSelector } from "@store/hooks"
import { selectData } from "@store/slices/dataSlice"
import { selectGame } from "@store/slices/gameSlice"

// Templates dynamisch importieren
const modules = import.meta.glob("../interventions/*.tsx", { eager: true })
const componentMap: Record<string, React.ComponentType<{ data: any }>> = {}

for (const path in modules) {
  const mod = modules[path] as { default?: React.ComponentType<{ data: any }> }
  const name = path.split("/").pop()?.replace(".tsx", "") ?? ""
  if (mod.default) componentMap[name] = mod.default
}

// ---------------------------------------------------------------------------
// LAZY SLIDE WRAPPER
// ---------------------------------------------------------------------------
// Rendert den Inhalt nur wenn der Slide "in der Nähe" des aktiven Slides ist.
// Slides außerhalb des Fensters zeigen einen leeren Platzhalter → kein Mount,
// kein useEffect, keine API-Calls für nicht-sichtbare Interventionen.
//
// RENDER_WINDOW = 2 bedeutet: aktiver Slide ± 2 Nachbarn werden gerendert.
// Das sind maximal 5 gemountete Slides gleichzeitig statt 178.
const RENDER_WINDOW = 2

type LazySlideProps = {
  index: number
  activeIndex: number
  children: React.ReactNode
}

const LazySlide = memo(function LazySlide({ index, activeIndex, children }: LazySlideProps) {
  // Einmal gemountet → bleibt gemountet (hasBeenActive-Flag)
  // Verhindert dass bereits besuchte Slides beim Zurückswipen neu mounten
  const hasBeenActiveRef = useRef(false)
  const isNear = Math.abs(index - activeIndex) <= RENDER_WINDOW

  if (isNear) {
    hasBeenActiveRef.current = true
  }

  if (!hasBeenActiveRef.current) {
    // Platzhalter: gleiche Größe wie echter Slide, aber kein Content-Mount
    return <div className="w-full h-full" />
  }

  return <>{children}</>
})

export default function Gameplay() {
  const { setSwiper, setInterventions } = useSlideManager()
  const { interventions, isLoading } = useAppSelector(selectData)
  const { currentInterventionId } = useAppSelector(selectGame)
  
  const swiperRef = useRef<any>(null)
  const [activeSkippable, setActiveSkippable] = useState(false)
  // Aktiver Slide-Index für LazySlide-Windowing.
  // Wird beim onSwiper-Callback auf initialSlideIndex gesetzt,
  // damit beim ersten Render die richtigen Slides im Fenster liegen.
  const [activeIndex, setActiveIndex] = useState(0)
  // Zählt wie oft interventions geladen wurden (0 = noch nie, 1 = erster Load, 2+ = Reload nach LevelUp)
  const interventionLoadCountRef = useRef(0)
  // State statt Ref: garantiert dass Effect 3b NACH Effect 2 läuft (React batcht State-Updates)
  const [pendingLevelUpJump, setPendingLevelUpJump] = useState(false)

  // 1. Daten-Parsing mit useMemo (Wichtig: Vor den bedingten Returns!)
  const parsedInterventions = useMemo(() => {
    if (!interventions) return []

  return interventions.map((raw: any) => {
    const props = typeof raw.props === "string" ? JSON.parse(raw.props || "{}") : raw.props || {}
    return {
      id: raw.id,
      slug: props.slug ?? null,        // ← aus props, nicht raw
      type: raw.type ?? "single",
      template: raw.template ?? "Info",
      props,
      slides:
        typeof raw.slides === "string"
          ? JSON.parse(raw.slides || "[]")
          : Array.isArray(raw.slides)
          ? raw.slides
          : [],
      skippable: raw.skippable ?? false,
      xp: raw.xp ?? 0,
    }
  })
}, [interventions])
//console.log(interventions[0])

  // 2. SlideManager synchronisieren + Lade-Zähler erhöhen
useEffect(() => {
  if (parsedInterventions.length) {
    setInterventions(parsedInterventions)
    const prevCount = interventionLoadCountRef.current
    interventionLoadCountRef.current += 1
    // Beim Reload (2. Laden+) → Jump-State setzen, damit Effect 3b einmalig springt
    if (prevCount >= 1) {
      setPendingLevelUpJump(true)
    }
  }
}, [parsedInterventions])

  // 3. Swiper-Logik (Event Handler)
  useEffect(() => {
    if (!swiperRef.current?.swiper || !parsedInterventions.length) return

    const swiper = swiperRef.current.swiper
    window.gameSwiper = swiper

    const handleSlideChange = () => {
      const current = parsedInterventions[swiper.activeIndex]
      setActiveSkippable(current?.skippable ?? false)
      // LazySlide-Windowing: aktiven Index tracken damit Nachbar-Slides gerendert werden
      setActiveIndex(swiper.activeIndex)
    }

    swiper.on("slideChange", handleSlideChange)
    
    // Initial-Check
    const start = parsedInterventions[swiper.activeIndex]
    setActiveSkippable(start?.skippable ?? false)
    setActiveIndex(swiper.activeIndex)

    return () => {
      swiper.off("slideChange", handleSlideChange)
    }
  }, [parsedInterventions])

  // 3b. Nach LevelUp: Swiper EINMALIG auf den richtigen Slide springen.
  // Feuert nur wenn pendingLevelUpJump === true (gesetzt in Effect 2 beim Reload).
  // Nach dem Jump wird der State zurückgesetzt → kein ungewolltes Springen bei normalem Spielfortschritt.
  // State statt Ref garantiert dass dieser Effect NACH Effect 2 läuft (React State-Batching).
  useEffect(() => {
    if (!pendingLevelUpJump) return
    if (!swiperRef.current?.swiper || !parsedInterventions.length) return

    // State sofort zurücksetzen → weitere Änderungen lösen keinen Jump aus
    setPendingLevelUpJump(false)

    const swiper = swiperRef.current.swiper

    // Index der nächsten Intervention nach der zuletzt abgeschlossenen
    const completedIdx = currentInterventionId != null
      ? parsedInterventions.findIndex((i) => i.id === currentInterventionId)
      : -1
    // Nächste Slide = completedIdx + 1, oder 0 wenn nicht gefunden
    const targetIdx = completedIdx >= 0 ? completedIdx + 1 : 0
    const clampedIdx = Math.min(targetIdx, parsedInterventions.length - 1)

    if (swiper.activeIndex !== clampedIdx) {
      swiper.slideTo(clampedIdx, 0) // 0ms = kein Animations-Delay
    }

    // slideChange-Event feuert bei slideTo() nicht automatisch →
    // skippable + allowTouchMove direkt setzen
    const targetIntervention = parsedInterventions[clampedIdx]
    const isSkippable = targetIntervention?.skippable ?? false
    setActiveSkippable(isSkippable)
    swiper.allowTouchMove = isSkippable
    // LazySlide-Windowing: activeIndex aktualisieren damit neue Nachbar-Slides gerendert werden
    setActiveIndex(clampedIdx)
  }, [pendingLevelUpJump, parsedInterventions, currentInterventionId])

  // 4. Touch-Sperre basierend auf skippable
  useEffect(() => {
    const swiper = swiperRef.current?.swiper
    if (!swiper) return
    swiper.allowTouchMove = activeSkippable
  }, [activeSkippable])

  // --- Bedingte Returns erst NACH allen Hooks ---
  if (isLoading)
    return <div className="p-6 text-zinc-400">Lade…</div>

  if (!parsedInterventions.length)
    return <div className="p-6 text-zinc-400">Keine Daten vorhanden.</div>

  // currentInterventionId = zuletzt abgeschlossene Intervention
  // → initialSlide soll auf die NÄCHSTE Intervention zeigen (completedIdx + 1)
  const completedIdx = parsedInterventions.findIndex(
    (i) => i.id === currentInterventionId
  )
  const initialSlideIndex = completedIdx >= 0
    ? Math.min(completedIdx + 1, parsedInterventions.length - 1)
    : 0

  return (
    <Swiper
      ref={swiperRef}
      className="h-full w-full flex-1 bg-zinc-900 overflow-hidden game-swiper"
      direction="vertical"
      slidesPerView={1}
      allowTouchMove={false}
      nested
      observer
      observeParents
      watchSlidesProgress
      updateOnWindowResize={false}
      initialSlide={initialSlideIndex}
      onSwiper={(swiper) => {
        swiperRef.current = { swiper }
        setSwiper(swiper)
        window.gameSwiper = swiper
        // LazySlide: initialen activeIndex setzen damit die richtigen
        // Slides beim ersten Render im Render-Fenster liegen
        setActiveIndex(swiper.activeIndex)
      }}
    >
      {parsedInterventions.map((intervention, index) => {
        const { id, type, template, props, slides } = intervention
        const Template = componentMap[template]

        if (!Template)
          return (
            <SwiperSlide key={id}>
              <LazySlide index={index} activeIndex={activeIndex}>
                <div className="text-zinc-400 p-6">
                  Kein Template gefunden: {template}
                </div>
              </LazySlide>
            </SwiperSlide>
          )

        if (type === "single") {
          return (
            <SwiperSlide
              key={id}
              className="!h-full flex items-center justify-center"
            >
              <LazySlide index={index} activeIndex={activeIndex}>
                <SingleSlide id={id}>
                  <Template data={{ ...props, id, type, template, xp: intervention.xp }} />
                </SingleSlide>
              </LazySlide>
            </SwiperSlide>
          )
        }

        if (type === "multi") {
          const slideList = Array.isArray(slides) ? slides : (props.slides || [])

          const slideContents = slideList.map(
            (s: { template: string; props?: any }, i: number) => {
              const T = componentMap[s.template]
              if (!T) return <div key={i}>Template fehlt: {s.template}</div>
              
              const p = typeof s.props === "string" ? JSON.parse(s.props || "{}") : s.props || {}
              return <T key={i} data={{ ...p, parentId: id }} />
            }
          )

          return (
            <SwiperSlide key={id} className="!h-full">
              <LazySlide index={index} activeIndex={activeIndex}>
                <MultiSlide id={id} slides={slideContents} />
              </LazySlide>
            </SwiperSlide>
          )
        }

        return null
      })}
    </Swiper>
  )
}