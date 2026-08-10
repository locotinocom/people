// src/components/interventions/TheWorkTurnaround.tsx

import { useRef, useState, useCallback, memo } from "react"
import { motion } from "framer-motion"
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

type TheWorkTurnaroundData = {
  id: number
  xp?: number
  title: string
  belief?: string
  description?: string
  hint?: string
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

function TheWorkTurnaround({ data }: { data: TheWorkTurnaroundData }) {
  const {
    id,
    xp = 0,
    title,
    belief,
    description,
    hint,
    placeholder,
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

  // Templates sauber mit Context auflösen
  const renderedTitle = applyTemplate(title, ctx)
  const renderedBelief = belief ? applyTemplate(belief, ctx) : null
  const renderedDescription = description ? applyTemplate(description, ctx) : null
  const renderedHint = hint ? applyTemplate(hint, ctx) : null
  const renderedPlaceholder = placeholder ? applyTemplate(placeholder, ctx) : null

  // NEU: Beschreibung, Hinweis und Beispiel zu einem zusammenhängenden
  // Subtitle-Block für die AvatarBubble kombinieren, statt separate Boxen.
  const combinedSubtitle = (
    <div className="flex flex-col gap-2">
      {renderedDescription && (
        <p className="leading-relaxed">{renderedDescription}</p>
      )}
      {renderedHint && (
        <p className="text-sm text-gray-400">{renderedHint}</p>
      )}
      {renderedPlaceholder && (
        <p className="text-sm text-gray-400 italic">
          <span className="not-italic text-xs uppercase tracking-wider text-gray-500 mr-1">
            z.B.
          </span>
          {renderedPlaceholder}
        </p>
      )}
    </div>
  )

  const [answer, setAnswer] = useState("")

  const handleComplete = useCallback(async () => {
    if (!api) return

    const profilePatch: Record<string, unknown> = {}
    const trimmedAnswer = answer.trim()
    if (saveTo && trimmedAnswer.length > 0) {
      assignPatchValue(profilePatch, saveTo, trimmedAnswer)
    }

    if (import.meta.env.DEV) {
      console.log("[TheWorkTurnaround] Antwort:", trimmedAnswer)
      console.log("[TheWorkTurnaround] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    if (Object.keys(profilePatch).length > 0) {
      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[TheWorkTurnaround] patchUserProfile fehlgeschlagen:", err)
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
  }, [api, answer, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0 flex flex-col gap-4">
        {typeof questionNumber === "number" && typeof totalQuestions === "number" && (
          <div className="text-xs uppercase tracking-wider text-green-400/70">
            Schritt {questionNumber} von {totalQuestions}
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

        <AvatarBubble title={renderedTitle} subtitle={combinedSubtitle} />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Schreibe deine neue, hilfreiche Perspektive..."
          rows={6}
          className="w-full rounded-2xl bg-gray-950 border border-gray-700 p-4 text-sm text-white resize-none focus:border-green-500 focus:outline-none"
        />
      </div>

      <motion.button
        ref={btnRef}
        onClick={handleComplete}
        className="mt-6 shrink-0 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 font-bold text-white transition"
      >
        Weiter
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(TheWorkTurnaround)