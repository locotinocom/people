// src/components/interventions/Grounding.tsx
// Level 4 – Teil 2: Verankerungsübung
// Modus A: Body Scan (konservativ)
// Modus B: Licht-Meditation (spirituell)
// Modus wird aus meta.grounding_mode gelesen (gesetzt durch TypeSelect l4_mode_select)

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation as useAnimationContext } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"

// ─── Typen ────────────────────────────────────────────────────────────────────

type GroundingMode = "conservative" | "spiritual" | null

type GroundingData = {
  id: number
  xp?: number
  mode?: GroundingMode
}

// ─── Body Scan Schritte ───────────────────────────────────────────────────────

const BODY_SCAN_STEPS = [
  {
    id: "feet",
    emoji: "🦶",
    title: "Füße",
    text: "Spür deine Füße. Den Boden darunter.\nWärme, Druck, Kribbeln — was auch immer da ist.\nEinfach wahrnehmen.",
    duration: 18,
  },
  {
    id: "legs",
    emoji: "🦵",
    title: "Beine & Bauch",
    text: "Wandere langsam nach oben.\nWie fühlen sich deine Beine an? Dein Bauch?\nSchwer, leicht, angespannt, weich?",
    duration: 18,
  },
  {
    id: "chest",
    emoji: "🫁",
    title: "Brust & Atem",
    text: "Deine Brust. Dein Atem.\nWie atmest du gerade — flach, tief, angehalten?\nKein Urteil. Nur beobachten.",
    duration: 18,
  },
  {
    id: "shoulders",
    emoji: "🧠",
    title: "Schultern & Kopf",
    text: "Schultern, Nacken, Kopf.\nWo ist Spannung? Wo ist Weite?\nDu musst nichts verändern — nur spüren.",
    duration: 18,
  },
]

// ─── Licht-Meditation Schritte ────────────────────────────────────────────────

const LIGHT_MEDITATION_STEPS = [
  {
    id: "earth_feet",
    emoji: "🌍",
    title: "Erdmittelpunkt",
    text: "Stell dir vor, aus dem Zentrum der Erde steigt ein strahlendes Licht auf.\nEs erreicht deine Füße — deinen Erdungspunkt.\nDu stabilisierst dich dort.",
    color: "from-amber-900/60 to-stone-900/80",
    glowColor: "rgba(217,119,6,0.4)",
    duration: 25,
  },
  {
    id: "earth_heart",
    emoji: "🫀",
    title: "Herz",
    text: "Das Licht wandert langsam nach oben —\ndurch die Beine, den Bauch —\nund erreicht dein Herz.\nEs stabilisiert sich dort. Wärme.",
    color: "from-rose-900/60 to-stone-900/80",
    glowColor: "rgba(225,29,72,0.4)",
    duration: 25,
  },
  {
    id: "earth_pineal",
    emoji: "👁️",
    title: "Zirbeldrüse",
    text: "Weiter nach oben —\nin die Mitte deines Kopfes, zur Zirbeldrüse.\nDas Licht stabilisiert sich. Stille.",
    color: "from-violet-900/60 to-stone-900/80",
    glowColor: "rgba(124,58,237,0.5)",
    duration: 25,
  },
  {
    id: "universe",
    emoji: "✨",
    title: "Universum",
    text: "Von dort schießt es hinauf —\nin den Weltraum.\nDu bist verbunden mit allem.",
    color: "from-indigo-900/60 to-slate-900/80",
    glowColor: "rgba(99,102,241,0.5)",
    duration: 20,
  },
  {
    id: "divine_pineal",
    emoji: "☀️",
    title: "Göttliches Licht",
    text: "Und gleichzeitig:\nein göttliches strahlendes Licht aus dem Universum kommt herab.\nZuerst zur Zirbeldrüse — einige Sekunden.",
    color: "from-yellow-900/40 to-indigo-900/80",
    glowColor: "rgba(234,179,8,0.5)",
    duration: 25,
  },
  {
    id: "divine_heart",
    emoji: "💛",
    title: "Herz & Bauch",
    text: "Das Licht fließt weiter —\nzum Herzen. Dann zum Bauch.\nWärme von oben und unten zugleich.",
    color: "from-amber-900/40 to-rose-900/60",
    glowColor: "rgba(245,158,11,0.4)",
    duration: 25,
  },
  {
    id: "complete",
    emoji: "🌿",
    title: "Verbunden",
    text: "Dann durch alle Schichten —\nzurück zum Zentrum der Erde.\nDu bist verbunden. Oben und unten. Innen und außen.",
    color: "from-emerald-900/60 to-stone-900/80",
    glowColor: "rgba(16,185,129,0.4)",
    duration: 20,
  },
]

// ─── Pulsierender Licht-Orb ───────────────────────────────────────────────────

