import { useRef, useState, useCallback, memo } from "react"
import { motion } from "framer-motion"
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
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

type TheWorkQuestionData = {
  id: number
  xp?: number
  title: string
  belief?: string
  question: string
  hint?: string
  inputType?: "yesno" | "textarea"
  placeholder?: string
  saveTo?: string
  questionNumber?: number
  totalQuestions?: number
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

function TheWorkQuestion({ data }: { data: TheWorkQuestionData }) {
  const {
    id,
    xp = 0,
    title,
    belief,
    question,
    hint,
    inputType = "textarea",
    placeholder = "Schreibe deine Antwort hier...",
    saveTo,
    questionNumber,
    totalQuestions,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const ctx = useTemplateContext()
  
 const renderedBelief = belief ? applyTemplate(belief, ctx) : null
  const renderedQuestion = applyTemplate(question, ctx)
  const renderedHint = hint ? applyTemplate(hint, ctx) : null

  const [textAnswer, setTextAnswer] = useState("")
  const [yesNoAnswer, setYesNoAnswer] = useState<boolean | null>(null)

  const canComplete = inputType === "yesno" ? yesNoAnswer !== null : textAnswer.trim().length > 0

  const handleComplete = useCallback(async () => {
    if (!api || !canComplete) return

    const profilePatch: Record<string, unknown> = {}
    
    if (saveTo) {
      if (inputType === "yesno" && yesNoAnswer !== null) {
        assignPatchValue(profilePatch, saveTo, yesNoAnswer ? "yes" : "no")
      } else if (inputType === "textarea") {
        const trimmedAnswer = textAnswer.trim()
        if (trimmedAnswer.length > 0) {
          assignPatchValue(profilePatch, saveTo, trimmedAnswer)
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log("[TheWorkQuestion] Antwort:", inputType === "yesno" ? yesNoAnswer : textAnswer)
      console.log("[TheWorkQuestion] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    if (Object.keys(profilePatch).length > 0) {
      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[TheWorkQuestion] patchUserProfile fehlgeschlagen:", err)
        return
      }
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
  }, [api, canComplete, inputType, yesNoAnswer, textAnswer, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0 flex flex-col gap-4">
        {typeof questionNumber === "number" && typeof totalQuestions === "number" && (
          <div className="text-xs uppercase tracking-wider text-green-400/70 text-center">
            Frage {questionNumber} von {totalQuestions}
          </div>
        )}

      {renderedBelief && (
  <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-4">
    <div className="text-xs text-green-400/70 uppercase tracking-wider mb-2">
      Dein Glaubenssatz
    </div>
    <div className="font-semibold text-white italic">„{renderedBelief}"</div>
  </div>
)}

        <AvatarBubble 
          title={renderedQuestion}
          subtitle={renderedHint}
        />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-4 pb-2">

          {inputType === "yesno" && (
            <div className="flex gap-4">
              <button
                onClick={() => setYesNoAnswer(true)}
                className={clsx(
                  "flex-1 px-6 py-4 rounded-2xl border text-center font-semibold transition-all duration-200",
                  yesNoAnswer === true
                    ? "bg-green-900/30 border-green-500 text-green-300"
                    : "border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-500"
                )}
              >
                Ja
              </button>
              <button
                onClick={() => setYesNoAnswer(false)}
                className={clsx(
                  "flex-1 px-6 py-4 rounded-2xl border text-center font-semibold transition-all duration-200",
                  yesNoAnswer === false
                    ? "bg-green-900/30 border-green-500 text-green-300"
                    : "border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-500"
                )}
              >
                Nein
              </button>
            </div>
          )}

          {inputType === "textarea" && (
            <textarea
              value={textAnswer}
              onChange={(event) => setTextAnswer(event.target.value)}
              placeholder={placeholder}
              rows={6}
              className="w-full rounded-2xl bg-gray-950 border border-gray-700 p-4 text-sm text-white resize-none focus:border-green-500 focus:outline-none"
            />
          )}
        </div>
      </div>

      <motion.button
        ref={btnRef}
        onClick={handleComplete}
        disabled={!canComplete}
        animate={{ opacity: canComplete ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          canComplete
            ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        )}
      >
        Weiter
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(TheWorkQuestion)
