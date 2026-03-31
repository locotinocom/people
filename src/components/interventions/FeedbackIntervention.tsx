import { memo, useCallback, useRef, useState } from "react"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { request } from "@api/request"
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader"
// authHeader wird als String direkt verwendet (kein Funktionsaufruf)

type Lang = "de" | "en"

// ─── Typen ───────────────────────────────────────────────────────────────────

type StarRatingQuestion = {
  type: "star"
  key: string
  label: string
}

type ScaleQuestion = {
  type: "scale"
  key: string
  label: string
}

type YesNoQuestion = {
  type: "yesno"
  key: string
  label: string
}

type TextQuestion = {
  type: "text"
  key: string
  label: string
  placeholder?: string
}

type FeedbackQuestion = StarRatingQuestion | ScaleQuestion | YesNoQuestion | TextQuestion

type FeedbackBlock = {
  title: string
  subtitle?: string
  questions: FeedbackQuestion[]
}

type PropsJson = {
  intro_title?: string
  intro_text?: string
  blocks: FeedbackBlock[]
  submit_label?: string
}

type FeedbackInterventionData = {
  id: number
  title: string
  question?: string
  xp?: number
  lang?: Lang
  // props kann direkt im data-Objekt liegen (GamePlay spread) ODER in data.props
  props?: PropsJson
  // direkte Felder (wenn GamePlay { ...props, id, ... } spread)
  intro_title?: string
  intro_text?: string
  blocks?: FeedbackBlock[]
  submit_label?: string
}

type Answers = Record<string, string | number | null>

// ─── Sub-Komponenten ──────────────────────────────────────────────────────────

function StarRating({ questionKey, value, onChange }: { questionKey: string; value: number | null; onChange: (k: string, v: number) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(questionKey, star)}
          className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${
            value !== null && star <= value ? "text-yellow-400" : "text-gray-300"
          }`}
          aria-label={`${star} Sterne`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ScaleRating({ questionKey, value, onChange }: { questionKey: string; value: number | null; onChange: (k: string, v: number) => void }) {
  const labels = ["stimme gar nicht zu", "stimme nicht zu", "neutral", "stimme zu", "stimme voll zu"]
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(questionKey, n)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${
              value === n
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  )
}

function YesNo({ questionKey, value, onChange }: { questionKey: string; value: string | null; onChange: (k: string, v: string) => void }) {
  return (
    <div className="flex gap-3 mt-1">
      {["Ja", "Nein"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(questionKey, opt)}
          className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all border ${
            value === opt
              ? "bg-indigo-600 text-white border-indigo-600 shadow"
              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function TextAnswer({ questionKey, value, placeholder, onChange }: { questionKey: string; value: string; placeholder?: string; onChange: (k: string, v: string) => void }) {
  return (
    <textarea
      rows={3}
      value={value}
      placeholder={placeholder ?? "Deine Antwort..."}
      onChange={(e) => onChange(questionKey, e.target.value)}
      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
    />
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

function FeedbackIntervention({ data }: { data: FeedbackInterventionData }) {
 
  const { id, xp = 20 } = data

  // GamePlay übergibt { ...props, id, type, template, xp } – d.h. die Props-Felder
  // liegen direkt im data-Objekt. Fallback auf data.props für direkten Aufruf.
  const p: PropsJson = {
    intro_title: data.intro_title ?? data.props?.intro_title,
    intro_text:  data.intro_text  ?? data.props?.intro_text,
    blocks:      data.blocks      ?? data.props?.blocks ?? [],
    submit_label: data.submit_label ?? data.props?.submit_label,
  }

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const authHeader = useAuthHeader()  // gibt direkt den Header-String zurück


  const userId = useAppSelector((s) => s.session.user?.id)
  

  const [answers, setAnswers] = useState<Answers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const xpFromRef = useRef<HTMLDivElement | null>(null)



  const handleChange = useCallback((key: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!api || isSubmitting) return
    setIsSubmitting(true)

    if (import.meta.env.DEV) {
      console.log("📋 FeedbackIntervention submit", { userId, interventionId: id, answers })
    }

    try {
      // Feedback in DB speichern via request()
      await request(
        "/feedback/submit",
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, intervention_id: id, answers }),
        },
        authHeader ?? undefined
      )
    } catch (err) {
      if (import.meta.env.DEV) console.error("❌ Feedback submit failed", err)
      // Wir blocken den User nicht — Feedback-Fehler soll den Flow nicht brechen
    }

    setSubmitted(true)

    // XP + nächste Slide wie gewohnt
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: startAnimation,
        api,
      })
    )

    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    )

    setIsSubmitting(false)
  }, [api, isSubmitting, userId, id, answers, dispatch, startAnimation, slideManager])

  const blocks: FeedbackBlock[] = p.blocks ?? []
  const totalQuestions = blocks.reduce((acc, b) => acc + b.questions.length, 0)
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== null && answers[k] !== "").length
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Avatar Bubble oben */}
     

      <div ref={xpFromRef} className="h-0 w-0" />

      {/* Scrollbarer Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 pb-8">

        {/* Intro */}
        {p.intro_text && (
          <div className="mt-4 mb-6 rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4">
            {p.intro_title && (
              <p className="text-sm font-bold text-indigo-700 mb-1">{p.intro_title}</p>
            )}
            <p className="text-sm text-indigo-600 leading-relaxed">{p.intro_text}</p>
          </div>
        )}

        {/* Progress Bar */}
        {totalQuestions > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{answeredCount} von {totalQuestions} beantwortet</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Frage-Blöcke */}
        {blocks.map((block, bi) => (
          <div key={bi} className="mb-9">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white-800">{block.title}</h3>
              {block.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{block.subtitle}</p>
              )}
            </div>

            <div className="flex flex-col gap-8">
              {block.questions.map((q) => (
                <div key={q.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-5">
                  <p className="text-sm font-medium text-gray-700 leading-snug">{q.label}</p>

                  {q.type === "star" && (
                    <StarRating
                      questionKey={q.key}
                      value={(answers[q.key] as number) ?? null}
                      onChange={handleChange}
                    />
                  )}

                  {q.type === "scale" && (
                    <ScaleRating
                      questionKey={q.key}
                      value={(answers[q.key] as number) ?? null}
                      onChange={handleChange}
                    />
                  )}

                  {q.type === "yesno" && (
                    <YesNo
                      questionKey={q.key}
                      value={(answers[q.key] as string) ?? null}
                      onChange={handleChange}
                    />
                  )}

                  {q.type === "text" && (
                    <TextAnswer
                      questionKey={q.key}
                      value={(answers[q.key] as string) ?? ""}
                      placeholder={(q as TextQuestion).placeholder}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || submitted}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-md mt-2 ${
            submitted
              ? "bg-green-100 text-green-600 border border-green-200 cursor-default"
              : isSubmitting
              ? "bg-indigo-300 text-white cursor-wait"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {submitted
            ? "✅ Danke für dein Feedback!"
            : isSubmitting
            ? "Wird gespeichert..."
            : p.submit_label ?? "Feedback absenden"}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Du kannst auch Fragen überspringen — jede Antwort hilft! 🙏
        </p>

      </div>
    </div>
  )
}

export default memo(FeedbackIntervention)
