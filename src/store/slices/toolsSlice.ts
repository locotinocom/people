// src/store/slices/toolsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import type { ToolItem, ApiInterface, GetToolsResponse } from "@api/types"

// ---------------------------------------------------------------------------
// Statische Tool-Definitionen (Frontend-Fallback / LevelUp-Anzeige)
// Werden mit Backend-Daten überschrieben sobald getTools() geladen hat.
// ---------------------------------------------------------------------------
export const TOOL_DEFINITIONS: Omit<ToolItem, "unlocked" | "owned" | "is_new">[] = [
  {
    key: "breath_tool",
    name: "Atemübung",
    description: "Geführte Atemübung mit individuellen Einstellungen. Hilft bei Stress, Panik und zum Einschlafen.",
    icon: "🫁",
    previewImage: undefined,
    price_dias: 3,
    required_level: 3,
  },
  {
    key: "grounding_tool",
    name: "Verankerung",
    description: "Körperbezogene oder visualisierte Übung, um präsent zu werden. Für Momente wenn der Kopf zu laut wird.",
    icon: "🧍",
    previewImage: undefined,
    price_dias: 5,
    required_level: 4,
  },
  {
    key: "feeling_tool",
    name: "Gefühle zulassen",
    description: "Geführte Übung, um unangenehme Gefühle bewusst wahrzunehmen und zu verarbeiten – ohne sie wegzuschieben.",
    icon: "💛",
    previewImage: undefined,
    price_dias: 10,
    required_level: 5,
  },
  {
    key: "the_work_tool",
    name: "The Work",
    description: "Reflektiere einen zentralen Glaubenssatz und finde eine neue Perspektive. Befreit dich von alten inneren Regeln.",
    icon: "🧠",
    previewImage: undefined,
    price_dias: 0,
    required_level: 8,
  },
  {
    key: "gratitude_tool",
    name: "Danke-Tagebuch",
    description: "Tägliche Dankbarkeitsübung. Füllt deine Batterien auf und verändert, wie du die Welt siehst.",
    icon: "🙏",
    previewImage: undefined,
    price_dias: 0,
    required_level: 9,
  },
  {
    key: "burn_ritual",
    name: "Verbrennen",
    description: "Lass los, was dich belastet – rituell und bewusst. Schreib es auf, verbrenne es symbolisch und spüre die Erleichterung.",
    icon: "🔥",
    previewImage: undefined,
    price_dias: 0,
    required_level: 10,
  },
]

// ---------------------------------------------------------------------------
// Hilfsfunktion: Backend-Response → ToolItem
// ---------------------------------------------------------------------------
function mapResponseToToolItem(r: GetToolsResponse): ToolItem {
  // Merge mit statischer Definition (für icon/previewImage falls Backend kein Emoji liefert)
  const staticDef = TOOL_DEFINITIONS.find((d) => d.key === r.key)
  return {
    key: r.key,
    name: r.name,
    description: r.description,
    icon: r.icon || staticDef?.icon || "🛠",
    previewImage: r.preview_image ?? staticDef?.previewImage,
    price_dias: r.price_dias,
    required_level: r.required_level,
    unlocked: r.unlocked,
    owned: r.owned,
    is_new: r.is_new,
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export interface ToolsState {
  items: ToolItem[]
  isLoading: boolean
  error: string | null
}

const buildInitialItems = (): ToolItem[] =>
  TOOL_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: false,
    owned: false,
    is_new: false,
  }))

const initialState: ToolsState = {
  items: buildInitialItems(),
  isLoading: false,
  error: null,
}

// ---------------------------------------------------------------------------
// Thunks
// ---------------------------------------------------------------------------

/**
 * Lädt alle Tools + User-Status vom Backend.
 * Wird beim App-Start in GameLayout aufgerufen.
 */
export const fetchTools = createAsyncThunk<
  ToolItem[],
  ApiInterface,
  { rejectValue: string }
