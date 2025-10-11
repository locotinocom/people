import { useRef, useEffect, memo } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import * as Templates from "."
import { useGame } from "../../context/GameContext"

type Slide = { template: string; skippable?: boolean; [key: string]: any }

type Props = {
  slides: Slide[]
  successXp?: number
  onAllDone: () => Promise<void> | void
  onComplete?: () => void // behalten, falls später genutzt
}

function MultiStep({ slides, successXp = 20, onAllDone }: Props) {
  const swiperRef = useRef<any>(null)
  const doneOnce = useRef(false)
  const stepLockRef = useRef<Record<number, boolean>>({})
  const { avatarName, avatarId } = useGame()

  useEffect(() => {
    console.log("🧱 MultiStep MOUNT")
    return () => console.log("💀 MultiStep UNMOUNT")
  }, [])

  // letzten Slide standardmäßig freigeben
  useEffect(() => {
    if (slides.length > 0 && slides[slides.length - 1].skippable === undefined) {
      slides[slides.length - 1].skippable = true
      if (import.meta.env.DEV)
        console.log("🧩 Letzter Slide automatisch auf skippable gesetzt (Dankesseite)")
    }
  }, [slides])

  const unlockVerticalSwiper = () => {
    const outerSwiper = document.querySelector(".swiper-initialized.swiper-vertical") as any
    if (outerSwiper?.swiper) {
      outerSwiper.swiper.allowTouchMove = true
      outerSwiper.swiper.update()
    }
    document
      .querySelectorAll(".outer-no-swipe, .swiper-no-swiping")
      .forEach((el) => el.classList.remove("outer-no-swipe", "swiper-no-swiping"))
    if (import.meta.env.DEV)
      console.log("🔓 Vertikales Swipen global erlaubt + CSS-Blockaden entfernt")
  }

  if (!avatarId) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 text-white">
        Lade Avatar …
      </div>
    )
  }

  return (
    <Swiper
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      direction="horizontal"
      slidesPerView={1}
      nested
      className="w-full h-full"
      noSwiping
      noSwipingClass="swiper-no-swiping"
      observer
      observeParents
      watchSlidesProgress
      updateOnWindowResize={false}
      virtual={false}
    >
      {slides.map((slide, i) => {
        const Component = (Templates as any)[slide.template]
        const isLast = i === slides.length - 1
        const nonSwipeClass = slide.skippable === false ? "swiper-no-swiping" : ""

        const mergedProps = {
          ...slide.props,
          xp: slide.xp ?? 0,
          avatarName,
          avatarId,
        }

        const onStepComplete = async (cancelled?: boolean) => {
          const swiper = swiperRef.current
          if (!swiper) return
          if (stepLockRef.current[i]) return
          stepLockRef.current[i] = true

          if (cancelled) {
            if (import.meta.env.DEV)
              console.log("❌ MultiStep: abgebrochen, kein XP, kein Wechsel")
            unlockVerticalSwiper()
            return
          }

          if (!isLast) {
            if (import.meta.env.DEV)
              console.log(`➡️ MultiStep: Slide [${i}] abgeschlossen → weiter zu [${i + 1}]`)
            swiper.slideNext()
            return
          }

          if (!doneOnce.current) {
            doneOnce.current = true
            const xpValue = Number(slide.xp ?? successXp ?? 0)
            if (xpValue > 0) {
              window.dispatchEvent(new CustomEvent("grant-xp", { detail: xpValue }))
              if (import.meta.env.DEV) console.log(`💎 XP vergeben: ${xpValue}`)
            }

            unlockVerticalSwiper()

            setTimeout(() => {
              if (import.meta.env.DEV)
                console.log("🏁 MultiStep vollständig abgeschlossen → onAllDone()")
              onAllDone?.()
            }, 600)
          }
        }

        return (
          <SwiperSlide key={i} className={`!h-full ${nonSwipeClass}`}>
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
    </Swiper>
  )
}

export default memo(MultiStep, (prev, next) => {
  return (
    prev.successXp === next.successXp &&
    prev.onAllDone === next.onAllDone &&
    prev.onComplete === next.onComplete &&
    JSON.stringify(prev.slides) === JSON.stringify(next.slides)
  )
})
