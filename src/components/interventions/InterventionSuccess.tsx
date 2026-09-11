/** @orphan-check-start
 * Auto-generated von check-orphaned-templates.js — bitte nicht von Hand editieren.
 * Zuletzt geprüft: 2026-08-10
 * Status: aktiv — wird von mindestens einem Level referenziert
 * Referenziert in: level-1.json
 * @orphan-check-end */
// src/components/interventions/InterventionSuccess.tsx
import { useRef } from "react"
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useReduxApi } from "@api/reduxApi"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { applyTemplate } from "@helpers/template.tsx"
import { useTemplateContext } from "@helpers/useTemplateContext"

// GamePlay.tsx reicht die Card-Props FLACH durch (<Template data={{ ...props, id, type, template, xp }} />),
// nicht verschachtelt unter einem "props"-Key - deshalb hier direkt auf data, wie bei allen anderen Interventionen.
type Props = {
  id: number
  xp: number
  title?: string
  message?: string
  button?: string
}

export default function InterventionSuccess({ data }: { data: Props }) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const { start: animate } = useAnimation()
  const slides = useSlideManager()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const ctx = useTemplateContext()

  // 🔥 Werte sicher machen – niemals crashen lassen
  const {
    id,
    xp,
    title = "Erfolg",
    message = "Cool du hast die Intervention erfolgreich abgeschlossen!",
    button = "Weiter",
  } = data

  // {{opponent_icon_small}}, {{user_name}} etc. ersetzen - wie in Info.tsx
  const renderedTitle = applyTemplate(title, ctx)
  const renderedMessage = applyTemplate(message, ctx)

  const handleContinue = async () => {
    if (!api) return

    // XP Animation
    if (xp > 0) {
      animate("xp", { from: btnRef.current })
    }

    // Backend speichern + LevelUp prüfen
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        api,
        playAnimation: animate,
      })
    )

    await new Promise((r) => setTimeout(r, 350))

    // Weiter
    await dispatch(
      handleActionThunk({
        action: {
          type: "next",
          goNext: () => slides.goNext(),
        },
        playAnimation: animate,
        api,
      })
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 text-white">
      <h2 className="text-2xl font-bold mb-3">{renderedTitle}</h2>

      {renderedMessage && (
        <p className="text-white/80 mb-6 max-w-md">
          {renderedMessage}
        </p>
      )}

      {xp > 0 && (
        <p className="text-xl text-yellow-400 font-semibold mb-4">
          +{xp} XP
        </p>
      )}

      <button
        type="button"
        ref={btnRef}
        onClick={handleContinue}
        className="px-6 py-3 bg-green-600 rounded-lg font-bold shadow-lg active:scale-95 transition-transform"
      >
        {button}
      </button>
    </div>
  )
}
