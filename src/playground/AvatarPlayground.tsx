import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { useEffect, useState } from "react"

// Avatar Model
function AvatarModel({
  url,
  blendShapes,
  onTargetsLoaded,
}: {
  url: string
  blendShapes: Record<string, number>
  onTargetsLoaded: (keys: string[]) => void
}) {
  const { scene } = useGLTF(url)

useEffect(() => {
  const allTargets: string[] = []

  scene.traverse((obj: any) => {
    if (obj.isMesh && obj.morphTargetDictionary) {
      const keys = Object.keys(obj.morphTargetDictionary)
      console.group(`🎭 MorphTargets von ${obj.name}`)
      console.log(keys)
      console.groupEnd()
      allTargets.push(...keys)
    }
  })

  const unique = Array.from(new Set(allTargets))
  console.log("✅ Alle gefundenen Morph Targets:", unique)
  onTargetsLoaded(unique)
}, [scene, onTargetsLoaded])


  useFrame(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh && obj.morphTargetDictionary) {
        for (const key in blendShapes) {
          const index = obj.morphTargetDictionary[key]
          if (index !== undefined) {
            obj.morphTargetInfluences[index] = blendShapes[key]
          }
        }
      }
    })
  })

  return <primitive object={scene} scale={1.5} />
}

export default function AvatarPlayground() {
  const [blendShapes, setBlendShapes] = useState<Record<string, number>>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [morphTargets, setMorphTargets] = useState<string[]>([])
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)

  useEffect(() => {
    const avatarId = import.meta.env.VITE_RPM_PLAYGROUND_AVATAR_ID
    if (avatarId) {
      setAvatarUrl(`https://models.readyplayer.me/${avatarId}.glb?morphTargets=ARKit`)
    }
  }, [])

  const handleChange = (key: string, value: number) => {
    setBlendShapes({ ...blendShapes, [key]: value })
  }

  const applyPreset = (preset: keyof typeof presets) => {
    if (!presets[preset]) return
    const reset: Record<string, number> = {}
    morphTargets.forEach((k) => (reset[k] = 0)) // alles zurücksetzen
    setBlendShapes({ ...reset, ...presets[preset] })
  }

  const downloadPreset = () => {
    const filtered: Record<string, number> = {}
    for (const key in blendShapes) {
      if (blendShapes[key] !== 0) {
        filtered[key] = blendShapes[key]
      }
    }

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2))
    const link = document.createElement("a")
    link.href = dataStr
    link.download = "avatar-preset.json"
    link.click()
  }

 const render2DAvatar = () => {
  const avatarId = import.meta.env.VITE_RPM_PLAYGROUND_AVATAR_ID
  if (!avatarId) return

  // Query manuell bauen → echte [] bleiben erhalten
  const parts: string[] = []
  for (const key in blendShapes) {
    if (blendShapes[key] !== 0) {
      parts.push(`blendShapes[${key}]=${blendShapes[key]}`)
    }
  }

  const query = parts.join("&")
  const url = `https://models.readyplayer.me/${avatarId}.png?morphTargets=ARKit&${query}`
  setSnapshotUrl(url)
}

  const downloadSnapshot = () => {
    if (!snapshotUrl) return
    const link = document.createElement("a")
    link.href = snapshotUrl
    link.download = "avatar-snapshot.png"
    link.click()
  }

  return (
    <div className="flex gap-4 h-screen">
      {/* Avatar */}
      <div className="flex-1 h-full bg-gray-100">
        {avatarUrl && (
          <Canvas camera={{ position: [0, 3, 3.8], fov: 10 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 4, 5]} />
            <OrbitControls target={[0, 2.2, 0]} minDistance={2} maxDistance={6} enablePan={false} />
            <AvatarModel
              url={avatarUrl}
              blendShapes={blendShapes}
              onTargetsLoaded={(keys) => {
                setMorphTargets(keys)
                if (Object.keys(blendShapes).length === 0) {
                  const init: Record<string, number> = {}
                  keys.forEach((k) => (init[k] = 0))
                  setBlendShapes(init)
                }
              }}
            />
          </Canvas>
        )}
      </div>

      {/* UI */}
      <div className="w-72 overflow-y-auto h-[600px] bg-white p-3 shadow-md rounded">
        <h2 className="font-bold mb-2">Presets</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(presets).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p as keyof typeof presets)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={downloadPreset}
          className="mb-2 px-3 py-1 bg-indigo-500 text-white rounded"
        >
          Download JSON
        </button>

        <button
          onClick={render2DAvatar}
          className="mb-2 px-3 py-1 bg-pink-500 text-white rounded"
        >
          2D Avatar rendern
        </button>

        {snapshotUrl && (
          <div className="mt-4">
            <img src={snapshotUrl} alt="2D Avatar Snapshot" className="w-full border rounded" />
            <button
              onClick={downloadSnapshot}
              className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
            >
              PNG Download
            </button>
          </div>
        )}

        <h2 className="font-bold mt-4 mb-2">Regler</h2>

