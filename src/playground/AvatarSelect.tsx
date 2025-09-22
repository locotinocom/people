import React, { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"

type Template = {
  id: string
  gender: string
  imageUrl: string
}

type Avatar = {
  id: string
  glb: string
  gender: string
}

// Loader für GLB
function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} scale={1} />
}

export default function FemaleAvatarFull() {
  const [token, setToken] = useState<string | null>(null)
  const [draft, setDraft] = useState<Avatar | null>(null)
  const [loading, setLoading] = useState(true)

  // User erstellen
  const createUser = async () => {
    const res = await fetch(
      `https://${import.meta.env.VITE_RPM_APP_SUBDOMAIN}.readyplayer.me/api/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            applicationId: import.meta.env.VITE_RPM_APP_ID,
          },
        }),
      }
    )
    const data = await res.json()
    return data.data.token as string
  }

  // Templates holen
  const getTemplates = async (token: string) => {
    const res = await fetch("https://api.readyplayer.me/v2/avatars/templates", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return data.data as Template[]
  }

  // Draft erstellen
  const createDraftAvatar = async (token: string, template: Template) => {
    const res = await fetch(
      `https://api.readyplayer.me/v2/avatars/templates/${template.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            partner: import.meta.env.VITE_RPM_APP_SUBDOMAIN,
            bodyType: "fullbody",
          },
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Draft creation failed: ${res.status} ${errorText}`)
    }

    const data = await res.json()
    return {
      id: data.data.id,
      glb: `https://api.readyplayer.me/v2/avatars/${data.data.id}.glb?preview=true`,
      gender: template.gender,
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const t = await createUser()
        setToken(t)

        const all = await getTemplates(t)
        const female = all.find((tpl) => tpl.gender === "female")
        if (female) {
          const d = await createDraftAvatar(t, female)
          setDraft(d)
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

  if (!draft) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-red-400">
        Kein weiblicher Avatar gefunden
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gray-900">
      <Canvas camera={{ position: [0, 1.6, 2.5], fov: 20 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} />
        <React.Suspense fallback={null}>
          <AvatarModel url={draft.glb} />
        </React.Suspense>
        <OrbitControls
          target={[0, 1.4, 0]}
          enablePan={false}
          minDistance={1.8}
          maxDistance={3.5}
        />
      </Canvas>
    </div>
  )
}
