/** @orphan-check-start
 * Auto-generated von check-orphaned-templates.js — bitte nicht von Hand editieren.
 * Zuletzt geprüft: 2026-08-16
 * Status: aktiv — wird von mindestens einem Level referenziert
 * Referenziert in: level-24.json
 * @orphan-check-end */

import { useState, useCallback, useEffect, memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "@ui/AvatarBubble"
import ScrollHintArrow from "@ui/ScrollHintArrow"
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

import { useScrollHint } from "@ui/useScrollHint"
import type { UserProfilePatch } from "@api/types" 

/* =======================
   Types
======================= */

type InnerChildMode = "presence" | "situational"
type InnerChildStep = "identify" | "need" | "response"

interface StateOption {
  id: string
  label: string
  specificQuestion?: string
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
  relevantForStates?: string[]
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
  stateFocusQuestion?: string

  // step "need" props
  needQuestion?: string
  needOptions?: NeedOption[]

  // step "response" props: reads childReplyText directly from saved data,
  // needOptions no longer required on this step. messageSaveTo optionally
  // points to a separate Form card's saveTo (e.g. the user's written message)
  // so it can be echoed back before the child's reply.
  messageSaveTo?: string
  childVoiceLabel?: string // Default: "Das innere Kind sagt" — Präfix vor childReplyText,
                            // damit klar ist, dass das Kind spricht, nicht der User selbst
                            // (AvatarBubble zeigt sonst missverständlich den User-Avatar)
}

export interface InnerChildResult {
  age?: number
  states?: string[]
  stateFocus?: string
  thought?: string
  towardFeeling?: string
  needId?: string
  childReplyText?: string
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
    stateFocusQuestion = "Du hast mehrere genannt. Welches davon ist gerade am lautesten?",
    // need
    needQuestion = "Was braucht es gerade von dir?",
    needOptions = [],
    // response
    messageSaveTo,
    childVoiceLabel = "Das innere Kind sagt",
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
  const [phase, setPhase] = useState<"age" | "state" | "state_focus" | "thought" | "toward" | "complete">("age")
  const [age, setAge] = useState<string>("")
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [customState, setCustomState] = useState<string>("")
  const [focusStateId, setFocusStateId] = useState<string>("")
  const [thought, setThought] = useState<string>("")
  const [towardFeeling, setTowardFeeling] = useState<string>("")
  const [customToward, setCustomToward] = useState<string>("")
  const [showCriticalNote, setShowCriticalNote] = useState(false)
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false)

  // ─── State for step "need" ─────────────────────────────────────────────────
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null)
  const [showReaction, setShowReaction] = useState(false)

  // ─── State for step "response" ─────────────────────────────────────────────
  const [hasCompleted, setHasCompleted] = useState(false)

  // ─── Scroll affordance (no-scrollbar hides the native cue, so we add our own) ─
  const identifyScroll = useScrollHint<HTMLDivElement>()
  const needScroll = useScrollHint<HTMLDivElement>()

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

  const focusChoices = useMemo(() => {
    const predefined = selectedStates
      .map((sid) => stateOptions.find((o: StateOption) => o.id === sid))
      .filter(Boolean) as StateOption[]
    if (customState.trim()) {
      return [...predefined, { id: "__custom__", label: customState.trim() } as StateOption]
    }
    return predefined
  }, [selectedStates, customState, stateOptions])

  const handleStateConfirm = useCallback(() => {
    if (focusChoices.length > 1) {
      setPhase("state_focus")
    } else if (focusChoices.length === 1) {
      setFocusStateId(focusChoices[0].id)
      setPhase("thought")
    }
  }, [focusChoices])

  const handleStateFocusSelect = useCallback((id: string) => {
    setFocusStateId(id)
    setPhase("thought")
  }, [])

  const focusOption = useMemo(
    () => stateOptions.find((o: StateOption) => o.id === focusStateId),
    [stateOptions, focusStateId]
  )
  const effectiveThoughtQuestion = focusOption?.specificQuestion || thoughtQuestion

  useEffect(() => {
    identifyScroll.recheck()
  }, [phase, selectedStates, focusChoices, identifyScroll])

  useEffect(() => {
    needScroll.recheck()
  }, [showReaction, needOptions, needScroll])

  const handleThoughtConfirm = useCallback(() => {
    setPhase("toward")
  }, [])

  const handleTowardSelect = useCallback(
    (optionId: string) => {
      setTowardFeeling(optionId)
      const option = towardOptions.find((o: TowardOption) => o.id === optionId)
      setShowCriticalNote(!!option?.critical)
      setCriticalAcknowledged(false)
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
      stateFocus: focusOption?.label || (focusStateId === "__custom__" ? customState.trim() : undefined),
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
    focusOption,
    focusStateId,
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

  const handleNeedSelect = useCallback((needId: string) => {
    // Just reveal the reaction text — no auto-advance.
    // The user decides when they're ready via handleNeedContinue.
    setSelectedNeedId(needId)
    setShowReaction(true)
  }, [])

  const handleNeedContinue = useCallback(async () => {
    if (!api || !selectedNeedId) return

    const selectedOption = needOptions.find((o: NeedOption) => o.id === selectedNeedId)

    // Save needId AND the resolved childReplyText directly — the "response"
    // step then just reads it back, no need to pass needOptions twice.
    const updated: InnerChildResult = {
      ...existingData,
      needId: selectedNeedId,
      childReplyText: selectedOption?.childReplyText,
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
  }, [api, existingData, saveTo, selectedNeedId, needOptions, dispatch, id, xp, startAnimation, slideManager])

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP: RESPONSE - Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const childReply = existingData.childReplyText || null

  const writtenMessage = useMemo(() => {
    if (!messageSaveTo) return null
    const val = getProfileValue(profile as unknown as Record<string, unknown>, messageSaveTo)
    return typeof val === "string" && val.trim() ? val.trim() : null
  }, [profile, messageSaveTo])

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
      : phase === "state_focus" ? applyTemplate(stateFocusQuestion, ctx)
      : phase === "thought" ? applyTemplate(effectiveThoughtQuestion, ctx)
      : phase === "toward" ? applyTemplate(towardQuestion, ctx)
      : "Inneres Kind"

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble title={bubbleTitle} />
        </div>

        <div className="flex-1 min-h-0 relative mt-6">
          <div ref={identifyScroll.ref} className="h-full overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
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

            {/* ─── Phase: State Focus (only shown when multiple states were chosen) ── */}
            {phase === "state_focus" && (
              <motion.div
                key="state_focus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-wrap gap-2">
                  {focusChoices.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleStateFocusSelect(opt.id)}
                      className="px-4 py-2 rounded-full border bg-white/5 border-white/20 hover:border-purple-500 transition"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-4 py-3">
                      {towardCriticalNote}
                    </p>
                    {!criticalAcknowledged ? (
                      <button
                        onClick={() => setCriticalAcknowledged(true)}
                        className="self-start px-4 py-2 rounded-full bg-white/5 border border-yellow-500/40 hover:border-yellow-400 text-sm transition"
                      >
                        Ich hab kurz innegehalten
                      </button>
                    ) : (
                      <p className="text-sm text-gray-400">✓ Danke.</p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleTowardConfirm}
                  disabled={(!towardFeeling && !customToward.trim()) || (showCriticalNote && !criticalAcknowledged)}
                  className={clsx(
                    "px-6 py-3 rounded-lg font-semibold transition",
                    (!towardFeeling && !customToward.trim()) || (showCriticalNote && !criticalAcknowledged)
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
          <AnimatePresence>
            {identifyScroll.canScrollDown && (
              <ScrollHintArrow onClick={() => identifyScroll.scrollDown()} />
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

    const currentStates = existingData.states || []
    const sortedNeedOptions = [...needOptions].sort((a: NeedOption, b: NeedOption) => {
      const aMatch = (a.relevantForStates || []).some((s) => currentStates.includes(s)) ? 1 : 0
      const bMatch = (b.relevantForStates || []).some((s) => currentStates.includes(s)) ? 1 : 0
      return bMatch - aMatch
    })
    // Nur die obersten Treffer markieren, nicht jede Option mit irgendeiner
    // Überschneidung — sonst verliert das Label seinen Sinn, sobald der User
    // mehrere Zustände gleichzeitig gewählt hat.
    const MAX_HIGHLIGHTED = 2
    let highlightedCount = 0

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble title={bubbleTitle} />
        </div>

        <div className="flex-1 min-h-0 relative mt-6">
          <div ref={needScroll.ref} className="h-full overflow-y-auto no-scrollbar">
          {!showReaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-3">
                {sortedNeedOptions.map((opt: NeedOption) => {
                  const matches = (opt.relevantForStates || []).some((s) => currentStates.includes(s))
                  const showBadge = matches && highlightedCount < MAX_HIGHLIGHTED
                  if (showBadge) highlightedCount++
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handleNeedSelect(opt.id)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-5 py-4 rounded-xl bg-white/5 border border-white/20 hover:border-purple-500 transition"
                    >
                      {opt.label}
                      {showBadge && (
                        <span className="ml-2 text-xs text-purple-300">· passt gerade vielleicht</span>
                      )}
                    </motion.button>
                  )
                })}
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
              <motion.button
                onClick={handleNeedContinue}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 transition"
              >
                Weiter, wenn du bereit bist
              </motion.button>
            </motion.div>
          )}
          </div>
          <AnimatePresence>
            {needScroll.canScrollDown && (
              <ScrollHintArrow onClick={() => needScroll.scrollDown()} />
            )}
          </AnimatePresence>
        </div>

        {xp > 0 && <p className="mt-4 text-sm text-gray-400 text-center">+{xp} XP</p>}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STEP RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════

  if (step === "response") {
    const bubbleTitle = childReply
      ? `${childVoiceLabel}: „${childReply}"`
      : "Keine Antwort gefunden."

    return (
      <div className="flex flex-col h-full p-6 text-white">
        <div className="shrink-0 flex flex-col gap-4">
          {writtenMessage && (
            <div className="text-sm text-gray-400 italic border-l-2 border-white/20 pl-3">
              Du hast geschrieben: "{writtenMessage}"
            </div>
          )}
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
