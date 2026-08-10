import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

import {
  RELATIONAL_CONTEXTS,
  getRandomQuestionsForLevel,
  calculateSubtypeResult,
  type SubtypeStatement,
  type SubtypeCalcResult,
} from "@data/subtypeData"

/* =======================
   Types
======================= */

type SubtypeFinderAIData = {
  id?: number
  xp?: number
  slug?: string
  title?: string
  intro?: string
  description?: string
  saveTo?: string
  /** Anzahl der Fragen, die in DIESEM Level gestellt werden sollen. */
  count?: number
  /**
   * Steuert, ob nach der letzten Frage der Auswertungs-Screen (Primär-/
   * Sekundärmuster + Kontext-Breakdown) angezeigt wird, bevor es weitergeht.
   *
   * - false (Standard/Normalbetrieb): Der User beantwortet nur die Fragen,
   *   bekommt seine XP und es geht sofort automatisch weiter – kein
   *   Zwischenstopp, kein Analyse-Screen.
   * - true (z.B. für Test-Level oder den finalen Abschluss-Level): Nach der
   *   letzten Frage wird die volle Auswertung angezeigt, der User bestätigt
   *   sie explizit über einen Button, bevor es weitergeht.
   */
  showAnalysis?: boolean
  props?: Omit<SubtypeFinderAIData, "props">
}


/* =======================
   Helpers
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

/**
 * Ersetzt {{count}} in einem beliebigen Text (zusätzlich zu den normalen
 * applyTemplate-Platzhaltern), damit Level-JSONs z.B.
 * "Beantworte {{count}} kurze Impulsfragen ..." schreiben können.
 */
function interpolateCount(text: string, count: number): string {
  return text.replace(/\{\{\s*count\s*\}\}/g, String(count))
}

/* =======================
   Component
======================= */

