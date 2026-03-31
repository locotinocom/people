import { useEffect, useState } from "react"
import { useReduxApi } from "@api/reduxApi"
import type { UserAssetWithMeta } from "@api/types"

export function useUserAssetsPreview(assetIds: string[]) {
  const api = useReduxApi()

  // 🔥 Typ festlegen
  const [items, setItems] = useState<UserAssetWithMeta[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!assetIds || assetIds.length === 0) return

    const load = async () => {
      setLoading(true)
      try {
        const res = await api.getUserAssetsByIds(assetIds.map(Number))
        setItems(res.data ?? []) // ❤️ jetzt korrekt typisiert
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [assetIds])

  return { items, loading }
}
