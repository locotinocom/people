// src/components/interventions/ui/AvatarBubble.tsx
import clsx from "clsx"


type AvatarBubbleProps = {
  name?: string
  mood?: "neutral" | "happy" | "thinking"
  text: string
  avatarSize?: "small" | "medium" | "full"
}

const moodMap: Record<string, string> = {
  neutral: "/avatars/avatar-neutral.png",
  happy: "/avatars/avatar-happy.png",
  thinking: "/avatars/avatar-thinking.png",
}

export default function AvatarBubble({
  name,
  mood = "neutral",
  text,
  avatarSize = "small",
}: AvatarBubbleProps) {
  const imgSrc = moodMap[mood] || moodMap.neutral

  return (
    <div className="flex items-start gap-3 my-4">
      <img
        src={imgSrc}
        alt={name || "Avatar"}
        className={clsx(
          "rounded-full",
          avatarSize === "small" && "w-12 h-12",
          avatarSize === "medium" && "w-20 h-20",
          avatarSize === "full" && "w-40 h-40"
        )}
      />
      <div className="bg-white shadow-md rounded-2xl px-4 py-2 max-w-[70%]">
        <p className="text-sm text-gray-800">{text}</p>
      </div>
    </div>
  )
}
