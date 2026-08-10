// src/features/feelingExercise/phases/PhaseSituationSetup.tsx
// Phase 2 – Situation auswählen / beschreiben
import { useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  situationText: string
  situationTimeframe: string
  onSituationText: (text: string) => void
  onSituationTimeframe: (timeframe: string) => void
  onComplete: () => void
}

const TIMEFRAME_OPTIONS = ["Heute", "Gestern", "Vor einigen Tagen"]

export default function PhaseSituationSetup({
  situationText,
  situationTimeframe,
  onSituationText,
  onSituationTimeframe,
  onComplete,
}: Props) {
  const [inputValue, setInputValue] = useState(situationText)
  const canContinue = inputValue.trim().length > 0

  const handleSubmit = () => {
    if (!canContinue) return
    onSituationText(inputValue.trim())
    onComplete()
  }

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit Avatar */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble
          title="Denk an eine Situation."
          subtitle="Sie kann heute passiert sein, gestern, oder auch schon ein paar Tage her. Eine Situation, die dich beschäftigt hat, verärgert hat, oder die dich aus dem Konzept gebracht hat."
        />
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4 flex flex-col gap-5">

        {/* Zeitrahmen-Buttons */}
        <div>
          <p className="text-white/50 text-xs mb-2 px-1">Wann war das?</p>
          <div className="flex gap-2 flex-wrap">
            {TIMEFRAME_OPTIONS.map((option) => (
              <motion.button
                key={option}
                onClick={() => onSituationTimeframe(option)}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                  situationTimeframe === option
                    ? "bg-green-600/30 border-green-500/60 text-green-200"
                    : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white/80"
                )}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Freitexteingabe */}
        <div>
          <p className="text-white/50 text-xs mb-2 px-1">Beschreib kurz, worum es geht – ein Satz reicht.</p>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="z.B. Streit mit meiner Mutter, Stress bei der Arbeit..."
            rows={3}
            className={clsx(
              "w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3",
              "text-white/90 text-sm placeholder-white/25 resize-none",
              "focus:outline-none focus:border-white/30 focus:bg-white/8",
              "transition-all duration-200"
            )}
          />
        </div>
        {/* Weiter-Button */}
        <div className="shrink-0">
        <motion.button
          onClick={handleSubmit}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.97 } : {}}
          className={clsx(
            "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            canContinue
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
