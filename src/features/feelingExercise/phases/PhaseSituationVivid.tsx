// src/features/feelingExercise/phases/PhaseSituationVivid.tsx
// Phase 3 – Situation lebendig machen (Detail-Fragen)
import { motion } from "framer-motion"
import type { SituationVividAnswers } from "../types"
import SituationQuestions from "../components/SituationQuestions"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  situationText: string
  vividAnswers: SituationVividAnswers
  onAnswer: (key: keyof SituationVividAnswers, value: string) => void
  onComplete: () => void
}

function buildSummary(situationText: string, answers: SituationVividAnswers): string {
  const parts: string[] = []
  if (answers.timeOfDay) parts.push(answers.timeOfDay)
  if (answers.weather && answers.weather !== "War drinnen" && answers.weather !== "Weiß nicht mehr") {
    parts.push(answers.weather.toLowerCase())
  }
  if (answers.posture) parts.push(`du warst ${answers.posture.toLowerCase()}`)

  const contextStr = parts.length > 0 ? ` ${parts.join(", ")}.` : "."

  return `Okay. „${situationText}"${contextStr} Ich hab ein gutes Bild davon. Bleib kurz bei dieser Situation.`
}

export default function PhaseSituationVivid({
  situationText,
  vividAnswers,
  onAnswer,
  onComplete,
}: Props) {
  const allAnswered = Object.keys(vividAnswers).length >= 6

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit Avatar */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble
          title="Ich möchte die Situation ein bisschen lebendiger machen."
          subtitle="Damit du dich besser hineinfühlen kannst. Beantworte kurz ein paar Fragen dazu."
        />
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4 flex flex-col gap-4">

        {/* Sequenzielle Fragen */}
        {!allAnswered && (
          <SituationQuestions
            answers={vividAnswers}
            onAnswer={onAnswer}
            onComplete={onComplete}
          />
        )}

        {/* Zusammenfassung nach allen Antworten */}
        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-green-600/10 border border-green-500/30 rounded-2xl px-4 py-3">
              <p className="text-white/90 text-sm leading-relaxed">
                {buildSummary(situationText, vividAnswers)}
              </p>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onComplete}
              className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all shadow-lg"
            >
              Weiter →
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
