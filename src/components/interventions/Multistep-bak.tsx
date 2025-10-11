import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import * as Templates from "."
import InterventionSuccess from "./InterventionSuccess"
import { useGame } from "../../context/GameContext"

type Slide = { template: string; [key: string]: any }

type Props = {
  slides: Slide[]
  successXp?: number
  onAllDone: () => Promise<void> | void
  onComplete?: () => void
}

export default function MultiStep({ slides, successXp = 20, onAllDone, onComplete }: Props) {
  const [finished, setFinished] = useState(false)
  const doneOnce = useRef(false)
  const successTriggered = useRef(false)
  const stepLockRef = useRef<Record<number, boolean>>({}) // 👈 moved hierhin

  const { avatarName, avatarId } = useGame()
  console.log("👤 Aktueller Avatar:", { avatarName, avatarId })

  return (
    <Swiper direction="horizontal" slidesPerView={1} nested className="w-full h-full">
      {slides.map((slide, i) => {
        const Component = (Templates as any)[slide.template]
        const isLast = i === slides.length - 1

        const mergedProps = {
          ...slide,
          ...slide.props,
          xp: slide.xp ?? 0,
          avatarName,
          avatarId,
        }

        const onStepComplete = async () => {
          if (stepLockRef.current[i]) return
          stepLockRef.current[i] = true

          if (slide.xp && slide.xp > 0) {
            window.dispatchEvent(new CustomEvent("grant-xp", { detail: slide.xp }))
          }

          onComplete?.()

          if (!isLast) {
            (document.querySelector(".swiper-initialized.swiper-horizontal") as any)?.swiper?.slideNext()
            return
          }

          if (doneOnce.current) return
          doneOnce.current = true
          setFinished(true)
          setTimeout(() => {
            (document.querySelector(".swiper-initialized.swiper-horizontal") as any)?.swiper?.slideNext()
          }, 0)
        }

        return (
          <SwiperSlide key={i}>
            <div className="flex items-center justify-center h-full bg-zinc-800">
              {Component ? (
                <Component {...mergedProps} onComplete={onStepComplete} />
              ) : (
                <div>❌ Template nicht gefunden {slide.template}</div>
              )}
            </div>
          </SwiperSlide>
        )
      })}

      {finished && (
        <SwiperSlide>
          <div className="flex items-center justify-center h-full bg-zinc-900">
            <InterventionSuccess
              xp={Number(successXp) || 0}
              onReady={() => {
                if (successTriggered.current) return
                successTriggered.current = true
                console.log("🏁 MultiStep → Success onReady einmalig ausgeführt")
                onAllDone?.()
              }}
            />
          </div>
        </SwiperSlide>
      )}
    </Swiper>
  )
}
