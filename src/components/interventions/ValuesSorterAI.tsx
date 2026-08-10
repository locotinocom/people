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
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

export interface ValueItem {
  id: string
  label: string // z.B. "Ehrlichkeit"
  description?: string // z.B. "Ich sage, was ich denke, auch wenn es unbequem ist."
}

export interface ValuesSorterResult {
  kept: string[] // IDs aller in Phase 1 behaltenen Werte (unsortiert)
  ranked: string[] // IDs der Top-N-Werte aus Phase 2, in Reihenfolge (Index 0 = Platz 1)
}

type ValuesSorterAIData = {
  id: number
  xp?: number
  slug: string
  title: string
  intro?: string
  saveTo: string
  values: ValueItem[]
  topN?: number // wie viele Werte am Ende final gerankt werden sollen, Default: 5
}

type Phase = "swipe" | "rank" | "complete"

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
   ValuesSorterAI
======================= */

function ValuesSorterAI({ data }: { data: ValuesSorterAIData }) {
  const { id, xp = 0, title, intro, saveTo, values, topN = 5 } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  // ─── Phase 1: Swipe-State ────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("swipe")
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [kept, setKept] = useState<ValueItem[]>([])
  const [exitDirection, setExitDirection] = useState<1 | -1 | 0>(0)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  // ─── Phase 2: Rank-State ─────────────────────────────────────────────────
  const [ranked, setRanked] = useState<ValueItem[]>([])

  const currentValue = values[swipeIndex]
  const isLastValue = swipeIndex === values.length - 1
  const swipeProgress = ((swipeIndex + 1) / values.length) * 100

  const rankTargetReached = ranked.length >= Math.min(topN, kept.length)
  const rankRemaining = kept.filter((v) => !ranked.some((r) => r.id === v.id))

  /* ─── Phase 1: Swipe-Handler ─────────────────────────────────────────── */

  const handleSwipe = useCallback(
    (keep: boolean) => {
      if (isAnimatingOut) return
      setIsAnimatingOut(true)
      setExitDirection(keep ? 1 : -1)

      const newKept = keep ? [...kept, currentValue] : kept

      setTimeout(() => {
        if (isLastValue) {
          setKept(newKept)
          // Wenn zu wenige Werte behalten wurden, um überhaupt zu ranken → direkt speichern
          if (newKept.length === 0) {
            handleComplete(newKept, [])
          } else {
            setPhase("rank")
          }
        } else {
          setKept(newKept)
          setSwipeIndex((i) => i + 1)
          setExitDirection(0)
          setIsAnimatingOut(false)
        }
      }, 250)
    },
    [kept, currentValue, isLastValue, isAnimatingOut]
  )

  /* ─── Phase 2: Rank-Handler ──────────────────────────────────────────── */

  const handleRankTap = useCallback(
    (value: ValueItem) => {
      if (ranked.some((r) => r.id === value.id)) return
      const newRanked = [...ranked, value]
      setRanked(newRanked)

      if (newRanked.length >= Math.min(topN, kept.length)) {
        setPhase("complete")
      }
    },
    [ranked, kept, topN]
  )

  const handleRankUndo = useCallback(() => {
    setRanked((prev) => prev.slice(0, -1))
    setPhase("rank")
  }, [])

  /* ─── Abschluss ───────────────────────────────────────────────────────── */

  const handleComplete = useCallback(
    async (finalKept: ValueItem[], finalRanked: ValueItem[]) => {
      if (!api) return

      const result: ValuesSorterResult = {
        kept: finalKept.map((v) => v.id),
        ranked: finalRanked.map((v) => v.id),
      }

      const profilePatch: Record<string, unknown> = {}
      assignPatchValue(profilePatch, saveTo, result)

      if (import.meta.env.DEV) {
        console.log("[ValuesSorterAI] Ergebnis:", result)
        console.log("[ValuesSorterAI] Patch:", JSON.stringify(profilePatch, null, 2))
      }

      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[ValuesSorterAI] patchUserProfile fehlgeschlagen:", err)
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
    },
    [api, saveTo, id, xp, dispatch, startAnimation, slideManager]
  )

  const handleFinalSubmit = useCallback(() => {
    handleComplete(kept, ranked)
  }, [handleComplete, kept, ranked])

  /* ─── Keyboard-Shortcuts (nur Phase "swipe") ─────────────────────────── */

  useEffect(() => {
    if (phase !== "swipe") return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingOut) return
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") {
        e.preventDefault()
        handleSwipe(true)
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleSwipe(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, handleSwipe, isAnimatingOut])

  /* ═══════════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Header */}
      <div className="shrink-0">
        <AvatarBubble title={title} subtitle={intro} />
      </div>

      {/* ─── Phase: Swipe ────────────────────────────────────────────── */}
      {phase === "swipe" && currentValue && (
        <>
          <div className="mt-4 shrink-0">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Wert {swipeIndex + 1} von {values.length}</span>
              <span>{Math.round(swipeProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${swipeProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="mt-6 flex-1 min-h-0 flex flex-col items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentValue.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                exit={{
                  opacity: 0,
                  x: exitDirection * 300,
                  rotate: exitDirection * 15,
                  transition: { duration: 0.25 },
                }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md bg-zinc-800 border border-gray-700 rounded-2xl p-6 flex flex-col gap-3 items-center text-center"
              >
                <p className="text-2xl font-bold text-white">{currentValue.label}</p>
                {currentValue.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {currentValue.description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 shrink-0 flex items-center justify-center gap-6">
            <motion.button
              onClick={() => handleSwipe(false)}
              disabled={isAnimatingOut}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-red-500 transition disabled:opacity-50"
            >
              <span className="text-3xl">👎</span>
              <span className="text-xs text-gray-400">Nicht wichtig</span>
            </motion.button>

            <motion.button
              onClick={() => handleSwipe(true)}
              disabled={isAnimatingOut}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-green-500 transition disabled:opacity-50"
            >
              <span className="text-3xl">👍</span>
              <span className="text-xs text-gray-400">Wichtig für mich</span>
            </motion.button>
          </div>
        </>
      )}

      {/* ─── Phase: Rank ─────────────────────────────────────────────── */}
      {phase === "rank" && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <p className="text-sm text-gray-400 mb-4 text-center">
            Tippe die Werte in der Reihenfolge an, wie wichtig sie dir wirklich sind.
            <br />
            Platz {ranked.length + 1} von {Math.min(topN, kept.length)}
          </p>

          {/* Bereits gerankte Werte */}
          {ranked.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 shrink-0">
              {ranked.map((v, idx) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-900/10 px-4 py-2"
                >
                  <span className="text-green-400 font-bold w-6 text-center">{idx + 1}</span>
                  <span className="font-semibold text-white">{v.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Noch zu rankende Werte */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2">
            {rankRemaining.map((v) => (
              <motion.button
                key={v.id}
                onClick={() => handleRankTap(v)}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl border border-gray-700 bg-gray-900/60 hover:border-gray-500 px-4 py-3 text-left transition"
              >
                <span className="font-semibold text-white">{v.label}</span>
              </motion.button>
            ))}
          </div>

          {ranked.length > 0 && (
            <button
              onClick={handleRankUndo}
              className="mt-4 shrink-0 text-xs text-gray-500 hover:text-gray-300 transition self-center"
            >
              Letzten Platz rückgängig machen
            </button>
          )}
        </div>
      )}

      {/* ─── Phase: Complete ─────────────────────────────────────────── */}
      {phase === "complete" && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <p className="text-sm text-gray-400 mb-4 text-center">Deine wichtigsten Werte:</p>
          <div className="flex flex-col gap-2">
            {ranked.map((v, idx) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-900/10 px-4 py-3"
              >
                <span className="text-green-400 font-bold w-6 text-center">{idx + 1}</span>
                <span className="font-semibold text-white">{v.label}</span>
              </div>
            ))}
          </div>

          <motion.button
            onClick={handleFinalSubmit}
            whileTap={{ scale: 0.98 }}
            className="mt-6 shrink-0 px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
          >
            Abschließen
          </motion.button>
        </div>
      )}

      {xp > 0 && phase === "complete" && (
        <p className="mt-2 shrink-0 text-sm text-gray-400 text-center">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(ValuesSorterAI)