function LightOrb({
  emoji,
  glowColor,
  progress,
}: {
  emoji: string
  glowColor: string
  progress: number
}) {
  const circumference = 2 * Math.PI * 50
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            `0 0 20px 4px ${glowColor}`,
            `0 0 50px 16px ${glowColor}`,
            `0 0 20px 4px ${glowColor}`,
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="50" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <motion.circle
          cx="56"
          cy="56"
          r="50"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <motion.div
        className="relative z-10 w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-3xl">{emoji}</span>
      </motion.div>
    </div>
  )
}

// ─── Body Scan Modus ──────────────────────────────────────────────────────────

function BodyScanMode({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(BODY_SCAN_STEPS[0].duration)
  const [phase, setPhase] = useState<"intro" | "scan" | "done">("intro")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentStep = BODY_SCAN_STEPS[stepIndex]

  useEffect(() => {
    if (phase !== "scan") return

    setTimeLeft(currentStep.duration)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          const next = stepIndex + 1
          if (next < BODY_SCAN_STEPS.length) {
            setStepIndex(next)
          } else {
            setPhase("done")
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, stepIndex])

  const progress = currentStep
    ? (currentStep.duration - timeLeft) / currentStep.duration
    : 1

  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
      >
        <div className="text-5xl mb-6">🧍</div>
        <h2 className="text-2xl font-bold mb-4">Body Scan</h2>
        <p className="text-gray-300 leading-relaxed mb-8 max-w-sm">
          Bring deine Aufmerksamkeit nach innen.<br />
          Kein Ziel — nur wahrnehmen.<br /><br />
          Wir wandern gemeinsam von den Füßen nach oben.
          Jeder Bereich bekommt ein paar Sekunden.
        </p>
        <motion.button
          onClick={() => setPhase("scan")}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 font-bold text-white transition-all shadow-lg"
        >
          Ich bin bereit 🌿
        </motion.button>
      </motion.div>
    )
  }

  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-6xl mb-6"
        >
          🌿
        </motion.div>
        <h2 className="text-2xl font-bold mb-3">Gut gemacht.</h2>
        <p className="text-gray-300 leading-relaxed mb-8 max-w-sm">
          Du hast deinen ganzen Körper wahrgenommen.<br />
          Das ist mehr als die meisten Menschen heute tun.
        </p>
        <motion.button
          onClick={onComplete}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 font-bold text-white transition-all shadow-lg"
        >
          Weiter →
        </motion.button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
        style={{
          background: "linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        }}
      >
        {/* Schritt-Indikator */}
        <div className="flex gap-2 mb-8">
          {BODY_SCAN_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                "w-2 h-2 rounded-full transition-all duration-500",
                i < stepIndex
                  ? "bg-teal-400"
                  : i === stepIndex
                  ? "bg-white scale-125"
                  : "bg-white/20"
              )}
            />
          ))}
        </div>

        <LightOrb
          emoji={currentStep.emoji}
          glowColor="rgba(20,184,166,0.5)"
          progress={progress}
        />

        <motion.h3
          key={`title-${currentStep.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-bold mt-6 mb-3"
        >
          {currentStep.title}
        </motion.h3>

        <motion.p
          key={`text-${currentStep.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 leading-relaxed whitespace-pre-line max-w-sm text-sm"
        >
          {currentStep.text}
        </motion.p>

        <p className="mt-6 text-2xl font-light text-white/50 tabular-nums">
          {timeLeft}s
        </p>

        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            const next = stepIndex + 1
            if (next < BODY_SCAN_STEPS.length) {
              setStepIndex(next)
            } else {
              setPhase("done")
            }
          }}
          className="mt-4 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          Weiter →
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Licht-Meditation Modus ───────────────────────────────────────────────────

