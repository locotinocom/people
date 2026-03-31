import { createContext, useContext, useRef } from "react"
import type { Swiper as SwiperType } from "swiper"

type SlideManager = {
  setSwiper: (swiper: SwiperType) => void
  setInterventions: (interventions: { id: string; slug?: string | null }[]) => void  // ← slug hinzu
  goNext: () => void
  goPrev: () => void
  goToCard: (id: string) => void
}

const SlideManagerContext = createContext<SlideManager | null>(null)
export const useSlideManager = () => useContext(SlideManagerContext)!

export function SlideManagerProvider({ children }: { children: React.ReactNode }) {
  const swiperRef = useRef<SwiperType | null>(null)
  const interventionsRef = useRef<{ id: string; slug?: string | null }[]>([])

  const setSwiper = (swiper: SwiperType) => {
    swiperRef.current = swiper
  }

  const setInterventions = (interventions: { id: string }[]) => {
    interventionsRef.current = interventions
  }

  const goNext = () => swiperRef.current?.slideNext()
  const goPrev = () => swiperRef.current?.slidePrev()

  const goToCard = (id: string) => {
    if (import.meta.env.DEV) console.log("[goToCard] suche:", id, "in:", interventionsRef.current.map(i => i.id))

    const index = interventionsRef.current.findIndex(    (i) => i.id === id || i.slug === id    // ← number ODER string
)
    if (index !== -1) {
      swiperRef.current?.slideTo(index)
    } else {
      if (import.meta.env.DEV) console.warn(`[SlideManager] goToCard: "${id}" nicht gefunden`)
    }
  }

  return (
    <SlideManagerContext.Provider value={{ setSwiper, setInterventions, goNext, goPrev, goToCard }}>
      {children}
    </SlideManagerContext.Provider>
  )
}