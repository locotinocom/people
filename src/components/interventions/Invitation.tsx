import { useState, useEffect } from "react"

type Props = {
  title?: string
  message: string
  yesText?: string
  noText?: string
  xp?: number
  onComplete: (cancelled?: boolean) => void
}

export default function Invitation({
  title = "Einladung",
  message,
  yesText = "Ja, gerne 🧘‍♀️",
  noText = "Vielleicht später",
  xp,
  onComplete,
}: Props) {
  const [declined, setDeclined] = useState(false)

  // Reset bei Mount (wenn man zurückswipet)
  useEffect(() => {
    setDeclined(false)
    if (import.meta.env.DEV) console.log("♻️ Invitation reset bei Mount")
  }, [])

  useEffect(() => {
    if (!declined) return
    if (import.meta.env.DEV) console.log("🙅 Nutzer hat Einladung abgelehnt")

    // Sofort vertikales Swipen aktivieren
    const outerSwiper = document.querySelector(".swiper-initialized.swiper-vertical") as any
    const unlock = () => {
      if (outerSwiper?.swiper && !outerSwiper.swiper.allowTouchMove) {
        outerSwiper.swiper.allowTouchMove = true
        if (import.meta.env.DEV) console.log("🔓 Swipe fix erneut gesetzt (Watcher aktiv)")
      }
    }

    unlock()
    const watch = setInterval(unlock, 1000) // alle Sekunde checken (Remount fix)

    const cleanup = setTimeout(() => {
      onComplete(true)
      if (import.meta.env.DEV) console.log("🏁 Invitation beendet → MultiStep abgebrochen")
    }, 1200)

    return () => {
      clearTimeout(cleanup)
      clearInterval(watch)
    }
  }, [declined, onComplete])

  // Anzeige nach Ablehnung
  if (declined) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Alles klar 👍</h2>
        <p className="text-lg mb-4 max-w-sm">
          Kein Problem – du kannst die Übung später jederzeit machen.
        </p>
        <p className="text-sm text-gray-400">(Du kannst jetzt weiterswipen)</p>
      </div>
    )
  }

  // Normale Anzeige
  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-lg mb-8 max-w-sm">{message}</p>

      <div className="flex gap-4">
        <button
          onClick={() => onComplete(false)}
          className="px-6 py-3 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500"
        >
          {yesText}
        </button>

        <button
          onClick={() => setDeclined(true)}
          className="px-6 py-3 bg-gray-600 rounded-lg text-white font-bold hover:bg-gray-500"
        >
          {noText}
        </button>
      </div>

      {typeof xp === "number" && xp > 0 && (
        <p className="mt-4 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
