// src/features/feelingExercise/components/SituationQuestions.tsx
// Sequenzielle Detail-Fragen zur Situation (eine nach der anderen als Chat-Nachrichten)
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type { SituationVividAnswers } from "../types"
import { SITUATION_VIVID_QUESTIONS } from "../constants/situationVividQuestions"

interface Props {
  answers: SituationVividAnswers
  onAnswer: (key: keyof SituationVividAnswers, value: string) => void
  onComplete: () => void
}

export default function SituationQuestions({ answers, onAnswer, onComplete }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const currentQuestion = SITUATION_VIVID_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === SITUATION_VIVID_QUESTIONS.length - 1

  const handleSelect = (option: string) => {
    onAnswer(currentQuestion.id, option)

    // Kurze Pause, dann nächste Frage oder abschließen
    setTimeout(() => {
      if (isLastQuestion) {
        onComplete()
      } else {
        setCurrentQuestionIndex((i) => i + 1)
      }
    }, 300)
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      {/* Fortschritts-Punkte */}
      <div className="flex gap-1.5 justify-center mb-2">
        {SITUATION_VIVID_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={clsx(
              "w-1.5 h-1.5 rounded-full transition-all duration-500",
              i < currentQuestionIndex
                ? "bg-blue-400"
                : i === currentQuestionIndex
                ? "bg-white scale-125"
                : "bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Aktuelle Frage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-3"
        >
          {/* Frage als Chat-Bubble */}
          <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p className="text-white/90 text-sm leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          {/* Antwort-Chips */}
          <div className="flex flex-wrap gap-2 mt-1">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option
              return (
                <motion.button
                  key={option}
                  onClick={() => handleSelect(option)}
                  whileTap={{ scale: 0.95 }}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                    "border focus:outline-none",
                    isSelected
                      ? "bg-blue-500/30 border-blue-400/60 text-blue-200"
                      : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white/90"
                  )}
                >
                  {option}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
