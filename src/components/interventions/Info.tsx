/** @orphan-check-start
 * Auto-generated von check-orphaned-templates.js — bitte nicht von Hand editieren.
 * Zuletzt geprüft: 2026-08-10
 * Status: aktiv — wird von mindestens einem Level referenziert
 * Referenziert in: level-1.json, level-10.json, level-11.json, level-12.json, level-15.json, level-16.json, level-17.json, level-18.json, level-19.json, level-2.json, level-20.json, level-3.json, level-4-survey.json, level-4.json, level-5.json, level-6.json, level-7.json, level-8.json, level-9.json
 * @orphan-check-end */
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import SwipeHint from "@components/SwipeHint"
import { useAppSelector } from "@store/hooks"
import { useEffect } from "react"
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useReduxApi } from "@api/reduxApi"
import AvatarRender, { type Emotion } from "@components/AvatarRender"
import clsx from "clsx"

type AvatarMode = "none" | "head" | "portrait" | "fullbody"

type InfoData = {
  id?: number
  xp?: number
  title?: string
  message?: string
  onComplete?: () => void
  autoComplete?: boolean
  showLargeAvatar?: boolean
  /** "full" is legacy and maps to "head" — kept for level-24.json */
  showAvatar?: AvatarMode | "full"
  avatarEmotion?: Emotion
}

export default function Info({ data }: { data: InfoData }) {
  const {
    id,
    xp = 0,
    title = "",
    message = "",
    onComplete,
    showLargeAvatar = false,
    showAvatar,
    avatarEmotion,
  } = data

  const level = useAppSelector((s) => s.game.level)
  const completedInterventions = useAppSelector((s) => s.game.completedInterventions)

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const { start: startAnimation } = useAnimation()

  const ctx = useTemplateContext()

  const renderedTitle = applyTemplate(title, ctx)
  const renderedMessage = applyTemplate(message, ctx)

  // Wenn diese Info-Karte XP hat, beim Anzeigen automatisch abschließen
useEffect(() => {
  if (!id || !api) return
  if (!data.autoComplete) return        // ← nur wenn explizit gesetzt
  if (completedInterventions.includes(id)) return
  if (xp <= 0) return

  dispatch(
    completeInterventionThunk({
      interventionId: id,
      xp,
      playAnimation: startAnimation,
      api,
    })
  )
}, [id])

  const resolvedMode: AvatarMode =
    showAvatar === "full" ? "head" : showAvatar ?? (showLargeAvatar ? "head" : "none")
  const showsAvatar = resolvedMode !== "none"
  const emotion: Emotion = avatarEmotion ?? "happy_default"

  if (showsAvatar && resolvedMode !== "fullbody") {
    const boxSize = resolvedMode === "portrait" ? "w-40 h-40" : "w-32 h-32"

    return (
      <div className="relative flex flex-col h-full p-8" onClick={onComplete}>
        <div className="flex items-start gap-6">
          <div className={clsx("shrink-0 rounded-full overflow-hidden bg-white/10", boxSize)}>
            <AvatarRender
              variant="bubble"
              camera={resolvedMode}
              emotion={emotion}
              className="w-full h-full"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {renderedTitle && <h2 className="text-2xl font-bold mb-3">{renderedTitle}</h2>}
            {renderedMessage && (
              <p className="text-lg text-gray-200 whitespace-pre-line leading-relaxed">{renderedMessage}</p>
            )}
          </div>
        </div>

        {level === 1 && <SwipeHint />}
      </div>
    )
  }

  if (showsAvatar && resolvedMode === "fullbody") {
    return (
      <div className="relative flex flex-col h-full p-8" onClick={onComplete}>
        <div className="flex flex-col items-center text-center">
          {renderedTitle && <h2 className="text-2xl font-bold mb-3">{renderedTitle}</h2>}
          {renderedMessage && (
            <p className="text-lg text-gray-200 whitespace-pre-line leading-relaxed">
              {renderedMessage}
            </p>
          )}
        </div>
        <div className="flex-1 min-h-[220px] mt-6">
          <AvatarRender camera="fullbody" emotion={emotion} className="w-full h-full" />
        </div>
        {level === 1 && <SwipeHint />}
      </div>
    )
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full p-8 text-center"
      onClick={onComplete}
    >
      {renderedTitle && <h2 className="text-2xl font-bold mb-4">{renderedTitle}</h2>}
      {renderedMessage && (
        <p className="text-lg text-gray-200 whitespace-pre-line">{renderedMessage}</p>
      )}

      {level === 1 && <SwipeHint />}
    </div>
  )
}
