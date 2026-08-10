// src/features/feelingExercise/phases/PhaseIntensityAfter.tsx
// Phase 7 – Re-Skalierung + Loop-Entscheidung
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type { EmotionType } from "../types"
import IntensitySlider from "../components/IntensitySlider"
import { getEmotionConfig } from "../constants/emotionConfig"
import { evaluateLoop } from "../hooks/useFeelingLoop"

interface Props {
  emotion: EmotionType
  loopCount: number
  onIntensity: (value: number) => void
  onLoop: () => void      // zurück zu Phase 6
  onComplete: () => void  // weiter zu Phase 8
}

export default function PhaseIntensityAfter({
  emotion,
  loopCount,
  onIntensity,
  onLoop,
  onComplete,
}: Props) {
  const [intensity, setIntensity] = useState<number | null>(null)
  const [loopDecision, setLoopDecision] = useState<ReturnType<typeof evaluateLoop> | null>(null)
  const config = getEmotionConfig(emotion)

  const handleIntensitySelect = (value: number) => {
    setIntensity(value)
    onIntensity(value)
    const decision = evaluateLoop(value, loopCount)
    setLoopDecision(decision)
  }

  const handleContinue = () => {
    if (!loopDecision) return
    if (loopDecision.shouldLoop) {
      onLoop()
    } else {
      onComplete()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-5 text-white"
    >
      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-5">
        {/* Chat-Nachricht */}
        <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
          <p className="text-white/90 text-sm leading-relaxed">
            Wie stark spürst du {config.bodyLabel} jetzt noch, nach dem Fühlen?
          </p>
        </div>

        {/* Intensitäts-Slider */}
        <div className="py-4">
          <IntensitySlider
            value={intensity}
            onChange={handleIntensitySelect}
            accentColor={config.color}
          />
        </div>

        {/* Loop-Nachricht */}
        <AnimatePresence>
          {loopDecision && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]"
            >
              <p className="text-white/90 text-sm leading-relaxed">
                {loopDecision.isMaxLoopsReached
                  ? loopDecision.message
                  : loopDecision.shouldLoop
                  ? loopDecision.message
                  : "Gut. Das Gefühl hat sich beruhigt. Du hast heute etwas Wichtiges getan."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weiter-Button */}
      <div className="shrink-0 pt-4">
        <motion.button
          onClick={handleContinue}
          disabled={intensity === null}
          whileTap={intensity !== null ? { scale: 0.97 } : {}}
          className={clsx(
            "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            intensity !== null
              ? "bg-green-600 hover:bg-green-500 text-white shadow-lg"
              : "bg-white/5 text-white/25 cursor-not-allowed"
          )}
        >
          {loopDecision?.shouldLoop ? "Nochmal fühlen" : "Weiter →"}
        </motion.button>
      </div>
    </motion.div>
  )
}
