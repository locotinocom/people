// src/components/interventions/ChatSimulationCard.tsx
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
import { FEELING_BUBBLE_TEXTS } from "../../features/feelingExercise/constants/feelingBubbleTexts"

type EmotionOption = { id: string; emoji: string; label: string }

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
  title: string
  description: string
  emoji: string
  messages: ChatMessage[]
}

type ChatSimulationData = {
  id: number
  xp?: number
  title: string
  situationSetup?: string
  situations: Situation[]
  interruptPoints: InterruptPoint[]
  saveTo: string
  nextCardId?: string
}

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

function ChatBubble({
  message,
  opponentIcon,
  ctx,
}: {
  message: ChatMessage
  opponentIcon: string | null
  ctx: Record<string, any>
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

type InterruptCardProps = {
  point: InterruptPoint
  ctx: Record<string, any>
  onAnswer: (saveTo: string, value: unknown) => void
}

function InterruptCard({ point, ctx, onAnswer }: InterruptCardProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensityBefore, setIntensityBefore] = useState<number | null>(null)
  const [intensityAfter, setIntensityAfter] = useState<number | null>(null)
  const [loopCount, setLoopCount] = useState(0)
  
  const [underlyingEmotion, setUnderlyingEmotion] = useState<string | null>(null)
  const [underlyingIntensityBefore, setUnderlyingIntensityBefore] = useState<number | null>(null)
  const [underlyingIntensityAfter, setUnderlyingIntensityAfter] = useState<number | null>(null)
  const [underlyingLoopCount, setUnderlyingLoopCount] = useState(0)

  const [phase, setPhase] = useState<
    "emotion" | "intensity_before" | "feeling" | "intensity_after" | 
    "secondary_reveal" | "underlying_intensity_before" | "underlying_feeling" | "underlying_intensity_after" | 
    "done"
  >("emotion")
  
  const [thoughtText, setThoughtText] = useState("")

  // Lokale Text-Ticker States für die Gefühls-Phasen
  const [coachingTextIdx, setCoachingTextIdx] = useState(0)
  const [underlyingTextIdx, setUnderlyingTextIdx] = useState(0)

  const primaryEmotions = [
    { id: "helplessness", emoji: "⛓️", label: "Ohnmacht / Hilflosigkeit", bodyLabel: "die Lähmung & Ohnmacht" },
    { id: "fear", emoji: "😰", label: "Angst / Bedrohung", bodyLabel: "die Enge & Angst" },
    { id: "shame", emoji: "🫣", label: "Scham / Wertlosigkeit", bodyLabel: "die Hitze & Scham" },
    { id: "guilt", emoji: "😔", label: "Schuldgefühl", bodyLabel: "den Druck & die Schuld" },
    { id: "despair", emoji: "🌧️", label: "Verzweiflung", bodyLabel: "die Schwere & Verzweiflung" },
    { id: "hopelessness", emoji: "🕳️", label: "Hoffnungslosigkeit", bodyLabel: "die Leere & Hoffnungslosigkeit" }
  ]

  const emotionConfig = selectedEmotion
    ? (() => { try { return getEmotionConfig(selectedEmotion as EmotionType) } catch { return null } })()
    : null

  const underlyingConfig = underlyingEmotion
    ? primaryEmotions.find(e => e.id === underlyingEmotion)
    : null

  // Ticker-Effekt für reguläre Emotionen während der "feeling"-Phase
  useEffect(() => {
    if (phase !== "feeling" || !selectedEmotion) return
    const texts = FEELING_BUBBLE_TEXTS[selectedEmotion] || []
    if (texts.length <= 1) return

    const interval = setInterval(() => {
      setCoachingTextIdx((prev) => (prev + 1) % texts.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [phase, selectedEmotion])

  // Ticker-Effekt für das darunterliegende Gefühl während der "underlying_feeling"-Phase
  useEffect(() => {
    if (phase !== "underlying_feeling" || !underlyingEmotion) return
    const texts = FEELING_BUBBLE_TEXTS[underlyingEmotion] || []
    if (texts.length <= 1) return

    const interval = setInterval(() => {
      setUnderlyingTextIdx((prev) => (prev + 1) % texts.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [phase, underlyingEmotion])

  const renderedQuestion = applyTemplate(point.question, ctx)

  const handleEmotionConfirm = () => {
    if (!selectedEmotion) return
    if (selectedEmotion === "neutral") {
      onAnswer(point.saveTo, { emotion: "neutral", skipped: true })
      setPhase("done")
      return
    }
    setPhase("intensity_before")
  }

  const handleIntensityAfterConfirm = () => {
    if (intensityAfter === null) return
    const decision = evaluateLoop(intensityAfter, loopCount)
    
    if (decision.shouldLoop && !decision.isMaxLoopsReached) {
      setLoopCount((c) => c + 1)
      setCoachingTextIdx(0) // Reset Ticker für den nächsten Loop
      setPhase("feeling")
    } else {
      if (selectedEmotion === "angry" || selectedEmotion === "stressed") { 
        setPhase("secondary_reveal")
      } else {
        onAnswer(point.saveTo, {
          emotion: selectedEmotion,
          intensityBefore,
          intensityAfter,
          loopCount: loopCount + (decision.shouldLoop ? 1 : 0),
        })
        setPhase("done")
      }
    }
  }

  const handleUnderlyingIntensityAfterConfirm = () => {
    if (underlyingIntensityAfter === null) return
    const decision = evaluateLoop(underlyingIntensityAfter, underlyingLoopCount)
    
    if (decision.shouldLoop && !decision.isMaxLoopsReached) {
      setUnderlyingLoopCount((c) => c + 1)
      setUnderlyingTextIdx(0) // Reset Ticker für den nächsten Loop
      setPhase("underlying_feeling")
    } else {
      onAnswer(point.saveTo, {
        emotion: selectedEmotion,
        intensityBefore,
        intensityAfter,
        loopCount,
        underlyingEmotion: {
          id: underlyingEmotion,
          intensityBefore: underlyingIntensityBefore,
          intensityAfter: underlyingIntensityAfter,
          loopCount: underlyingLoopCount + (decision.shouldLoop ? 1 : 0)
        }
      })
      setPhase("done")
    }
  }

  if (phase === "done") {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-2xl px-4 py-3 text-center">
        <p className="text-green-300 text-sm">✓ Notiert</p>
      </div>
    )
  }

  // Bestimme die aktuell anzuzeigenden Texte aus der feelingBubbleTexts
  const currentCoachingTexts = selectedEmotion ? (FEELING_BUBBLE_TEXTS[selectedEmotion] || []) : []
  const activeCoachingText = currentCoachingTexts[coachingTextIdx] || "Bleib kurz bei diesem Gefühl. Lass es da sein."

  const currentUnderlyingTexts = underlyingEmotion ? (FEELING_BUBBLE_TEXTS[underlyingEmotion] || []) : []
  const activeUnderlyingText = currentUnderlyingTexts[underlyingTextIdx] || "Atme durch. Es darf jetzt für einen kurzen Moment einfach da sein. Du bist in Sicherheit."

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/15 rounded-2xl px-4 py-4 flex flex-col gap-3"
    >
      {phase !== "secondary_reveal" && 
       phase !== "underlying_intensity_before" && 
       phase !== "underlying_feeling" && 
       phase !== "underlying_intensity_after" && (
         <p className="text-white/90 text-sm font-medium leading-relaxed">{renderedQuestion}</p>
      )}

      {point.type === "emotion_select" && (
        <>
          {phase === "emotion" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {point.emotions?.map((emo) => (
                  <button
                    key={emo.id}
                    onClick={() => setSelectedEmotion(emo.id)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all duration-200",
                      selectedEmotion === emo.id
                        ? "bg-green-600/30 border-green-500/70 text-green-200"
                        : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <span>{emo.emoji}</span>
                    <span>{emo.label}</span>
                  </button>
                ))}
              </div>
              {selectedEmotion && (
                <button
                  onClick={handleEmotionConfirm}
                  className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold"
                >
                  {selectedEmotion === "neutral" ? "Weiter →" : "Dieses Gefühl fühlen →"}
                </button>
              )}
            </div>
          )}

          {phase === "intensity_before" && emotionConfig && (
            <div className="flex flex-col gap-3">
              <p className="text-white/60 text-xs">Wie stark spürst du {emotionConfig.bodyLabel} gerade?</p>
              <IntensitySlider value={intensityBefore} onChange={setIntensityBefore} accentColor={emotionConfig.color} />
              {intensityBefore !== null && (
                <button onClick={() => setPhase("feeling")} className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold">
                  Weiter →
                </button>
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
              
              {/* Animierter, rotierender Coaching Text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={coachingTextIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/80 text-xs text-center min-h-[32px] px-4 flex items-center justify-center"
                >
                  {activeCoachingText}
                </motion.p>
              </AnimatePresence>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => setPhase("intensity_after")}
                className="text-sm text-white/40 hover:text-white/70 py-1"
              >
                Ich bin fertig
              </motion.button>
            </div>
          )}

          {phase === "intensity_after" && emotionConfig && (
            <div className="flex flex-col gap-3">
              <p className="text-white/60 text-xs">Wie stark spürst du {emotionConfig.bodyLabel} jetzt noch?</p>
              <IntensitySlider value={intensityAfter} onChange={setIntensityAfter} accentColor={emotionConfig.color} />
              {intensityAfter !== null && (
                <button onClick={handleIntensityAfterConfirm} className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold">
                  Weiter →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ---------------- WUT-DEEP-DIVE ---------------- */}
      {phase === "secondary_reveal" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200/90 leading-relaxed">
            <strong>💡 Psychologischer Fact:</strong> Wut und Ärger sind oft ein unbewusster Schutzschild. Sie rasen hoch, um uns vor einem verletzlicheren, tieferen Gefühl zu schützen.
          </div>
          <p className="text-white/90 text-sm font-medium leading-relaxed">Wenn du unter die Wut schaust: Welches Gefühl will die Wut hier eigentlich beschützen?</p>
          
          <div className="flex flex-col gap-2">
            {primaryEmotions.map((pEmo) => (
              <button
                key={pEmo.id}
                onClick={() => {
                  setUnderlyingEmotion(pEmo.id);
                  setPhase("underlying_intensity_before");
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left bg-white/5 border-white/15 text-white/80 hover:bg-white/10 transition-all"
              >
                <span>{pEmo.emoji}</span>
                <span>{pEmo.label}</span>
              </button>
            ))}
            <button 
              onClick={() => {
                onAnswer(point.saveTo, { emotion: selectedEmotion, intensityBefore, intensityAfter, loopCount, underlyingEmotion: null });
                setPhase("done");
              }}
              className="text-xs text-white/40 hover:text-white/60 text-center py-2"
            >
              Nichts davon, es ist nur reine Wut.
            </button>
          </div>
        </motion.div>
      )}

      {phase === "underlying_intensity_before" && underlyingConfig && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <p className="text-white/90 text-sm font-medium">Lass uns dort kurz hinschauen.</p>
          <p className="text-white/60 text-xs">Wie stark nimmst du {underlyingConfig.bodyLabel} jetzt in dir wahr?</p>
          <IntensitySlider value={underlyingIntensityBefore} onChange={setUnderlyingIntensityBefore} accentColor="#f43f5e" />
          {underlyingIntensityBefore !== null && (
            <button onClick={() => setPhase("underlying_feeling")} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold">
              Dieses Gefühl da sein lassen →
            </button>
          )}
        </motion.div>
      )}

      {phase === "underlying_feeling" && underlyingConfig && (
        <div className="flex flex-col gap-3 items-center py-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              boxShadow: `0 0 20px 6px #f43f5e33`,
              background: `rgba(244, 63, 94, 0.15)`,
            }}
          >
            {underlyingConfig.emoji}
          </div>
          <p className="text-white/80 text-sm font-medium text-center">{underlyingConfig.label}</p>
          
          {/* Animierter, rotierender Coaching Text für Primäremotionen */}
          <AnimatePresence mode="wait">
            <motion.p
              key={underlyingTextIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-white/50 text-xs text-center max-w-[90%] min-h-[32px] px-4 flex items-center justify-center"
            >
              {activeUnderlyingText}
            </motion.p>
          </AnimatePresence>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
            onClick={() => setPhase("underlying_intensity_after")}
            className="text-sm text-white/40 hover:text-white/70 py-1 mt-2"
          >
            Ich habe es gefühlt
          </motion.button>
        </div>
      )}

      {phase === "underlying_intensity_after" && underlyingConfig && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <p className="text-white/60 text-xs">Wie intensiv fühlt sich {underlyingConfig.bodyLabel} jetzt an?</p>
          <IntensitySlider value={underlyingIntensityAfter} onChange={setUnderlyingIntensityAfter} accentColor="#f43f5e" />
          {underlyingIntensityAfter !== null && (
            <button onClick={handleUnderlyingIntensityAfterConfirm} className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold">
              Speichern & Weiter →
            </button>
          )}
        </motion.div>
      )}

      {/* ---------------- RESTLICHE INPUT-TYPES ---------------- */}
      {point.type === "thought_input" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            placeholder={point.placeholder ?? "Was kommt dir in den Sinn?"}
            rows={2}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 resize-none focus:outline-none"
          />
          <button
            onClick={() => { onAnswer(point.saveTo, thoughtText.trim()); setPhase("done") }}
            disabled={thoughtText.trim().length === 0}
            className={clsx("w-full py-2.5 rounded-xl text-sm font-semibold", thoughtText.trim().length > 0 ? "bg-green-600 text-white" : "bg-white/5 text-white/25 cursor-not-allowed")}
          >
            Notieren →
          </button>
        </div>
      )}

      {point.type === "impulse_select" && (
        <div className="flex flex-col gap-2">
          {point.emotions?.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onAnswer(point.saveTo, opt.id); setPhase("done") }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

type VisibleItem =
  | { kind: "message"; message: ChatMessage }
  | { kind: "typing" }
  | { kind: "interrupt"; point: InterruptPoint; interruptIndex: number }

function ChatSimulationCard({ data }: { data: ChatSimulationData }) {
  const { id, xp = 80, title, situationSetup, situations, interruptPoints, saveTo, nextCardId } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  const opponentId = useAppSelector((s) => (s as any).session?.profile?.opponent_animal ?? null)
  const opponentIcon = opponentId ? `/assets/animals/svg/${opponentId}.svg` : null

  const [phase, setPhase] = useState<"select_situation" | "chatting" | "done">("select_situation")
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null)
  const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([])

  const messageIndexRef = useRef(0)
  const processingRef = useRef(false)
  const [waitingForInterrupt, setWaitingForInterrupt] = useState<string | null>(null)
  const [answeredInterruptIndices, setAnsweredInterruptIndices] = useState<Set<number>>(new Set())
  const [interruptAnswers, setInterruptAnswers] = useState<Record<string, unknown>>({})
  const [completing, setCompleting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, 60)
  }, [])

  const startSimulation = (situation: Situation) => {
    setSelectedSituation(situation)
    messageIndexRef.current = 0
    processingRef.current = false
    setWaitingForInterrupt(null)
    setVisibleItems([])
    setPhase("chatting")
  }

  const processNext = useCallback(() => {
    if (!selectedSituation || processingRef.current || waitingForInterrupt || phase !== "chatting") return

    const idx = messageIndexRef.current
    const msgs = selectedSituation.messages

    if (idx >= msgs.length) {
      setPhase("done")
      return
    }

    const msg = msgs[idx]
    processingRef.current = true

    if (msg.sender === "opponent") {
      setVisibleItems((prev) => [...prev, { kind: "typing" }])
      scrollToBottom()
    }

    const delay = msg.delay ?? 1200

    setTimeout(() => {
      setVisibleItems((prev) => {
        const clean = prev.filter((i) => i.kind !== "typing")
        return [...clean, { kind: "message", message: msg }]
      })
      scrollToBottom()

      messageIndexRef.current = idx + 1

      if (msg.triggerInterrupt) {
        const point = interruptPoints.find((p) => p.id === msg.triggerInterrupt)
        if (point) {
          const interruptIndex = interruptPoints.indexOf(point)
          setWaitingForInterrupt(point.id)
          
          setTimeout(() => {
            setVisibleItems((prev) => [...prev, { kind: "interrupt", point, interruptIndex }])
            scrollToBottom()
          }, 400)
          return 
        }
      }

    network_processing_label:
      processingRef.current = false
      setVisibleItems((prev) => [...prev])
    }, delay)
  }, [selectedSituation, waitingForInterrupt, phase, interruptPoints, scrollToBottom])

  useEffect(() => {
    if (phase === "chatting" && !waitingForInterrupt && !processingRef.current) {
      processNext()
    }
  }, [phase, waitingForInterrupt, visibleItems, processNext])

  const handleInterruptAnswer = useCallback((interruptIndex: number, interruptId: string, value: unknown) => {
    setInterruptAnswers((prev) => ({ ...prev, [interruptId]: value }))
    setAnsweredInterruptIndices((prev) => new Set([...prev, interruptIndex]))
    
    setTimeout(() => {
      setWaitingForInterrupt(null)
      processingRef.current = false
      setVisibleItems((prev) => [...prev])
    }, 600)
  }, [])

  const handleComplete = useCallback(async () => {
    if (!api || completing || !selectedSituation) return
    setCompleting(true)

    const profilePatch: Record<string, unknown> = {}
    const simulationData: Record<string, unknown> = { chosen_situation_id: selectedSituation.id }

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
        await dispatch(patchUserProfile({ api, patch: profilePatch as UserProfilePatch })).unwrap()
      }
    } catch (err) { /* Dev error log */ }

    await dispatch(completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })).unwrap()
    await dispatch(handleActionThunk({ action: { type: "next", goNext: () => slideManager.goNext(), ...(nextCardId ? { targetCardId: nextCardId } : {}) }, playAnimation: startAnimation, api })).unwrap()
  }, [api, completing, interruptAnswers, interruptPoints, saveTo, id, xp, nextCardId, dispatch, startAnimation, slideManager, selectedSituation])

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-white/90 text-sm font-medium leading-relaxed">{applyTemplate(title, ctx)}</p>
          {situationSetup && phase === "select_situation" && (
            <p className="text-white/50 text-xs leading-relaxed mt-1">{applyTemplate(situationSetup, ctx)}</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col gap-3">
        {phase === "select_situation" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 my-auto pt-4">
            {situations.map((sit) => (
              <button
                key={sit.id}
                onClick={() => startSimulation(sit)}
                className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all duration-200 active:scale-[0.99]"
              >
                <span className="text-2xl bg-white/5 p-2 rounded-xl shrink-0">{sit.emoji}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-white/90">{sit.title}</span>
                  <span className="text-xs text-white/50 leading-relaxed">{sit.description}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {phase !== "select_situation" && (
          <AnimatePresence initial={false}>
            {visibleItems.map((item, index) => {
              if (item.kind === "typing") return <TypingIndicator key={`typing-${index}`} opponentIcon={opponentIcon} />
              if (item.kind === "message") return <ChatBubble key={`msg-${item.message.id}-${index}`} message={item.message} opponentIcon={opponentIcon} ctx={ctx} />
              if (item.kind === "interrupt") {
                const isAnswered = answeredInterruptIndices.has(item.interruptIndex)
                return (
                  <div key={`interrupt-${item.point.id}-${index}`}>
                    {isAnswered ? (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-2xl px-4 py-3 text-center">
                        <p className="text-green-300 text-sm">✓ Notiert</p>
                      </div>
                    ) : (
                      <InterruptCard point={item.point} ctx={ctx} onAnswer={(saveTo, val) => handleInterruptAnswer(item.interruptIndex, item.point.id, val)} />
                    )}
                  </div>
                )
              }
              return null
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Completion Button */}
      {phase === "done" && !waitingForInterrupt && (
        <div className="shrink-0 px-5 pb-5 pt-2">
          <button onClick={handleComplete} disabled={completing} className={clsx("w-full py-3.5 rounded-2xl font-semibold text-sm transition-all", completing ? "bg-green-600/50 text-white/50 cursor-not-allowed" : "bg-green-600 text-white shadow-lg")}>
            {completing ? "Wird gespeichert..." : "Weiter →"}
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(ChatSimulationCard)