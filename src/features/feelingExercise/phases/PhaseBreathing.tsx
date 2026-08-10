// src/features/feelingExercise/phases/PhaseBreathing.tsx
// Phase 1 – Atemübung (wiederverwendbar, nutzt bestehende BreathExerciseCore)
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BreathExerciseCore from "@tools/BreathExerciseCore"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  onComplete: () => void
}

const BREATH_PRESETS = [
  {
    key: "calm_406",
    label: "Beruhigen (4-0-6)",
    inhaleSec: 4,
    holdSec: 0,
    exhaleSec: 6,
    durationSec: 120, // 2 Minuten
  },
]

export default function PhaseBreathing({ onComplete }: Props) {
  const [done, setDone] = useState(false)

  const handleSessionComplete = () => {
    setDone(true)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Intro-Text mit Avatar */}
            <div className="shrink-0 px-5 pt-5 pb-2">
              <AvatarBubble
                title="Bevor wir anfangen – lass uns kurz zur Ruhe kommen."
                subtitle="Atme einfach mit. Kein Druck."
              />
            </div>

            {/* Atemübung */}
            <div className="flex-1 min-h-0">
              <BreathExerciseCore
                title="Atemübung"
                presets={BREATH_PRESETS}
                defaultPresetKey="calm_406"
                allowCustomize={false}
                defaultMinutes={2}
                devTag="FeelingExercise-Breathing"
                onSessionComplete={handleSessionComplete}
              />
            </div>

            {/* Skip-Option */}
            <div className="shrink-0 px-5 pb-4 text-center">
              <button
                onClick={handleSessionComplete}
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                Überspringen →
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full text-white"
          >
            <div className="shrink-0 px-5 pt-5 pb-3">
              <AvatarBubble
                title="Gut. Jetzt bist du ein bisschen ruhiger hier."
                subtitle="Bleib bei dir."
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onComplete}
                className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
              >
                Weiter →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
