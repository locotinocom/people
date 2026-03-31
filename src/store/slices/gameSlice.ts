// src/store/slices/gameSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"

// ---------------------------------------------------------------------------
// localStorage-Persistenz für LevelUp (damit Refresh das Overlay nicht löscht)
// User-spezifisch: Key enthält die User-ID, damit User-Wechsel keinen alten State zeigt
// ---------------------------------------------------------------------------

function getLevelUpStorageKey(userId?: number | string | null): string {
  return userId ? `pp_levelup_pending_${userId}` : "pp_levelup_pending"
}

export function saveLevelUpToStorage(
  data: { level: number; reward: LevelUpReward } | null,
  userId?: number | string | null
) {
  try {
    const key = getLevelUpStorageKey(userId)
    // Generischen Key IMMER löschen (Migration + verhindert alten State bei userId=null)
    localStorage.removeItem("pp_levelup_pending")
    if (data) {
      localStorage.setItem(key, JSON.stringify(data))
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // localStorage nicht verfügbar → ignorieren
  }
}

export function loadLevelUpFromStorage(
  userId?: number | string | null
): { level: number; reward: LevelUpReward } | null {
  try {
    const key = getLevelUpStorageKey(userId)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Löscht alle LevelUp-Storage-Einträge (für Logout) */
export function clearAllLevelUpStorage() {
  try {
    // Generischen Key löschen
    localStorage.removeItem("pp_levelup_pending")
    // Alle user-spezifischen Keys löschen
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith("pp_levelup_pending_")) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignorieren
  }
}

import type {
  ApiInterface,
  ProgressResponse,
  LevelStatsResponse,
  DiamondState,
} from "@api/types"

/* =====================================================================================
   STATE TYP
===================================================================================== */

export interface LevelUpReward {
  dias: number
  transaction_id: number
  level: number
  asset_ids: string | string[] | null
  tool_ids: string | string[] | null
}

interface GameState {
  currentInterventionId: number | null
  lastCompletedAt: string | null

  levelStats: LevelStatsResponse | null

  level: number
  xp: number

  diamondBalance: number
  diamondsLoaded: boolean

  completedInterventions: number[]

  isLoading: boolean
  error: string | null

  // 🔥 LEVEL-UP UI
  levelUpPending: boolean
  levelUpData: null | {
    level: number
    reward: LevelUpReward
    
  }

  
}

/* =====================================================================================
   INITIAL STATE
===================================================================================== */
// Beim App-Start KEIN localStorage lesen – das Backend ist die Quelle der Wahrheit.
// fetchSessionState setzt pending_levelup aus dem Backend und speichert es dann user-spezifisch.
const initialState: GameState = {
  currentInterventionId: null,
  lastCompletedAt: null,
  levelStats: null,

  level: 1,
  xp: 0,

  diamondBalance: 0,
  diamondsLoaded: false,

  completedInterventions: [],

  isLoading: false,
  error: null,

  levelUpPending: false,
  levelUpData: null,
}

/* const initialState: GameState = {
  currentInterventionId: null,
  lastCompletedAt: null,
  levelStats: null,

  level: 1,
  xp: 0,

  diamondBalance: 0,
  diamondsLoaded: false,

  completedInterventions: [],

  isLoading: false,
  error: null,

  // 🔥 DEBUG: LevelUp immer anzeigen
  levelUpPending: import.meta.env.DEV ? true : false,

  levelUpData: import.meta.env.DEV
    ? {
        level: 2,
        reward: {
          dias: 5,
          transaction_id: 999999,
          level: 5,
          asset_ids: ["1", "2"],
          tool_ids: ["meditation_plus"],
        },
      }
    : null,
} */


/* =====================================================================================
   1) fetchProgress
===================================================================================== */

export const fetchProgress = createAsyncThunk<
  ProgressResponse | null,
  ApiInterface,
  { rejectValue: string }
>("game/fetchProgress", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getProgress()

    if (import.meta.env.DEV) console.log("🎯 fetchProgress (raw) →", res)

    if (!res.success) {
      return rejectWithValue(res.message || "Fehler bei fetchProgress")
    }

    return res.data ?? null
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Fehler bei fetchProgress"
    return rejectWithValue(msg)
  }
})

/* =====================================================================================
   2) fetchLevelStats
===================================================================================== */

export const fetchLevelStats = createAsyncThunk<
  LevelStatsResponse,
  ApiInterface,
  { rejectValue: string }
>("game/fetchLevelStats", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getCurrentLevel()

    if (import.meta.env.DEV) console.log("📊 fetchLevelStats (raw) →", res)

    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "LevelStats Fehler")
    }

    return res.data
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Fehler bei fetchLevelStats"
    return rejectWithValue(msg)
  }
})

