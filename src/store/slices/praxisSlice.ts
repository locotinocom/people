// src/store/slices/praxisSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import type { PraxisItem, PraxisContentItem } from "@api/types"

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------
export interface PraxisRewardPending {
  transactionId: number
  diamondAmount: number
  praxisItemId: string
}

export interface PraxisState {
  items: PraxisItem[]              // User's aktive/abgeschlossene Items
  contentPool: PraxisContentItem[]  // Verfügbare Content-Definitionen
  isLoading: boolean
  error: string | null
  lastFetchedAt: string | null
  /** Gesetzt sofort nach erfolgreichem completePraxisItem, bis der User die Dias eingelöst hat */
  rewardPending: PraxisRewardPending | null
}

const initialState: PraxisState = {
  items: [],
  contentPool: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  rewardPending: null,
}

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

/**
 * Lade Praxis-Items für den aktuellen User vom Backend (/game/state)
 * Wird in GameLayout beim App-Start aufgerufen
 */
export const fetchPraxisItems = createAsyncThunk<
  PraxisItem[],
  any, // api: ApiInterface
  { rejectValue: string }
>("praxis/fetchPraxisItems", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getFullGameState()
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Praxis-Items konnten nicht geladen werden")
    }
    // praxis_items kommt aus /game/state response
    return res.data.praxis_items || []
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

/**
 * Lade den Content-Pool aus dem Backend
 */
export const fetchPraxisContentPool = createAsyncThunk<
  PraxisContentItem[],
  any, // api: ApiInterface
  { rejectValue: string }
>("praxis/fetchContentPool", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getPraxisContent()
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Content-Pool konnte nicht geladen werden")
    }
    return res.data.praxis_content || []
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

/**
 * User nimmt ein pending Item an – startet den Countdown (availableAt)
 */
export const acceptPraxisItem = createAsyncThunk<
  { praxisItemId: string; acceptedAt: string; availableAt: string },
  { api: any; praxisItemId: string },
  { rejectValue: string }
