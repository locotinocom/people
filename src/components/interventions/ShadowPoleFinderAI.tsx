import {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
import { applyTemplate, resolveGenderedLabel, type GenderedLabel } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

export type ShadowPole = "active" | "passive"

export interface ShadowPoleStatement {
  id: string
  pole: ShadowPole
  text: string
}

export interface ShadowPoleFinderResult {
  archetype: string
  activePoleName: string
  passivePoleName: string
  activePercent: number
  passivePercent: number
  dominantPole: ShadowPole
  wasTiebreak: boolean
  answers: {
    [statementId: string]: { pole: ShadowPole; value: boolean }
  }
}

type ShadowPoleFinderAIData = {
  id: number
  xp?: number
  slug: string
  title: string
  intro?: string
  saveTo: string
  archetypeName: string | GenderedLabel
  activePoleName: string | GenderedLabel
  passivePoleName: string | GenderedLabel
  activeTagline: string
  passiveTagline: string
  tiebreakQuestion?: string
  statements: ShadowPoleStatement[]
}

type Phase = "swipe" | "tiebreak" | "result"

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
   ShadowPoleFinderAI
======================= */

function ShadowPoleFinderAI({ data }: { data: ShadowPoleFinderAIData }) {
  const {
    id,
    xp = 0,
    title,
    intro,
    saveTo,
    archetypeName,
    activePoleName,
    passivePoleName,
    activeTagline,
    passiveTagline,
    tiebreakQuestion = "Beide Seiten zeigen sich gerade gleich stark. Welche spricht dich in diesem Moment eher an?",
    statements,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  const renderedTitle = applyTemplate(title, ctx)
  const renderedIntro = intro ? applyTemplate(intro, ctx) : undefined
  const renderedTiebreakQuestion = applyTemplate(tiebreakQuestion, ctx)

  // Gegenderte Pol-/Archetyp-Namen einmalig auflösen
  const resolvedArchetypeName = resolveGenderedLabel(archetypeName, ctx.user_gender)
  const resolvedActivePoleName = resolveGenderedLabel(activePoleName, ctx.user_gender)
  const resolvedPassivePoleName = resolveGenderedLabel(passivePoleName, ctx.user_gender)

  const [phase, setPhase] = useState<Phase>("swipe")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ShadowPoleFinderResult["answers"]>({})
  const [exitDirection, setExitDirection] = useState<1 | -1 | 0>(0)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [manualDominantPole, setManualDominantPole] = useState<ShadowPole | null>(null)

  const currentStatement = statements[currentIndex]
  const isLastStatement = currentIndex === statements.length - 1
  const progress = ((currentIndex + 1) / statements.length) * 100

  const renderedStatementText = currentStatement
    ? applyTemplate(currentStatement.text, ctx)
    : []

  /* ─── Ergebnis-Berechnung (Prozente + rechnerisch dominanter Pol) ──── */

  const computed = useMemo(() => {
    if (Object.keys(answers).length === 0) return null

    const activeStatements = statements.filter((s) => s.pole === "active")
    const passiveStatements = statements.filter((s) => s.pole === "passive")

    const activeYes = activeStatements.filter((s) => answers[s.id]?.value === true).length
    const passiveYes = passiveStatements.filter((s) => answers[s.id]?.value === true).length

    const activeRate = activeStatements.length > 0 ? activeYes / activeStatements.length : 0
    const passiveRate = passiveStatements.length > 0 ? passiveYes / passiveStatements.length : 0

    const totalRate = activeRate + passiveRate

    const activePercent = totalRate > 0 ? Math.round((activeRate / totalRate) * 100) : 50
    const passivePercent = 100 - activePercent

    return {
      activePercent,
      passivePercent,
      isTie: activePercent === passivePercent,
    }
  }, [answers, statements])

  // Sobald der letzte Swipe ausgewertet ist, prüfen ob Tiebreak nötig ist
  useEffect(() => {
    if (phase !== "swipe") return
    if (!isLastStatement) return
    if (!computed) return
    if (Object.keys(answers).length !== statements.length) return

    if (computed.isTie) {
      setPhase("tiebreak")
    } else {
      setPhase("result")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers])

  const result = useMemo<ShadowPoleFinderResult | null>(() => {
    if (!computed) return null

    const rechnerischDominant: ShadowPole =
      computed.activePercent >= computed.passivePercent ? "active" : "passive"

    return {
      archetype: resolvedArchetypeName,
      activePoleName: resolvedActivePoleName,
      passivePoleName: resolvedPassivePoleName,
      activePercent: computed.activePercent,
      passivePercent: computed.passivePercent,
      dominantPole: computed.isTie && manualDominantPole ? manualDominantPole : rechnerischDominant,
      wasTiebreak: computed.isTie,
      answers,
    }
  }, [computed, answers, resolvedArchetypeName, resolvedActivePoleName, resolvedPassivePoleName, manualDominantPole])

  const dominantTagline = useMemo(() => {
    if (!result) return null
    const templateStr = result.dominantPole === "active" ? activeTagline : passiveTagline
    const percent = result.dominantPole === "active" ? result.activePercent : result.passivePercent
    const poleName = result.dominantPole === "active" ? resolvedActivePoleName : resolvedPassivePoleName

    const extendedCtx = {
      ...ctx,
      percent,
      pole_name: poleName,
      archetype: resolvedArchetypeName,
    }
    return applyTemplate(templateStr, extendedCtx)
  }, [result, activeTagline, passiveTagline, resolvedActivePoleName, resolvedPassivePoleName, resolvedArchetypeName, ctx])

  /* ─── Swipe-Handler ───────────────────────────────────────────────── */

  const handleAnswer = useCallback(
    (value: boolean) => {
      if (isAnimatingOut || !currentStatement) return
      setIsAnimatingOut(true)
      setExitDirection(value ? 1 : -1)

      const newAnswers = {
        ...answers,
        [currentStatement.id]: { pole: currentStatement.pole, value },
      }
      setAnswers(newAnswers)

      setTimeout(() => {
        if (!isLastStatement) {
          setCurrentIndex((i) => i + 1)
          setExitDirection(0)
          setIsAnimatingOut(false)
        }
      }, 250)
    },
    [answers, currentStatement, isLastStatement, isAnimatingOut]
  )

  useEffect(() => {
    if (phase !== "swipe") return
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
  }, [phase, handleAnswer, isAnimatingOut])

  const handleTiebreakSelect = useCallback((pole: ShadowPole) => {
    setManualDominantPole(pole)
    setPhase("result")
  }, [])

  /* ─── Abschluss ───────────────────────────────────────────────────── */

  const handleComplete = useCallback(async () => {
    if (!api || !result || hasCompleted) return
    setHasCompleted(true)

    const profilePatch: Record<string, unknown> = {}

    // Flache Begleitfelder – damit spätere Level (z.B. ShadowOracleAI) per
    // einfachem {{meta.xyz}}-Template wissen, welcher Pol dominant war.
    // Das verschachtelte result-Objekt selbst kann per Template nicht
    // gelesen werden (kein Support für Objekt-Pfade wie meta.xyz.dominantPole).
    assignPatchValue(profilePatch, `${saveTo}_dominant`, result.dominantPole)
    assignPatchValue(
      profilePatch,
      `${saveTo}_dominant_label`,
      result.dominantPole === "active" ? resolvedActivePoleName : resolvedPassivePoleName
    )
    assignPatchValue(profilePatch, saveTo, result)

    if (import.meta.env.DEV) {
      console.log("[ShadowPoleFinderAI] Ergebnis:", result)
      console.log("[ShadowPoleFinderAI] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[ShadowPoleFinderAI] patchUserProfile fehlgeschlagen:", err)
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
  }, [
    api,
    result,
    hasCompleted,
    saveTo,
    resolvedActivePoleName,
    resolvedPassivePoleName,
    id,
    xp,
    dispatch,
    startAnimation,
    slideManager,
  ])

  /* ═══════════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble title={renderedTitle} subtitle={renderedIntro} />
      </div>

      {/* ─── Phase: Swipe ─────────────────────────────────────────── */}
      {phase === "swipe" && currentStatement && (
        <>
          <div className="mt-4 shrink-0">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Aussage {currentIndex + 1} von {statements.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div
              style={{
                width: "100%",
                height: "10px",
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(to right, #a855f7, #ec4899, #f43f5e)",
                  borderRadius: "9999px",
                  transition: "width 300ms ease-out",
                }}
              />
            </div>
          </div>

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
                <p className="text-lg font-semibold leading-relaxed">
                  {renderedStatementText}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

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
        </>
      )}

      {/* ─── Phase: Tiebreak (nur bei exaktem 50/50) ─────────────────── */}
      {phase === "tiebreak" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 min-h-0 flex flex-col justify-center gap-6"
        >
          <p className="text-center text-gray-300 leading-relaxed">
            {renderedTiebreakQuestion}
          </p>

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={() => handleTiebreakSelect("active")}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl border border-red-500/30 bg-red-900/10 hover:border-red-500 px-5 py-4 text-left transition"
            >
              <span className="font-semibold text-red-400">{resolvedActivePoleName}</span>
            </motion.button>

            <motion.button
              onClick={() => handleTiebreakSelect("passive")}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl border border-blue-500/30 bg-blue-900/10 hover:border-blue-500 px-5 py-4 text-left transition"
            >
              <span className="font-semibold text-blue-400">{resolvedPassivePoleName}</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ─── Phase: Ergebnis ─────────────────────────────────────────── */}
      {phase === "result" && result && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-purple-500/30 bg-purple-900/10 p-5 mb-6"
          >
            <p className="text-lg font-semibold leading-relaxed">
              {dominantTagline}
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-red-400">{resolvedActivePoleName}</span>
                <span className="text-gray-400">{result.activePercent}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500"
                  style={{ width: `${result.activePercent}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.activePercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-blue-400">{resolvedPassivePoleName}</span>
                <span className="text-gray-400">{result.passivePercent}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  style={{ width: `${result.passivePercent}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.passivePercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </div>

          {result.wasTiebreak && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              Bei Gleichstand hast du selbst gewählt, welcher Anteil gerade lauter ist.
            </p>
          )}

          <p className="mt-6 text-sm text-gray-400 text-center">
            Beides sind Anteile, keine Urteile. Beim nächsten Mal schauen wir uns an,
            wie du mit dem stärksten Anteil arbeiten kannst.
          </p>

          <motion.button
            onClick={handleComplete}
            disabled={hasCompleted}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
              hasCompleted
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500"
            )}
          >
            Weiter
          </motion.button>
        </div>
      )}

      {xp > 0 && phase === "result" && (
        <p className="mt-2 shrink-0 text-sm text-gray-400 text-center">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(ShadowPoleFinderAI)