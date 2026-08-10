// src/features/feelingExercise/phases/PhaseIntensityBefore.tsx
// Phase 5 – Intensität vor dem Fühlen (Skala 1–10)
import { motion } from "framer-motion"
import clsx from "clsx"
import type { EmotionType } from "../types"
import IntensitySlider from "../components/IntensitySlider"
import { getEmotionConfig } from "../constants/emotionConfig"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  emotion: EmotionType
  intensity: number | null
  onIntensity: (value: number) => void
  onComplete: () => void
}

function getIntensityQuestion(emotion: EmotionType): string {
  const config = getEmotionConfig(emotion)
  return `Wie stark spürst du ${config.bodyLabel} gerade, wenn du an diese Situation denkst?`
}

export default function PhaseIntensityBefore({ emotion, intensity, onIntensity, onComplete }: Props) {
  const config = getEmotionConfig(emotion)

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit Avatar */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble
          title={getIntensityQuestion(emotion)}
        />
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4 flex flex-col gap-5">

        {/* Intensitäts-Slider */}
        <div className="py-4">
          <IntensitySlider
            value={intensity}
            onChange={onIntensity}
            accentColor={config.color}
          />
        </div>
        {/* Weiter-Button */}
        <div className="shrink-0">
        <motion.button
          onClick={onComplete}
          disabled={intensity === null}
          whileTap={intensity !== null ? { scale: 0.97 } : {}}
          className={clsx(
            "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            intensity !== null
              ? "bg-green-600 hover:bg-green-500 text-white shadow-lg"
              : "bg-white/5 text-white/25 cursor-not-allowed"
          )}
        >
          Weiter →
        </motion.button>
        </div>
      </div>
    </div>
  )
}
