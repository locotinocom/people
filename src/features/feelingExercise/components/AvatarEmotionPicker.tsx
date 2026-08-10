// src/features/feelingExercise/components/AvatarEmotionPicker.tsx
// Avatar-Kopf mit Emotion-Varianten – 6 Emotionen nebeneinander
import { motion } from "framer-motion"
import clsx from "clsx"
import { useAppSelector } from "@store/hooks"
import type { EmotionType } from "../types"
import { EMOTION_CONFIGS } from "../constants/emotionConfig"

interface Props {
  selected: EmotionType | null
  onSelect: (emotion: EmotionType) => void
}

// Mapping von EmotionType → AvatarRender-Emotion-String
// AvatarRender nutzt camera="head" mit emotions_standalone-Assets
const EMOTION_TO_AVATAR: Record<EmotionType, string> = {
  stressed: "stressed",
  angry: "angry",
  guilty_ashamed: "guilty_ashamed",
  fear: "fear",
  sad_disappointed: "sad_disappointed",
  neutral: "neutral",
}

interface AvatarHeadProps {
  avatarKey: string
  emotion: EmotionType
  isSelected: boolean
  accentColor: string
  label: string
  onSelect: () => void
}

function AvatarHead({ avatarKey, emotion, isSelected, accentColor, label, onSelect }: AvatarHeadProps) {
  const emotionFile = EMOTION_TO_AVATAR[emotion]

  // Layers für Kopf-Rendering (analog zu AvatarRender camera="head")
  const baseSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_base.svg`
  const emotionSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_${emotionFile}.svg`
  const topSrc = `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_top.svg`

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      className={clsx(
        "flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-200",
        "focus:outline-none"
      )}
    >
      {/* Avatar-Kopf */}
      <div
        className={clsx(
          "relative w-14 h-14 rounded-full overflow-hidden transition-all duration-200",
          isSelected ? "ring-offset-2 ring-offset-gray-900" : "ring-1 ring-white/10"
        )}
        style={
          isSelected
            ? {
                outline: `2px solid ${accentColor}`,
                outlineOffset: "2px",
                boxShadow: `0 0 16px 4px ${accentColor}55`,
              }
            : {}
        }
      >
        {/* Hintergrund */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isSelected
              ? `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`
              : "rgba(255,255,255,0.03)",
          }}
        />

        {/* SVG-Layer: base */}
        <img
          src={baseSrc}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
          style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
          onError={(e) => {
            // Fallback: Element ausblenden wenn Asset fehlt
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />

        {/* SVG-Layer: emotion */}
        <img
          src={emotionSrc}
          alt={label}
          draggable={false}
          className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
          style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />

        {/* SVG-Layer: hair_top */}
        <img
          src={topSrc}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none"
          style={{ transform: "translateX(-50%) translateY(-5%) scale(1)" }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
          }}
        />
      </div>

      {/* Label */}
      <span
        className={clsx(
          "text-xs font-medium text-center leading-tight transition-colors duration-200",
          isSelected ? "font-semibold" : "text-white/50"
        )}
        style={isSelected ? { color: accentColor } : {}}
      >
        {label}
      </span>
    </motion.button>
  )
}

export default function AvatarEmotionPicker({ selected, onSelect }: Props) {
  const avatarId = useAppSelector((s) => s.avatar.avatar?.avatar_id ?? "eva")
  const avatarKey = (avatarId === "tim" || avatarId === "eva" ? avatarId : "eva").toLowerCase()

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3 justify-items-center max-w-xs mx-auto">
        {EMOTION_CONFIGS.map((config) => (
          <AvatarHead
            key={config.key}
            avatarKey={avatarKey}
            emotion={config.key}
            isSelected={selected === config.key}
            accentColor={config.color}
            label={config.label}
            onSelect={() => onSelect(config.key)}
          />
        ))}
      </div>
    </div>
  )
}
