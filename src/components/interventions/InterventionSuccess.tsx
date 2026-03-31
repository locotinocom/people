// src/components/interventions/InterventionSuccess.tsx
import { useRef } from "react"
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useReduxApi } from "@api/reduxApi"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"

type Props = {
  id: number
  xp: number
  props?: {
    title?: string
    message?: string
    button?: string
  }
}

export default function InterventionSuccess({ data }: { data: Props }) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const { start: animate } = useAnimation()
  const slides = useSlideManager()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  // 🔥 props sicher machen – niemals crashen lassen
  const { id, xp, props: rawProps } = data
  const p = rawProps ?? {}

  const {
    title = "Erfolg",
    message = "Cool du hast die Intervention erfolgreich abgeschlossen!",
    button = "Weiter",
  } = p

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
      <h2 className="text-2xl font-bold mb-3">{title}</h2>

      {message && (
        <p className="text-white/80 mb-6 max-w-md">
          {message}
        </p>
      )}

      {xp > 0 && (
        <p className="text-xl text-yellow-400 font-semibold mb-4">
          +{xp} XP
        </p>
      )}

      <button
        ref={btnRef}
        onClick={handleContinue}
        className="px-6 py-3 bg-green-600 rounded-lg font-bold shadow-lg active:scale-95 transition-transform"
      >
        {button}
      </button>
    </div>
  )
}
