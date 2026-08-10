// src/components/interventions/ChatSimulationCard.tsx
// Template: "ChatSimulation" – WhatsApp-ähnliche Chat-Simulation mit Gefühls-Checks (Level 6)
// Wird von GamePlay.tsx via import.meta.glob automatisch als Template erkannt.
//
// QUEUE-LOGIK: Index-basiert via useRef – kein setState-in-setState-Bug.
// NEUTRAL-LOOP: Wenn emotion_select → "neutral" → nächste Situation aus alternativeSituations.

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useTemplateContext } from "@helpers/useTemplateContext"
import { applyTemplate } from "@helpers/template.tsx"
import type { UserProfilePatch } from "@api/types"
import IntensitySlider from "../../features/feelingExercise/components/IntensitySlider"
import { getEmotionConfig } from "../../features/feelingExercise/constants/emotionConfig"
import { evaluateLoop } from "../../features/feelingExercise/hooks/useFeelingLoop"
import type { EmotionType } from "../../features/feelingExercise/types"

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

type EmotionOption = {
  id: string
  emoji: string
  label: string
}

type InterruptPoint = {
  id: string
  type: "emotion_select" | "thought_input" | "impulse_select"
  question: string
  emotions?: EmotionOption[]
  placeholder?: string
  saveTo: string
}

type ChatMessage = {
  id: string
  sender: "opponent" | "user_suggestion"
  text: string
  delay?: number
  triggerInterrupt?: string
}

type Situation = {
  id: string
  title?: string
  messages: ChatMessage[]
}