function SubtypeFinderAI({ data }: { data: SubtypeFinderAIData }) {
  const resolvedProps = data?.props || data || {}

  const {
    id = 0,
    xp = 0,
    title = "Systemischer Subtypen-Finder 🧩",
    intro,
    description,
    saveTo = "meta.subtype_analysis",
    count = 3,
    showAnalysis = false,
  } = resolvedProps

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  // ── Bereits beantwortete Fragen & alle bisherigen Rohantworten aus dem
  //    globalen User-Profil (profile.meta) lesen ─────────────────────────
  const profile = useAppSelector((s) => s.session?.profile)
  const previouslyAnsweredIds = useMemo<string[]>(
    () => (profile?.meta?.subtype_answered_ids as string[] | undefined) ?? [],
    [profile]
  )
  const previousAllAnswers = useMemo<Record<string, number>>(
    () => (profile?.meta?.subtype_all_answers as Record<string, number> | undefined) ?? {},
    [profile]
  )

  const renderedTitle = applyTemplate(title, ctx)
  const defaultIntroText =
    count === 1
      ? "Beantworte spontan aus dem Bauch heraus mit Daumen hoch oder runter."
      : `Beantworte ${count} kurze Impulsfragen spontan aus dem Bauch heraus mit Daumen hoch oder runter.`
  const introSource = description ?? intro ?? defaultIntroText
  const renderedIntro = applyTemplate(interpolateCount(introSource, count), ctx)

  // ── Fragen für DIESES Level ziehen (einmalig beim Mount) ──────────────
  const [statements] = useState<SubtypeStatement[]>(() =>
    getRandomQuestionsForLevel(previouslyAnsweredIds, count)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [exitDirection, setExitDirection] = useState<1 | -1 | 0>(0)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [results, setResults] = useState<SubtypeCalcResult | null>(null)

  const currentStatement =
    statements && statements.length > 0 ? statements[currentIndex] : null
  const isLastStatement =
    statements && statements.length > 0 ? currentIndex === statements.length - 1 : false

  const renderedStatementText = currentStatement
    ? applyTemplate(currentStatement.text, ctx)
    : ""

  /* ─── Auswertung Berechnen (KUMULATIV über alle bisherigen Antworten) ─── */

  const calculateResults = useCallback(
    (levelAnswers: Record<string, number>): SubtypeCalcResult => {
      const mergedAnswers = { ...previousAllAnswers, ...levelAnswers }
      return calculateSubtypeResult(mergedAnswers)
    },
    [previousAllAnswers]
  )

  /* ─── Speichern & Weiterleiten ───────────────────────────────── */

  const finishTest = useCallback(
    async (resultData: SubtypeCalcResult, levelAnswers: Record<string, number>) => {
      if (!api || isFinishing) return
      setIsFinishing(true)

      const profilePatch: Record<string, unknown> = {}

      assignPatchValue(profilePatch, `${saveTo}_dominant`, resultData.dominantTypeId)
      assignPatchValue(profilePatch, `${saveTo}_dominant_label`, resultData.dominantTypeName)
      assignPatchValue(profilePatch, `${saveTo}_secondary`, resultData.secondaryTypeId)
      assignPatchValue(profilePatch, `${saveTo}_secondary_label`, resultData.secondaryTypeName)
      assignPatchValue(profilePatch, saveTo, resultData)

      // Global fortschreiben: beantwortete IDs + alle Rohantworten
      // WICHTIG: Muss unter "meta." gespeichert werden, da das Backend nur
      // eine feste Whitelist an Top-Level-Feldern akzeptiert (name,
      // opponent_animal, age, gender, occupation, country) + "meta".
      // Alles andere wird vom Server stillschweigend verworfen!
      const newIds = Object.keys(levelAnswers)
      const mergedIds = Array.from(new Set([...previouslyAnsweredIds, ...newIds]))
      assignPatchValue(profilePatch, "meta.subtype_answered_ids", mergedIds)
      assignPatchValue(profilePatch, "meta.subtype_all_answers", {
        ...previousAllAnswers,
        ...levelAnswers,
      })

      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("patchUserProfile Error:", err)
      }

      await dispatch(
        completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
      ).unwrap()

      await new Promise((r) => setTimeout(r, 200))

      await dispatch(
        handleActionThunk({
          action: { type: "next", goNext: () => slideManager.goNext() },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    },
    [
      api,
      isFinishing,
      saveTo,
      dispatch,
      id,
      xp,
      startAnimation,
      slideManager,
      previouslyAnsweredIds,
      previousAllAnswers,
    ]
  )

  const handleAnswer = useCallback(
    (value: boolean) => {
      if (isAnimatingOut || !currentStatement || isFinishing) return
      setIsAnimatingOut(true)
      setExitDirection(value ? 1 : -1)

      const updatedAnswers = {
        ...answers,
        [currentStatement.id]: value ? 1 : 0,
      }
      setAnswers(updatedAnswers)

      setTimeout(() => {
        if (!isLastStatement) {
          setCurrentIndex((i) => i + 1)
          setExitDirection(0)
          setIsAnimatingOut(false)
        } else {
          const computed = calculateResults(updatedAnswers)
          if (showAnalysis) {
            // Test-/Analyse-Modus: Auswertungsscreen anzeigen, User bestätigt manuell
            setResults(computed)
          } else {
            // Normalbetrieb: kein Zwischenstopp – direkt speichern & weiter
            finishTest(computed, updatedAnswers)
          }
        }
      }, 180)
    },
    [
      isAnimatingOut,
      currentStatement,
      isFinishing,
      answers,
      isLastStatement,
      calculateResults,
      showAnalysis,
      finishTest,
    ]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingOut || isFinishing || results) return
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
  }, [handleAnswer, isAnimatingOut, isFinishing, results])

  /* ─── Fallback: Fragen-Pool erschöpft (alle Fragen bereits beantwortet) ── */

  if (!statements || statements.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble
            title={renderedTitle}
            subtitle="Du hast bereits alle verfügbaren Impulsfragen beantwortet – dein Profil ist vollständig. 🎉"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400 max-w-sm">
            Es gibt aktuell keine neuen Fragen mehr für dich. Du kannst einfach weitermachen.
          </p>
        </div>
        <button
          onClick={() =>
            dispatch(
              handleActionThunk({
                action: { type: "next", goNext: () => slideManager.goNext() },
                playAnimation: startAnimation,
                api,
              })
            )
          }
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg hover:brightness-110 transition mt-auto shrink-0"
        >
          Weiter →
        </button>
      </div>
    )
  }

  /* ─── Auswertungsscreen nach der letzten Frage ────────────────── */

  if (results) {
    return (
      <div className="flex flex-col h-full min-h-0 p-6 text-white overflow-y-auto">
        <div className="shrink-0 mb-4">
          <AvatarBubble
            title="Deine systemische Analyse 📊"
            subtitle="Hier siehst du, welches Muster in welchem Kontext aktiv wird."
          />
        </div>

        {/* Haupt-Muster */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-5 mb-4 text-center">
          <span className="text-xs uppercase tracking-wider text-purple-300 font-bold">
            Dominantes Gesamtmuster
          </span>
          <h3 className="text-2xl font-bold text-white mt-1">
            {results.dominantTypeName}
          </h3>
        </div>

        {results.secondaryTypeId && (
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 mb-6 text-center">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Sekundäres Muster
            </span>
            <h4 className="text-lg font-semibold text-white mt-1">
              {results.secondaryTypeName}
            </h4>
          </div>
        )}

        {/* Kontext Matrix Auswertung */}
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Verhalten nach Beziehungs-Kontext
        </h4>

        <div className="flex flex-col gap-3 mb-6">
          {Object.values(results.contextBreakdown).map((item) => (
            <div
              key={item?.contextId}
              className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="text-xs text-gray-400">{item?.contextLabel}</p>
                <p className="text-base font-semibold text-white mt-0.5">
                  {item?.dominantTypeName}
                </p>
              </div>
              <span className="text-lg font-bold text-pink-400">
                {item?.scorePercent}%
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => finishTest(results, answers)}
          disabled={isFinishing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg hover:brightness-110 transition disabled:opacity-50 mt-auto shrink-0"
        >
          {isFinishing ? "Wird gespeichert..." : "Ergebnis sichern & weiter →"}
        </button>
      </div>
    )
  }

  /* ─── Fragen-Durchlauf ────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble title={renderedTitle} subtitle={renderedIntro} />
      </div>

      {currentStatement && (
        <>
          {/* Fortschrittsanzeige: nur anzeigen, wenn es mehr als 1 Frage in diesem Level gibt */}
          {statements.length > 1 && (
            <div className="mt-4 shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="truncate max-w-[200px] text-zinc-400">
                  {RELATIONAL_CONTEXTS[currentStatement.relationalContext]?.label}
                </span>
                <span>
                  {currentIndex + 1} / {statements.length}
                </span>
              </div>

              <div className="w-full h-2 bg-zinc-900 border border-zinc-700 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${((currentIndex + 1) / statements.length) * 100}%`,
                    height: "100%",
                    background:
                      "linear-gradient(to right, #a855f7, #ec4899, #f43f5e)",
                    borderRadius: "9999px",
                    transition: "width 150ms ease-out",
                  }}
                />
              </div>
            </div>
          )}

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
                  transition: { duration: 0.18 },
                }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md bg-zinc-800 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
              >
                <p className="text-lg font-semibold leading-relaxed text-center">
                  {renderedStatementText}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 shrink-0 flex items-center justify-center gap-6">
            <motion.button
              onClick={() => handleAnswer(false)}
              disabled={isAnimatingOut || isFinishing}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-red-500 transition disabled:opacity-50"
            >
              <span className="text-3xl">👎</span>
              <span className="text-xs text-gray-400">Trifft nicht zu</span>
            </motion.button>

            <motion.button
              onClick={() => handleAnswer(true)}
              disabled={isAnimatingOut || isFinishing}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 px-8 py-4 rounded-xl bg-zinc-800 border border-gray-700 hover:border-green-500 transition disabled:opacity-50"
            >
              <span className="text-3xl">👍</span>
              <span className="text-xs text-gray-400">Trifft zu</span>
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}

export default memo(SubtypeFinderAI)
