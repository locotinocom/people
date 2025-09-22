type Props = {
  title: string
  xp?: number
  onComplete: () => void
  emotions?: string[]
}

export default function EmotionPicker({
  title,
  xp,
  onComplete,
  emotions = ["😊", "😡", "😢", "😱", "🤔", "❤️"],
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {emotions.map((emo) => (
          <button
            key={emo}
            onClick={onComplete}
            className="text-3xl hover:scale-110 transition-transform"
          >
            {emo}
          </button>
        ))}
      </div>
      {typeof xp === "number" && (
        <p className="mt-2 text-sm text-gray-400">Erledigen bringt +{xp} XP</p>
      )}
    </div>
  )
}
