import { useEffect } from "react"
import { motion } from "framer-motion"
import { useSwiperSlide } from "swiper/react"
import AvatarRender from "../AvatarRender"
import type { Emotion, Pose, Camera } from "../AvatarRender"

type InfoProps = {
  title?: string
  message: string
  level?: number
  bubble?: boolean
  fullBodyAvatar?: boolean
  emotion?: Emotion
  pose?: Pose
  camera?: Camera
  autoComplete?: boolean
  onComplete?: () => void
}

export default function Info({
  title = "Info",
  message,
  level = 1,
  bubble = false,
  fullBodyAvatar = false,
  emotion = "happy",
  pose = "standing",
  camera = "head",
  autoComplete = false,
  onComplete,
}: InfoProps) {
  const avatarName = localStorage.getItem("avatarName") || "Begleiter"
  const { isActive } = useSwiperSlide()

  useEffect(() => {
    if (!autoComplete || !onComplete || !isActive) return
    if (import.meta.env.DEV) console.log("⏳ Info: Timer gestartet (Slide ist aktiv)")
    const timer = setTimeout(() => {
      if (import.meta.env.DEV) console.log("✅ Info: onComplete nach 2s (aktiver Slide)")
      onComplete()
    }, 50)
    return () => {
      clearTimeout(timer)
      if (import.meta.env.DEV)
        console.log("🧹 Info: Timer gecleart (Slide wurde inaktiv/Unmount)")
    }
  }, [autoComplete, onComplete, isActive])

  if (bubble) {
    if (import.meta.env.DEV)
      console.log("💬 Info: Bubble-Variante (isActive:", isActive, ")")
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 relative">
        <div className="flex items-start gap-2.5">
          <div
            className={
              fullBodyAvatar
                ? "flex-shrink-0 w-30 h-120 flex items-center justify-center"
                : "w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-white"
            }
          >
            <AvatarRender
              name={avatarName}
              emotion={emotion}
              pose={pose}
              camera={camera}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 bg-zinc-900 rounded-e-xl rounded-es-xl shadow-md text-gray-100">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-sm font-semibold text-white">{avatarName}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-2">{title} 🎉</h2>
            <p className="text-sm font-normal py-2.5 text-gray-200">{message}</p>
          </div>
        </div>

        {level === 1 && (
          <motion.div
            className="absolute bottom-10 flex flex-col items-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className="text-white text-sm mb-1">Nach oben wischen</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l-7-7-7 7" />
            </svg>
          </motion.div>
        )}
      </div>
    )
  }

  if (import.meta.env.DEV) console.log("🧾 Info: Klassisch (isActive:", isActive, ")")

  return (
    <div className="flex flex-col h-full w-full items-center justify-center text-center px-6 relative">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{title} 🎉</h1>
      <p className="text-lg md:text-xl text-white leading-relaxed mb-16 whitespace-pre-line">
        {message} 🤩✨
      </p>

      {level === 1 && (
        <motion.div
          className="absolute bottom-10 flex flex-col items-center"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <span className="text-white text-sm mb-1">Nach oben wischen</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l-7-7-7 7" />
          </svg>
        </motion.div>
      )}
    </div>
  )
}