function LightMeditationMode({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(LIGHT_MEDITATION_STEPS[0].duration)
  const [phase, setPhase] = useState<"intro" | "meditation" | "done">("intro")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentStep = LIGHT_MEDITATION_STEPS[stepIndex]

  useEffect(() => {
    if (phase !== "meditation") return

    setTimeLeft(currentStep.duration)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          const next = stepIndex + 1
          if (next < LIGHT_MEDITATION_STEPS.length) {
            setStepIndex(next)
          } else {
            setPhase("done")
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, stepIndex])

  const progress = currentStep
    ? (currentStep.duration - timeLeft) / currentStep.duration
    : 1

  if (phase === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
      >
        <div className="text-5xl mb-6">✨</div>
        <h2 className="text-2xl font-bold mb-4">Licht-Meditation</h2>
        <p className="text-gray-300 leading-relaxed mb-8 max-w-sm">
          Eine geführte Reise durch deinen Körper —<br />
          mit Licht aus der Erde und dem Universum.<br /><br />
          Schließe die Augen, wenn du magst.<br />
          Lass die Bilder kommen.
        </p>
        <motion.button
          onClick={() => setPhase("meditation")}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white transition-all shadow-lg"
        >
          Ich bin bereit ✨
        </motion.button>
      </motion.div>
    )
  }

  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
        style={{
          background: "linear-gradient(160deg, #1e1b4b 0%, #2d1b69 50%, #1e1b4b 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-6xl mb-6"
        >
          🌿
        </motion.div>
        <h2 className="text-2xl font-bold mb-3">Du bist verbunden.</h2>
        <p className="text-gray-300 leading-relaxed mb-8 max-w-sm">
          Oben und unten. Innen und außen.<br />
          Das Licht ist immer da — du musst es nur einladen.
        </p>
        <motion.button
          onClick={onComplete}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white transition-all shadow-lg"
        >
          Weiter →
        </motion.button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className={clsx(
          "flex flex-col h-full items-center justify-center p-8 text-white text-center bg-gradient-to-b",
          currentStep.color
        )}
      >
        {/* Schritt-Indikator */}
        <div className="flex gap-1.5 mb-8">
          {LIGHT_MEDITATION_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-700",
                i < stepIndex
                  ? "bg-white/60"
                  : i === stepIndex
                  ? "bg-white scale-150"
                  : "bg-white/15"
              )}
            />
          ))}
        </div>

        <LightOrb
          emoji={currentStep.emoji}
          glowColor={currentStep.glowColor}
          progress={progress}
        />

        <motion.h3
          key={`title-${currentStep.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold mt-6 mb-3"
        >
          {currentStep.title}
        </motion.h3>

        <motion.p
          key={`text-${currentStep.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-200 leading-relaxed whitespace-pre-line max-w-sm text-sm"
        >
          {currentStep.text}
        </motion.p>

        <p className="mt-6 text-2xl font-light text-white/40 tabular-nums">
          {timeLeft}s
        </p>

        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            const next = stepIndex + 1
            if (next < LIGHT_MEDITATION_STEPS.length) {
              setStepIndex(next)
            } else {
              setPhase("done")
            }
          }}
          className="mt-4 text-xs text-white/20 hover:text-white/50 transition-colors"
        >
          Weiter →
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Modus-Auswahl (Fallback wenn kein Modus gesetzt) ─────────────────────────

function ModeSelect({ onSelect }: { onSelect: (mode: "conservative" | "spiritual") => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full items-center justify-center p-8 text-white"
    >
      <h2 className="text-2xl font-bold mb-2 text-center">Verankerungsübung</h2>
      <p className="text-gray-400 text-sm mb-8 text-center">
        Wie möchtest du die Übung machen?
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <motion.button
          onClick={() => onSelect("conservative")}
          whileTap={{ scale: 0.97 }}
          className="flex items-start gap-4 px-5 py-5 rounded-2xl border border-teal-700/50 bg-teal-900/20 hover:bg-teal-900/40 text-left transition-all"
        >
          <span className="text-3xl mt-0.5">🧍</span>
          <div>
            <p className="font-bold text-white">Body Scan</p>
            <p className="text-sm text-gray-400 mt-1 leading-snug">
              Aufmerksamkeit von den Füßen nach oben — jeden Bereich wahrnehmen, ohne zu bewerten.
            </p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => onSelect("spiritual")}
          whileTap={{ scale: 0.97 }}
          className="flex items-start gap-4 px-5 py-5 rounded-2xl border border-violet-700/50 bg-violet-900/20 hover:bg-violet-900/40 text-left transition-all"
        >
          <span className="text-3xl mt-0.5">✨</span>
          <div>
            <p className="font-bold text-white">Licht-Meditation</p>
            <p className="text-sm text-gray-400 mt-1 leading-snug">
              Eine geführte Reise mit Licht aus der Erde und dem Universum.
            </p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

function Grounding({ data }: { data: GroundingData }) {
  const { id, xp = 80, mode: modeProp = null } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimationContext()

  // Modus aus Redux-Profil lesen (gesetzt durch TypeSelect l4_mode_select)
  const profileMode = useAppSelector(
    (s) => (s.session?.profile as any)?.meta?.grounding_mode as GroundingMode | undefined
  )

  const [activeMode, setActiveMode] = useState<"conservative" | "spiritual" | null>(
    modeProp ?? profileMode ?? null
  )

  // Wenn profileMode sich ändert (nach TypeSelect), übernehmen
  useEffect(() => {
    if (!activeMode && profileMode) {
      setActiveMode(profileMode as "conservative" | "spiritual")
    }
  }, [profileMode, activeMode])

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

  // Kein Modus gesetzt → User wählt selbst
  if (!activeMode) {
    return <ModeSelect onSelect={setActiveMode} />
  }

  if (activeMode === "conservative") {
    return <BodyScanMode onComplete={handleComplete} />
  }

  return <LightMeditationMode onComplete={handleComplete} />
}

export default memo(Grounding)
