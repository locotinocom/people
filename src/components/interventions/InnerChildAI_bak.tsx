/** @orphan-check-start
 * Auto-generated von check-orphaned-templates.js — bitte nicht von Hand editieren.
 * Zuletzt geprüft: 2026-08-16
 * Status: aktiv — wird von mindestens einem Level referenziert
 * Referenziert in: level-24.json
 * @orphan-check-end */

import { useState, useCallback, useEffect, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile, selectSession } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { applyTemplate } from "@helpers/template"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

type InnerChildMode = "presence" | "situational"
type InnerChildStep = "identify" | "need" | "response"

interface StateOption {
  id: string
  label: string
}

interface TowardOption {
  id: string
  label: string
  critical?: boolean
}

interface NeedOption {
  id: string
  label: string
  reactionText: string
  childReplyText: string
}

export interface InnerChildAIData {
  id: number
  xp?: number
  slug: string
  mode: InnerChildMode
  step: InnerChildStep
  saveTo: string // Must include "meta." prefix!

  // step "identify" props
  ageQuestion?: string
  stateQuestion?: string
  stateSelectionType?: "multi" | "single"
  allowCustomState?: boolean
  stateOptions?: StateOption[]
  thoughtQuestion?: string
  thoughtPlaceholder?: string
  allowNothingThought?: boolean
  towardQuestion?: string
  towardOptions?: TowardOption[]
  allowCustomToward?: boolean
  towardCriticalNote?: string

  // step "need" props
  needQuestion?: string
  needOptions?: NeedOption[]

  // step "response" props: reuses needOptions from JSON
}

export interface InnerChildResult {
  age?: number
  states?: string[]
  thought?: string
  towardFeeling?: string
  needId?: string
}

/* =======================
   Helper: assignPatchValue
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

function getProfileValue(profile: unknown, saveTo: string): unknown {
  if (profile === null || profile === undefined || typeof profile !== "object") {
    return undefined
  }

  const parts = saveTo.split(".")
  let current: unknown = profile
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/* =======================
   InnerChildAI Component
======================= */