>(
  "tools/fetchTools",
  async (api, { rejectWithValue }) => {
    try {
      const res = await api.getTools()
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || "Tools konnten nicht geladen werden")
      }
      return res.data.map(mapResponseToToolItem)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tools Fehler"
      return rejectWithValue(msg)
    }
  }
)

/**
 * Tool kaufen – ruft POST /tools/buyTool auf.
 * Zieht Dias ab (Backend) und markiert Tool als owned.
 */
export const buyToolThunk = createAsyncThunk<
  { key: string; newBalance: number },
  { api: ApiInterface; toolKey: string },
  { rejectValue: string }
>(
  "tools/buy",
  async ({ api, toolKey }, { rejectWithValue }) => {
    try {
      const res = await api.buyTool(toolKey)
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || "Kauf fehlgeschlagen")
      }
      return { key: toolKey, newBalance: res.data.new_balance }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kauf fehlgeschlagen"
      return rejectWithValue(msg)
    }
  }
)

/**
 * "Neu"-Badge entfernen – ruft POST /tools/markSeen auf.
 */
export const markToolSeenThunk = createAsyncThunk<
  string,
  { api: ApiInterface; toolKey: string },
  { rejectValue: string }
>(
  "tools/markSeen",
  async ({ api, toolKey }, { rejectWithValue }) => {
    try {
      await api.markToolSeen(toolKey)
      return toolKey
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler"
      return rejectWithValue(msg)
    }
  }
)

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const toolsSlice = createSlice({
  name: "tools",
  initialState,
  reducers: {
    /**
     * Wird beim LevelUp aufgerufen: tool_keys aus dem Reward freischalten.
     * (Optimistisches Update – Backend hat es bereits gespeichert)
     */
    unlockTools(state, action: PayloadAction<string[]>) {
      const keys = action.payload
      state.items.forEach((item) => {
        if (keys.includes(item.key)) {
          item.unlocked = true
          item.is_new = true
        }
      })
    },

    /** Lokales "Neu"-Badge entfernen (ohne API-Call) */
    markToolSeen(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.key === action.payload)
      if (item) item.is_new = false
    },

    /**
     * Beim App-Start: User-Level übergeben → alle Tools unterhalb des Levels
     * als unlocked markieren (Fallback wenn Backend noch nicht geladen).
     */
    syncToolsByLevel(state, action: PayloadAction<number>) {
      const userLevel = action.payload
      state.items.forEach((item) => {
        if (userLevel >= item.required_level) {
          item.unlocked = true
        }
      })
    },

    /** Direkt ein Tool als owned markieren (z.B. nach Backend-Sync). */
    setToolOwned(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.key === action.payload)
      if (item) {
        item.owned = true
        item.unlocked = true
      }
    },
  },

  extraReducers: (builder) => {
    // ── fetchTools ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchTools.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTools.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
      })
      .addCase(fetchTools.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Tools Fehler"
      })

    // ── buyToolThunk ────────────────────────────────────────────────────────
    builder
      .addCase(buyToolThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(buyToolThunk.fulfilled, (state, action) => {
        state.isLoading = false
        const item = state.items.find((i) => i.key === action.payload.key)
        if (item) {
          item.owned = true
          item.unlocked = true
          item.is_new = true
        }
      })
      .addCase(buyToolThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? "Kauf fehlgeschlagen"
      })

    // ── markToolSeenThunk ───────────────────────────────────────────────────
    builder.addCase(markToolSeenThunk.fulfilled, (state, action) => {
      const item = state.items.find((i) => i.key === action.payload)
      if (item) item.is_new = false
    })
  },
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const { unlockTools, markToolSeen, syncToolsByLevel, setToolOwned } =
  toolsSlice.actions

export const selectTools = (state: RootState) => state.tools
export const selectToolByKey = (key: string) => (state: RootState) =>
  state.tools.items.find((i: ToolItem) => i.key === key)

export default toolsSlice.reducer
