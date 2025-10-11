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
    <div className="flex flex-row r h-full p-10 gap-0">
      {/* 🧍‍♂️ Linke Spalte: Avatar */}
      <div className="flex-shrink-0 w-45 h-120 flex items-center justify-center">
        <AvatarRender
          name={rawName}
          emotion="happy"
          pose="relaxed"
          camera={camera}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 🗣️ Rechte Spalte: Inhalt */}
      <div className="flex flex-col text-left max-w-md mt-10 space-y-6 pt-12">
        <h2 className="text-2xl font-bold text-white">{title}</h2>

        <p className="text-gray-300 leading-relaxed whitespace-pre-line p-5">
          {message.replace(/\{\{avatarName\}\}/g, avatarName)}
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
    console.log("✅ SimpleAction onComplete triggered")
    onComplete()
  }}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white text-lg transition"
          >
            {buttonText}
          </button>
        </div>

        {xp > 0 && (
          <p className="text-sm text-gray-400 pt-1">
            Aufgabe erledigen bringt +{xp} XP
          </p>
        )}
      </div>
    </div>
  )
}
