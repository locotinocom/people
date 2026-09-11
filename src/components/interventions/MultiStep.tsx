/** @orphan-check-start
 * Auto-generated von check-orphaned-templates.js — bitte nicht von Hand editieren.
 * Zuletzt geprüft: 2026-08-10
 * Status: UNREFERENZIERT — in keinem Level 1-21 als template genutzt
 * Hinweis: Vor dem Löschen prüfen: evtl. Tool-Menü, künftige Level oder bewusst reserviert.
 * @orphan-check-end */
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
