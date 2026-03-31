// src/utils/buildAvatar2DUrl.ts

export type RpmCamera = "portrait" | "fullbody" | "fit"
export type RpmPose = "standing" | "relaxed" | "thumbs-up" | "power-stance"
export type RpmExpression = "happy" | "lol" | "sad" | "scared" | "rage"

export type BuildAvatar2DUrlArgs = {
  avatarId: string
  pose?: RpmPose
  camera?: RpmCamera
  size?: number
  quality?: number
  background?: string
  expression?: RpmExpression
  blendShapes?: Record<string, number>
  /**
   * Cache-Bypass-Key.
   * MUSS sich ändern, wenn das Inventory geschlossen wird.
   */
  uat?: string
  /**
   * Beibehalten aus Kompatibilitätsgründen.
   * Hat faktisch keinen Einfluss auf RPM-Caching.
   */
  cacheControl?: "true" | "false"
}

export function buildAvatar2DUrl({
  avatarId,
  pose,
  camera,
  size,
  quality,
  background,
  expression,
  blendShapes,
  uat,
  cacheControl,
}: BuildAvatar2DUrlArgs): string {
  const params = new URLSearchParams()

  if (pose) params.set("pose", pose)
  if (camera) params.set("camera", camera)
  if (typeof size === "number") params.set("size", String(size))
  if (typeof quality === "number") params.set("quality", String(quality))
  if (background) params.set("background", background)

  if (expression) {
    params.set("expression", expression)
  } else if (blendShapes) {
    for (const [key, value] of Object.entries(blendShapes)) {
      params.set(`blendShapes[${key}]`, String(value))
    }
  }

  if (uat) {
    // Cache-Bypass (einziger wirksamer Mechanismus)
    params.set("uat", uat)

    // Beibehalten – funktional wirkungslos, aber kompatibel
    if (cacheControl) {
      params.set("cacheControl", cacheControl)
    }
  }

  const query = params.toString()
  return `https://models.readyplayer.me/${avatarId}.png${query ? `?${query}` : ""}`
}
