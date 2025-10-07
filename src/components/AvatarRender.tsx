import { useEffect, useState } from "react"

type Emotion =
  | "neutral"
  | "happy"
  | "sad"
  | "anger"
  | "fear"
  | "guilt"
  | "shame"
  | "disgust"
  | "surprise"
  | "thinking"
  | "happy_default"
    | "sad_default"
    | "scared_default"
    | "rage_default"
    | "lol_default"

type Pose = "standing" | "relaxed" | "thumbs-up" | "power-stance"
type Camera = "portrait" | "fullbody" | "head"

type Props = {
  name?: string
  emotion?: Emotion
  pose?: Pose
  camera?: Camera
  size?: number
  className?: string
}

export default function AvatarRender({
  name,
  emotion = "neutral",
  pose = "standing",
  camera = "portrait",
  size,
  className = "",
}: Props) {
  const [avatarName, setAvatarName] = useState<string>("")

  useEffect(() => {
    if (name) setAvatarName(name)
    else {
      const saved = localStorage.getItem("avatarName") || "tim"
      setAvatarName(saved)
    }
  }, [name])

  if (!avatarName) return null

  const actualCamera = camera === "head" ? "portrait" : camera
  const fileName = `${emotion}_${pose}_${actualCamera}.png`
  const src = `/avatar_cache/${avatarName}/${fileName}`

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-900 flex items-center justify-center ${className}`}
      style={{
        width: size ? `${size}px` : "100%",
        height: "100%", // nimmt die Höhe des Eltern-Containers ein
      }}
    >
      <img
        src={src}
        alt={`${avatarName} ${emotion} ${pose} ${camera}`}
        className="w-full h-full object-cover"
        style={{ objectPosition: "center" }}
        onError={(e) => {
          console.warn("⚠️ Avatar nicht gefunden:", src)
          e.currentTarget.style.opacity = "0.3"
        }}
      />
    </div>
  )
}
