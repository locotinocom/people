type Props = {
  scaleMin: number
  scaleMax: number
}

export default function BeforeAfterScale({ scaleMin, scaleMax }: Props) {
  const range = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => i + scaleMin)

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-orange-200">
      <p className="text-lg font-semibold mb-6">Wie stark fühlst du dich?</p>
      <div className="flex flex-wrap justify-center gap-3">
        {range.map((num) => (
          <button
            key={num}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg shadow"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}
