// src/playground/GetAvatarTemplates.tsx
import { useEffect, useState } from "react"

type AvatarTemplate = {
  id: string
  imageUrl: string
  gender: string
  usageType: string
}

export default function GetAvatarTemplates() {
  const [templates, setTemplates] = useState<AvatarTemplate[]>([])
  const [loading, setLoading] = useState(true)

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

  const fetchTemplates = async (token: string) => {
    const res = await fetch("https://api.readyplayer.me/v2/avatars/templates", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
      },
    })
    const data = await res.json()
    return data.data as AvatarTemplate[]
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const token = await createUser()
        const loaded = await fetchTemplates(token)
        setTemplates(loaded)
      } catch (err) {
        console.error("Template API Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        Lade Templates...
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-y-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Avatar Templates – Insgesamt: {templates.length}
      </h1>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {templates.map((tpl) => (
          <li
            key={tpl.id}
            className="border rounded-lg p-4 flex flex-col items-center bg-zinc-800"
          >
            <img
              src={tpl.imageUrl}
              alt={tpl.gender}
              className="w-32 h-32 object-contain mb-2"
            />
            <p className="font-semibold capitalize">{tpl.gender}</p>
            <p className="text-sm text-gray-400">{tpl.usageType}</p>
            <p className="text-xs text-gray-500 break-all">{tpl.id}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
