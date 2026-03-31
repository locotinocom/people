// src/store/slices/avatarSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { ApiInterface } from "@api/types"
import type { AvatarStatus } from "@api/types"

const BASE_PATH = (avatarId: string) => `/avatars/${avatarId}`

// Exakte Layer-Reihenfolge aus dem Playground
export const AVATAR_LAYER_ORDER = [
  "base",
  "bottom",
  "shoes",
  "top",
  "fullbody",
  "accessory",
  "hair_base",
  "head_base",
  "emotion_fullbody",
  "head_accessory",  // ← hierher verschoben
  "hair_top",
] as const

export type AvatarLayerKey = typeof AVATAR_LAYER_ORDER[number]

// Default SVGs — immer sichtbar, nie null
const getDefaultLayers = (avatarId: string): Partial<Record<AvatarLayerKey, string>> => ({
  base:            `${BASE_PATH(avatarId)}/base/default_base.svg`,
  bottom:          `${BASE_PATH(avatarId)}/bottom/default_bottom.svg`,
  top:             `${BASE_PATH(avatarId)}/top/default_top.svg`,
  hair_base:       `${BASE_PATH(avatarId)}/hair_base/default_hair_base.svg`,
  head_base:       `${BASE_PATH(avatarId)}/head_base/${avatarId}_default_head_base.svg`,
  emotion_fullbody:`${BASE_PATH(avatarId)}/emotion/neutral.svg`,
  hair_top:        `${BASE_PATH(avatarId)}/hair_top/default_hair_top.svg`,
   shoes:        `${BASE_PATH(avatarId)}/shoes/default_shoes.svg`,
})

export function resolveDefaultLayers(avatarId: string): Partial<Record<AvatarLayerKey, string>> {
  return getDefaultLayers(avatarId)
}

export interface AvatarInfo {
  avatar_id: string
  gender: string
  name?: string
  layers: Partial<Record<AvatarLayerKey, string>>
}

interface AvatarState {
  avatar: AvatarInfo | null
  status: AvatarStatus | null
  avatarImageUat: string
  isLoading: boolean
  error: string | null
}

const initialState: AvatarState = {
  avatar: null,
  status: null,
  avatarImageUat: "init",
  isLoading: false,
  error: null,
}

export const fetchUserAvatar = createAsyncThunk<
  AvatarInfo,
  ApiInterface,
  { rejectValue: string }
>("avatar/fetchUserAvatar", async (api, { rejectWithValue }) => {
  try {
    const statusRes = await api.getAvatarStatus()
    if (!statusRes.success || !statusRes.data) {
      return rejectWithValue("Avatar-Status konnte nicht geladen werden")
    }

    const avatarId = statusRes.data.avatar_id ?? "eva"
    const gender = statusRes.data.gender ?? "female"

    // Defaults setzen
    const layers: Partial<Record<AvatarLayerKey, string>> = {
      ...getDefaultLayers(avatarId),
    }

    // Equipped Assets laden und Layers überschreiben
    const equippedRes = await api.getEquippedAssets()
    const equippedMap = equippedRes.data?.equipped ?? {}

    for (const [category, asset] of Object.entries(equippedMap)) {
      const key = category as AvatarLayerKey
      const typedAsset = asset as any
      if (typedAsset.name) {
        layers[key] = `${BASE_PATH(avatarId)}/${category}/${typedAsset.name}.svg`
      }
    }

    // fullbody → top und bottom ausblenden
    if (layers.fullbody) {
      delete layers.top
      delete layers.bottom
    }

    return { avatar_id: avatarId, gender, layers }
  } catch (e: any) {
    return rejectWithValue(e.message ?? "Unbekannter Fehler")
  }
})

export const fetchAvatarStatus = createAsyncThunk<
  AvatarStatus,
  ApiInterface,
  { rejectValue: string }
>("avatar/fetchAvatarStatus", async (api, { rejectWithValue }) => {
  try {
    const res = await api.getAvatarStatus()
    if (!res.success || !res.data) {
      return rejectWithValue("Avatar-Status konnte nicht geladen werden")
    }
    return {
      hasAvatar: res.data.hasAvatar,
      avatar_id: res.data.avatar_id,
      gender: res.data.gender,
    }
  } catch (e: any) {
    return rejectWithValue(e.message ?? "Unbekannter Fehler")
  }
})

export const avatarSlice = createSlice({
  name: "avatar",
  initialState,
  reducers: {
    clearAvatar: (state) => {
      state.avatar = null
    },

    updateLayer: (
      state,
      action: PayloadAction<{ category: AvatarLayerKey; svgPath: string | null }>
    ) => {
      if (!state.avatar) return
      const { category, svgPath } = action.payload
      const defaults = getDefaultLayers(state.avatar.avatar_id)

      if (svgPath === null) {
        // Hat die Kategorie einen Default? → Default wiederherstellen
        // Sonst komplett entfernen (shoes, accessory, head_accessory)
        if (defaults[category]) {
          state.avatar.layers[category] = defaults[category]
        } else {
          delete state.avatar.layers[category]
        }

        // fullbody ausgezogen → top/bottom wiederherstellen
        if (category === "fullbody") {
          state.avatar.layers.top = defaults.top
          state.avatar.layers.bottom = defaults.bottom
        }
      } else {
        state.avatar.layers[category] = svgPath

        // fullbody angezogen → top/bottom ausblenden
        if (category === "fullbody") {
          delete state.avatar.layers.top
          delete state.avatar.layers.bottom
        }
      }

      state.avatarImageUat = Date.now().toString()
    },

    reloadAvatar: (state) => {
      state.avatarImageUat = Date.now().toString()
    },

    bumpAvatarImageUat: (state) => {
      state.avatarImageUat = Date.now().toString()
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAvatar.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserAvatar.fulfilled, (state, action) => {
        state.isLoading = false
        state.avatar = action.payload
      })
      .addCase(fetchUserAvatar.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Avatar konnte nicht geladen werden"
      })
      .addCase(fetchAvatarStatus.fulfilled, (state, action) => {
        state.status = action.payload
      })
  },
})

export const {
  clearAvatar,
  updateLayer,
  reloadAvatar,
  bumpAvatarImageUat,
} = avatarSlice.actions

export default avatarSlice.reducer