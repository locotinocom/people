// src/store/hooks.ts
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "./store"

// Typsichere Versionen der Standard-Hooks
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector = useSelector.withTypes<RootState>()
