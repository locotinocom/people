import presets from "../assets/avatars/presets/all_presets.json"

type Emotion =
  | keyof typeof presets
  | "lol_default"
  | "sad_default"
  | "scared_default"
  | "rage_default"

type Camera = "portrait" | "fullbody" | "head"
type Pose = "power-stance" | "relaxed" | "standing" | "thumbs-up"

//interface AvatarOptions {
  //size?: number
  //camera?: Camera
  //pose?: Pose
//}

/**
 * Erzeugt eine Ready Player Me URL für einen Avatar mit Emotion, Pose, Kamera etc.
 */
export function showAvatarHelper(
  emotion: Emotion,
  pose: Pose = "standing",
  camera: Camera = "portrait",
  size: number = 512
): string {
  const avatarId = import.meta.env.VITE_RPM_PLAYGROUND_AVATAR_ID
  if (!avatarId) throw new Error("Avatar ID nicht gefunden")

  const emotionData = (presets as any)[emotion]?.["1"]

  // Falls kein Blendshape-Preset vorhanden → Default verwenden
  const blendParts: string[] = []
  if (emotionData) {
    for (const key in emotionData) {
      blendParts.push(`blendShapes[${key}]=${emotionData[key]}`)
    }
  } else {
    // z. B. bei *_default Emotionen (nur als symbolische API-Erweiterung)
    blendParts.push(`expression=${emotion.replace("_default", "")}`)
  }

  // Kamera-Typen vereinheitlichen
  const cameraMap: Record<Camera, string> = {
    portrait: "portrait",
    fullbody: "fullbody",
    head: "portrait" // eigenes CSS-Cropping möglich
  }

  const query = [
    ...blendParts,
    `camera=${cameraMap[camera]}`,
    `pose=${pose}`,
    `size=${size}`,
    
  ].join("&")

  return `https://models.readyplayer.me/${avatarId}.png?${query}`
}
