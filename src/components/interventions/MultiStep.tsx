import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import * as Templates from "."
import InterventionSuccess from "./InterventionSuccess"

type Slide = { template: string; [key: string]: any }

type Props = {
  slides: Slide[]
  successXp?: number
  onAllDone: () => Promise<void> | void
}

export default function MultiStep({ slides, successXp = 20, onAllDone }: Props) {
  const [finished, setFinished] = useState(false)
  const doneOnce = useRef(false)

  return (
    <Swiper direction="horizontal" slidesPerView={1} nested className="w-full h-full">
      {slides.map((slide, i) => {
        const Component = (Templates as any)[slide.template]
        const isLast = i === slides.length - 1

        const onComplete = async () => {
          if (!isLast) {
            // Weiter zur nächsten inhaltlichen Slide
            const el = document.querySelector(".swiper-initialized.swiper-horizontal") as any
            el?.swiper?.slideNext()
            return
          }

          // Letzte inhaltliche Slide abgeschlossen → Success-Slide anzeigen
          if (doneOnce.current) return
          doneOnce.current = true

          setFinished(true)

          // Nach dem Rendern zur Success-Slide wechseln
          setTimeout(() => {
            const el = document.querySelector(".swiper-initialized.swiper-horizontal") as any
            el?.swiper?.slideNext()
          }, 0)

          // WICHTIG: NICHT hier onAllDone() aufrufen.
          // Das passiert auf der Success-Slide via onReady (siehe unten).
        }

        return (
          <SwiperSlide key={i}>
            <div className="flex items-center justify-center h-full bg-zinc-800">
              {Component ? (
                <Component {...slide} onComplete={onComplete} />
              ) : (
                <div>❌ Template nicht gefunden</div>
              )}
            </div>
          </SwiperSlide>
        )
      })}

      {finished && (
        <SwiperSlide>
          <div className="flex items-center justify-center h-full bg-zinc-900">
            {/* Hier wird onAllDone erst auf der Success-Slide getriggert */}
            <InterventionSuccess xp={successXp} onReady={onAllDone} />
          </div>
        </SwiperSlide>
      )}
    </Swiper>
  )
}
