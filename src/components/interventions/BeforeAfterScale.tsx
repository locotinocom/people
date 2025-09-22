type Props = {
  title: string
  xp?: number
  onComplete: () => void
  scaleMin: number
  scaleMax: number
}

export default function BeforeAfterScale({ title, xp, onComplete, scaleMin, scaleMax }: Props) {
  const range = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => i + scaleMin)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p>Wie stark fühlst du dich?</p>
      <div className="flex gap-2 mt-4">
        {range.map((num) => (
          <button
            key={num}
            onClick={onComplete}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {num}
          </button>
        ))}
      </div>
      {typeof xp === "number" && (
        <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