function InnerChildAI({ data }: { data: InnerChildAIData }) {
  // Support both data.props (from level JSON) and direct data
  const resolvedProps = (data as any)?.props || data || {}

  const {
    id,
    xp = 0,
    slug,
    mode,
    step,
    saveTo,
    // identify
    ageQuestion = "Wie alt ist dein inneres Kind gerade?",
    stateQuestion = "Wie erlebst du es?",
    stateSelectionType = "multi",
    allowCustomState = false,
    stateOptions = [],
    thoughtQuestion = "Was denkt es gerade?",
    thoughtPlaceholder = "Einfach schreiben...",
    allowNothingThought = false,
    towardQuestion = "Wie fühlst du dich dem Kind gegenüber?",
    towardOptions = [],
    allowCustomToward = false,
    towardCriticalNote = "Das ist ok – versuch trotzdem, kurz zuzuhören.",
    // need
    needQuestion = "Was braucht es gerade von dir?",
    needOptions = [],
  } = resolvedProps

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()
  const { profile } = useAppSelector(selectSession)

  // Load existing data from profile if available
  const existingData = useMemo(() => {
    const val = getProfileValue(profile as unknown as Record<string, unknown>, saveTo)
    return (val as InnerChildResult) || {}
  }, [profile, saveTo])

  // ─── State for step "identify" ─────────────────────────────────────────────
  const [phase, setPhase] = useState<"age" | "state" | "thought" | "toward" | "complete">("age")
  const [age, setAge] = useState<string>("")
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [customState, setCustomState] = useState<string>("")
  const [thought, setThought] = useState<string>("")
  const [towardFeeling, setTowardFeeling] = useState<string>("")
  const [customToward, setCustomToward] = useState<string>("")
  const [showCriticalNote, setShowCriticalNote] = useState(false)

  // ─── State for step "need" ─────────────────────────────────────────────────
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null)
  const [showReaction, setShowReaction] = useState(false)

  // ─── State for step "response" ─────────────────────────────────────────────
  const [hasCompleted, setHasCompleted] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP: IDENTIFY - Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAgeSubmit = useCallback(() => {
    const ageNum = parseInt(age, 10)
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) return
    setPhase("state")
  }, [age])

  const handleStateToggle = useCallback((stateId: string) => {
    setSelectedStates((prev) =>
      prev.includes(stateId) ? prev.filter((s) => s !== stateId) : [...prev, stateId]
    )
  }, [])

  const handleStateConfirm = useCallback(() => {
    setPhase("thought")
  }, [])

  const handleThoughtConfirm = useCallback(() => {
    setPhase("toward")
  }, [])

  const handleTowardSelect = useCallback(
    (optionId: string) => {
      setTowardFeeling(optionId)
      const option = towardOptions.find((o: TowardOption) => o.id === optionId)
      if (option?.critical) {
        setShowCriticalNote(true)
      }
    },
    [towardOptions]
  )

  const handleTowardConfirm = useCallback(async () => {
    if (!api) return

    const finalStates = [...selectedStates]
    if (customState.trim()) finalStates.push(customState.trim())

    const finalToward = customToward.trim() || towardFeeling

    const result: InnerChildResult = {
      age: parseInt(age, 10),
      states: finalStates,
      thought: thought.trim() || (allowNothingThought ? "Nichts" : ""),
      towardFeeling: finalToward,
    }

    const patch: Record<string, unknown> = {}
    assignPatchValue(patch, saveTo, result)

    try {
      await dispatch(
        patchUserProfile({
          api,
          patch: patch as UserProfilePatch,
        })
      ).unwrap()

      await dispatch(
        completeInterventionThunk({
          interventionId: id,
          xp,
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()

      await new Promise((r) => setTimeout(r, 400))

      await dispatch(
        handleActionThunk({
          action: { type: "next", goNext: () => slideManager.goNext() },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    } catch (err) {
      console.error("[InnerChildAI] Error completing identify step:", err)
    }
  }, [
    age,
    selectedStates,
    customState,
    thought,
    towardFeeling,
    customToward,
    allowNothingThought,
    saveTo,
    api,
    dispatch,
    id,
    xp,
    startAnimation,
    slideManager,
  ])

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP: NEED - Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleNeedSelect = useCallback(
    async (needId: string) => {
      if (!api) return
      setSelectedNeedId(needId)
      setShowReaction(true)

      // Wait for user to read the reaction text
      await new Promise((r) => setTimeout(r, 2000))

      // Save needId to profile
      const updated: InnerChildResult = {
        ...existingData,
        needId,
      }

      const patch: Record<string, unknown> = {}
      assignPatchValue(patch, saveTo, updated)

      try {
        await dispatch(
          patchUserProfile({
            api,
            patch: patch as UserProfilePatch,
          })
        ).unwrap()

        await dispatch(
          completeInterventionThunk({
            interventionId: id,
            xp,
            playAnimation: startAnimation,
            api,
          })
        ).unwrap()

        await new Promise((r) => setTimeout(r, 400))

        await dispatch(
          handleActionThunk({
            action: { type: "next", goNext: () => slideManager.goNext() },
            playAnimation: startAnimation,
            api,
          })
        ).unwrap()
      } catch (err) {
        console.error("[InnerChildAI] Error completing need step:", err)
      }
    },
    [api, existingData, saveTo, dispatch, id, xp, startAnimation, slideManager]
  )

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP: RESPONSE - Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const childReply = useMemo(() => {
    if (!existingData.needId) return null
    const option = needOptions.find((o: NeedOption) => o.id === existingData.needId)
    return option?.childReplyText || null
  }, [existingData, needOptions])

  const handleResponseComplete = useCallback(async () => {
    if (!api || hasCompleted) return
    setHasCompleted(true)

    try {
      await dispatch(
        completeInterventionThunk({
          interventionId: id,
          xp,
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()

      await new Promise((r) => setTimeout(r, 400))

      await dispatch(
        handleActionThunk({
          action: { type: "next", goNext: () => slideManager.goNext() },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    } catch (err) {
      console.error("[InnerChildAI] Error completing response step:", err)
    }
  }, [api, hasCompleted, dispatch, id, xp, startAnimation, slideManager])

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STEP IDENTIFY
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "identify") {
    // Dynamic bubble title based on current phase
    const bubbleTitle = phase === "age" ? applyTemplate(ageQuestion, ctx)
      : phase === "state" ? applyTemplate(stateQuestion, ctx)
      : phase === "thought" ? applyTemplate(thoughtQuestion, ctx)
      : phase === "toward" ? applyTemplate(towardQuestion, ctx)
      : "Inneres Kind"

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble title={bubbleTitle} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mt-6">
          <AnimatePresence mode="wait">
            {/* ─── Phase: Age ─────────────────────────────────────── */}
            {phase === "age" && (
              <motion.div
                key="age"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAgeSubmit()}
                  placeholder="z.B. 7"
                  autoFocus
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleAgeSubmit}
                  disabled={!age || isNaN(parseInt(age, 10))}
                  className={clsx(
                    "px-6 py-3 rounded-lg font-semibold transition",
                    !age || isNaN(parseInt(age, 10))
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500"
                  )}
                >
                  Weiter
                </button>
              </motion.div>
            )}

            {/* ─── Phase: State ───────────────────────────────────── */}
            {phase === "state" && (
              <motion.div
                key="state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-wrap gap-2">
                  {stateOptions.map((opt: StateOption) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        stateSelectionType === "single"
                          ? setSelectedStates([opt.id])
                          : handleStateToggle(opt.id)
                      }
                      className={clsx(
                        "px-4 py-2 rounded-full border transition",
                        selectedStates.includes(opt.id)
                          ? "bg-purple-600 border-purple-500"
                          : "bg-white/5 border-white/20 hover:border-purple-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {allowCustomState && (
                  <input
                    type="text"
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    placeholder="Oder eigene Beschreibung..."
                    className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                  />
                )}
                <button
                  onClick={handleStateConfirm}
                  disabled={selectedStates.length === 0 && !customState.trim()}
                  className={clsx(
                    "px-6 py-3 rounded-lg font-semibold transition",
                    selectedStates.length === 0 && !customState.trim()
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500"
                  )}
                >
                  Weiter
                </button>
              </motion.div>
            )}

            {/* ─── Phase: Thought ─────────────────────────────────── */}
            {phase === "thought" && (
              <motion.div
                key="thought"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {allowNothingThought && (
                  <button
                    onClick={() => {
                      setThought("Nichts")
                      setPhase("toward")
                    }}
                    className="self-start px-4 py-2 rounded-full bg-white/5 border border-white/20 hover:border-purple-500 text-sm transition"
                  >
                    Nichts
                  </button>
                )}
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder={thoughtPlaceholder}
                  rows={4}
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none resize-none"
                />
                <button
                  onClick={handleThoughtConfirm}
                  className="px-6 py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 transition"
                >
                  Weiter
                </button>
              </motion.div>
            )}

            {/* ─── Phase: Toward ──────────────────────────────────── */}
            {phase === "toward" && (
              <motion.div
                key="toward"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-wrap gap-2">
                  {towardOptions.map((opt: TowardOption) => (
                    <button
                      key={opt.id}
                      onClick={() => handleTowardSelect(opt.id)}
                      className={clsx(
                        "px-4 py-2 rounded-full border transition",
                        towardFeeling === opt.id
                          ? "bg-purple-600 border-purple-500"
                          : "bg-white/5 border-white/20 hover:border-purple-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {allowCustomToward && (
                  <input
                    type="text"
                    value={customToward}
                    onChange={(e) => setCustomToward(e.target.value)}
                    placeholder="Oder eigenes Gefühl..."
                    className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                  />
                )}
                {showCriticalNote && (
                  <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-4 py-3">
                    {towardCriticalNote}
                  </p>
                )}
                <button
                  onClick={handleTowardConfirm}
                  disabled={!towardFeeling && !customToward.trim()}
                  className={clsx(
                    "px-6 py-3 rounded-lg font-semibold transition",
                    !towardFeeling && !customToward.trim()
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-500"
                  )}
                >
                  Speichern & Weiter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {xp > 0 && <p className="mt-4 text-sm text-gray-400 text-center">+{xp} XP</p>}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STEP NEED
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "need") {
    const selectedOption = needOptions.find((o: NeedOption) => o.id === selectedNeedId)
    const bubbleTitle = showReaction && selectedOption 
      ? selectedOption.reactionText 
      : applyTemplate(needQuestion, ctx)

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble title={bubbleTitle} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar mt-6">
          {!showReaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-3">
                {needOptions.map((opt: NeedOption) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => handleNeedSelect(opt.id)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left px-5 py-4 rounded-xl bg-white/5 border border-white/20 hover:border-purple-500 transition"
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {showReaction && selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-6"
            >
              <p className="text-sm text-gray-400 italic">
                (Nimm dir einen Moment Zeit...)
              </p>
            </motion.div>
          )}
        </div>

        {xp > 0 && <p className="mt-4 text-sm text-gray-400 text-center">+{xp} XP</p>}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STEP RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "response") {
    const bubbleTitle = childReply || "Keine Antwort gefunden."

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble title={bubbleTitle} />
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto no-scrollbar mt-6">
          {/* Content wird in der AvatarBubble angezeigt */}
        </div>

        <motion.button
          onClick={handleResponseComplete}
          disabled={hasCompleted}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "mt-6 px-6 py-3 rounded-lg font-semibold transition",
            hasCompleted
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500"
          )}
        >
          {hasCompleted ? "Wird gespeichert..." : "Weiter"}
        </motion.button>

        {xp > 0 && <p className="mt-2 text-sm text-gray-400 text-center">+{xp} XP</p>}
      </div>
    )
  }

  // Fallback
  return <div className="flex items-center justify-center h-full text-white">Unbekannter Step: {step}</div>
}

export default memo(InnerChildAI)
