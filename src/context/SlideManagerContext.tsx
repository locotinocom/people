import { createContext, useContext, useRef } from "react"
import type { Swiper as SwiperType } from "swiper"
import toast from "react-hot-toast"
import { useAppSelector } from "@store/hooks"
import { selectGame } from "@store/slices/gameSlice"

const DEBUG_SLIDES = import.meta.env.DEV && import.meta.env.VITE_DEBUG_SLIDES === "true"

export type SlideManagerIntervention = {
  id: number
  slug?: string | null
  level: number
}

type SlideManager = {
  setSwiper: (swiper: SwiperType) => void
  setInterventions: (interventions: SlideManagerIntervention[]) => void
  setNavigationSource: (source: string) => void
  getNavigationSource: () => string
  goNext: () => void
  goPrev: () => void
  goToCard: (id: string | number) => void
}

const SlideManagerContext = createContext<SlideManager | null>(null)
export const useSlideManager = () => useContext(SlideManagerContext)!

export function SlideManagerProvider({ children }: { children: React.ReactNode }) {
  const swiperRef = useRef<SwiperType | null>(null)
  const interventionsRef = useRef<SlideManagerIntervention[]>([])
  const navigationSourceRef = useRef("unknown")

  // Freigabe-Ergebnis der zuletzt abgeschlossenen Intervention (Schritt 5).
  // Kommt direkt aus Redux, kein Ref nötig - der Provider selbst rendert bei
  // jeder Änderung neu, goNext() unten sieht dadurch immer den aktuellen Wert.
  const advanceGate = useAppSelector(selectGame).advanceGate

  const setSwiper = (swiper: SwiperType) => {
    swiperRef.current = swiper
  }

  const setInterventions = (interventions: SlideManagerIntervention[]) => {
    interventionsRef.current = interventions
  }

  const setNavigationSource = (source: string) => {
    navigationSourceRef.current = source
  }
  const getNavigationSource = () => navigationSourceRef.current

  const goToCard = (id: string | number) => {
    if (import.meta.env.DEV) console.log("[goToCard] suche:", id, "in:", interventionsRef.current.map(i => i.id))

    const index = interventionsRef.current.findIndex((i) => i.id === id || i.slug === id)
    if (index !== -1) {
      navigationSourceRef.current = "slideTo()"
      // slideTo() funktioniert in beide Richtungen (auch rückwärts) - Swiper
      // kennt hier keine "nur vorwärts"-Einschränkung, anders als slideNext().
      swiperRef.current?.slideTo(index)
    } else {
      if (import.meta.env.DEV) console.warn(`[SlideManager] goToCard: "${id}" nicht gefunden`)
    }
  }

  const goPrev = () => {
    navigationSourceRef.current = "goPrev()"
    swiperRef.current?.slidePrev()
  }

  /**
   * Zentrale Weiter-Navigation - einziger Ort, an dem entschieden wird, ob
   * eine Levelgrenze überschritten werden darf. Wird von ~40
   * Intervention-Komponenten aufgerufen; die Logik hier lebt bewusst an
   * einer Stelle statt in jeder einzelnen Komponente.
   *
   * can_advance kommt IMMER vom Server (advanceGate, gesetzt in
   * completeInterventionThunk) - nie aus dem lokalen Card-Index abgeleitet.
   */
  const goNext = () => {
    const interventions = interventionsRef.current
    const swiper = swiperRef.current
    if (!swiper) return

    const activeIndex = swiper.activeIndex
    const current = interventions[activeIndex]
    const next = interventions[activeIndex + 1]

    // Kein Levelwechsel betroffen (letzte Card überhaupt, oder beide Cards
    // im selben Level): normale Navigation, unverändert wie bisher.
    if (!current || !next || current.level === next.level) {
      navigationSourceRef.current = "goNext()"
      swiper.slideNext()
      return
    }

    // Ab hier: die nächste Card gehört zu einem anderen (höheren) Level.
    // Serverfreigabe ist zwingend - ohne bekanntes Gate NIE weiterspringen.
    if (!advanceGate) {
      if (import.meta.env.DEV) {
        console.warn(
          "[SlideManager] goNext: Levelgrenze erreicht, aber keine Serverfreigabe bekannt - Navigation blockiert.",
          { currentId: current.id, nextId: next.id }
        )
      }
      return
    }

    if (advanceGate.can_advance) {
      const target = advanceGate.next_intervention_id
      if (target != null) {
        goToCard(target)
      } else {
        // Sollte praktisch nicht vorkommen (Server liefert can_advance=true
        // ohne next_intervention_id) - defensiv trotzdem nicht crashen.
        if (import.meta.env.DEV) {
          console.warn("[SlideManager] goNext: can_advance=true ohne next_intervention_id.", advanceGate)
        }
      }
      return
    }

    // Blockiert. Ruhiger Hinweis statt Fehlerton, dann zur offenen Card
    // zurück (kann RÜCKWÄRTS sein - goToCard()/slideTo() kann das).
    if (advanceGate.code === "mandatory_card_open" && advanceGate.open_intervention_id != null) {
      toast("Eine Übung aus diesem Level fehlt noch.", { icon: "↩️", duration: 4000 })
      if (DEBUG_SLIDES) {
        console.warn("[SlideManager] goNext: blockiert (mandatory_card_open), springe zu", advanceGate.open_intervention_id)
      }
      goToCard(advanceGate.open_intervention_id)
      return
    }

    // level_threshold_not_met (oder ein unbekannter Blockade-Grund ohne
    // offene Card): es gibt kein sinnvolles Sprungziel. Auf der aktuellen
    // Card bleiben statt irgendwohin zu springen.
    toast("Dieses Level ist noch nicht ganz abgeschlossen – schau kurz, ob noch etwas offen ist.", {
      icon: "⏳",
      duration: 4000,
    })
    // Das sollte nach der Pflicht-Card-Prüfung praktisch nicht mehr auftreten -
    // laut genug loggen, damit es beim Testen auffällt statt sich zu verstecken.
    console.warn("[SlideManager] goNext: blockiert ohne offene Card (unerwartet):", advanceGate)
  }

  return (
    <SlideManagerContext.Provider value={{ setSwiper, setInterventions, setNavigationSource, getNavigationSource, goNext, goPrev, goToCard }}>
      {children}
    </SlideManagerContext.Provider>
  )
}
