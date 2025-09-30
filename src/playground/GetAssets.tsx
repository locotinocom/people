// src/playground/GetAssets.tsx
import { useEffect, useState } from "react"

type Asset = {
  id: string
  name: string
  type: string
  gender: string
  iconUrl?: string
}

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

const genders = ["male", "female", "neutral"]

export default function GetAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Auswahl direkt aus localStorage initialisieren
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("selectedAssets")
    return saved ? JSON.parse(saved) : {}
  })

  // Jede Änderung sofort speichern
  useEffect(() => {
    localStorage.setItem("selectedAssets", JSON.stringify(selected))
  }, [selected])

  // Auswahl toggeln
  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Download JSON-Datei (inkl. iconUrl, gruppiert nach type)
  const downloadJSON = () => {
    const selectedList = assets.filter((a) => selected[a.id])

    // Gruppierung nach type
    const grouped: Record<string, any[]> = {}
    selectedList.forEach((a) => {
      if (!grouped[a.type]) grouped[a.type] = []
      grouped[a.type].push({
        id: a.id,
        name: a.name,
        type: a.type,
        gender: a.gender,
        iconUrl: a.iconUrl,
        selected: true,
      })
    })

    // Sortierung pro Kategorie nach Name
    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    })

    const dataStr = JSON.stringify(grouped, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "selected-assets.json"
    a.click()

    URL.revokeObjectURL(url)
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

  // Alle Assets für alle Genders & Kategorien laden
  const fetchAllAssets = async (token: string) => {
    let all: Asset[] = []

    for (const gender of genders) {
      for (const category of categories) {
        let page = 1
        let hasNext = true

        while (hasNext) {
          const res = await fetch(
            `https://api.readyplayer.me/v1/assets?gender=${gender}&filter=usable-by-user-and-app&filterApplicationId=${
              import.meta.env.VITE_RPM_APP_ID
            }&filterUserId=${import.meta.env.VITE_RPM_USER_ID}&type=${category}&limit=100&page=${page}`,
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
      }
    }
    return all
  }

  // Assets einmalig laden
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const token = await createUser()
        const loaded = await fetchAllAssets(token)
        setAssets(loaded)
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
      <h1 className="text-2xl font-bold mb-4">
        Assets – Insgesamt: {assets.length} – Ausgewählt:{" "}
        {Object.values(selected).filter(Boolean).length}
      </h1>

      {/* Download Button */}
      <button
        onClick={downloadJSON}
        className="mb-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
      >
        Auswahl herunterladen (JSON)
      </button>

      {/* Asset Grid */}
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {assets.map((a) => (
          <li
            key={a.id}
            onClick={() => toggleSelect(a.id)}
            className={`border rounded-lg p-2 flex flex-col items-center cursor-pointer ${
              selected[a.id]
                ? "border-blue-500 bg-blue-900/30"
                : "border-gray-700"
            }`}
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
            <p className="text-[10px] text-gray-600">{a.id}</p>

            <input
              type="checkbox"
              checked={!!selected[a.id]}
              onChange={() => toggleSelect(a.id)}
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
