import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import type { ApiInterface, InventoryItem } from "@api/types"

// =======================================================
// Thunk: Inventory laden → IMMER ein ARRAY zurückgeben
// =======================================================
export const fetchInventory = createAsyncThunk<
  InventoryItem[],         // <-- Thunk return type = ARRAY
  ApiInterface,
  { rejectValue: string }
>(
  "inventory/fetchInventory",
  async (api, { rejectWithValue }) => {
    try {
      const res = await api.getInventory()

      if (import.meta.env.DEV) console.log("📦 fetchInventory (raw) →", res)

      if (!res.success) {
        return rejectWithValue(res.message || "Inventory Fehler")
      }

      // Backend liefert: { items: InventoryItem[] } oder data kann direkt InventoryItem[] sein
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.items)
        ? (res.data as any).items
        : []

      return items   // <-- ARRAY zurück
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Inventory Fehler"
      return rejectWithValue(msg)
    }
  }
)

export const buyAssetThunk = createAsyncThunk(
  "inventory/buy",
  async ({ api, assetId }: { api: ApiInterface; assetId: number }) => {
    const res = await api.buyAsset(assetId)
    return { assetId, success: res.success }
  }
)

export const equipAssetThunk = createAsyncThunk(
  "inventory/equip",
  async ({ api, assetId }: { api: ApiInterface; assetId: number }) => {
    const res = await api.equipItem({
      assetId,
      category: ""
    })
    return res.data // asset_id + type
  }
)

export const unequipAssetThunk = createAsyncThunk(
  "inventory/unequip",
  async ({ api, assetId }: { api: ApiInterface; assetId: number }) => {
    const res = await api.unequipItem({
      assetId,
      category: ""
    })
    return res.data // asset_id + type
  }
)


// =======================================================
// State
// =======================================================
export interface InventoryState {
  items: InventoryItem[]   // <-- ARRAY
  isLoading: boolean
  error: string | null
}

const initialState: InventoryState = {
  items: [],
  isLoading: false,
  error: null,
}


export const syncAvatarItemsThunk = createAsyncThunk(
  "inventory/syncAvatarItems",
  async ({ api, wearables }: { api: ApiInterface; wearables: string[] }) => {
    const res = await api.syncAvatarItems({ wearables })
    return res.data     // → { equipped_asset_ids: number[], count: number }
  }
)

// =======================================================
// Slice
// =======================================================
export const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload  // <-- ARRAY direkt
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Inventory Fehler"
      })
      .addCase(buyAssetThunk.fulfilled, (s, a) => {
  const item = s.items.find((i) => i.id === a.payload.assetId)
  console.log("Bought item:", item)
  if (item) {
    item.owned = true
    item.unlocked = true
    item.is_new = true
  }
})



.addCase(equipAssetThunk.fulfilled, (s, a) => {
  const payload = a.payload

  if (!payload) return   // payload === null → Exit

  const { asset_id, type } = payload

  // → jetzt ist TS sicher: payload ist NICHT null
  s.items.forEach((i) => {
    if (i.type === type) i.equipped = false
  })

  const item = s.items.find((i) => i.id === asset_id)
  if (item) item.equipped = true
})

.addCase(unequipAssetThunk.fulfilled, (s, a) => {
  const payload = a.payload
  if (!payload) return
  const { asset_id } = payload
  const item = s.items.find((i) => i.id === asset_id)
  if (item) item.equipped = false
})
.addCase(syncAvatarItemsThunk.fulfilled, (s, a) => {
  const data = a.payload
  if (!data) return

  const equippedIds = new Set(data.equipped_asset_ids)

  // Alle unequippen
  s.items.forEach(item => {
    item.equipped = false
  })

  // Die "echten" equippen
  s.items.forEach(item => {
    if (equippedIds.has(item.asset_id)) {
      item.equipped = true
    }
  })
})


  },
})

export const selectInventory = (state: RootState) => state.inventory
export default inventorySlice.reducer
