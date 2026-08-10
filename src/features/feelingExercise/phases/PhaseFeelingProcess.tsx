// src/features/feelingExercise/phases/PhaseFeelingProcess.tsx
// Phase 6 – Geführter Fühl-Prozess (dunkler, beruhigender Screen)
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppSelector } from "@store/hooks"
import type { EmotionType } from "../types"
import FeelingBubbles from "../components/FeelingBubbles"
import { getEmotionConfig } from "../constants/emotionConfig"

interface Props {
  emotion: EmotionType
  onComplete: () => void
}

// Mapping EmotionType → emotions_standalone Dateiname
const EMOTION_TO_FILE: Record<EmotionType, string> = {
  stressed: "stressed",
  angry: "angry",
  guilty_ashamed: "guilty_ashamed",
  fear: "fear",
  sad_disappointed: "sad_disappointed",
  neutral: "default",
}

function AvatarHeadLarge({ avatarKey, emotion }: { avatarKey: string; emotion: EmotionType }) {
  const emotionFile = EMOTION_TO_FILE[emotion]
  const baseSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_base.svg`
  const emotionSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_${emotionFile}.svg`
  const topSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_top.svg`

  return (
    <div className="relative w-28 h-28 rounded-full overflow-hidden">
      <img
        src={baseSrc}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
        style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
      <img
        src={emotionSrc}
        alt={emotion}
        draggable={false}
        className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
        style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
      <img
        src={topSrc}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
        style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    </div>
  )
}

export default function PhaseFeelingProcess({ emotion, onComplete }: Props) {
  const [eyesTipVisible, setEyesTipVisible] = useState(true)
  const avatarId = useAppSelector((s) => s.avatar.avatar?.avatar_id ?? "eva")
  const avatarKey = (avatarId === "tim" || avatarId === "eva" ? avatarId : "eva").toLowerCase()
  const config = getEmotionConfig(emotion)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col h-full text-white relative"
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #111827 50%, #0f172a 100%)",
      }}
    >
      {/* Sanfter Farbakzent im Hintergrund */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${config.color}18 0%, transparent 60%)`,
        }}
      />

      {/* Inhalt */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-10 px-6">
        {/* Augen-Tipp */}
        <AnimatePresence>
          {eyesTipVisible && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-xs text-white/30 text-center"
              onAnimationComplete={() => {
                // Tipp nach 4s ausblenden
                setTimeout(() => setEyesTipVisible(false), 4000)
              }}
            >
              Du kannst die Augen schließen ✦
            </motion.p>
          )}
        </AnimatePresence>

        {/* Avatar-Kopf (groß, zentriert) */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div
              className="rounded-full p-1"
              style={{
                boxShadow: `0 0 40px 12px ${config.color}33`,
              }}
            >
              <AvatarHeadLarge avatarKey={avatarKey} emotion={emotion} />
            </div>
          </motion.div>

          {/* Animierte Sprechblasen */}
          <div className="min-h-[80px] flex items-center">
            <FeelingBubbles emotion={emotion} accentColor={config.color} />
          </div>
        </div>

        {/* Fertig-Button (unauffällig) */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          onClick={onComplete}
          className="text-sm text-white/30 hover:text-white/60 transition-colors py-2 px-4"
        >
          Ich bin fertig
        </motion.button>
      </div>
    </motion.div>
  )
}
