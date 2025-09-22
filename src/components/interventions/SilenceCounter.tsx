import { useEffect, useRef, useState } from "react"

type Props = {
  title: string
  xp?: number
  onComplete: () => void
  duration?: number
  instruction?: string
}

export default function SilenceCounter({ title, xp, onComplete, duration = 5, instruction }: Props) {
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!started) return
    if (timeLeft <= 0) { onComplete(); return }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [started, timeLeft, onComplete])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      {instruction && <p className="text-sm text-gray-300">{instruction}</p>}

      {!started ? (
        <button onClick={() => { if (!startedRef.current) { startedRef.current = true; setStarted(true) } }}
          className="px-5 py-2 rounded bg-zinc-700 hover:bg-zinc-600">
          Start
        </button>
      ) : (
        <p className="text-2xl font-mono">{timeLeft} s</p>
      )}

      {typeof xp === "number" && <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>}
    </div>
  )
}
