import React, { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"

type Avatar = {
  id: string
  glb: string
}

type Asset = {
  id: string
  name: string
  iconUrl: string
  type: string
  gender: string
}

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} scale={1.6} />
}

export default function TopSelector() {
  const [token, setToken] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

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

  // Tops laden – Beispiel: alle "top"-Assets für female
const fetchSelectedTops = async (token: string) => {
  const res = await fetch(
    `https://api.readyplayer.me/v1/assets?filter=usable-by-user-and-app&filterApplicationId=${import.meta.env.VITE_RPM_APP_ID}&filterUserId=${import.meta.env.VITE_RPM_USER_ID}&type=top&limit=10&page=1&order=name`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
      },
    }
  )

  const data = await res.json()

  if (!data.data) {
    console.error("Keine Assets gefunden:", data)
    return []
  }

  console.log("Usable female outfits (Limit 10):", data.data)
  return data.data as Asset[]
}


  // Avatar Asset ausrüsten (dynamisch nach type)
// Avatar Asset ausrüsten (dynamisch nach type)
const equipAsset = async (asset: Asset) => {
  if (!token || !avatar) return
  try {
    setUpdating(true)

    const res = await fetch(`https://api.readyplayer.me/v2/avatars/${avatar.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          assets: {
            [asset.type]: asset.id, // ✅ dynamisch nach type
          },
        },
      }),
    })

    const result = await res.json()
    console.log("EquipAsset Response:", result) // 👀 loggen was die API zurückgibt

    // Avatar neu laden (Cache-Buster mit Timestamp)
    setAvatar({
      ...avatar,
      glb: `https://api.readyplayer.me/v2/avatars/${avatar.id}.glb?preview=true&t=${Date.now()}`,
    })
  } catch (err) {
    console.error("EquipAsset Error:", err)
  } finally {
    setUpdating(false)
  }
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

        const tops = await fetchSelectedTops(t)
        setAssets(tops)
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
        Lade Avatar & Assets...
      </div>
    )
  }

  if (!avatar) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-red-400">
        Kein Avatar gefunden
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white relative">
      {/* Avatar oben */}
      <div className="flex-1">
        <Canvas camera={{ position: [0, 2.0, 4.5], fov: 12 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} />
          <React.Suspense fallback={null}>
            <AvatarModel url={avatar.glb} />
          </React.Suspense>
          <OrbitControls target={[0, 2.0, 0]} enablePan={false} />
        </Canvas>
      </div>

      {/* Asset-Auswahl unten */}
      <div className="p-4 bg-gray-800 flex gap-4 overflow-x-auto">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => equipAsset(asset)}
            className="flex flex-col items-center min-w-[90px]"
          >
            <img
              src={asset.iconUrl}
              alt={asset.name}
              className="w-20 h-20 object-contain border border-gray-700 rounded-lg hover:border-blue-500"
            />
            <span className="text-xs mt-1">{asset.name}</span>
          </button>
        ))}
      </div>

      {/* Overlay beim Updaten */}
      {updating && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
          Avatar wird aktualisiert...
        </div>
      )}
    </div>
  )
}
