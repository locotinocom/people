import { useEffect } from "react"
import { useSlideManager } from "@context/SlideManagerContext"
// API
import { useReduxApi } from "@api/reduxApi"

// Redux
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"

type InvitationData = {
  id: number
  title?: string
  message?: string
  buttonText?: string
  xp?: number
}

export default function Invitation({ data }: { data: InvitationData }) {
  const { id, title = "Einladung", message = "", buttonText = "Weiter", xp = 0 } = data
const slideManager = useSlideManager()

  const dispatch = useAppDispatch()
  const api = useReduxApi()

  useEffect(() => {
    if (import.meta.env.DEV) console.log("📩 Invitation geladen:", id)
  }, [id])

 const handleContinue = async () => {
  if (!api) return

  // 1) Intervention speichern
  await dispatch(
    completeInterventionThunk({
      interventionId: id,
      xp,
      playAnimation: () => {},
      api,
    })
  )

  if (import.meta.env.DEV)
    console.log("✅ Invitation abgeschlossen", { id, xp })

  // 2) Weiter
  await dispatch(
    handleActionThunk({
      action: {
        type: "next",
        goNext: () => slideManager.goNext(), // <-- KORREKT
      },
      playAnimation: () => {},
      api,
    })
  )
}


  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-white">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      {message && (
        <p className="text-lg mb-8 whitespace-pre-line max-w-sm">
          {message}
        </p>
      )}

      <button
        onClick={handleContinue}
        className="px-6 py-3 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500"
      >
        {buttonText}
      </button>

      {xp > 0 && (
        <p className="mt-4 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
