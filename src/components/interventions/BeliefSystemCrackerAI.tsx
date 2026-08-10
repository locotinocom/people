import {
  useState,
  useCallback,
  memo,
} from "react"
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

export interface BeliefPrompt {
  id: string
  stem: string // z.B. "Wenn ich Nein sage, dann..."
  placeholder?: string
}

export interface BeliefSystemCrackerResult {
  [promptId: string]: string // Speichert { "p1": "werde ich verlassen", "p2": "..." }
}

type BeliefSystemCrackerAIData = {
  id: number
  xp?: number
  slug: string
  title: string
  intro?: string
  saveTo: string
  prompts: BeliefPrompt[]
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
   BeliefSystemCrackerAI
======================= */

function BeliefSystemCrackerAI({ data }: { data: BeliefSystemCrackerAIData }) {
  const { id, xp = 0, title, intro, saveTo, prompts } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<BeliefSystemCrackerResult>({})
  const [currentAnswer, setCurrentAnswer] = useState("")

  const currentPrompt = prompts[currentIndex]
  const isLastPrompt = currentIndex === prompts.length - 1
  const progress = ((currentIndex + 1) / prompts.length) * 100

  // Nächster Prompt
  const handleNext = useCallback(() => {
    if (!currentAnswer.trim()) return

    // Antwort speichern
    const newAnswers = {
      ...answers,
      [currentPrompt.id]: currentAnswer.trim(),
    }
    setAnswers(newAnswers)

    if (isLastPrompt) {
      // Letzter Prompt → Speichern und abschließen
      handleComplete(newAnswers)
    } else {
      // Nächster Prompt
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer("")
    }
  }, [currentAnswer, currentPrompt, isLastPrompt, currentIndex, answers])

  // Abschluss
  const handleComplete = useCallback(
    async (finalAnswers: BeliefSystemCrackerResult) => {
      if (!api) return

      const profilePatch: Record<string, unknown> = {}
      assignPatchValue(profilePatch, saveTo, finalAnswers)

      if (import.meta.env.DEV) {
        console.log("[BeliefSystemCrackerAI] Antworten:", finalAnswers)
        console.log("[BeliefSystemCrackerAI] Patch:", JSON.stringify(profilePatch, null, 2))
      }

      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[BeliefSystemCrackerAI] patchUserProfile fehlgeschlagen:", err)
        return
      }

      await dispatch(
        completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
      ).unwrap()

      await new Promise((r) => setTimeout(r, 400))

      await dispatch(
        handleActionThunk({
          action: {
            type: "next",
            goNext: () => slideManager.goNext(),
          },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    },
    [api, saveTo, id, xp, dispatch, startAnimation, slideManager]
  )

  // Enter-Taste
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleNext()
      }
    },
    [handleNext]
  )

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Header */}
      <div className="shrink-0">
        <AvatarBubble title={title} subtitle={intro} />
      </div>

      {/* Fortschrittsbalken */}
      <div className="mt-4 shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Satz {currentIndex + 1} von {prompts.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Prompt & Textarea */}
      <div className="mt-6 flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPrompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Stem */}
            <div className="mb-4">
              <p className="text-xl font-bold text-green-400">
                {currentPrompt.stem}
              </p>
            </div>

            {/* Textarea */}
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentPrompt.placeholder || "Schreib das erste, was kommt..."}
              autoFocus
              className="flex-1 min-h-0 p-4 bg-zinc-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-500 transition-colors"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Weiter-Button */}
      <motion.button
        onClick={handleNext}
        disabled={!currentAnswer.trim()}
        animate={{ opacity: currentAnswer.trim() ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          currentAnswer.trim()
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        {isLastPrompt ? "Abschließen" : "Weiter"}
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400 text-center">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(BeliefSystemCrackerAI)
