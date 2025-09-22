// src/playground/AvatarCustomizer.tsx
import React, { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"

type Avatar = {
  id: string
  glb: string
}

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} scale={1.6} />
}

export default function AvatarCustomizer() {
  const [token, setToken] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [loading, setLoading] = useState(true)

  // User erstellen
  const createUser = async () => {
    const res = await fetch(
      `https://${import.meta.env.VITE_RPM_APP_SUBDOMAIN}.readyplayer.me/api/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { applicationId: import.meta.env.VITE_RPM_APP_ID },
        }),
      }
    )
    const data = await res.json()
    return data.data.token as string
  }

  // Female Template holen
  const getFemaleTemplate = async (token: string) => {
    const res = await fetch("https://api.readyplayer.me/v2/avatars/templates", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return data.data.find((tpl: any) => tpl.gender === "female")
  }

  // Draft Avatar erstellen
  const createDraftAvatar = async (token: string, templateId: string) => {
    const res = await fetch(
      `https://api.readyplayer.me/v2/avatars/templates/${templateId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { partner: import.meta.env.VITE_RPM_APP_SUBDOMAIN, bodyType: "fullbody" },
        }),
      }
    )
    const data = await res.json()
    return {
      id: data.data.id,
      glb: `https://api.readyplayer.me/v2/avatars/${data.data.id}.glb?preview=true`,
    }
  }

  // Avatar-Eigenschaft ändern
  const updateAvatar = async (prop: string, value: any) => {
    if (!token || !avatar) return
    await fetch(`https://api.readyplayer.me/v2/avatars/${avatar.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: { [prop]: value },
      }),
    })

    // GLB neu laden -> Cache umgehen mit zusätzlichem Param "t"
    setAvatar({
      ...avatar,
      glb: `https://api.readyplayer.me/v2/avatars/${avatar.id}.glb?preview=true&t=${Date.now()}`,
    })
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const t = await createUser()
        setToken(t)
        const female = await getFemaleTemplate(t)
        if (female) {
          const d = await createDraftAvatar(t, female.id)
          setAvatar(d)
        }
      } catch (err) {
        console.error("Avatar API Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        Lade Avatar...
      </div>
    )
  }

  if (!avatar) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-red-400">
        Kein weiblicher Avatar gefunden
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      {/* Avatar oben */}
      <div className="flex-1">
        <Canvas  camera={{ position: [0, 2.0, 4.5], fov:10 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} />
          <React.Suspense fallback={null}>
            <AvatarModel url={avatar.glb} />
          </React.Suspense>
          <OrbitControls target={[0, 2.5, 0]} enablePan={false} />
        </Canvas>
      </div>

      {/* Controls unten */}
      <div className="p-4 bg-gray-800 flex flex-col gap-4">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => updateAvatar("outfits.eyes.color", "blue")}
            className="px-3 py-1 bg-blue-600 rounded"
          >
            Blaue Augen
          </button>
          <button
            onClick={() => updateAvatar("outfits.eyes.color", "green")}
            className="px-3 py-1 bg-green-600 rounded"
          >
            Grüne Augen
          </button>
          <button
            onClick={() => updateAvatar("outfits.eyes.color", "brown")}
            className="px-3 py-1 bg-yellow-700 rounded"
          >
            Braune Augen
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => updateAvatar("outfits.hair.color", "black")}
            className="px-3 py-1 bg-gray-700 rounded"
          >
            Schwarze Haare
          </button>
          <button
            onClick={() => updateAvatar("outfits.hair.color", "blonde")}
            className="px-3 py-1 bg-yellow-500 text-black rounded"
          >
            Blonde Haare
          </button>
          <button
            onClick={() => updateAvatar("outfits.hair.color", "red")}
            className="px-3 py-1 bg-red-600 rounded"
          >
            Rote Haare
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => updateAvatar("outfits.glasses", "glasses_round")}
            className="px-3 py-1 bg-indigo-500 rounded"
          >
            Brille An
          </button>
          <button
            onClick={() => updateAvatar("outfits.glasses", null)}
            className="px-3 py-1 bg-gray-500 rounded"
          >
            Brille Aus
          </button>
        </div>

        <div className="flex flex-col items-center">
          <label className="mb-1">Haarlänge</label>
          <input
            type="range"
            min={0}
            max={5}
            defaultValue={2}
            onChange={(e) =>
              updateAvatar("outfits.hair.length", Number(e.target.value))
            }
            className="w-64"
          />
        </div>
      </div>
    </div>
  )
}
