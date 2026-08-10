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
import { applyTemplate, applyTemplateText } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import type { UserProfilePatch } from "@api/types"

type BeliefOption = {
  id: string
  label: string
  helperText?: string
}

type TheWorkSelectData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  saveTo: string
  nextCardId?: string
  beliefs: BeliefOption[]
  preselectedId?: string
  preselectedLabel?: string
  allowCustom?: boolean
  customPlaceholder?: string
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

function TheWorkSelect({ data }: { data: TheWorkSelectData }) {
  const {
    id,
    xp = 0,
    title,
    subtitle,
    saveTo,
    nextCardId,
    beliefs,
    preselectedId,
    preselectedLabel,
    allowCustom = false,
    customPlaceholder = "Schreibe deinen eigenen Satz hier...",
  } = data

  const ctx = useTemplateContext()

  // Anzeige (kann JSX wie Icons enthalten)
  const renderedTitle = applyTemplate(title, ctx)
  const renderedSubtitle = subtitle ? applyTemplate(subtitle, ctx) : undefined
  const renderedBeliefs = beliefs.map((belief) => ({
    ...belief,
    renderedLabel: applyTemplate(belief.label, ctx),
    renderedHelperText: belief.helperText ? applyTemplate(belief.helperText, ctx) : undefined,
  }))

  // Datenwerte (müssen reiner String sein)
  const renderedPreselectedId = preselectedId
    ? applyTemplateText(preselectedId, ctx).trim()
    : null
  const renderedPreselectedLabel = preselectedLabel
    ? applyTemplateText(preselectedLabel, ctx).trim()
    : null

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(renderedPreselectedId)
  const [customText, setCustomText] = useState(renderedPreselectedLabel || "")
  const [customMode, setCustomMode] = useState(false)

  const selectedBelief = beliefs.find((b) => b.id === selectedId)
  const answerText = customMode
  ? customText.trim()
  : selectedBelief
  ? selectedBelief.label.trim()
  : ""
  const canComplete = customMode ? answerText.length > 0 : Boolean(selectedBelief)

  const handleSelect = (id: string) => {
    setCustomMode(false)
    setSelectedId(id)
  }

  const handleCustomMode = () => {
    setCustomMode(true)
    setSelectedId(null)
  }

  const handleComplete = useCallback(async () => {
    if (!api || !canComplete) return

    const profilePatch: Record<string, unknown> = {}
    assignPatchValue(profilePatch, saveTo, answerText)

    if (saveTo === "meta.core_belief") {
      assignPatchValue(profilePatch, "meta.core_belief_label", answerText)
    }

    if (import.meta.env.DEV) {
      console.log("[TheWorkSelect] Gewählte Aussage:", answerText)
      console.log("[TheWorkSelect] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[TheWorkSelect] patchUserProfile fehlgeschlagen:", err)
      return
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
  }, [api, canComplete, saveTo, answerText, nextCardId, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble title={renderedTitle} subtitle={renderedSubtitle} />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-4 pb-2">
          {renderedPreselectedLabel && renderedPreselectedId && (
            <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-4 text-sm">
              <div className="text-xs text-green-400/70 uppercase tracking-wider mb-2">
                Dein Satz aus vorhin
              </div>
              <div className="font-semibold text-white">{renderedPreselectedLabel}</div>
            </div>
          )}

          <div className="space-y-3">
            {renderedBeliefs.map((belief) => {
              const selected = selectedId === belief.id && !customMode
              return (
                <motion.button
                  key={belief.id}
                  onClick={() => handleSelect(belief.id)}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    "w-full rounded-2xl border p-4 text-left transition-all duration-200",
                    selected
                      ? "bg-green-900/30 border-green-500"
                      : "border-gray-700 bg-gray-900/60 hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">•</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{belief.renderedLabel}</div>
                      {belief.renderedHelperText && (
                        <div className="text-sm text-gray-400 leading-snug">
                          {belief.renderedHelperText}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {allowCustom && (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Keiner davon passt?</div>
                  <div className="text-xs text-gray-500">Formuliere deinen eigenen Glaubenssatz.</div>
                </div>
                <button
                  type="button"
                  onClick={handleCustomMode}
                  className={clsx(
                    "px-3 py-2 rounded-full text-xs font-semibold transition",
                    customMode
                      ? "bg-green-600 text-white"
                      : "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                  )}
                >
                  Eigener Satz
                </button>
              </div>

              {customMode && (
                <textarea
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder={customPlaceholder}
                  className="mt-4 w-full min-h-[120px] rounded-2xl bg-gray-950 border border-gray-700 p-4 text-sm text-white resize-none focus:border-green-500 focus:outline-none"
                />
              )}
            </div>
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
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        {customMode ? "Mein Satz speichern" : selectedBelief ? "Das ist mein Satz" : "Auswählen..."}
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(TheWorkSelect)