// src/features/feelingExercise/phases/PhaseEmotionSelect.tsx
// Phase 4 – Emotion auswählen (Avatar-Emotion-Picker)
import { motion } from "framer-motion"
import clsx from "clsx"
import type { EmotionType } from "../types"
import AvatarEmotionPicker from "../components/AvatarEmotionPicker"
import { getEmotionConfig } from "../constants/emotionConfig"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  chosenEmotion: EmotionType | null
  onSelect: (emotion: EmotionType) => void
  onComplete: () => void
}

export default function PhaseEmotionSelect({ chosenEmotion, onSelect, onComplete }: Props) {
  const accentColor = chosenEmotion ? getEmotionConfig(chosenEmotion).color : undefined

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit Avatar */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble
          title="Wenn du jetzt an diese Situation denkst..."
          subtitle="Welches Gefühl taucht da am stärksten auf?"
        />
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4 flex flex-col gap-5">

        {/* Avatar-Emotion-Picker */}
        <div className="py-2">
          <AvatarEmotionPicker selected={chosenEmotion} onSelect={onSelect} />
        </div>

        {/* Ausgewählte Emotion anzeigen */}
        {chosenEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl px-4 py-3 text-center"
            style={{ borderColor: accentColor, borderWidth: 1 }}
          >
            <p className="text-sm" style={{ color: accentColor }}>
              Du hast „{getEmotionConfig(chosenEmotion).label}" gewählt.
            </p>
          </motion.div>
        )}
        {/* Weiter-Button */}
        <div className="shrink-0">
        <motion.button
          onClick={onComplete}
          disabled={!chosenEmotion}
          whileTap={chosenEmotion ? { scale: 0.97 } : {}}
          className={clsx(
            "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            chosenEmotion
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
