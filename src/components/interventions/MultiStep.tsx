import { Swiper, SwiperSlide } from "swiper/react"
import type { ReactNode } from "react"

type MultiStepProps = {
  id: number
  slides: ReactNode[]
}

export default function MultiStep({ id, slides }: MultiStepProps) {
  return (
    console.log("Rendering MultiStep", { id, slides }),
    <Swiper
      key={`multi-${id}`}
      className="w-full h-full bg-zinc-900"
      direction="horizontal"
      slidesPerView={1}
      allowTouchMove={false}
      nested
      observer
      observeParents
      watchSlidesProgress
      updateOnWindowResize={false}
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={`${id}-${i}`} className="!h-full flex items-center justify-center">
          {slide}
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
