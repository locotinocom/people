// src/store/slices/dataSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import type {
  ApiInterface,
  GameStateBundle,
  AvatarItem,
  Intervention,
} from "@api/types"
import { fetchSessionState } from "./sessionSlice"

interface DataState {
  interventions: Intervention[]
  avatarItems: AvatarItem[]
  isLoading: boolean
  error: string | null
}

const initialState: DataState = {
  avatarItems: [],
  interventions: [],
  isLoading: false,
  error: null,
}

// Fallback: Stammdaten separat laden (falls fetchSessionState woanders aufgerufen wird)
export const fetchDataBundle = createAsyncThunk<
  GameStateBundle,
  ApiInterface,
  { rejectValue: string }
>("data/fetchDataBundle", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getFullGameState()

    if (import.meta.env.DEV) {
      console.log("📦 fetchDataBundle und wie (raw) →", res)
    }

    if (!res.success || !res.data) {
      const msg = res.message || "Unbekannter Fehler beim Laden der Stammdaten"
      return rejectWithValue(msg)
    }

    if (import.meta.env.DEV) {
      console.log("📦 fetchDataBundle (data) →", res.data)
    }

    return res.data
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("💥 Fehler bei fetchDataBundle:", err)
    }
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler beim Laden der Stammdaten"
    return rejectWithValue(message)
  }
})

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ✅ Daten aus fetchSessionState übernehmen (getFullGameState nur 1x!)
      .addCase(fetchSessionState.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSessionState.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as { interventions?: Intervention[]; avatar_items?: AvatarItem[] }
        state.interventions = payload.interventions ?? []
        state.avatarItems = payload.avatar_items ?? []
      })
      .addCase(fetchSessionState.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) ?? "Ladefehler (Stammdaten)"
      })
      .addCase(fetchDataBundle.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchDataBundle.fulfilled,
        (state, action: PayloadAction<GameStateBundle>) => {
          state.isLoading = false
          const payload = action.payload
          state.interventions = payload.interventions ?? []
          state.avatarItems = payload.avatar_items ?? []
        }
      )
      .addCase(fetchDataBundle.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) ?? "Ladefehler (Stammdaten)"
      })
  },
})

export const selectData = (state: RootState) => state.data
export default dataSlice.reducer
