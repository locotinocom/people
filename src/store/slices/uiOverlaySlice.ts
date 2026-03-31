// uiOverlaySlice.ts
import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

export type OverlayType =
  | "inventory"
  | "tools"
  | "levelStats"
  | "chatbot"
  | "profile"
  | "settings"
  | null

interface UiOverlayState {
  active: OverlayType
  /** Welches Tool gerade als Standalone geöffnet ist (z.B. "breath_tool") */
  activeToolKey: string | null
}

const initialState: UiOverlayState = {
  active: null,
  activeToolKey: null,
}

const uiOverlaySlice = createSlice({
  name: "uiOverlay",
  initialState,
  reducers: {
    openOverlay: (state, action: PayloadAction<{ type: OverlayType; toolKey?: string }>) => {
      state.active = action.payload.type
      state.activeToolKey = action.payload.toolKey ?? null
    },
    closeOverlay: (state) => {
      state.active = null
      state.activeToolKey = null
    },
    /** Öffnet ein Tool direkt als Standalone-Overlay */
    openTool: (state, action: PayloadAction<string>) => {
      state.active = "tools"
      state.activeToolKey = action.payload
    },
    /** Schließt das aktive Tool, bleibt aber im Tools-Screen */
    closeTool: (state) => {
      state.activeToolKey = null
    },
  },
})

export const { openOverlay, closeOverlay, openTool, closeTool } = uiOverlaySlice.actions
export default uiOverlaySlice.reducer
