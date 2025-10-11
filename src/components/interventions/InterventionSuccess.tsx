import { useEffect, useState } from "react"

type Props = {
  xp: number
  onReady?: () => void
  // 👇 optional für Kompatibilität, falls irgendwo noch onComplete gereicht wird
  onComplete?: () => void
}

export default function InterventionSuccess({ xp, onReady, onComplete }: Props) {
  const [msg, setMsg] = useState("")

  useEffect(() => {
    // … deine Message-Logik …

    // Wichtig: Callback sicher auslösen (kleines Delay, damit der Slide-Wechsel stabil ist)
    const cb = onReady ?? onComplete
    const t = setTimeout(() => cb?.(), 200)
    return () => clearTimeout(t)
  }, [onReady, onComplete])

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h2 className="text-xl font-bold mb-4">{msg}</h2>
      <p className="text-lg text-yellow-400 font-semibold mb-6">
        Belohnung: +{xp} XP
      </p>
      <p className="text-sm text-gray-400">
        ⬆️ Swipe nach oben, um deine Reise fortzusetzen
      </p>
    </div>
  )
}
