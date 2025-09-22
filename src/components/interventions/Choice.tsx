import { useState, useMemo } from "react"
type ChoiceOption = { id: string; label: string } | string

type Props = {
  title: string
  xp?: number
  onComplete: () => void
  options: ChoiceOption[]
}

export default function Choice({ title, xp, onComplete, options }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const normalized = useMemo(
    () => options.map((o) => (typeof o === "string" ? { id: o, label: o } : o)),
    [options]
  )

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-lg text-gray-300">Wähle eine Option:</p>
      <div className="flex flex-wrap justify-center gap-3">
        {normalized.map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setSelected(opt.id); onComplete(); }}
            className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
              selected === opt.id ? "bg-blue-500 text-white border-blue-500 scale-105"
                                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {typeof xp === "number" && <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>}
    </div>
  )
}