{Object.entries(
  morphTargets.reduce((groups: Record<string, string[]>, key) => {
    const lower = key.toLowerCase()

    if (lower.includes("eye") || lower.includes("blink") || lower.includes("squint")) {
      groups["👁️ Augen"] = [...(groups["👁️ Augen"] || []), key]
    } else if (lower.includes("mouth") || lower.includes("lip") || lower.includes("jaw")) {
      groups["👄 Mund"] = [...(groups["👄 Mund"] || []), key]
    } else if (lower.includes("brow") || lower.includes("eyebrow")) {
      groups["🪄 Augenbrauen"] = [...(groups["🪄 Augenbrauen"] || []), key]
    } else if (lower.includes("cheek") || lower.includes("nose")) {
      groups["😳 Wangen / Nase"] = [...(groups["😳 Wangen / Nase"] || []), key]
    } else {
      groups["✨ Sonstige"] = [...(groups["✨ Sonstige"] || []), key]
    }

    return groups
  }, {})
).map(([category, keys]) => (
  <div key={category} className="mb-4">
    <h3 className="font-semibold text-sm mb-1">{category}</h3>
    {keys.map((key) => (
      <div key={key} className="mb-1">
        <label className="block text-xs">{key}</label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={blendShapes[key] || 0}
          onChange={(e) => handleChange(key, parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    ))}
  </div>
))}

      </div>
    </div>
  )
}

const presets = {
  neutral: {
    eyeSquintLeft: 0,
    eyeSquintRight: 0,
    mouthSmileLeft: 0,
    mouthSmileRight: 0,
    browInnerUp: 0,
    jawOpen: 0,
  },
  happy: {
    mouthSmileLeft: 0.9,
    mouthSmileRight: 0.9,
    cheekPuff: 0.5,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    browInnerUp: 0.2,
  },
  sad: {
    browInnerUp: 0.7,
    mouthFrownLeft: 0.8,
    mouthFrownRight: 0.8,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    mouthFrownLeft: 0.7,
    mouthFrownRight: 0.7,
    jawOpen: 0.3,
  },
  fear: {
    eyeWideLeft: 0.9,
    eyeWideRight: 0.9,
    browInnerUp: 0.8,
    jawOpen: 0.7,
    mouthFrownLeft: 0.3,
    mouthFrownRight: 0.3,
  },
  surprise: {
    eyeWideLeft: 1,
    eyeWideRight: 1,
    browOuterUpLeft: 0.8,
    browOuterUpRight: 0.8,
    jawOpen: 0.8,
  },
  disgust: {
    noseSneerLeft: 0.8,
    noseSneerRight: 0.8,
    upperLipRaiseLeft: 0.6,
    upperLipRaiseRight: 0.6,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  shame: {
    browInnerUp: 0.5,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    mouthFrownLeft: 0.4,
    mouthFrownRight: 0.4,
    // optional: Kopf leicht nach unten neigen (wenn Bone-Steuerung später dazukommt)
  },
  guilt: {
    browInnerUp: 0.6,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    mouthFrownLeft: 0.4,
    mouthFrownRight: 0.4,
    jawOpen: 0.2,
  },
}
