import { useEffect } from "react"

type Props = {
  xp: number
  onReady?: () => void
  onComplete?: () => void // optionaler Fallback
}

export default function InterventionSuccess({ xp, onReady, onComplete }: Props) {
  useEffect(() => {
    const cb = onReady ?? onComplete
    const t = setTimeout(() => cb?.(), 200)
    return () => clearTimeout(t)
  }, [onReady, onComplete])

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h2 className="text-xl font-bold mb-4">Geschafft!</h2>
      <p className="text-lg text-yellow-400 font-semibold mb-6">
        Belohnung: +{xp} XP
      </p>
      <p className="text-sm text-gray-400">
        ⬆️ Swipe nach oben, um deine Reise fortzusetzen
      </p>
    </div>
  )
}
