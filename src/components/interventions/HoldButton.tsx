// components/interventions/HoldButton.tsx
import { useRef, useState } from "react"

type Props = {
  title: string
  xp?: number
  onComplete: () => void
  holdDuration?: number   // Sekunden (alias zu deinem JSON: holdDuration)
  buttonText?: string     // alias zu deinem JSON: buttonText
}

export default function HoldButton({
  title,
  xp,
  onComplete,
  holdDuration = 3,
  buttonText = "Halten…",
}: Props) {
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const tick = () => {
    if (startRef.current == null) return
    const elapsed = (performance.now() - startRef.current) / 1000
    const pct = Math.min(100, (elapsed / holdDuration) * 100)
    setProgress(pct)
    if (elapsed >= holdDuration) {
      stopHold()
      onComplete()
    } else {
      timerRef.current = window.requestAnimationFrame(tick)
    }
  }

  const startHold = () => {
    if (timerRef.current) return
    startRef.current = performance.now()
    timerRef.current = window.requestAnimationFrame(tick)
  }

  const stopHold = () => {
    if (timerRef.current) {
      window.cancelAnimationFrame(timerRef.current)
      timerRef.current = null
    }
    startRef.current = null
    setProgress(0)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>

      <button
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        className="relative px-6 py-3 bg-blue-600 rounded-lg text-white font-bold overflow-hidden touch-none"
      >
        {buttonText}
        <div
          className="absolute bottom-0 left-0 h-1 bg-yellow-400"
          style={{ width: `${progress}%` }}
        />
      </button>

      {typeof xp === "number" && (
        <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