>("praxis/acceptPraxisItem", async ({ api, praxisItemId }, { rejectWithValue }) => {
  try {
    const res = await api.acceptPraxisItem(praxisItemId)
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Annehmen fehlgeschlagen")
    }
    return {
      praxisItemId,
      acceptedAt: res.data.accepted_at,
      availableAt: res.data.available_at,
    }
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

/**
 * User lehnt ein pending Item ab – Backend erzwingt sofortigen Respawn
 */
export const dismissPraxisItem = createAsyncThunk<
  { praxisItemId: string },
  { api: any; praxisItemId: string },
  { rejectValue: string }
>("praxis/dismissPraxisItem", async ({ api, praxisItemId }, { rejectWithValue }) => {
  try {
    const res = await api.dismissPraxisItem(praxisItemId)
    if (!res.success) {
      return rejectWithValue(res.message || "Ablehnen fehlgeschlagen")
    }
    return { praxisItemId }
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const praxisSlice = createSlice({
  name: "praxis",
  initialState,
  reducers: {
    /**
     * Füge ein neues pending Item für den User hinzu
     */
    addPraxisItem(state, action: PayloadAction<PraxisItem>) {
      state.items.push(action.payload)
    },

    /**
     * Markiere ein Item als completed/dismissed/expired
     */
    updatePraxisItemStatus(
      state,
      action: PayloadAction<{ id: string; status: PraxisItem["status"]; completedAt?: string }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id)
      if (item) {
        item.status = action.payload.status
        if (action.payload.completedAt) {
          item.completedAt = action.payload.completedAt
        }
      }
    },

    /**
     * Speichere User-Response zu einem Item
     */
    setPraxisItemResponse(
      state,
      action: PayloadAction<{ id: string; responseData: Record<string, unknown> }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id)
      if (item) {
        item.responseData = action.payload.responseData
      }
    },

    /**
     * Lade User-Items aus dem Backend (z.B. aus user_profiles.meta.praxis_items)
     */
    setPraxisItems(state, action: PayloadAction<PraxisItem[]>) {
      state.items = action.payload
    },

    /**
     * Schließt das Reward-Overlay, nachdem die Dias eingelöst (oder der Dialog geschlossen) wurden
     */
    clearPraxisReward(state) {
      state.rewardPending = null
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Praxis Items
      .addCase(fetchPraxisItems.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPraxisItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.lastFetchedAt = new Date().toISOString()
      })
      .addCase(fetchPraxisItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Praxis-Items konnten nicht geladen werden"
      })
      // Fetch Content Pool
      .addCase(fetchPraxisContentPool.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPraxisContentPool.fulfilled, (state, action) => {
        state.isLoading = false
        state.contentPool = action.payload
        state.lastFetchedAt = new Date().toISOString()
      })
      .addCase(fetchPraxisContentPool.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Content-Pool konnte nicht geladen werden"
      })
      // Accept Praxis Item
      .addCase(acceptPraxisItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(acceptPraxisItem.fulfilled, (state, action) => {
        state.isLoading = false
        const item = state.items.find((i) => i.id === action.payload.praxisItemId)
        if (item) {
          item.status = "active"
          item.acceptedAt = action.payload.acceptedAt
          item.availableAt = action.payload.availableAt
        }
      })
      .addCase(acceptPraxisItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Annehmen fehlgeschlagen"
      })
      // Dismiss Praxis Item
      .addCase(dismissPraxisItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(dismissPraxisItem.fulfilled, (state, action) => {
        state.isLoading = false
        const item = state.items.find((i) => i.id === action.payload.praxisItemId)
        if (item) {
          item.status = "dismissed"
        }
      })
      .addCase(dismissPraxisItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Ablehnen fehlgeschlagen"
      })
      // Complete Praxis Item
      .addCase(completePraxisItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(completePraxisItem.fulfilled, (state, action) => {
        state.isLoading = false
        const item = state.items.find((i) => i.id === action.payload.praxisItemId)
        if (item) {
          item.status = "completed"
          item.completedAt = action.payload.completedAt
        }
        // Reward-Overlay anzeigen, bis der User die Dias eingelöst hat (siehe PraxisRewardOverlay)
        state.rewardPending = {
          transactionId: action.payload.transactionId,
          diamondAmount: action.payload.diamondAmount,
          praxisItemId: action.payload.praxisItemId,
        }
      })
      .addCase(completePraxisItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Item-Completion fehlgeschlagen"
      })
      // Claim Praxis Diamonds
      .addCase(claimPraxisDiamonds.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(claimPraxisDiamonds.fulfilled, (state) => {
        state.isLoading = false
        state.rewardPending = null
      })
      .addCase(claimPraxisDiamonds.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Einlösen fehlgeschlagen"
      })
  },
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const {
  addPraxisItem,
  updatePraxisItemStatus,
  setPraxisItemResponse,
  setPraxisItems,
  clearPraxisReward,
} =
  praxisSlice.actions

/**
 * Thunk zur Item-Completion (POST /praxis/complete)
 */
export const completePraxisItem = createAsyncThunk<
  { transactionId: number; diamondAmount: number; completedAt: string; praxisItemId: string },
  { api: any; praxisItemId: string; responseData?: Record<string, unknown> },
  { rejectValue: string }
>("praxis/completePraxisItem", async ({ api, praxisItemId, responseData }, { rejectWithValue }) => {
  try {
    const res = await api.completePraxisItem(praxisItemId, responseData)
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Completion failed")
    }
    return {
      transactionId: res.data.transaction_id,
      diamondAmount: res.data.diamond_amount,
      completedAt: res.data.completed_at,
      praxisItemId,
    }
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

/**
 * Thunk zum Einlösen der Praxis-Diamanten (POST /game/praxis/claimDiamonds).
 * Wird vom PraxisRewardOverlay aufgerufen, nachdem completePraxisItem erfolgreich war.
 */
export const claimPraxisDiamonds = createAsyncThunk<
  { balance: number; alreadyClaimed: boolean },
  { api: any; transactionId: number },
  { rejectValue: string }
>("praxis/claimPraxisDiamonds", async ({ api, transactionId }, { rejectWithValue }) => {
  try {
    const res = await api.claimPraxisDiamonds(transactionId)
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Einlösen fehlgeschlagen")
    }
    return {
      balance: res.data.balance,
      alreadyClaimed: res.data.already_claimed,
    }
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

export const selectPraxis = (state: RootState) => state.praxis
export const selectPraxisItems = (state: RootState) => state.praxis.items
export const selectPraxisContentPool = (state: RootState) => state.praxis.contentPool
export const selectPraxisLoading = (state: RootState) => state.praxis.isLoading
export const selectPraxisError = (state: RootState) => state.praxis.error
export const selectPraxisRewardPending = (state: RootState) => state.praxis.rewardPending

export default praxisSlice.reducer
