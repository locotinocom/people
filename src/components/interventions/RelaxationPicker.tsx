import { useState, useCallback, useRef, useEffect, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useContentPool } from "@helpers/useContentPool"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Fest codierter Wahrnehmungs-Pool
======================= */

type Sense = "hearing" | "smell" | "sight" | "taste" | "breath" | "body" | "space"

interface RelaxationExercise {
  id: string
  sense: Sense
  title: string
  invitation: string
}

const SENSE_META: Record<Sense, { label: string; color: string; emoji: string }> = {
  hearing: { label: "Hören", color: "text-sky-400", emoji: "👂" },
  smell: { label: "Riechen", color: "text-emerald-400", emoji: "👃" },
  sight: { label: "Sehen", color: "text-amber-400", emoji: "👁️" },
  taste: { label: "Schmecken", color: "text-rose-400", emoji: "👅" },
  breath: { label: "Atmen", color: "text-violet-400", emoji: "🌬️" },
  body: { label: "Spüren", color: "text-teal-400", emoji: "🫱" },
  space: { label: "Wahrnehmen", color: "text-indigo-400", emoji: "🌌" },
}

const RELAXATION_EXERCISES: RelaxationExercise[] = [
  {
    id: "listen_freely",
    sense: "hearing",
    title: "Einfach hören",
    invitation:
      "Ich lade dich ein, für einen Moment einfach zuzuhören – den Geräuschen um dich herum, nah oder fern, laut oder leise.\n\nDu musst nichts benennen oder bewerten. Wenn eine Bewertung kommt, darf auch die einfach da sein.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "smell_around",
    sense: "smell",
    title: "Einfach riechen",
    invitation:
      "Ich lade dich ein, kurz wahrzunehmen, was du gerade riechst – auch wenn es kaum etwas ist. Das ist völlig in Ordnung.\n\nEs gibt hier nichts zu finden oder zu erreichen, nur einfach wahrzunehmen, was ist.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "see_freely",
    sense: "sight",
    title: "Einfach schauen",
    invitation:
      "Ich lade dich ein, deinen Blick sanft durch den Raum wandern zu lassen.\n\nNichts fixieren, nichts bewerten müssen. Wenn dein Blick irgendwo hängen bleibt, ist das okay.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "taste_present",
    sense: "taste",
    title: "Einfach schmecken",
    invitation:
      "Ich lade dich ein, kurz zu spüren, was gerade in deinem Mund ist – ein Geschmack, oder auch einfach nichts Besonderes. Beides ist völlig richtig.\n\nEs gibt nichts, was du tun musst, nur wahrzunehmen.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "breath_as_is",
    sense: "breath",
    title: "Einfach atmen",
    invitation:
      "Ich lade dich ein, deinem Atem zu folgen – so, wie er gerade von selbst kommt.\n\nDu musst ihn nicht verändern, nicht vertiefen. Nur beobachten, wie er kommt und geht.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "feel_body",
    sense: "body",
    title: "Einfach spüren",
    invitation:
      "Ich lade dich ein, kurz zu spüren, wie du gerade sitzt oder stehst – genau so, wie es ist, ohne etwas anpassen zu müssen.\n\nSpüre einfach, was schon da ist.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "let_thoughts_pass",
    sense: "space",
    title: "Einfach da sein",
    invitation:
      "Ich lade dich ein, für einen Moment einfach da zu sein – ohne etwas tun zu müssen.\n\nFalls Gedanken auftauchen, ist das gut so. Lass sie kommen und wieder gehen, wie Wolken am Himmel. Es gibt hier kein Richtig oder Falsch.\n\nNimm dir so viel oder so wenig Zeit, wie du brauchst. Wenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
  {
    id: "widen_awareness",
    sense: "space",
    title: "Einfach wahrnehmen",
    invitation:
      "Ich lade dich ein, für einen Moment alles gleichzeitig da sein zu lassen – was du hörst, was du spürst, was du siehst.\n\nNichts davon musst du verändern. Geh einfach mit, so lange du magst.\n\nWenn du bereit bist, ziehe den Regler unten nach rechts.",
  },
]

const LAST_EXERCISE_STORAGE_KEY = "relaxation_last_exercise_id"

/**
 * Zieht eine zufällige Übung, schließt dabei die zuletzt gezogene aus
 * (falls im localStorage vorhanden), damit dieselbe Übung nicht zweimal
 * direkt hintereinander kommt.
 */
function pickRandomExercise(): RelaxationExercise {
  let lastId: string | null = null
  try {
    lastId = localStorage.getItem(LAST_EXERCISE_STORAGE_KEY)
  } catch {
    // localStorage evtl. nicht verfügbar – einfach ohne Ausschluss weitermachen
  }

  const pool = lastId
    ? RELAXATION_EXERCISES.filter((e) => e.id !== lastId)
    : RELAXATION_EXERCISES

  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? RELAXATION_EXERCISES[0]

  try {
    localStorage.setItem(LAST_EXERCISE_STORAGE_KEY, chosen.id)
  } catch {
    // kein Problem, wenn das Speichern fehlschlägt – nur die Wiederholungssperre entfällt dann
  }

  return chosen
}

/* =======================
   Types
======================= */

interface RelaxationCheckInQuestion {
  text: string
  yesLabel: string
  noLabel: string
  yesMeansSkip: boolean
}

const DEFAULT_CHECKIN_QUESTION: RelaxationCheckInQuestion = {
  text: "Fühlst du dich gerade halbwegs entspannt?",
  yesLabel: "Ja, passt",
  noLabel: "Eigentlich nicht",
  yesMeansSkip: true,
}

const DEFAULT_TRANSITION_TEXT = "Etwas Entspannung kann nicht schaden."

type RelaxationPickerData = {
  id: number
  slug: string
  saveTo?: string
  checkInPoolId?: string
  transitionPoolId?: string
}

type Phase = "checkin" | "transition" | "exercise"

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
   SwipeToConfirm – Drag ODER Halten, beides ohne Zeitdruck-Gefühl.
======================= */

const LONG_PRESS_MS = 1400

function SwipeToConfirm({ onConfirm }: { onConfirm: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(280)
  const thumbSize = 56

  // Halten-Fallback
  const [isPressing, setIsPressing] = useState(false)
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth)
  }, [])

  const maxDrag = Math.max(trackWidth - thumbSize, 0)
  const dragThreshold = trackWidth * 0.7

  const handleDragEnd = useCallback(
    (_: unknown, info: { point: { x: number } }) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const relativeX = info.point.x - rect.left
      if (relativeX > dragThreshold) {
        onConfirm()
      }
    },
    [dragThreshold, onConfirm]
  )

  // Halten-Fallback: Pointer-Down startet Timer, Pointer-Up/Leave bricht ab
  const handlePressStart = useCallback(() => {
    setIsPressing(true)
    pressTimeoutRef.current = setTimeout(() => {
      onConfirm()
    }, LONG_PRESS_MS)
  }, [onConfirm])

  const handlePressEnd = useCallback(() => {
    setIsPressing(false)
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={trackRef}
        className="relative w-full h-14 rounded-full bg-zinc-800 border border-gray-700 overflow-hidden flex items-center px-1"
      >
        <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none select-none">
          Ich bin soweit
        </span>

        {/* Füllbalken bei Halten – gibt sichtbares Feedback statt reinem Warten */}
        {isPressing && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: LONG_PRESS_MS / 1000, ease: "linear" }}
            className="absolute inset-0 bg-sky-500/20 rounded-full"
          />
        )}

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          whileDrag={{ scale: 1.05 }}
          className="w-14 h-12 rounded-full bg-sky-500 flex items-center justify-center cursor-grab active:cursor-grabbing relative z-10 shadow-lg"
        >
          <span className="text-xl text-white">→</span>
        </motion.div>
      </div>

      {/* Punkt 1: sanfter Anker gegen Leistungsdruck bei offener Dauer */}
      <p className="text-xs text-gray-500 text-center">
        Es gibt keine falsche Dauer – ziehe oder halte, wenn du bereit bist.
      </p>
    </div>
  )
}

