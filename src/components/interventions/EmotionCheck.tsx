// src/components/interventions/EmotionCheck.tsx
// Mini-Emotions-Phase für Level 10 BurnRitual mit Feeling-Loop (max. 3 Runden)

import { useState, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import AvatarEmotionPicker from "../../features/feelingExercise/components/AvatarEmotionPicker"
import IntensitySlider from "../../features/feelingExercise/components/IntensitySlider"
import FeelingBubbles from "../../features/feelingExercise/components/FeelingBubbles"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useTemplateContext } from "@helpers/useTemplateContext"
import { applyTemplate } from "@helpers/template"
import type { UserProfilePatch } from "@api/types"
import type { EmotionType } from "../../features/feelingExercise/types"

/* =======================
   Types
======================= */

type EmotionCheckData = {
  id: number
  xp?: number
  slug: string
  title: string
  question: string
  instructionAfter?: string
  saveTo: string
  maxIntensity?: number // Default: 3
  maxLoops?: number // Default: 3
}

type Phase = 
  | "select"           // Emotion auswählen
  | "intensity_before" // Intensität vor dem Fühlen
  | "feeling"          // Aktiv fühlen (Feeling-Bubbles)
  | "intensity_after"  // Intensität nach dem Fühlen
  | "complete"         // Fertig

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
   EmotionCheck
======================= */

