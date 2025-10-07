import { useEffect, useState } from "react"
import { usePlayerData } from "../../hooks/usePlayerData"

type Props = {
  questionId?: number
  duration: number // in Sekunden
  text: string
}

export default function CircleTimer({ duration, text }: Props) {
  const { addXP } = usePlayerData()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running || finished) return

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          setFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [running, finished])

  const handleStart = () => {
    setRunning(true)
  }

  const handleFinish = () => {
    addXP(40) // XP vergeben
  }

  const progress = 1 - timeLeft / duration
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <p className="text-center text-lg">{text}</p>

      {!running && !finished && (
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          Starten
        </button>
      )}

      {running && (
        <svg className="w-32 h-32" viewBox="0 0 100 100">
          <circle
            className="text-gray-300"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="text-blue-500"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      )}

      {finished && (
        <button
          onClick={handleFinish}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
        >
          Abschließen
        </button>
      )}
    </div>
  )
}
