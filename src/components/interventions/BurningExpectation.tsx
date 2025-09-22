import { useState } from "react"

type Props = {
  title: string
  xp?: number
  onComplete: () => void
}

export default function BurningExpectation({ title, xp, onComplete }: Props) {
  const [burnt, setBurnt] = useState(false)

  const handleBurn = () => {
    setBurnt(true)
    setTimeout(() => onComplete(), 1000) // kleine Verzögerung für Effekt
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <button
        onClick={handleBurn}
        className={`px-6 py-3 rounded-lg font-bold text-white transition-colors ${
          burnt ? "bg-red-700" : "bg-red-500 hover:bg-red-600"
        }`}
      >
        Erwartung verbrennen 🔥
      </button>
      {burnt && <p className="text-red-300 mt-2">💨 Weg mit ihr...</p>}
      {typeof xp === "number" && (
        <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
