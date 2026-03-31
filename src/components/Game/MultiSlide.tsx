import { SwiperSlide } from "swiper/react"
import SwiperBase from "./SwiperBase"
import SlideContent from "@layouts/SlideContent"
import type { ReactNode } from "react"

type MultiSlideProps = {
  id: number
  slides: ReactNode[] // Inhalte der einzelnen Slides
  direction?: "horizontal" | "vertical"
}

/**
 * MultiSlide
 * ----------
 * Präsentationskomponente für mehrere horizontale Slides.
 * Wird z. B. in Gameplay.tsx verwendet, wenn eine Intervention mehrere Schritte hat.
 */
export default function MultiSlide({
  id,
  slides,
  direction = "horizontal",
}: MultiSlideProps) {
  return (
    <SwiperBase direction={direction}>
      {slides.map((content, index) => (
        <SwiperSlide
          key={`${id}-${index}`}
          className="h-full overflow-hidden items-center justify-center flex flex-col"
        >
          <SlideContent>{content}</SlideContent>
        </SwiperSlide>
      ))}
    </SwiperBase>
  )
}
