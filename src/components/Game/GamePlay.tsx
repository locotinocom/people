import { Swiper, SwiperSlide } from "swiper/react"
import SingleSlide from "./SingleSlide"
import MultiSlide from "./MultiSlide"
import { useSlideManager } from "@context/SlideManagerContext"
import { useRef, useEffect, useState, useMemo, memo } from "react"
// Redux
import { useAppSelector, useAppDispatch } from "@store/hooks"
import { selectData } from "@store/slices/dataSlice"
import { selectGame, fetchProgress } from "@store/slices/gameSlice"
import { getCompletionDebugState } from "@store/slices/gameActionsSlice"
import { useReduxApi } from "@api/reduxApi"

const DEBUG_SLIDES = import.meta.env.DEV && import.meta.env.VITE_DEBUG_SLIDES === "true"

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

// ---------------------------------------------------------------------------
// CONDITION EVALUATION
// ---------------------------------------------------------------------------
// Hilfsfunktion: Condition evaluieren
function evaluateCondition(condition: any, userProfile: any): boolean {
  if (!condition) return true
  
  const { field, equals, not_equals } = condition
  if (!field) return true
  
  // Nested field access (z.B. "meta.l12_check_1")
  const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }
  
  const value = getValue(userProfile, field)
  
  // Debug logging
  if (import.meta.env.DEV && field.includes('l12')) {
    console.log('[Condition Debug]', {
      field,
      value,
      valueType: typeof value,
      equals,
      equalsType: typeof equals,
      not_equals,
      userProfile: (userProfile as any)?.meta,
      result: equals !== undefined ? value === equals : (not_equals !== undefined ? value !== not_equals : true)
    })
  }
  
  if (equals !== undefined) {
    return value === equals
  }
  
  if (not_equals !== undefined) {
    return value !== not_equals
  }
  
  return true
}

export default function Gameplay() {
  const { setSwiper, setInterventions, setNavigationSource, getNavigationSource } = useSlideManager()
  const { interventions, isLoading } = useAppSelector(selectData)
  const { currentInterventionId } = useAppSelector(selectGame)
  const userProfile = useAppSelector((state) => state.session.user)
  const dispatch = useAppDispatch()
  const api = useReduxApi()

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
    const condition = typeof raw.condition === "string" ? JSON.parse(raw.condition || "null") : raw.condition || null
    return {
      id: raw.id,
      slug: props.slug ?? null,        // ← aus props, nicht raw
      level: raw.level,
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
      condition,
    }
  })
}, [interventions])
//console.log(interventions[0])

  // 1b. Filtern nach Conditions
  const filteredInterventions = useMemo(() => {
    const filtered = parsedInterventions.filter(intervention => 
      evaluateCondition(intervention.condition, userProfile)
    )
    
    if (import.meta.env.DEV) {
      console.log('[Filtered Interventions]', {
        total: parsedInterventions.length,
        filtered: filtered.length,
        removed: parsedInterventions.length - filtered.length,
        userProfile: (userProfile as any)?.meta
      })
    }
    
    return filtered
  }, [parsedInterventions, userProfile])

  const completedIdxForStart = filteredInterventions.findIndex(
    (i) => i.id === currentInterventionId
  )
  const initialSlideIndex = completedIdxForStart >= 0
    ? Math.min(completedIdxForStart + 1, Math.max(0, filteredInterventions.length - 1))
    : 0

  // 1c. Stale currentInterventionId erkennen (nicht mehr stumm auf Index 0 fallen).
  // currentInterventionId kommt aus Redux/localStorage und kann veraltet sein
  // (z.B. nach einem Levelwechsel, der die geladenen Interventionen ersetzt hat).
  // currentInterventionId === null ist dagegen legitim (User hat schlicht noch
  // keinen Fortschritt) und wird NICHT als "stale" behandelt.
  const staleIdWarnedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!filteredInterventions.length) return
    if (currentInterventionId == null) return
    if (completedIdxForStart !== -1) return
    if (staleIdWarnedRef.current === currentInterventionId) return
    staleIdWarnedRef.current = currentInterventionId

    if (import.meta.env.DEV) {
      console.warn(
        "[GamePlay] Stale currentInterventionId:",
        currentInterventionId,
        "nicht unter den geladenen Interventionen gefunden - lade Serverstand neu statt auf Index 0 zu fallen.",
        { loaded: filteredInterventions.map((i) => i.id) }
      )
    }

    if (!api) return
    let cancelled = false
    ;(async () => {
      await dispatch(fetchProgress(api))
      // Nach dem Reload: Effect 3b (unten) per pendingLevelUpJump auf den
      // dann aktuellen currentInterventionId springen lassen. Bleibt er
      // weiterhin unauffindbar, springt Effect 3b bewusst (und diesmal
      // begründet gewarnt) auf Index 0.
      if (!cancelled) setPendingLevelUpJump(true)
    })()
    return () => {
      cancelled = true
    }
  }, [filteredInterventions, currentInterventionId, completedIdxForStart, api, dispatch])

  useEffect(() => {
    if (!DEBUG_SLIDES) return
    console.log("[slides:mount]", {
      startIndex: initialSlideIndex,
      currentInterventionId,
      length: filteredInterventions.length,
      order: filteredInterventions.map((intervention) => intervention.id),
    })
  }, [currentInterventionId, filteredInterventions, initialSlideIndex])

  // 2. SlideManager synchronisieren + Lade-Zähler erhöhen