/* =====================================================================================
   3) fetchDiamonds
===================================================================================== */

export const fetchDiamonds = createAsyncThunk<
  DiamondState | null,
  ApiInterface,
  { rejectValue: string }
>("game/fetchDiamonds", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getDiamonds()

    if (import.meta.env.DEV) console.log("💎 fetchDiamonds (raw) →", res)

    if (!res.success) {
      return rejectWithValue(res.message || "Diamonds Fehler")
    }

    return res.data ?? null
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Fehler bei fetchDiamonds"
    return rejectWithValue(msg)
  }
})

/* =====================================================================================
   4) saveProgress
===================================================================================== */

export const saveProgress = createAsyncThunk<
  { success: boolean },
  { api: ApiInterface; interventionId: number; xp: number },
  { rejectValue: string }
>("game/saveProgress", async ({ api, interventionId, xp }, { rejectWithValue }) => {
  try {
    if (import.meta.env.DEV) {
      console.log("💾 saveProgress →", { interventionId, xp })
    }

    const res = await api.saveInterventionProgress(interventionId, xp)

    if (import.meta.env.DEV) {
      console.log("💾 saveProgress result (raw) →", res)
    }

    if (!res.success) {
      return rejectWithValue(res.message || "Fehler beim Speichern")
    }

    return { success: true }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Fehler bei saveProgress"
    return rejectWithValue(msg)
  }
})

/* =====================================================================================
   SLICE
===================================================================================== */

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    addCompletedIntervention(state, action: PayloadAction<number>) {
      if (!state.completedInterventions.includes(action.payload)) {
        state.completedInterventions.push(action.payload)
      }
    },

    // 🔥 LEVEL-UP Overlay aktivieren
    // HINWEIS: Storage-Persistenz erfolgt NICHT hier, sondern in sessionSlice.ts
    // mit der korrekten userId (user-spezifischer Key)
    setLevelUp(
      state,
      action: PayloadAction<{ level: number; reward: LevelUpReward; }>
    ) {
      state.levelUpPending = true
      state.levelUpData = action.payload
      // saveLevelUpToStorage wird in sessionSlice.ts mit userId aufgerufen
    },

    // 🔥 Overlay schließen
    clearLevelUp(state) {
      state.levelUpPending = false
      state.levelUpData = null
      // Storage wird in handleClose() via clearAllLevelUpStorage() oder
      // in sessionSlice.clearSession() geleert
    },
  },

  extraReducers: (builder) => {
    /* ====================== Progress ====================== */

    builder
      .addCase(fetchProgress.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchProgress.fulfilled,
        (state, action: PayloadAction<ProgressResponse | null>) => {
          state.isLoading = false

          const progress = action.payload
          if (!progress) return

          state.currentInterventionId = progress.intervention_id
          state.lastCompletedAt = progress.completed_at

          if (
            progress.intervention_id !== null &&
            !state.completedInterventions.includes(progress.intervention_id)
          ) {
            state.completedInterventions.push(progress.intervention_id)
          }
        }
      )
      .addCase(fetchProgress.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Fehler bei fetchProgress"
      })

    /* ====================== Level Stats ====================== */

    builder
      .addCase(
        fetchLevelStats.fulfilled,
        (state, action: PayloadAction<LevelStatsResponse>) => {
          state.levelStats = action.payload

          state.level = action.payload.level
          state.xp = action.payload.xp_in_level
        }
      )
      .addCase(fetchLevelStats.rejected, (state, action) => {
        state.error = action.payload ?? "Fehler bei fetchLevelStats"
      })

    /* ====================== Diamonds ====================== */

    builder
      .addCase(
        fetchDiamonds.fulfilled,
        (state, action: PayloadAction<DiamondState | null>) => {
          if (action.payload) {
            state.diamondBalance = action.payload.balance
            state.diamondsLoaded = true
          }
        }
      )
      .addCase(fetchDiamonds.rejected, (state, action) => {
        state.error = action.payload ?? "Fehler bei fetchDiamonds"
      })

    /* ====================== SaveProgress ====================== */

    builder.addCase(saveProgress.rejected, (state, action) => {
      state.error = action.payload ?? "Fehler bei saveProgress"
    })
  },
})

/* =====================================================================================
   EXPORTS
===================================================================================== */

export const { addCompletedIntervention, setLevelUp, clearLevelUp } =
  gameSlice.actions

export const selectGame = (state: RootState) => state.game

export default gameSlice.reducer
