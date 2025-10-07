import { usePlayerData } from "../../hooks/usePlayerData"

type Props = {
  questionId: number
}

export default function GenderPicker({ questionId }: Props) {
  const { saveAnswer, getAnswer, addXP } = usePlayerData()
  const current = getAnswer(questionId)

  const handleSelect = (value: string) => {
    saveAnswer(questionId, value)
    addXP(5) // z. B. 5 XP für Geschlecht-Auswahl
  }

  const options = [
    { value: "male", label: "Männlich" },
    { value: "female", label: "Weiblich" },
    { value: "diverse", label: "Divers" },
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold">Welches Geschlecht hast du?</h3>
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`px-4 py-2 rounded ${
              current === opt.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-700 hover:bg-zinc-600 text-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
