import { usePlayerData } from "../../hooks/usePlayerData"

type Props = {
  questionId: number
}

export default function AgePicker({ questionId }: Props) {
  const { saveAnswer, getAnswer, addXP } = usePlayerData()
  const current = getAnswer(questionId)

  const handleSelect = (value: string) => {
    saveAnswer(questionId, value)
    addXP(10)
  }

  const options = ["unter 18", "18–25", "26–35", "36–50", "50+"]

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold">Wie alt bist du?</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((range) => (
          <button
            key={range}
            onClick={() => handleSelect(range)}
            className={`px-4 py-2 rounded ${
              current === range ? "bg-blue-600 text-white" : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
