import { SwiperSlide } from "swiper/react"
import SlideContent from "@layouts/SlideContent"
import type { ReactNode } from "react"

type SingleSlideProps = {
  id: number
  children: ReactNode
}

export default function SingleSlide({ id, children }: SingleSlideProps) {
  return (
    <SwiperSlide
      key={id}
      className="!h-full flex items-center justify-center overflow-hidden"
    >
      <SlideContent>{children}</SlideContent>
    </SwiperSlide>
  )
}