function EmotionCheck({ data }: { data: EmotionCheckData }) {
  const {
    id,
    xp = 0,
    slug,
    title,
    question,
    instructionAfter,
    saveTo,
    maxIntensity = 3,
    maxLoops = 3,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const templateCtx = useTemplateContext()

  // Template-Variablen auflösen (Fix: templateCtx statt dem undefinierten ctx verwenden & kein .join(""))
  const resolvedQuestion = applyTemplate(question, templateCtx)
  const renderedTitle = applyTemplate(title, templateCtx)
  const renderedInstructionAfter = instructionAfter ? applyTemplate(instructionAfter, templateCtx) : null

  const [phase, setPhase] = useState<Phase>("select")
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null)
  const [intensityBefore, setIntensityBefore] = useState<number>(5)
  const [intensityAfter, setIntensityAfter] = useState<number>(5)
  const [loopCount, setLoopCount] = useState<number>(0)
  const [hasCompleted, setHasCompleted] = useState(false)

  // ─── Phase 1: Emotion auswählen ──────────────────────────────────────────
  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setSelectedEmotion(emotion)

    // Neutral-Shortcut: Sofort fertig
    if (emotion === "neutral") {
      setPhase("complete")
    } else {
      setPhase("intensity_before")
    }
  }, [])

  // ─── Phase 2: Intensität vor dem Fühlen ──────────────────────────────────
  const handleIntensityBeforeChange = useCallback((value: number) => {
    setIntensityBefore(value)
  }, [])

  const handleIntensityBeforeConfirm = useCallback(() => {
    setPhase("feeling")
  }, [])

  // ─── Phase 3: Feeling-Bubbles abgeschlossen ──────────────────────────────
  const handleFeelingComplete = useCallback(() => {
    setPhase("intensity_after")
  }, [])

  // ─── Phase 4: Intensität nach dem Fühlen ─────────────────────────────────
  const handleIntensityAfterChange = useCallback((value: number) => {
    setIntensityAfter(value)
  }, [])

  const handleIntensityAfterConfirm = useCallback(() => {
    const newLoopCount = loopCount + 1

    // Bedingung 1: Intensität ≤ maxIntensity → Fertig
    if (intensityAfter <= maxIntensity) {
      setPhase("complete")
      return
    }

    // Bedingung 2: Max. Loops erreicht → Fertig
    if (newLoopCount >= maxLoops) {
      setPhase("complete")
      return
    }

    // Sonst: Nochmal fühlen
    setLoopCount(newLoopCount)
    setIntensityBefore(intensityAfter) // Neue Baseline
    setPhase("feeling")
  }, [intensityAfter, loopCount, maxIntensity, maxLoops])

  // ─── Phase 5: Abschluss ──────────────────────────────────────────────────
  const handleComplete = useCallback(async () => {
    if (!api || hasCompleted) return
    setHasCompleted(true)

    const profilePatch: Record<string, unknown> = {}
    const result = {
      emotion: selectedEmotion,
      intensity_before: intensityBefore,
      intensity_after: intensityAfter,
      loop_count: loopCount,
      timestamp: new Date().toISOString(),
    }
    assignPatchValue(profilePatch, saveTo, result)

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[EmotionCheck] patchUserProfile failed:", err)
      setHasCompleted(false)
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
  }, [api, hasCompleted, selectedEmotion, intensityBefore, intensityAfter, loopCount, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-6">
          {/* Titel mit aufgelöstem Template */}
          <AvatarBubble title={renderedTitle} />

          <AnimatePresence mode="wait">
            {/* ─── Phase: Emotion auswählen ────────────────────────────── */}
            {phase === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed text-center">
                  {resolvedQuestion}
                </p>

                <AvatarEmotionPicker
                  selected={selectedEmotion}
                  onSelect={handleEmotionSelect}
                />
              </motion.div>
            )}

            {/* ─── Phase: Intensität vor dem Fühlen ────────────────────── */}
            {phase === "intensity_before" && selectedEmotion && (
              <motion.div
                key="intensity_before"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed text-center">
                  Wie stark fühlst du das gerade?
                </p>

                <IntensitySlider
                  value={intensityBefore}
                  onChange={handleIntensityBeforeChange}
                />

                <motion.button
                  onClick={handleIntensityBeforeConfirm}
                  whileTap={{ scale: 0.97 }}
                  className="mx-auto px-8 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 transition text-white"
                >
                  Weiter
                </motion.button>
              </motion.div>
            )}

            {/* ─── Phase: Feeling-Bubbles ──────────────────────────────── */}
            {phase === "feeling" && selectedEmotion && (
              <motion.div
                key="feeling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed text-center">
                  Spüre das Gefühl. Lass es zu.
                </p>

                <FeelingBubbles emotion={selectedEmotion} />

                {/* Weiter-Button nach 10s */}
                <motion.button
                  onClick={handleFeelingComplete}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 10 }}
                  whileTap={{ scale: 0.97 }}
                  className="mx-auto px-8 py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 transition text-white"
                >
                  Weiter
                </motion.button>
              </motion.div>
            )}

            {/* ─── Phase: Intensität nach dem Fühlen ───────────────────── */}
            {phase === "intensity_after" && selectedEmotion && (
              <motion.div
                key="intensity_after"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed text-center">
                  Wie stark ist das Gefühl jetzt?
                </p>

                <IntensitySlider
                  value={intensityAfter}
                  onChange={handleIntensityAfterChange}
                />

                {/* Hinweis wenn noch zu hoch */}
                {intensityAfter > maxIntensity && loopCount < maxLoops - 1 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-orange-400 text-center"
                  >
                    Das Gefühl ist noch stark. Lass uns nochmal fühlen.
                  </motion.p>
                )}

                {/* Hinweis wenn max. Loops erreicht */}
                {intensityAfter > maxIntensity && loopCount >= maxLoops - 1 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-400 text-center"
                  >
                    Das ist okay. Du hast es gespürt.
                  </motion.p>
                )}

                <motion.button
                  onClick={handleIntensityAfterConfirm}
                  whileTap={{ scale: 0.97 }}
                  className="mx-auto px-8 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition text-white"
                >
                  Weiter
                </motion.button>
              </motion.div>
            )}

            {/* ─── Phase: Complete ─────────────────────────────────────── */}
            {phase === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col gap-6"
              >
                {renderedInstructionAfter && (
                  <p className="text-gray-300 leading-relaxed text-center">
                    {renderedInstructionAfter}
                  </p>
                )}

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-6xl"
                >
                  ✓
                </motion.div>

                {/* Loop-Info */}
                {selectedEmotion !== "neutral" && loopCount > 0 && (
                  <p className="text-sm text-gray-400 text-center">
                    {loopCount} {loopCount === 1 ? "Runde" : "Runden"} gefühlt
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Weiter-Button (nur nach Completion) */}
      {phase === "complete" && (
        <motion.button
          onClick={handleComplete}
          disabled={hasCompleted}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={clsx(
            "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
            hasCompleted
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500"
          )}
        >
          Weiter →
        </motion.button>
      )}

      {xp > 0 && phase === "complete" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-2 shrink-0 text-sm text-gray-400"
        >
          +{xp} XP
        </motion.p>
      )}
    </div>
  )
}

export default memo(EmotionCheck)