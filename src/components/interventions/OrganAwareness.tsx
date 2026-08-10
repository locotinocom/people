// src/components/interventions/OrganAwareness.tsx
// Level 4 – Teil 1: Organ-Wahrnehmung
// Ablauf: Organ wählen → Info → 60s Timer → Feedback

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation as useAnimationContext } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"

// ─── Typen ────────────────────────────────────────────────────────────────────

type Organ = {
  id: string
  emoji: string
  name: string
  info: string
}

type FeedbackOption = {
  id: string
  emoji: string
  label: string
}

type OrganAwarenessData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  timerSeconds?: number
  feedbackQuestion?: string
  feedbackOptions?: FeedbackOption[]
  organs: Organ[]
}

// ─── Phase-Typen ──────────────────────────────────────────────────────────────

type Phase = "select" | "info" | "timer" | "feedback"

// ─── Pulsierender Kreis ───────────────────────────────────────────────────────

function PulsingOrb({ emoji, progress }: { emoji: string; progress: number }) {
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      {/* Hintergrund-Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            "0 0 20px 4px rgba(139,92,246,0.3)",
            "0 0 40px 12px rgba(139,92,246,0.5)",
            "0 0 20px 4px rgba(139,92,246,0.3)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fortschritts-Ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
          fill="none"
        />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          stroke="rgba(167,139,250,0.9)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>

      {/* Pulsierender Innenkreis */}
      <motion.div
        className="relative z-10 w-24 h-24 rounded-full bg-violet-900/60 border border-violet-500/40 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-4xl">{emoji}</span>
      </motion.div>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

function OrganAwareness({ data }: { data: OrganAwarenessData }) {
  const {
    id,
    xp = 50,
    title,
    subtitle,
    timerSeconds = 60,
    feedbackQuestion = "Wie war das für dich?",
    feedbackOptions = [],
    organs,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimationContext()

  const [phase, setPhase] = useState<Phase>("select")
  const [selectedOrgan, setSelectedOrgan] = useState<Organ | null>(null)
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer starten wenn Phase "timer"
  useEffect(() => {
    if (phase !== "timer") return

    setTimeLeft(timerSeconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setPhase("feedback")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, timerSeconds])

  const handleOrganSelect = useCallback((organ: Organ) => {
    setSelectedOrgan(organ)
    setPhase("info")
  }, [])

  const handleStartTimer = useCallback(() => {
    setPhase("timer")
  }, [])

  const handleSkipTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase("feedback")
  }, [])

  const handleComplete = useCallback(async () => {
    if (!api) return

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
  }, [api, id, xp, dispatch, startAnimation, slideManager])

  const progress = (timerSeconds - timeLeft) / timerSeconds

  // ── Phase: Organ-Auswahl ──────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div className="flex flex-col h-full min-h-0 p-6 text-white">
        <div className="shrink-0 mb-6">
          <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-3 pb-4">
            {organs.map((organ) => (
              <motion.button
                key={organ.id}
                onClick={() => handleOrganSelect(organ)}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 px-3 py-5 rounded-2xl border border-gray-700 hover:border-violet-500 hover:bg-violet-900/20 transition-all duration-200 text-center"
              >
                <span className="text-4xl">{organ.emoji}</span>
                <span className="text-sm font-semibold text-white">{organ.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Phase: Info über das Organ ────────────────────────────────────────────

  if (phase === "info" && selectedOrgan) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col h-full min-h-0 p-6 text-white items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-7xl mb-6"
          >
            {selectedOrgan.emoji}
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            {selectedOrgan.name}
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base text-gray-300 text-center leading-relaxed max-w-sm mb-8"
          >
            {selectedOrgan.info}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full max-w-sm"
          >
            <p className="text-sm text-violet-300 text-center mb-4">
              Schließe jetzt die Augen und richte deine Aufmerksamkeit auf dein {selectedOrgan.name}.<br />
              Einfach wahrnehmen — ohne zu bewerten.
            </p>

            <motion.button
              onClick={handleStartTimer}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white transition-all shadow-lg"
            >
              Ich bin bereit ✨
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Phase: Timer ──────────────────────────────────────────────────────────

  if (phase === "timer" && selectedOrgan) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="timer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-full min-h-0 items-center justify-center p-6 text-white"
          style={{
            background: "linear-gradient(160deg, #1e1b4b 0%, #2d1b69 50%, #1e1b4b 100%)",
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-violet-300 mb-8 text-center"
          >
            Richte deine Aufmerksamkeit auf dein {selectedOrgan.name}
          </motion.p>

          <PulsingOrb emoji={selectedOrgan.emoji} progress={progress} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-3xl font-light text-white/80 tabular-nums">
              {timeLeft}s
            </p>
            <p className="text-xs text-white/40 mt-1">
              Einfach wahrnehmen — dankbar sein
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={handleSkipTimer}
            className="mt-10 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Überspringen
          </motion.button>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Phase: Feedback ───────────────────────────────────────────────────────

  if (phase === "feedback") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="feedback"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-full min-h-0 p-6 text-white items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-5xl mb-4"
          >
            {selectedOrgan?.emoji}
          </motion.div>

          <h2 className="text-xl font-bold text-white mb-2 text-center">
            {feedbackQuestion}
          </h2>
          <p className="text-sm text-gray-400 mb-8 text-center">
            Kein Richtig oder Falsch — nur deine ehrliche Wahrnehmung.
          </p>

          <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
            {feedbackOptions.map((opt) => (
              <motion.button
                key={opt.id}
                onClick={() => setSelectedFeedback(opt.id)}
                whileTap={{ scale: 0.97 }}
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-200",
                  selectedFeedback === opt.id
                    ? "bg-violet-900/40 border-violet-500"
                    : "border-gray-700 hover:border-gray-500"
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span
                  className={clsx(
                    "font-medium text-sm",
                    selectedFeedback === opt.id ? "text-violet-300" : "text-white"
                  )}
                >
                  {opt.label}
                </span>
                <div
                  className={clsx(
                    "ml-auto w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                    selectedFeedback === opt.id
                      ? "border-violet-500 bg-violet-500"
                      : "border-gray-600"
                  )}
                />
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={handleComplete}
            disabled={!selectedFeedback}
            animate={{ opacity: selectedFeedback ? 1 : 0.4 }}
            whileTap={{ scale: 0.97 }}
            className={clsx(
              "w-full max-w-sm py-4 rounded-2xl font-bold text-base transition-all shadow-md",
              selectedFeedback
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            Weiter →
          </motion.button>

          {xp > 0 && (
            <p className="mt-3 text-xs text-gray-500">+{xp} XP</p>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}

export default memo(OrganAwareness)