useEffect(() => {
  if (filteredInterventions.length) {
    setInterventions(filteredInterventions)
    const prevCount = interventionLoadCountRef.current
    interventionLoadCountRef.current += 1
    // Beim Reload (2. Laden+) → Jump-State setzen, damit Effect 3b einmalig springt
    if (prevCount >= 1) {
      setPendingLevelUpJump(true)
    }
  }
}, [filteredInterventions])

  // 3. Swiper-Logik (Event Handler)
  useEffect(() => {
    if (!swiperRef.current?.swiper || !filteredInterventions.length) return

    const swiper = swiperRef.current.swiper
    window.gameSwiper = swiper

    const focusActiveSlide = () => {
      const activeSlide = swiper.slides[swiper.activeIndex] as HTMLElement | undefined
      if (!activeSlide) return
      activeSlide.tabIndex = -1
      activeSlide.focus({ preventScroll: true })
    }

    const handleSlideChange = () => {
      const previousIndex = swiper.previousIndex
      const current = filteredInterventions[swiper.activeIndex]
      const completion = previousIndex >= 0
        ? getCompletionDebugState(filteredInterventions[previousIndex]?.id)
        : undefined
      if (DEBUG_SLIDES) {
        console.log("[slides:change]", {
          previousIndex,
          newIndex: swiper.activeIndex,
          interventionId: current?.id,
          trigger: getNavigationSource(),
          leftCardCompletion: completion ?? { called: false },
        })
      }
      setActiveSkippable(current?.skippable ?? false)
      // LazySlide-Windowing: aktiven Index tracken damit Nachbar-Slides gerendert werden
      setActiveIndex(swiper.activeIndex)
      focusActiveSlide()
    }
    const handleTouchStart = () => setNavigationSource("touch/swipe")
    const handleMousewheel = () => setNavigationSource("mousewheel")
    const handleKeyPress = () => setNavigationSource("keyboard")

    swiper.on("slideChange", handleSlideChange)
    swiper.on("touchStart", handleTouchStart)
    swiper.on("mousewheel", handleMousewheel)
    swiper.on("keyPress", handleKeyPress)
    
    // Initial-Check
    const start = filteredInterventions[swiper.activeIndex]
    setActiveSkippable(start?.skippable ?? false)
    setActiveIndex(swiper.activeIndex)
    focusActiveSlide()

    return () => {
      swiper.off("slideChange", handleSlideChange)
      swiper.off("touchStart", handleTouchStart)
      swiper.off("mousewheel", handleMousewheel)
      swiper.off("keyPress", handleKeyPress)
    }
  }, [filteredInterventions])

  // 3b. Nach LevelUp: Swiper EINMALIG auf den richtigen Slide springen.
  // Feuert nur wenn pendingLevelUpJump === true (gesetzt in Effect 2 beim Reload).
  // Nach dem Jump wird der State zurückgesetzt → kein ungewolltes Springen bei normalem Spielfortschritt.
  // State statt Ref garantiert dass dieser Effect NACH Effect 2 läuft (React State-Batching).
  useEffect(() => {
    if (!pendingLevelUpJump) return
    if (!swiperRef.current?.swiper || !filteredInterventions.length) return

    // State sofort zurücksetzen → weitere Änderungen lösen keinen Jump aus
    setPendingLevelUpJump(false)

    const swiper = swiperRef.current.swiper

    // Index der nächsten Intervention nach der zuletzt abgeschlossenen
    const completedIdx = currentInterventionId != null
      ? filteredInterventions.findIndex((i) => i.id === currentInterventionId)
      : -1
    // Nächste Slide = completedIdx + 1, oder 0 wenn nicht gefunden
    const targetIdx = completedIdx >= 0 ? completedIdx + 1 : 0
    const clampedIdx = Math.min(targetIdx, filteredInterventions.length - 1)

    if (swiper.activeIndex !== clampedIdx) {
      swiper.slideTo(clampedIdx, 0) // 0ms = kein Animations-Delay
    }

    // slideChange-Event feuert bei slideTo() nicht automatisch →
    // skippable + allowTouchMove direkt setzen
    const targetIntervention = filteredInterventions[clampedIdx]
    const isSkippable = targetIntervention?.skippable ?? false
    setActiveSkippable(isSkippable)
    swiper.allowTouchMove = isSkippable
    // LazySlide-Windowing: activeIndex aktualisieren damit neue Nachbar-Slides gerendert werden
    setActiveIndex(clampedIdx)
  }, [pendingLevelUpJump, filteredInterventions, currentInterventionId])

  // 4. Touch-Sperre basierend auf skippable
  useEffect(() => {
    const swiper = swiperRef.current?.swiper
    if (!swiper) return
    swiper.allowTouchMove = activeSkippable
  }, [activeSkippable])

  // 5. Harte Levelgrenze: slideNext() (Touch, Mousewheel, Keyboard, oder ein
  // programmatischer .slideNext()-Aufruf) darf eine Levelgrenze NIE
  // überschreiten - unabhängig davon, ob die aktuelle Card skippable ist.
  // Das schließt genau die Lücke, die allowTouchMove (oben, nur nach
  // skippable gestaffelt) für eine skippable letzte Card eines Levels offen
  // lässt. Der einzige erlaubte Weg über die Grenze ist ein slideTo() (via
  // goToCard()) nach bestätigter Serverfreigabe, siehe
  // SlideManagerContext.goNext() - slideTo() ignoriert allowSlideNext bewusst.
  useEffect(() => {
    const swiper = swiperRef.current?.swiper
    if (!swiper) return

    const current = filteredInterventions[activeIndex]
    const next = filteredInterventions[activeIndex + 1]
    const atLevelBoundary = Boolean(current && next && current.level !== next.level)

    swiper.allowSlideNext = !atLevelBoundary

    if (DEBUG_SLIDES && atLevelBoundary) {
      console.log("[slides:boundary]", {
        activeIndex,
        currentLevel: current?.level,
        nextLevel: next?.level,
      })
    }
  }, [activeIndex, filteredInterventions])

  // --- Bedingte Returns erst NACH allen Hooks ---
  if (isLoading)
    return <div className="p-6 text-zinc-400">Lade…</div>

  if (!filteredInterventions.length)
    return <div className="p-6 text-zinc-400">Keine Daten vorhanden.</div>

  // currentInterventionId = zuletzt abgeschlossene Intervention
  // → initialSlide soll auf die NÄCHSTE Intervention zeigen (completedIdx + 1)
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
      {filteredInterventions.map((intervention, index) => {
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
