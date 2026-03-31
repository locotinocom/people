import { configureStore } from "@reduxjs/toolkit"
import dataReducer from "./slices/dataSlice"
import gameReducer from "./slices/gameSlice"
import gameActionsReducer from "./slices/gameActionsSlice"
import avatarReducer from "./slices/avatarSlice"
import inventoryReducer from "./slices/inventorySlice"
import uiOverlayReducer from "./slices/uiOverlaySlice"
import sessionReducer from "./slices/sessionSlice"
import toolsReducer from "./slices/toolsSlice"

export const store = configureStore({
  reducer: {
    data: dataReducer,
    game: gameReducer,
    gameActions: gameActionsReducer,
    avatar: avatarReducer,
    inventory: inventoryReducer,
    uiOverlay: uiOverlayReducer,
    session: sessionReducer,
    tools: toolsReducer,
  },
  // keine extraArgument-API mehr
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
