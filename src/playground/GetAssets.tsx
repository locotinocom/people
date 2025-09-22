    // src/playground/GetAssets.tsx
import React, { useEffect, useState } from "react"

type Asset = {
  id: string
  name: string
  type: string
  gender: string
  iconUrl?: string
  modelUrl?: string
}

export default function GetAssets() {
  const [token, setToken] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // 1. User erstellen, um Token zu bekommen
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

  // 2. Alle Assets laden (mit Pagination)
const fetchAllAssets = async (token: string) => {
  let page = 1
  let hasNext = true
  let all: Asset[] = []

  while (hasNext) {
    const res = await fetch(
      `https://api.readyplayer.me/v1/assets?gender=female&filter=usable-by-user-and-app&filterApplicationId=68ccff54ab3583906cbead0e&filterUserId=68d16790480c285f8e5d61b1&type=top&limit=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
        },
      }
    )

    const data = await res.json()
    if (!data.data) break

    all = all.concat(data.data)
    hasNext = data.pagination?.hasNextPage
    page++
  }

  console.log("Alle Assets geladen:", all)
  return all
}



  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const t = await createUser()
        setToken(t)
        const allAssets = await fetchAllAssets(t)
        setAssets(allAssets)
        console.log("Alle Assets geladen:", allAssets)
      } catch (err) {
        console.error("Asset API Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        Lade Assets...
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-y-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Assets ({assets.length})</h1>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {assets.map((a) => (
          <li
            key={a.id}
            className="border border-gray-700 rounded-lg p-2 flex flex-col items-center"
          >
            {a.iconUrl && (
              <img
                src={a.iconUrl}
                alt={a.name}
                className="w-24 h-24 object-contain mb-2"
              />
            )}
            <p className="text-sm font-semibold">{a.name}</p>
            <p className="text-xs text-gray-400">{a.type}</p>
            <p className="text-xs text-gray-500">{a.gender}</p>
             <p className="text-xs text-gray-500">{a.id}</p>
            
          </li>
        ))}
      </ul>
    </div>
  )
}
