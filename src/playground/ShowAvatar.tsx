import { useState } from "react"
import { showAvatarHelper } from "../helpers/showAvatarHelper"
import allPresets from "../assets/avatars/presets/all_presets.json"

export default function ShowAvatar() {
  // 💡 "allPresets" statt "presets"
  const [emotion, setEmotion] = useState<keyof typeof allPresets | "lol_default">("happy")
  const [pose, setPose] = useState<"standing" | "relaxed" | "thumbs-up" | "power-stance">("standing")
  const [camera, setCamera] = useState<"portrait" | "fullbody" | "head">("portrait")
  const [size, setSize] = useState<number>(512)

  // 💡 Korrekte Helper-Funktion verwenden
  const imageUrl = showAvatarHelper(emotion, pose, camera, size)

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold mb-2">🎭 Avatar Playground</h1>

      {/* --- Steuerung --- */}
      <div className="flex flex-wrap gap-4">
        {/* Emotion */}
        <div>
          <label className="block text-sm font-semibold mb-1">Emotion</label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value as keyof typeof allPresets)}
            className="border rounded px-2 py-1"
          >
            {Object.keys(allPresets).map((emo) => (
              <option key={emo} value={emo}>
                {emo}
              </option>
            ))}
            <option disabled>──────────</option>
            <option value="lol_default">lol_default</option>
            <option value="sad_default">sad_default</option>
            <option value="scared_default">scared_default</option>
            <option value="rage_default">rage_default</option>
          </select>
        </div>

        {/* Pose */}
        <div>
          <label className="block text-sm font-semibold mb-1">Pose</label>
          <select
            value={pose}
            onChange={(e) =>
              setPose(e.target.value as "standing" | "relaxed" | "thumbs-up" | "power-stance")
            }
            className="border rounded px-2 py-1"
          >
            <option value="standing">standing</option>
            <option value="relaxed">relaxed</option>
            <option value="thumbs-up">thumbs-up</option>
            <option value="power-stance">power-stance</option>
          </select>
        </div>

        {/* Camera */}
        <div>
          <label className="block text-sm font-semibold mb-1">Camera</label>
          <select
            value={camera}
            onChange={(e) => setCamera(e.target.value as "portrait" | "fullbody" | "head")}
            className="border rounded px-2 py-1"
          >
            <option value="portrait">portrait (head + shoulders)</option>
            <option value="fullbody">fullbody</option>
            <option value="head">head (cropped portrait)</option>
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-semibold mb-1">Size</label>
          <input
            type="number"
            min={64}
            max={1024}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      </div>

      {/* --- Bildanzeige --- */}
      <div className="mt-4 flex flex-col items-center gap-4">
        <img
          src={imageUrl}
          alt={emotion}
          className={`border rounded-2xl shadow-lg ${
            camera === "head" ? "object-cover object-top scale-125 w-64 h-64 overflow-hidden" : ""
          }`}
        />
        <code className="text-xs bg-gray-100 p-2 rounded max-w-full break-all">{imageUrl}</code>
      </div>
    </div>
  )
}
