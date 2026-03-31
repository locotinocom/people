import { useRef } from "react"

// API
import { useReduxApi } from "@api/reduxApi"

// Redux
import { useAppDispatch } from "@store/hooks"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"

// Animation
import { useAnimation } from "@context/AnimationContext"

// SlideManager
import { useSlideManager } from "@context/SlideManagerContext"

type YesNoData = {
  id: number
  title: string
  question: string
  yesText: string
  noText: string
  xp?: number
}

export default function YesNo({ data }: { data: YesNoData }) {
console.log("🚦 YesNo Intervention geladen:", data)
  const { id, title, question, yesText, noText, xp = 0 } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const { start: startAnimation } = useAnimation()
  const slideManager = useSlideManager()

  const btnRef = useRef<HTMLButtonElement | null>(null)

  const handleComplete = async () => {
    if (!api) return

    if (import.meta.env.DEV) console.log("📌 YesNo:", { id, xp })

    // XP-Animation + API-Call + Level-Reload passieren im Thunk
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: startAnimation,
        api,
      })
    )

    // 3) Delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 4) Weiterblättern
    await dispatch(
      handleActionThunk({
        action: {
          type: "next",
          goNext: () => slideManager.goNext(),  // ← ENTSCHEIDEND
        },
        playAnimation: startAnimation,          // ← ANIMATION WEITERGEBEN
        api,
      })
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
      <h2 className="text-xl font-bold mb-2">{title}</h2>

      <p>{question}</p>

      <div className="flex gap-4 mt-4">
        <button
          ref={btnRef}
          onClick={handleComplete}
          className="px-6 py-3 bg-green-600 rounded-lg text-white font-bold"
        >
          {yesText}
        </button>

        <button
          onClick={handleComplete}
          className="px-6 py-3 bg-red-600 rounded-lg text-white font-bold"
        >
          {noText}
        </button>
      </div>

      {xp > 0 && (
        <p className="mt-2 text-sm text-gray-400">
          Erledigen bringt +{xp} XP
        </p>
      )}
    </div>
  )
}