type ChatSimulationData = {
  id: number
  xp?: number
  title: string
  situationSetup?: string
  // Entweder direkt messages (alte Struktur) oder situations (neue Struktur)
  messages?: ChatMessage[]
  situations?: Situation[]
  interruptPoints: InterruptPoint[]
  saveTo: string
  nextCardId?: string
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Patch-Wert setzen
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tipp-Indikator
// ---------------------------------------------------------------------------

function TypingIndicator({ opponentIcon }: { opponentIcon: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        {opponentIcon ? (
          <img src={opponentIcon} alt="Opponent" className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-sm">🐾</span>
        )}
      </div>
      <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/50"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Chat-Nachricht
// ---------------------------------------------------------------------------

function ChatBubble({
  message,
  opponentIcon,
  ctx,
}: {
  message: ChatMessage
  opponentIcon: string | null
  ctx: Record<string, string | number | null | undefined>
}) {
  const isOpponent = message.sender === "opponent"
  const renderedText = applyTemplate(message.text, ctx)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx("flex items-end gap-2", isOpponent ? "justify-start" : "justify-end")}
    >
      {isOpponent && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
          {opponentIcon ? (
            <img src={opponentIcon} alt="Opponent" className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-sm">🐾</span>
          )}
        </div>
      )}
      <div className={clsx("max-w-[75%] flex flex-col gap-0.5", !isOpponent && "items-end")}>
        {!isOpponent && (
          <p className="text-white/30 text-[10px] px-1">Mögliche Antwort</p>
        )}
        <div
          className={clsx(
            "px-4 py-2.5 text-sm leading-relaxed",
            isOpponent
              ? "bg-white/10 rounded-2xl rounded-bl-sm text-white/90"
              : "bg-white/20 rounded-2xl rounded-br-sm text-white/60 opacity-70"
          )}
        >
          {renderedText}
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// InterruptCard – eingebettet im Chat
// ---------------------------------------------------------------------------

type InterruptCardProps = {
  point: InterruptPoint
  ctx: Record<string, string | number | null | undefined>
  onAnswer: (saveTo: string, value: unknown, isNeutral?: boolean) => void
}

function InterruptCard({ point, ctx, onAnswer }: InterruptCardProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensityBefore, setIntensityBefore] = useState<number | null>(null)
  const [intensityAfter, setIntensityAfter] = useState<number | null>(null)
  const [loopCount, setLoopCount] = useState(0)
  const [phase, setPhase] = useState<"emotion" | "intensity_before" | "feeling" | "intensity_after">("emotion")
  const [thoughtText, setThoughtText] = useState("")
  const [selectedImpulse, setSelectedImpulse] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  const emotionConfig = selectedEmotion
    ? (() => { try { return getEmotionConfig(selectedEmotion as EmotionType) } catch { return null } })()
    : null

  const renderedQuestion = applyTemplate(point.question, ctx)

  // emotion_select: Vollständiger Feeling-Flow
  const handleEmotionConfirm = () => {
    if (!selectedEmotion) return
    // Neutral → direkt abschließen mit isNeutral=true
    if (selectedEmotion === "neutral") {
      onAnswer(point.saveTo, { emotion: "neutral", skipped: true }, true)
      setAnswered(true)
      return
    }
    setPhase("intensity_before")
  }

  const handleIntensityBeforeConfirm = () => {
    setPhase("feeling")
  }

  const handleFeelingDone = () => {
    setPhase("intensity_after")
  }

  const handleIntensityAfterSelect = (value: number) => {
    setIntensityAfter(value)
  }

  const handleIntensityAfterConfirm = () => {
    if (intensityAfter === null) return
    const decision = evaluateLoop(intensityAfter, loopCount)
    if (decision.shouldLoop && !decision.isMaxLoopsReached) {
      setLoopCount((c) => c + 1)
      setPhase("feeling")
    } else {
      const result = {
        emotion: selectedEmotion,
        intensityBefore,
        intensityAfter,
        loopCount: loopCount + (decision.shouldLoop ? 1 : 0),
      }
      onAnswer(point.saveTo, result, false)
      setAnswered(true)
    }
  }

  // thought_input
  const handleThoughtSubmit = () => {
    onAnswer(point.saveTo, thoughtText.trim(), false)
    setAnswered(true)
  }

  // impulse_select
  const handleImpulseSelect = (id: string) => {
    setSelectedImpulse(id)
    onAnswer(point.saveTo, id, false)
    setAnswered(true)
  }

  if (answered) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-900/20 border border-green-500/30 rounded-2xl px-4 py-3 text-center"
      >
        <p className="text-green-300 text-sm">✓ Notiert</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/15 rounded-2xl px-4 py-4 flex flex-col gap-3"
    >
      <p className="text-white/90 text-sm font-medium leading-relaxed">
        {renderedQuestion}
      </p>

      {/* emotion_select */}
      {point.type === "emotion_select" && (
        <>
          {phase === "emotion" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {point.emotions?.map((emo) => (
                  <motion.button
                    key={emo.id}
                    onClick={() => setSelectedEmotion(emo.id)}
                    whileTap={{ scale: 0.95 }}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all duration-200",
                      selectedEmotion === emo.id
                        ? "bg-green-600/30 border-green-500/70 text-green-200"
                        : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <span>{emo.emoji}</span>
                    <span>{emo.label}</span>
                  </motion.button>
                ))}
              </div>
              {selectedEmotion && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleEmotionConfirm}
                  className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
                >
                  {selectedEmotion === "neutral" ? "Weiter →" : "Dieses Gefühl fühlen →"}
                </motion.button>
              )}
            </div>
          )}

          {phase === "intensity_before" && emotionConfig && (
            <div className="flex flex-col gap-3">
              <p className="text-white/60 text-xs">
                Wie stark spürst du {emotionConfig.bodyLabel} gerade?
              </p>
              <IntensitySlider
                value={intensityBefore}
                onChange={setIntensityBefore}
                accentColor={emotionConfig.color}
              />
              {intensityBefore !== null && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleIntensityBeforeConfirm}
                  className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
                >
                  Weiter →
                </motion.button>
              )}
            </div>
          )}

          {phase === "feeling" && (
            <div className="flex flex-col gap-3 items-center py-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{
                  boxShadow: emotionConfig ? `0 0 20px 6px ${emotionConfig.color}33` : undefined,
                  background: emotionConfig ? `${emotionConfig.color}22` : "rgba(255,255,255,0.05)",
                }}
              >
                {point.emotions?.find((e) => e.id === selectedEmotion)?.emoji ?? "💭"}
              </div>
              <p className="text-white/60 text-xs text-center">
                Bleib kurz bei diesem Gefühl. Lass es da sein.
              </p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={handleFeelingDone}
                className="text-sm text-white/40 hover:text-white/70 transition-colors py-1"
              >
                Ich bin fertig
              </motion.button>
            </div>
          )}

          {phase === "intensity_after" && emotionConfig && (
            <div className="flex flex-col gap-3">
              <p className="text-white/60 text-xs">
                Wie stark spürst du {emotionConfig.bodyLabel} jetzt noch?
              </p>
              <IntensitySlider
                value={intensityAfter}
                onChange={handleIntensityAfterSelect}
                accentColor={emotionConfig.color}
              />
              {intensityAfter !== null && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleIntensityAfterConfirm}
                  className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
                >
                  Weiter →
                </motion.button>
              )}
            </div>
          )}
        </>
      )}

      {/* thought_input */}
      {point.type === "thought_input" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            placeholder={point.placeholder ?? "Was kommt dir in den Sinn?"}
            rows={2}
            className={clsx(
              "w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5",
              "text-white/90 text-sm placeholder-white/25 resize-none",
              "focus:outline-none focus:border-white/30 transition-all duration-200"
            )}
          />
          <motion.button
            onClick={handleThoughtSubmit}
            disabled={thoughtText.trim().length === 0}
            whileTap={thoughtText.trim().length > 0 ? { scale: 0.97 } : {}}
            className={clsx(
              "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
              thoughtText.trim().length > 0
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-white/5 text-white/25 cursor-not-allowed"
            )}
          >
            Notieren →
          </motion.button>
        </div>
      )}

      {/* impulse_select */}
      {point.type === "impulse_select" && (
        <div className="flex flex-col gap-2">
          {point.emotions?.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => handleImpulseSelect(opt.id)}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all duration-200",
                selectedImpulse === opt.id
                  ? "bg-green-600/30 border-green-500/70 text-green-200"
                  : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
              )}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Sichtbare Chat-Items
