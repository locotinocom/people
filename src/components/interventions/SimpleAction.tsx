import AvatarRender from "../AvatarRender"

type Props = {
  title: string
  message: string
  buttonText: string
  xp?: number
  onComplete: () => void
  camera?: "portrait" | "fullbody" | "head"
}

export default function SimpleAction({
  title,
  message,
  buttonText,
  xp = 5,
  onComplete,
  camera = "fullbody",
}: Props) {
  const rawName = localStorage.getItem("avatarName") || "dein Begleiter"
  const avatarName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 gap-6">
      {/* 🧭 Titel */}
      <h2 className="text-xl font-bold">{title}</h2>

      {/* 💬 Beschreibung */}
      <p className="text-gray-300 max-w-sm whitespace-pre-line">
        {message.replace(/\{\{avatarName\}\}/g, avatarName)}
      </p>

      {/* 👥 Avatar + Button nebeneinander */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="w-40 h-40">
          <AvatarRender
            name={rawName}
            emotion="happy"
            pose="standing"
            camera={camera}
            className="w-full h-full object-contain"
          />
        </div>

        <button
          onClick={onComplete}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white text-lg transition"
        >
          {buttonText}
        </button>
      </div>

      {/* ⭐ XP-Anzeige */}
      {xp > 0 && (
        <p className="text-sm text-gray-400 mt-2">
          Aufgabe erledigen bringt +{xp} XP
        </p>
      )}
    </div>
  )
}
