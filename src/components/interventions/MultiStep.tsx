import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import * as Templates from "."

type Slide = {
  template: string
  [key: string]: any
}

type Props = {
  slides: Slide[]
}

export default function MultiStep({ slides }: Props) {
  return (
    <Swiper direction="horizontal" slidesPerView={1} nested={true} className="w-full h-full">
      {slides.map((slide, i) => {
        const Component = (Templates as any)[slide.template]
        return (
          <SwiperSlide key={i}>
            {Component ? <Component {...slide} /> : <div>❌ Template nicht gefunden</div>}
          </SwiperSlide>
        )
      })}
    </Swiper>
  )
}
