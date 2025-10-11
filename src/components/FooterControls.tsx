import { useState } from "react"
import { api } from "../api"
import type { StepProgress } from "../api/types"

type Props = {
  swiperRef: React.RefObject<any>
  setStepIndex: (idx: number) => void
  setInitialSlide: (idx: number) => void
}

export default function FooterControls({ swiperRef, setStepIndex, setInitialSlide }: Props) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex gap-2 p-2 bg-gray-800 border-t border-gray-700">
      {/* Zum gespeicherten Schritt */}
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          const res: StepProgress = await api.getCurrentStep()
          swiperRef.current?.slideTo(res.stepIndex, 0)
          setStepIndex(res.stepIndex)
          setInitialSlide(res.stepIndex)
          setLoading(false)
        }}
        className="px-3 py-1 bg-blue-600 rounded text-sm"
      >
        Gehe zu gespeichertem Schritt
      </button>

      {/* Neustart */}
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          await api.resetProgress()
          setStepIndex(0)
          setInitialSlide(0)
          swiperRef.current?.slideTo(0, 0)
          setLoading(false)
        }}
        className="px-3 py-1 bg-red-600 rounded text-sm"
      >
        Neustart
      </button>
    </div>
  )
}
