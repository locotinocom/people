import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import type { ApiInterface, User, UserProfile, UserProfilePatch } from "@api/types"
import { setLevelUp, saveLevelUpToStorage, clearAllLevelUpStorage } from "./gameSlice"
import type { LevelUpReward } from "./gameSlice"

interface SessionState {
  user: User | null
  avatar: any | null
  profile: UserProfile | null
  status: "idle" | "loading" | "ready" | "error"
  error: string | null
}

const initialState: SessionState = {
  user: null,
  avatar: null,
  profile: null,
  status: "idle",
  error: null,
}

export type SessionBundlePayload = {
  user: User | null
  avatar: any | null
  profile: UserProfile | null
  interventions?: any[]
  avatar_items?: any[]
}

export const fetchSessionState = createAsyncThunk<
  SessionBundlePayload,
  ApiInterface,
  { rejectValue: string; dispatch: any }
>("session/fetchSessionState", async (api, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.getFullGameState()
    if (!res.success || !res.data) return rejectWithValue(res.message || "Session-State Fehler")

    const bundle: any = res.data

    if (import.meta.env.DEV) console.log("👤 fetchSessionState bundle →", bundle)

    const user: User | null = bundle.user ?? null
    const userId = user?.id ?? null

    // Backend Check für pending LevelUp
    if (bundle.pending_levelup) {
      const levelUpData = {
        level: bundle.pending_levelup.level,
        reward: bundle.pending_levelup.reward as LevelUpReward,
      }
      if (import.meta.env.DEV) {
        console.log("💎 fetchSessionState: pending_levelup gefunden →", levelUpData)
      }
      dispatch(setLevelUp(levelUpData))
      saveLevelUpToStorage(levelUpData, userId)
    } else {
      saveLevelUpToStorage(null, userId)
    }

    return {
      user,
      avatar: bundle.avatar ?? null,
      profile: bundle.profile ?? null,
      interventions: bundle.interventions,
      avatar_items: bundle.avatar_items,
    }
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Session-State Fehler")
  }
})

export const patchUserProfile = createAsyncThunk<
  UserProfile,
  { api: ApiInterface; patch: UserProfilePatch },
  { rejectValue: string }
>("session/patchUserProfile", async ({ api, patch }, { rejectWithValue }) => {
  try {
    const res = await api.patchProfile(patch)
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || "Profil konnte nicht gespeichert werden")
    }
    return (res.data as any).profile as UserProfile
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden")
  }
})

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    // OPTIMISTIC UI: Diamanten sofort im Frontend anpassen
    addDiamondsLocally(state, action: PayloadAction<number>) {
      const amount = action.payload;
      
      // 1. Im Profil aktualisieren (falls vorhanden)
      if (state.profile) {
        // Falls dias im Profil liegen:
        if (typeof (state.profile as any).dias === 'number') {
          (state.profile as any).dias += amount;
        }
      }
      
      // 2. Im User-Objekt aktualisieren (Redundanz-Check)
      if (state.user && typeof (state.user as any).dias === 'number') {
        (state.user as any).dias += amount;
      }
      
      if (import.meta.env.DEV) {
        console.log(`✨ Optimistic UI: ${amount} Diamanten ${amount > 0 ? 'hinzugefügt' : 'abgezogen'}.`);
      }
    },
    setAvatar(state, action: PayloadAction<any>) {
      state.avatar = action.payload
    },
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload
    },
    clearSession(state) {
      state.user = null
      state.avatar = null
      state.profile = null
      state.status = "idle"
      state.error = null
      clearAllLevelUpStorage()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessionState.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchSessionState.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.avatar = action.payload.avatar
        state.profile = action.payload.profile
        state.status = "ready"
      })
      .addCase(fetchSessionState.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Fehler"
      })
      .addCase(patchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload
      })
  },
})

// Wichtig: addDiamondsLocally exportieren!
export const { setAvatar, setProfile, clearSession, addDiamondsLocally } = sessionSlice.actions
export const selectSession = (state: RootState) => state.session
export default sessionSlice.reducer