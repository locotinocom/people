import { useEffect, useState } from "react"

type Props = {
  xp: number
  /** Wird beim Mount der Success-Slide aufgerufen (für XP-Animation/Reward). */
  onReady?: () => void
}

const messages = [
  "Cool, du hast es geschafft! 🎉",
  "Stark, weiter so! 💪",
  "Yes! Wieder ein Schritt weiter 🚀",
  "Super gemacht, du bist auf Kurs 🌟",
]

export default function InterventionSuccess({ xp, onReady }: Props) {
  // fixiere Nachricht einmalig beim Mount
  const [msg] = useState(() => messages[Math.floor(Math.random() * messages.length)])

  useEffect(() => {
    onReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
