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
  const [gender, setGender] = useState("neutral")
  const [category, setCategory] = useState("top")

  // Auswahl wird direkt aus localStorage initialisiert
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("selectedAssets")
    return saved ? JSON.parse(saved) : {}
  })

  // Jede Änderung sofort speichern
  useEffect(() => {
    localStorage.setItem("selectedAssets", JSON.stringify(selected))
    console.log("🔵 Speichere Auswahl:", selected)
  }, [selected])

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

  // Assets für Kategorie & Gender laden
  const fetchAssets = async (token: string, gender: string, category: string) => {
    let page = 1
    let hasNext = true
    let all: Asset[] = []

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

    return all
  }

  // Assets neu laden bei Gender/Kategorie-Wechsel
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const token = await createUser()
        const loaded = await fetchAssets(token, gender, category)
        setAssets(loaded)
      } catch (err) {
        console.error("Asset API Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [gender, category])

  // Auswahl toggeln
  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

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
        Assets: {category} ({gender}) – Ausgewählt:{" "}
        {Object.values(selected).filter(Boolean).length}
      </h1>

      {/* Gender Auswahl */}
      <div className="flex gap-2 mb-4">
        {genders.map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`px-3 py-1 rounded ${
              gender === g ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Kategorie Auswahl */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded ${
              category === c ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

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
              onClick={(e) => e.stopPropagation()} // verhindert Doppelklick
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
