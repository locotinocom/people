// src/playground/MakePermanentAvatars.tsx
import { useEffect, useState } from "react"

type Avatar = {
  id: string
}

const EVA_TEMPLATE_ID = "645cd15df23d0562d3f9d283"
const TIM_TEMPLATE_ID = "645cd12cf23d0562d3f9d27f"

export default function MakePermanentAvatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)

  // Step 1: Anonymous User erstellen → Token
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

  // Step 2: Draft aus Template erstellen
  const createDraft = async (token: string, templateId: string) => {
    const res = await fetch(
      `https://api.readyplayer.me/v2/avatars/templates/${templateId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
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
    const data = await res.json()
    return data.data.id as string // Draft-ID
  }

  // Step 3: Draft direkt permanent machen
  const makePermanent = async (token: string, draftId: string) => {
    const res = await fetch(`https://api.readyplayer.me/v2/avatars/${draftId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-APP-ID": import.meta.env.VITE_RPM_APP_ID,
      },
    })
    const data = await res.json()
    return data.data.id as string
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const token = await createUser()

        // Eva
        const evaDraftId = await createDraft(token, EVA_TEMPLATE_ID)
        const evaId = await makePermanent(token, evaDraftId)

        // Tim
        const timDraftId = await createDraft(token, TIM_TEMPLATE_ID)
        const timId = await makePermanent(token, timDraftId)

        setAvatars([{ id: evaId }, { id: timId }])

        console.log("Eva permanent ID:", evaId)
        console.log("Tim permanent ID:", timId)
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
        Lade Avatare...
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold mb-6">Fixe Avatare (Eva & Tim)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {avatars.map((av, index) => (
          <div
            key={av.id}
            className="flex flex-col items-center bg-zinc-800 rounded-lg p-6"
          >
            <p className="font-semibold">{index === 0 ? "Eva" : "Tim"}</p>
            <p className="text-xs text-green-400">{av.id}</p>
            <p className="text-xs text-gray-400 mt-2">
              GLB: https://models.readyplayer.me/{av.id}.glb
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
