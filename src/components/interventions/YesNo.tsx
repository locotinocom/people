type Props = {
  title: string
  question: string
  yesText: string
  noText: string
  xp?: number
  onComplete: () => void
}

export default function YesNo({ title, question, yesText, noText, xp, onComplete }: Props) {
  return (
    <div className="flex overflow-hidden max-h-full  flex-col items-center gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
    
      <p>{question}</p>
      <div className="flex gap-4 mt-2">
        <button onClick={onComplete} className="px-6 py-3 bg-green-600 rounded-lg text-white font-bold">
          {yesText}
        </button>
        <button onClick={onComplete} className="px-6 py-3 bg-red-600 rounded-lg text-white font-bold">
          {noText}
        </button>
      </div>
      {typeof xp === "number" && <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>}
    </div>
  )
}
