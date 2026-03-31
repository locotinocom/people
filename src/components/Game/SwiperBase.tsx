import { Swiper } from "swiper/react"
import type { ReactNode } from "react"


type Props = {
  children: ReactNode
  direction?: "horizontal" | "vertical"
}

export default function SwiperBase({ children, direction = "vertical" }: Props) {
  return (
    <Swiper
    className="h-full w-full flex-1 bg-zinc-900 overflow-hidden"
  direction={direction}
  slidesPerView={1}
  nested
  observer
  observeParents
  watchSlidesProgress
  updateOnWindowResize={false}
    >
      {children}
    
    </Swiper>
  )
}
