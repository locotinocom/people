// src/playground/GetAvatarPoses.tsx
import { useEffect, useState } from "react"

type RenderConfig = {
  url: string
  expression?: string
  pose?: string
}

const EVA_ID = import.meta.env.VITE_RPM_EVA
const TIM_ID = import.meta.env.VITE_RPM_TIM

// beliebige Listen (kannst du erweitern)
const expressions = ["happy", "lol", "sad", "scared", "rage"]
const poses = ["standing", "relaxed", "power-stance", "thumbs-up"]

export default function GetAvatarPoses() {
  const [evaRenders, setEvaRenders] = useState<RenderConfig[]>([])
  const [timRenders, setTimRenders] = useState<RenderConfig[]>([])

  useEffect(() => {
    const buildUrls = (id: string): RenderConfig[] => {
      const list: RenderConfig[] = []
      for (const expr of expressions) {
        for (const pose of poses) {
          list.push({
            url: `https://models.readyplayer.me/${id}.png?camera=fullbody&size=1024&expression=${expr}&pose=${pose}`,
            expression: expr,
            pose,
          })
        }
      }
      return list
    }

    setEvaRenders(buildUrls(EVA_ID))
    setTimRenders(buildUrls(TIM_ID))
  }, [])

  const renderGrid = (renders: RenderConfig[]) => (
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {renders.map((r) => (
        <li
          key={`${r.pose}-${r.expression}`}
          className="flex flex-col items-center bg-zinc-800 rounded-lg p-3"
        >
          <img
            src={r.url}
            alt={`${r.pose}-${r.expression}`}
            className="w-32 h-32 object-contain mb-2"
          />
          <p className="text-sm">{r.pose}</p>
          <p className="text-xs text-gray-400">{r.expression}</p>
          <a
            href={r.url}
            download={`${r.pose}-${r.expression}.png`}
            className="text-blue-400 text-xs mt-1"
          >
            Speichern
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-y-auto p-6 space-y-12">
      <div>
        <h1 className="text-xl font-bold mb-4">Eva – Posen & Emotionen</h1>
        {renderGrid(evaRenders)}
      </div>
      <div>
        <h1 className="text-xl font-bold mb-4">Tim – Posen & Emotionen</h1>
        {renderGrid(timRenders)}
      </div>
    </div>
  )
}
