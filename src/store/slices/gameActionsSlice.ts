// src/store/slices/gameActionsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store"

import {
  fetchProgress,
  fetchLevelStats,
  fetchDiamonds,
  addCompletedIntervention,
  setLevelUp,
  saveLevelUpToStorage,
  setAdvanceGate,
} from "./gameSlice"

import { fetchSessionState } from "./sessionSlice"

import type { AnimationType, FlyConfig } from "@context/AnimationContext"
import type { ApiInterface } from "@api/types"
import { invalidateCacheFor } from "@api/request"

const DEBUG_SLIDES = import.meta.env.DEV && import.meta.env.VITE_DEBUG_SLIDES === "true"
const completionDebugState = new Map<number, { called: boolean; httpStatus?: number; success: boolean; xp: number }>()

export function getCompletionDebugState(interventionId: number) {
  return completionDebugState.get(interventionId)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionType = "next" | "answer" | "meditation" | "prev" | "reload_level"

export type Action = {
  type: ActionType
  goNext?: () => void
  payload?: unknown
  interventionId?: number
  xp?: number
  save?: boolean
}

interface GameActionsState {
  lastAction?: ActionType
}

const initialState: GameActionsState = {
  lastAction: undefined,
}

// ---------------------------------------------------------------------------
// 🎯 handleAction (der Router)
// ---------------------------------------------------------------------------

export const handleActionThunk = createAsyncThunk(
  "gameActions/handleAction",
  async (
    {
      action,
      playAnimation,
      api,
    }: {
      action: Action
      playAnimation: (type: AnimationType, fly?: FlyConfig) => void
      api: ApiInterface
    },
    { dispatch }
  ) => {
    if (import.meta.env.DEV) console.log("[ACTION]", action)

    switch (action.type) {
      case "next":
      case "prev":
        action.goNext?.()
        break

      case "answer":
        if (action.save && action.interventionId) {
          await dispatch(
            completeInterventionThunk({
              interventionId: action.interventionId,
              xp: action.xp ?? 0,
              playAnimation,
              api,
            })
          )
        }
        action.goNext?.()
        break
      
      case "reload_level":
        // Level-Daten neu laden um Conditions neu zu evaluieren
        await dispatch(fetchProgress(api))
        await dispatch(fetchLevelStats(api))
        
        // Session-State neu laden um userProfile zu aktualisieren
        await dispatch(fetchSessionState(api))
        break
    }

    return action.type
  }
)

// ---------------------------------------------------------------------------
// 🎯 Intervention abschließen (Hauptlogik)
// ---------------------------------------------------------------------------

/* export const completeInterventionThunk = createAsyncThunk(
  "gameActions/completeIntervention",
  async (
    {
      interventionId,
      xp,
      playAnimation,
      api,
    }: {
      interventionId: number
      xp: number
      playAnimation: (type: AnimationType, fly?: FlyConfig) => void
      api: ApiInterface
    },
    { dispatch, getState }
  ) => {
    const { game } = getState() as RootState

    // schon abgeschlossen?
    if (game.completedInterventions.includes(interventionId)) {
      completionDebugState.set(interventionId, { called: false, success: true, xp })
      console.log(`ℹ️ Intervention ${interventionId} war bereits abgeschlossen`)
      return
    }

    console.log(`✅ Intervention ${interventionId} abgeschlossen`)

    // 1. API: Fortschritt speichern
    await api.saveInterventionProgress(interventionId, xp)

    // 2. XP Animation
    if (xp > 0) {
      playAnimation("xp", { count: xp })
    }

    // 3. Lokal ergänzen (Hilfsfunktion)
    dispatch(addCompletedIntervention(interventionId))

    // 4. Echte Werte neu laden (Backend = Wahrheit)
    await dispatch(fetchProgress(api))
    await dispatch(fetchLevelStats(api))
    await dispatch(fetchDiamonds(api))
  }
) */

export const completeInterventionThunk = createAsyncThunk(
  "gameActions/completeIntervention",
  async (
    {
      interventionId,
      xp,
      playAnimation,
      api,
    }: {
      interventionId: number
      xp: number
      playAnimation: (type: AnimationType, fly?: FlyConfig) => void
      api: ApiInterface
    },
    { dispatch, getState }
  ) => {
    // Guard: bereits abgeschlossen? → kein doppelter API-Call
    const { game } = getState() as RootState
    if (game.completedInterventions.includes(interventionId)) {
      if (import.meta.env.DEV) {
        console.log(`ℹ️ Intervention ${interventionId} bereits abgeschlossen – übersprungen`)
      }
      return
    }

    // 1) Backend: Intervention abschließen + XP speichern
    const res = await api.completeIntervention(interventionId)

    completionDebugState.set(interventionId, {
      called: true,
      httpStatus: res.httpStatus,
      success: Boolean(res.success && res.data),
      xp,
    })

    if (DEBUG_SLIDES) {
      console.log("✅ completeIntervention response:", res)
    }

    if (!res.success || !res.data) {
      console.error("completeIntervention ERROR:", res)
      throw new Error(res.error || res.message || "Intervention konnte nicht abgeschlossen werden")
    }

    const data = res.data

    // 2) XP-Animation NACH erfolgreichem API-Call starten
    if (xp > 0) {
      playAnimation("xp", { count: xp })
    }

    // 3) GET-Cache für Level/Progress invalidieren, damit frische Daten kommen
    invalidateCacheFor(
      "/game/getCurrentLevel",
      "/game/getProgress",
      "/game/getDiamonds"
    )

    // 4) Lokal speichern → wichtig für Progress
    dispatch(addCompletedIntervention(interventionId))

    // 5) Level/Xp/Diamonds neu laden (Backend = Quelle der Wahrheit)
    await dispatch(fetchProgress(api))
    await dispatch(fetchLevelStats(api))
    await dispatch(fetchDiamonds(api))

    // 6) Freigabe-Ergebnis merken (Schritt 5/6-Contract) - SlideManagerContext.goNext()
    // entscheidet anhand dieses Werts, ob und wohin eine Levelgrenze überschritten werden darf.
    dispatch(
      setAdvanceGate({
        can_advance: data.can_advance,
        next_intervention_id: data.next_intervention_id,
        next_level: data.next_level,
        code: data.code,
        current_xp: data.current_xp,
        required_xp: data.required_xp,
        missing_xp: data.missing_xp,
        open_intervention_id: data.open_intervention_id,
      })
    )

    // 7) LevelUp?
    if (data.leveled_up && data.reward) {
      const levelUpPayload = {
        level: data.new_level,
        reward: data.reward,
      }
      dispatch(setLevelUp(levelUpPayload))
      // User-spezifisch im localStorage persistieren (damit Refresh das Overlay nicht löscht)
      const userId = (getState() as RootState).session?.user?.id ?? null
      saveLevelUpToStorage(levelUpPayload, userId)
    }

    return data
  }
)

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const gameActionsSlice = createSlice({
  name: "gameActions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(handleActionThunk.fulfilled, (state, action) => {
      state.lastAction = action.payload
    })
  },
})

export const selectGameActions = (state: RootState) => state.gameActions
export default gameActionsSlice.reducer
