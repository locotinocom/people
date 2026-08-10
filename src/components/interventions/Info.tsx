import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"
import SwipeHint from "@components/SwipeHint"
import { useAppSelector } from "@store/hooks"
import { useEffect } from "react"
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useReduxApi } from "@api/reduxApi"
import AvatarRender from "@components/AvatarRender"

type InfoData = {
  id?: number
  xp?: number
  title?: string
  message?: string
  onComplete?: () => void
  autoComplete?: boolean
  showLargeAvatar?: boolean
}

export default function Info({ data }: { data: InfoData }) {
  const { id, xp = 0, title = "", message = "", onComplete, showLargeAvatar = false } = data

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

  if (showLargeAvatar) {
    return (
      <div
        className="relative flex flex-col h-full p-8"
        onClick={onComplete}
      >
        <div className="flex items-start gap-6">
          {/* Großer Avatar links */}
          <div className="shrink-0 w-32 h-32 rounded-full overflow-hidden bg-white/10">
            <AvatarRender
              variant="bubble"
              camera="head"
              emotion="happy_default"
              className="w-full h-full"
            />
          </div>

          {/* Text rechts */}
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