// ---------------------------------------------------------------------------

type VisibleItem =
  | { kind: "message"; message: ChatMessage }
  | { kind: "typing" }
  | { kind: "interrupt"; point: InterruptPoint; interruptIndex: number }
  | { kind: "situation_header"; text: string }

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

function ChatSimulationCard({ data }: { data: ChatSimulationData }) {
  const {
    id,
    xp = 80,
    title,
    situationSetup,
    messages: directMessages,
    situations,
    interruptPoints,
    saveTo,
    nextCardId,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  const opponentId = useAppSelector((s) => (s as any).session?.profile?.opponent_animal ?? null)
  const opponentIcon = opponentId ? `/assets/animals/svg/${opponentId}.svg` : null

  // Situationen normalisieren: entweder situations[] oder direkt messages[]
  const allSituations: Situation[] = situations
    ? situations
    : directMessages
    ? [{ id: "default", messages: directMessages }]
    : []

  // Aktueller Situations-Index (für Neutral-Loop)
  const [situationIndex, setSituationIndex] = useState(0)
  const currentSituation = allSituations[situationIndex] ?? allSituations[0]
  const currentMessages = currentSituation?.messages ?? []

  // Sichtbare Items im Chat
  const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([])

  // Welcher Message-Index wird als nächstes verarbeitet
  const messageIndexRef = useRef(0)
  // Läuft gerade ein Timer/Delay?
  const processingRef = useRef(false)
  // Warten auf Interrupt-Antwort?
  const [waitingForInterrupt, setWaitingForInterrupt] = useState<string | null>(null)
  // Beantwortete Interrupts (Index → beantwortet)
  const [answeredInterruptIndices, setAnsweredInterruptIndices] = useState<Set<number>>(new Set())
  // Gesammelte Antworten
  const [interruptAnswers, setInterruptAnswers] = useState<Record<string, unknown>>({})
  // Alles fertig?
  const [allDone, setAllDone] = useState(false)
  const [completing, setCompleting] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  const renderedTitle = applyTemplate(title, ctx)
  const renderedSetup = situationSetup ? applyTemplate(situationSetup, ctx) : null

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 80)
  }, [])

  // Situation wechseln (Neutral-Loop)
  const switchToNextSituation = useCallback(() => {
    const nextIdx = situationIndex + 1
    if (nextIdx >= allSituations.length) {
      // Keine weitere Situation → trotzdem abschließen
      setAllDone(true)
      return
    }
    // Neue Situation starten
    setSituationIndex(nextIdx)
    messageIndexRef.current = 0
    processingRef.current = false
    setWaitingForInterrupt(null)
    const nextSit = allSituations[nextIdx]
    setVisibleItems((prev) => [
      ...prev,
      { kind: "situation_header", text: nextSit.title ?? `Situation ${nextIdx + 1}` },
    ])
    scrollToBottom()
  }, [situationIndex, allSituations, scrollToBottom])

  // Nächste Nachricht aus currentMessages verarbeiten
  const processNext = useCallback(() => {
    if (processingRef.current) return
    if (waitingForInterrupt) return

    const idx = messageIndexRef.current
    const msgs = currentMessages

    if (idx >= msgs.length) {
      setAllDone(true)
      return
    }

    const msg = msgs[idx]
    processingRef.current = true

    // Tipp-Indikator zeigen
    setVisibleItems((prev) => [...prev, { kind: "typing" }])
    scrollToBottom()

    const delay = msg.delay ?? 1200

    setTimeout(() => {
      // Tipp-Indikator entfernen, Nachricht hinzufügen
      setVisibleItems((prev) => {
        const withoutTyping = prev.filter((i) => i.kind !== "typing")
        return [...withoutTyping, { kind: "message", message: msg }]
      })
      scrollToBottom()

      messageIndexRef.current = idx + 1
      processingRef.current = false

      // Interrupt nach dieser Nachricht?
      if (msg.triggerInterrupt) {
        const point = interruptPoints.find((p) => p.id === msg.triggerInterrupt)
        if (point) {
          const interruptIndex = interruptPoints.indexOf(point)
          setTimeout(() => {
            setVisibleItems((prev) => [
              ...prev,
              { kind: "interrupt", point, interruptIndex },
            ])
            setWaitingForInterrupt(point.id)
            scrollToBottom()
          }, 400)
          return // WICHTIG: Hier stoppen, nicht weitermachen!
        }
      }

      // Kein Interrupt → nächste Nachricht nach kurzem Delay
      setTimeout(() => {
        processingRef.current = false
        // Trigger re-run via dummy state update
        setVisibleItems((prev) => [...prev])
      }, 300)
    }, delay)
  }, [currentMessages, interruptPoints, waitingForInterrupt, scrollToBottom])

  // Effect: Nächste Nachricht starten wenn nicht blockiert
  useEffect(() => {
    if (waitingForInterrupt) return
    if (allDone) return
    if (processingRef.current) return

    const idx = messageIndexRef.current
    if (idx >= currentMessages.length) {
      setAllDone(true)
      return
    }

    const timer = setTimeout(() => {
      processNext()
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleItems, waitingForInterrupt, allDone, situationIndex])

  // Interrupt beantwortet
  const handleInterruptAnswer = useCallback(
    (interruptIndex: number, interruptId: string, value: unknown, isNeutral: boolean) => {
      setInterruptAnswers((prev) => ({ ...prev, [interruptId]: value }))
      setAnsweredInterruptIndices((prev) => new Set([...prev, interruptIndex]))
      
      // WICHTIG: Erst nach Delay waitingForInterrupt zurücksetzen
      // Sonst startet der useEffect sofort die nächste Nachricht
      setTimeout(() => {
        setWaitingForInterrupt(null)
        processingRef.current = false

        if (isNeutral) {
          // Neutral → nächste Situation versuchen
          switchToNextSituation()
        } else {
          // Weiter mit nächster Nachricht - trigger effect
          setVisibleItems((prev) => [...prev])
        }
      }, 600)
    },
    [switchToNextSituation]
  )

  // Abschließen
  const handleComplete = useCallback(async () => {
    if (!api || completing) return
    setCompleting(true)

    const profilePatch: Record<string, unknown> = {}
    const simulationData: Record<string, unknown> = {}

    for (const [interruptId, value] of Object.entries(interruptAnswers)) {
      const point = interruptPoints.find((p) => p.id === interruptId)
      if (point) {
        assignPatchValue(profilePatch, point.saveTo, value)
        simulationData[interruptId] = value
      }
    }
    assignPatchValue(profilePatch, saveTo, simulationData)

    try {
      if (Object.keys(profilePatch).length > 0) {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("[ChatSimulation] patchUserProfile fehlgeschlagen:", err)
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
          ...(nextCardId ? { targetCardId: nextCardId } : {}),
        },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, completing, interruptAnswers, interruptPoints, saveTo, id, xp, nextCardId, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-white/90 text-sm font-medium leading-relaxed">
            {renderedTitle}
          </p>
          {renderedSetup && (
            <p className="text-white/50 text-xs leading-relaxed mt-1">
              {renderedSetup}
            </p>
          )}
        </div>
      </div>

      {/* Chat-Verlauf */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col gap-3"
      >
        <AnimatePresence initial={false}>
          {visibleItems.map((item, index) => {
            if (item.kind === "typing") {
              return (
                <TypingIndicator key={`typing-${index}`} opponentIcon={opponentIcon} />
              )
            }
            if (item.kind === "message") {
              return (
                <ChatBubble
                  key={`msg-${item.message.id}-${index}`}
                  message={item.message}
                  opponentIcon={opponentIcon}
                  ctx={ctx}
                />
              )
            }
            if (item.kind === "situation_header") {
              return (
                <motion.div
                  key={`sit-header-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 py-1"
                >
                  <div className="flex-1 h-px bg-white/10" />
                  <p className="text-white/30 text-xs">{item.text}</p>
                  <div className="flex-1 h-px bg-white/10" />
                </motion.div>
              )
            }
            if (item.kind === "interrupt") {
              const isAnswered = answeredInterruptIndices.has(item.interruptIndex)
              return (
                <motion.div key={`interrupt-${item.point.id}-${index}`}>
                  {isAnswered ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-900/20 border border-green-500/30 rounded-2xl px-4 py-3 text-center"
                    >
                      <p className="text-green-300 text-sm">✓ Notiert</p>
                    </motion.div>
                  ) : (
                    <InterruptCard
                      point={item.point}
                      ctx={ctx}
                      onAnswer={(_saveTo, value, isNeutral) =>
                        handleInterruptAnswer(item.interruptIndex, item.point.id, value, isNeutral ?? false)
                      }
                    />
                  )}
                </motion.div>
              )
            }
            return null
          })}
        </AnimatePresence>
      </div>

      {/* Weiter-Button */}
      <AnimatePresence>
        {allDone && !waitingForInterrupt && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 px-5 pb-5 pt-2"
          >
            <motion.button
              onClick={handleComplete}
              disabled={completing}
              whileTap={!completing ? { scale: 0.97 } : {}}
              className={clsx(
                "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
                completing
                  ? "bg-green-600/50 text-white/50 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 text-white shadow-lg"
              )}
            >
              {completing ? "Wird gespeichert..." : "Weiter →"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(ChatSimulationCard)
