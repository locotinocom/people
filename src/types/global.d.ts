// src/types/global.d.ts
import type { Swiper as SwiperType } from "swiper"

declare global {
  interface Window {
    gameSwiper?: SwiperType
    goToNextSlide?: () => void
  }
}

export {}
