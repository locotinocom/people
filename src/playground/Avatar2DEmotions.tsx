import { useEffect, useState } from "react"
import allPresets from "../assets/avatars/presets/all_presets.json"

type Presets = Record<string, Record<string, Record<string, number>>>

export default function Avatar2DEmotions() {
  const [images, setImages] = useState<{ emotion: string; variant: string; url: string }[]>([])
  const avatarId = import.meta.env.VITE_RPM_PLAYGROUND_AVATAR_ID

  useEffect(() => {
    if (!avatarId) return
    const presets: Presets = allPresets as Presets

    const urls: { emotion: string; variant: string; url: string }[] = []

    // Alle Emotionen + Varianten iterieren
    Object.entries(presets).forEach(([emotion, variants]) => {
      Object.entries(variants).forEach(([variant, values]) => {
        // BlendShapes → Query-String umwandeln
        const parts: string[] = []
        for (const key in values) {
          parts.push(`blendShapes[${key}]=${values[key]}`)
        }
        const query = parts.join("&")

        // Beispiel: Portrait-Render, transparenter Hintergrund
        const url = `https://models.readyplayer.me/${avatarId}.png?${query}&pose=relaxed&size=512`

        urls.push({ emotion, variant, url })
      })
    })

    setImages(urls)
  }, [avatarId])

  if (!avatarId) return <div className="text-red-500 p-4">⚠️ Kein Avatar-ID gefunden</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">2D Avatar Emotion Renders</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map(({ emotion, variant, url }) => (
          <div
            key={`${emotion}-${variant}`}
            className="flex flex-col items-center p-3 bg-white rounded-2xl shadow"
          >
            <img
              src={url}
              alt={`${emotion} ${variant}`}
              className="rounded-xl border w-48 h-48 object-contain"
            />
            <p className="text-sm font-medium mt-2">
              {emotion} <span className="text-gray-400">({variant})</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
