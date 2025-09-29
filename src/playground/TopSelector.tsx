import React, { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        object?: any
      }
    }
  }
}

type Avatar = { id: string; glb: string }

type Asset = {
  id: string
  name: string
  type: string
  gender: string
  iconUrl?: string
}

function AvatarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, true)
  return <primitive object={scene} scale={1.6} />
}

export default function TopSelector() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [assets, setAssets] = useState<Record<string, Asset[]>>({})
  const [updating, setUpdating] = useState(false)
  const [activeAssets, setActiveAssets] = useState<Record<string, string>>({})

  const FIXED_AVATAR_ID = import.meta.env.VITE_RPM_FIXED_FEMALE_ID

  // Avatar neu laden (Cache-Buster)
  const reloadAvatar = () => {
    const newUrl = `https://models.readyplayer.me/${FIXED_AVATAR_ID}.glb?t=${Date.now()}`
    setAvatar({ id: FIXED_AVATAR_ID, glb: newUrl })
  }

  // Asset ausrüsten
  const equipAsset = async (assetId: string, type: string) => {
    try {
      setUpdating(true)
      const res = await fetch(
        `https://api.readyplayer.me/v1/avatars/${FIXED_AVATAR_ID}/equip`,
        {
          method: "PUT",
          headers: {
            "X-API-Key": import.meta.env.VITE_RPM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: { assetId } }),
        }
      )
      if (res.ok) {
        console.log("✅ Equipped:", assetId)
        setActiveAssets((prev) => ({ ...prev, [type]: assetId }))
        reloadAvatar()
      } else {
        console.error("❌ Equip failed:", res.status)
      }
    } finally {
      setUpdating(false)
    }
  }

  // Asset ablegen
  const unequipAsset = async (assetId: string, type: string) => {
    try {
      setUpdating(true)
      const res = await fetch(
        `https://api.readyplayer.me/v1/avatars/${FIXED_AVATAR_ID}/unequip`,
        {
          method: "PUT",
          headers: {
            "X-API-Key": import.meta.env.VITE_RPM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: { assetId } }),
        }
      )
      if (res.status === 204) {
        console.log("✅ Unequipped:", assetId)
        setActiveAssets((prev) => {
          const updated = { ...prev }
          delete updated[type]
          return updated
        })
        reloadAvatar()
      } else {
        console.error("❌ Unequip failed:", res.status)
      }
    } finally {
      setUpdating(false)
    }
  }

  // Assets holen für bestimmte Typen
  const fetchAssetsByType = async (type: string, token: string): Promise<Asset[]> => {
    const res = await fetch(
      `https://api.readyplayer.me/v1/assets?gender=neutral&filter=usable-by-user-and-app&filterApplicationId=${
        import.meta.env.VITE_RPM_APP_ID
      }&filterUserId=${import.meta.env.VITE_RPM_USER_ID}&type=${type}&limit=5&page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
        },
      }
    )
    const data = await res.json()
    return data.data || []
  }

  // User erstellen → Token
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

  useEffect(() => {
    const init = async () => {
      reloadAvatar()
      try {
        const token = await createUser()

        const categories = [
          "bottom",
          "glasses",
          "hair",
          "headwear",
          "outfit",
          "shirt",
          "top",
          "footwear",
        ]
        const result: Record<string, Asset[]> = {}

        for (const c of categories) {
          result[c] = await fetchAssetsByType(c, token)
        }

        setAssets(result)
      } catch (err) {
        console.error("Asset API Error:", err)
      }
    }
    init()
  }, [])

  if (!avatar) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        Kein Avatar
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white relative">
      {/* Avatar in 3D */}
      <div className="h-2/3">
        <Canvas camera={{ position: [0, 2.0, 4.5], fov: 12 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} />
          <React.Suspense fallback={null}>
            <AvatarModel key={avatar.glb} url={avatar.glb} />
          </React.Suspense>
          <OrbitControls target={[0, 2.0, 0]} enablePan={false} />
        </Canvas>
      </div>

      {/* Asset-Auswahl */}
      <div className="h-1/3 p-4 bg-gray-800 overflow-y-auto max-h-[60vh] space-y-6">
        {Object.entries(assets).map(([type, list]) => (
          <div key={type}>
            <h2 className="text-lg font-bold mb-2 capitalize flex justify-between items-center">
              {type}
              {activeAssets[type] && (
                <button
                  onClick={() => unequipAsset(activeAssets[type], type)}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                >
                  Ablegen
                </button>
              )}
            </h2>
            <div className="flex gap-4 overflow-x-auto">
              {list.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => equipAsset(asset.id, type)}
                  className="flex flex-col items-center min-w-[90px]"
                >
                  {asset.iconUrl && (
                    <img
                      src={asset.iconUrl}
                      alt={asset.name}
                      className="w-20 h-20 object-contain border border-gray-700 rounded-lg hover:border-blue-500"
                    />
                  )}
                  <span className="text-xs mt-1">{asset.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Overlay */}
      {updating && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
          Avatar wird aktualisiert…
        </div>
      )}
    </div>
  )
}
