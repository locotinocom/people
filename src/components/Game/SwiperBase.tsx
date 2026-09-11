import { Swiper } from "swiper/react"
import type { ReactNode } from "react"


type Props = {
  children: ReactNode
  direction?: "horizontal" | "vertical"
}

export default function SwiperBase({ children, direction = "vertical" }: Props) {
  // Der äußere Level-Swiper (GamePlay.tsx) ist fest vertical. Laut Swiper-Doku
  // ist `nested` NUR für einen inneren Swiper mit DERSELBEN Achse wie der
  // äußere gedacht - bei MultiSlide (Default: horizontal) greift das also
  // nicht und wird deshalb hier nicht gesetzt, um kein undokumentiertes
  // Verhalten zu riskieren.
  //
  // `touchMoveStopPropagation` ist die explizite, achsenunabhängige Sperre:
  // sie stoppt die Propagation von "touchmove" aus diesem inneren Swiper,
  // damit ein Wisch innerhalb einer Multi-Slide-Card (z.B. am letzten
  // inneren Slide weitergewischt) niemals den äußeren Level-Swiper bewegt.
  return (
    <Swiper
    className="h-full w-full flex-1 bg-zinc-900 overflow-hidden"
  direction={direction}
  slidesPerView={1}
  nested={direction === "vertical"}
  touchMoveStopPropagation
  observer
  observeParents
  watchSlidesProgress
  updateOnWindowResize={false}
    >
      {children}

    </Swiper>
  )
}
