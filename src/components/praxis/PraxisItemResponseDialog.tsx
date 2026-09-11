// src/components/praxis/PraxisItemResponseDialog.tsx
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import { completePraxisItem, selectPraxisLoading } from "@store/slices/praxisSlice"
import type { PraxisItem, PraxisContentItem } from "@api/types"
import toast from "react-hot-toast"

type Props = {
  item: PraxisItem
  contentDef?: PraxisContentItem
  isOpen: boolean
  onClose: () => void
}

export default function PraxisItemResponseDialog({
  item,
  contentDef,
  isOpen,
  onClose,
}: Props) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const isLoading = useAppSelector(selectPraxisLoading)
  const [textResponse, setTextResponse] = useState("")
  const [checkboxResponses, setCheckboxResponses] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (submitting || isLoading) return

    let responseData: Record<string, unknown> = {}

    if (item.type === "micro_commitment") {
      if (!textResponse.trim()) {
        toast.error("Bitte beschreibe, wie es gelaufen ist")
        return
      }
      responseData = { how_it_went: textResponse }
    } else if (item.type === "situation_reflection") {
      if (!textResponse.trim()) {
        toast.error("Bitte beschreibe die Situation")
        return
      }
      responseData = { situation: textResponse }
    } else if (item.type === "challenge") {
      const completedCount = Object.values(checkboxResponses).filter(Boolean).length
      if (completedCount === 0) {
        toast.error("Bitte wähle mindestens einen Tag aus")
        return
      }
      responseData = { days_completed: checkboxResponses }
    }

    setSubmitting(true)
    try {
      const result = await dispatch(
        completePraxisItem({
          api,
          praxisItemId: item.id,
          responseData,
        })
      )

      if (completePraxisItem.fulfilled.match(result)) {
        toast.success(`+${item.diamondReward} 💎 Aufgabe erledigt!`)
        onClose()
        setTextResponse("")
        setCheckboxResponses({})
      } else {
        toast.error("Aufgabe konnte nicht gespeichert werden")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-3xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {contentDef?.title || "Aufgabe beantworten"}
          </h2>
          <p className="text-sm text-white/60">
            {contentDef?.followUpQuestion || "Bitte beanworte die Frage:"}
          </p>
        </div>

        {/* Text Input */}
        {(item.type === "micro_commitment" || item.type === "situation_reflection") && (
          <div className="mb-6">
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder="Deine Antwort..."
              className="w-full bg-gray-700 border border-gray-600 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>
        )}

        {/* Challenge Checkboxes */}
        {item.type === "challenge" && (
          <div className="mb-6 space-y-2">
            {[1, 2, 3].map((day) => (
              <label key={day} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxResponses[day] || false}
                  onChange={(e) =>
                    setCheckboxResponses((prev) => ({
                      ...prev,
                      [day]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-white">Tag {day}</span>
              </label>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || isLoading}
            className="flex-1 py-2 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white transition disabled:bg-gray-600"
          >
            {submitting || isLoading ? "..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  )
}
