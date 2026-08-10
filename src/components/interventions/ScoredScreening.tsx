import {
  useRef,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react"
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

type ScoreMap = {
  [typeId: string]: number
}

type ScreeningOption = {
  id: string
  label: string
  scores: ScoreMap
}

type ScreeningQuestion = {
  id: string
  text: string
  options: ScreeningOption[]
}

type ScoringConfig = {
  types: string[]
  saveTo: string
  scoresSaveTo: string
}

type ScoredScreeningData = {
  id: number
  xp?: number
  intro?: string
  scoring: ScoringConfig
  questions: ScreeningQuestion[]
}

/* =======================
   Hilfsfunktion: assignPatchValue
======================= */

function assignPatchValue(
  patch: Record<string, unknown>,
  saveTo: string,
  value: unknown
): void {
  const dotIndex = saveTo.indexOf(".")
  if (dotIndex === -1) {
    patch[saveTo] = value
  } else {
    const top = saveTo.slice(0, dotIndex)
    const rest = saveTo.slice(dotIndex + 1)
    if (!patch[top] || typeof patch[top] !== "object" || Array.isArray(patch[top])) {
      patch[top] = {}
    }
    assignPatchValue(patch[top] as Record<string, unknown>, rest, value)
  }
}

/* =======================
   computeResult
======================= */

function computeResult(
  answers: Record<string, string>,
  questions: ScreeningQuestion[],
  types: string[]
): { winner: string; scores: ScoreMap } {
  const totals: ScoreMap = {}
  for (const t of types) totals[t] = 0

  for (const q of questions) {
    const selectedOptionId = answers[q.id]
    if (!selectedOptionId) continue
    const option = q.options.find((o) => o.id === selectedOptionId)
    if (!option) continue
    for (const [typeId, pts] of Object.entries(option.scores)) {
      totals[typeId] = (totals[typeId] ?? 0) + pts
    }
  }

  const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? types[0]

  return { winner, scores: totals }
}

/* =======================
   QuestionCard
======================= */
const QuestionCard = memo(function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  questionIndex,
  totalQuestions,
  ctx, // ✅ Als Prop empfangen
}: {
  question: ScreeningQuestion
  selectedOptionId: string | undefined
  onSelect: (optionId: string) => void
  questionIndex: number
  totalQuestions: number
  ctx: any // TemplateContext Typ
}) {
return (
  <motion.div
    key={question.id}
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="flex flex-col gap-4 h-full min-h-0"
  >
    {/* Fortschrittsanzeige */}
    <div className="flex items-center gap-2 mb-1 shrink-0">
      <div className="flex gap-1">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1 rounded-full transition-all duration-300",
              i < questionIndex
                ? "bg-green-500 w-4"
                : i === questionIndex
                ? "bg-green-400 w-6"
                : "bg-gray-700 w-4"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1">
        {questionIndex + 1} / {totalQuestions}
      </span>
    </div>

    {/* Scrollbarer Inhaltsbereich */}
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
      <div className="flex flex-col gap-4">
        <AvatarBubble title={applyTemplate(question.text, ctx)} />

        <div className="flex flex-col gap-2 mt-2 pb-2">
          {question.options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.id)}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "px-4 py-3 rounded-lg border text-left transition-all duration-200",
                selectedOptionId === option.id
                  ? "bg-green-600 border-green-500 text-white"
                  : "border-gray-600 text-gray-300 hover:border-gray-400"
              )}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)
})

/* =======================
   ScoredScreening
======================= */

function ScoredScreening({ data }: { data: ScoredScreeningData }) {
  const { id, xp = 0, intro, scoring, questions } = data
  
  // ✅ Hooks immer hier oben aufrufen
  const ctx = useTemplateContext() 
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showIntro, setShowIntro] = useState(!!intro)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const selectedOptionId = answers[currentQuestion?.id]
  const allAnswered = useMemo(
    () => questions.every((q) => !!answers[q.id]),
    [questions, answers]
  )
  const isLastQuestion = currentIndex === totalQuestions - 1

  const handleSelect = useCallback(
    (optionId: string) => {
      const qId = questions[currentIndex].id
      setAnswers((prev) => ({ ...prev, [qId]: optionId }))

      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((i) => i + 1)
        }
      }, 350)
    },
    [currentIndex, questions, totalQuestions]
  )

  const handleBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const handleComplete = useCallback(async () => {
    if (!api || !allAnswered) return

    const { winner, scores } = computeResult(answers, questions, scoring.types)

    // Label-Mapping für primary_reason
    const PRIMARY_REASON_LABELS: Record<string, string> = {
      fear_reaction: "du Angst vor der Reaktion hast",
      need_love: "du gesehen und geliebt werden möchtest",
      avoid_conflict: "du Konflikte vermeiden möchtest"
    }

    const profilePatch: Record<string, unknown> = {}
    assignPatchValue(profilePatch, scoring.saveTo, winner)
    assignPatchValue(profilePatch, scoring.scoresSaveTo, scores)
    
    // Wenn saveTo "meta.primary_reason" ist, speichere auch das Label
    if (scoring.saveTo === "meta.primary_reason") {
      const label = PRIMARY_REASON_LABELS[winner] || winner
      assignPatchValue(profilePatch, "meta.primary_reason_label", label)
    }

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      return
    }

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, allAnswered, answers, questions, scoring, xp, id, dispatch, startAnimation, slideManager])

  // Intro-Screen
  if (showIntro) {
    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="flex-1 flex flex-col justify-center">
          {/* ✅ Auch hier Template anwenden */}
          <AvatarBubble title={applyTemplate(intro!, ctx)} />
        </div>
        <motion.button
          onClick={() => setShowIntro(false)}
          whileTap={{ scale: 0.97 }}
          className="mt-6 px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
        >
          Los geht's
        </motion.button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 text-white">
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            selectedOptionId={selectedOptionId}
            onSelect={handleSelect}
            questionIndex={currentIndex}
            totalQuestions={totalQuestions}
            ctx={ctx} // ✅ Context an QuestionCard weiterreichen
          />
        </AnimatePresence>
      </div>

      <div className="flex gap-3 mt-6">
        {currentIndex > 0 && (
          <button
            onClick={handleBack}
            className="px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 transition"
          >
            ←
          </button>
        )}

        {isLastQuestion && (
          <motion.button
            ref={btnRef}
            onClick={handleComplete}
            disabled={!allAnswered}
            animate={{ opacity: allAnswered ? 1 : 0.5 }}
            className={clsx(
              "flex-1 px-6 py-3 rounded-lg font-bold transition",
              allAnswered
                ? "bg-green-600 hover:bg-green-500"
                : "bg-gray-700 cursor-not-allowed"
            )}
          >
            Auswertung ansehen
          </motion.button>
        )}
      </div>

      {xp > 0 && (
        <p className="mt-2 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(ScoredScreening)