/* =======================
   RelaxationPicker
======================= */

function RelaxationPicker({ data }: { data: RelaxationPickerData }) {
  const {
    id,
    saveTo,
    checkInPoolId = "relaxation_checkin_questions",
    transitionPoolId = "relaxation_transition_texts",
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  const checkInQuestion =
    useContentPool<RelaxationCheckInQuestion>(checkInPoolId, DEFAULT_CHECKIN_QUESTION) ??
    DEFAULT_CHECKIN_QUESTION
  const transitionText = useContentPool<string>(transitionPoolId, DEFAULT_TRANSITION_TEXT) ?? DEFAULT_TRANSITION_TEXT

  const [phase, setPhase] = useState<Phase>("checkin")

  // Einmalig beim Mount ziehen, mit Ausschluss der zuletzt gezogenen Übung
  const [exercise] = useState<RelaxationExercise>(() => pickRandomExercise())

  const senseMeta = SENSE_META[exercise.sense]

  const goNext = useCallback(
    async (wasSkipped: boolean) => {
      if (!api) return

      if (saveTo) {
        const profilePatch: Record<string, unknown> = {}
        assignPatchValue(profilePatch, saveTo, {
          exerciseId: exercise.id,
          sense: exercise.sense,
          skippedViaCheckIn: wasSkipped,
          timestamp: new Date().toISOString(),
        })
        try {
          await dispatch(patchUserProfile({ api, patch: profilePatch as UserProfilePatch })).unwrap()
        } catch (err) {
          if (import.meta.env.DEV) console.error("[RelaxationPicker] patchUserProfile fehlgeschlagen:", err)
        }
      }

      await dispatch(
        handleActionThunk({
          action: { type: "next", goNext: () => slideManager.goNext() },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    },
    [api, saveTo, exercise, dispatch, startAnimation, slideManager]
  )

  const handleCheckIn = useCallback(
    (clickedYes: boolean) => {
      const shouldSkip = clickedYes ? checkInQuestion.yesMeansSkip : !checkInQuestion.yesMeansSkip
      if (shouldSkip) {
        goNext(true)
      } else {
        setPhase("transition")
      }
    },
    [goNext, checkInQuestion]
  )

  const handleTransitionContinue = useCallback(() => {
    setPhase("exercise")
  }, [])

  const handleExerciseConfirm = useCallback(() => {
    goNext(false)
  }, [goNext])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {phase === "checkin" && (
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-8">
          <AvatarBubble title={checkInQuestion.text} />
          <div className="flex gap-4">
            <motion.button
              onClick={() => handleCheckIn(true)}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-700 bg-gray-900/60 hover:border-green-500 text-center font-semibold transition"
            >
              {checkInQuestion.yesLabel}
            </motion.button>
            <motion.button
              onClick={() => handleCheckIn(false)}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-700 bg-gray-900/60 hover:border-sky-500 text-center font-semibold transition"
            >
              {checkInQuestion.noLabel}
            </motion.button>
          </div>
        </div>
      )}

      {phase === "transition" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 min-h-0 flex flex-col justify-center gap-8"
        >
          <AvatarBubble title={transitionText} />
          <motion.button
            onClick={handleTransitionContinue}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-lg font-bold bg-sky-600 hover:bg-sky-500 transition"
          >
            Weiter
          </motion.button>
        </motion.div>
      )}

      {phase === "exercise" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 min-h-0 flex flex-col justify-center gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`text-xs font-medium uppercase tracking-widest flex items-center gap-2 ${senseMeta.color}`}>
              <span>{senseMeta.emoji}</span>
              <span>{senseMeta.label}</span>
            </div>
            <h3 className="text-xl font-bold text-center">{exercise.title}</h3>
          </div>

          <p className="text-lg leading-relaxed text-center text-gray-200 whitespace-pre-line px-2">
            {exercise.invitation}
          </p>

          <SwipeToConfirm onConfirm={handleExerciseConfirm} />
        </motion.div>
      )}
    </div>
  )
}

export default memo(RelaxationPicker)