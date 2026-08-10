import {
  useState,
  useCallback,
  useEffect,
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
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

export type CostBenefitBlock =
  | "past_benefit"
  | "past_fear"
  | "present_cost"
  | "present_reality"

export interface CostBenefitStatement {
  id: string
  block: CostBenefitBlock
  text: string
}

export interface CostBenefitMatrixResult {
  [statementId: string]: {
    block: CostBenefitBlock
    value: boolean
  }
}

type CostBenefitMatrixAIData = {
  id: number
  xp?: number
  slug: string
  title: string
  intro?: string
  saveTo: string
  statements: CostBenefitStatement[]
}

/* =======================
   Block-Metadaten
======================= */

const BLOCK_META: Record<CostBenefitBlock, { label: string; color: string; bar: string }> = {
  past_benefit: { label: "Damals · Nutzen", color: "text-amber-400", bar: "bg-amber-500" },
  past_fear: { label: "Damals · Angst", color: "text-orange-400", bar: "bg-orange-500" },
  present_cost: { label: "Heute · Kosten", color: "text-red-400", bar: "bg-red-500" },
  present_reality: { label: "Heute · Realität", color: "text-green-400", bar: "bg-green-500" },
}

/* =======================
   Hilfsfunktion
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
   CostBenefitMatrixAI
======================= */

function CostBenefitMatrixAI({ data }: { data: CostBenefitMatrixAIData }) {
  const { id, xp = 0, title, intro, saveTo, statements } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  // Titel/Intro templaten (statisch pro Karte, ändert sich nicht während der Runden)
  const renderedTitle = applyTemplate(title, ctx)
  const renderedIntro = intro ? applyTemplate(intro, ctx) : undefined

  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<CostBenefitMatrixResult>({})
  const [exitDirection, setExitDirection] = useState<1 | -1 | 0>(0)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  const currentStatement = statements[currentIndex]
  const isLastStatement = currentIndex === statements.length - 1
  const progress = ((currentIndex + 1) / statements.length) * 100
  const blockMeta = BLOCK_META[currentStatement.block]

  // Aktuellen Statement-Text templaten (pro Karte neu, da sich currentStatement ändert)
  const renderedStatementText = applyTemplate(currentStatement.text, ctx)

  const handleAnswer = useCallback(
    (value: boolean) => {
      if (isAnimatingOut) return
      setIsAnimatingOut(true)
      setExitDirection(value ? 1 : -1)

      const newAnswers: CostBenefitMatrixResult = {
        ...answers,
        [currentStatement.id]: { block: currentStatement.block, value },
      }
      setAnswers(newAnswers)

      setTimeout(() => {
        if (isLastStatement) {
          handleComplete(newAnswers)
        } else {
          setCurrentIndex((i) => i + 1)
          setExitDirection(0)
          setIsAnimatingOut(false)
        }
      }, 250)
    },
    [answers, currentStatement, isLastStatement, isAnimatingOut]
  )

  const handleComplete = useCallback(
    async (finalAnswers: CostBenefitMatrixResult) => {
      if (!api) return

      const profilePatch: Record<string, unknown> = {}
      assignPatchValue(profilePatch, saveTo, finalAnswers)

      if (import.meta.env.DEV) {
        console.log("[CostBenefitMatrixAI] Antworten:", finalAnswers)
        console.log("[CostBenefitMatrixAI] Patch:", JSON.stringify(profilePatch, null, 2))
      }

      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[CostBenefitMatrixAI] patchUserProfile fehlgeschlagen:", err)
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingOut) return
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") {
        e.preventDefault()
        handleAnswer(true)
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleAnswer(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleAnswer, isAnimatingOut])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Header */}
      <div className="shrink-0">
        <AvatarBubble title={renderedTitle} subtitle={renderedIntro} />
      </div>

      {/* Fortschrittsbalken */}
      <div className="mt-4 shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Aussage {currentIndex + 1} von {statements.length}</span>
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

      {/* Karte */}
      <div className="mt-6 flex-1 min-h-0 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatement.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
            exit={{
              opacity: 0,
              x: exitDirection * 300,
              rotate: exitDirection * 15,
              transition: { duration: 0.25 },
            }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-zinc-800 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
          >
            <span className={clsx("text-xs font-bold uppercase tracking-wide", blockMeta.color)}>
              {blockMeta.label}
            </span>
            <p className="text-lg font-semibold leading-relaxed">
              {renderedStatementText}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Daumen hoch/runter Buttons */}
      <div className="mt-6 shrink-0 flex items-center justify-center gap-6">
        <motion.button
          onClick={() => handleAnswer(false)}
          disabled={isAnimatingOut}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-red-500 transition disabled:opacity-50"
        >
          <span className="text-3xl">👎</span>
          <span className="text-xs text-gray-400">Trifft nicht zu</span>
        </motion.button>

        <motion.button
          onClick={() => handleAnswer(true)}
          disabled={isAnimatingOut}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-green-500 transition disabled:opacity-50"
        >
          <span className="text-3xl">👍</span>
          <span className="text-xs text-gray-400">Trifft zu</span>
        </motion.button>
      </div>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400 text-center">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(CostBenefitMatrixAI)