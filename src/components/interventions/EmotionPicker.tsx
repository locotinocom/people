type Props = {
  emotions: string[]
}

export default function EmotionPicker({ emotions }: Props) {
  return (
<div className="h-full w-full flex flex-col items-center justify-center bg-green-200">
      <p>Wähle ein Gefühl:</p>
      <div className="flex gap-3 mt-4">
        {emotions.map((emo, i) => (
          <button key={i} className="px-3 py-2 bg-red-400 text-white rounded">
            {emo}
          </button>
        ))}
      </div>
    </div>
  )
}
