//import { useRef } from "react"
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader"
import { createBaseApi } from "./reduxApiBase"

// 🔴 EINMALIG pro Modul
let apiSingleton: ReturnType<typeof createBaseApi> | null = null
let authHeaderRef: { current: string | null } = { current: null }

export function useReduxApi() {
  const authHeader = useAuthHeader()

  // immer aktuell halten
  authHeaderRef.current = authHeader ?? null

  // API genau einmal erzeugen
  if (!apiSingleton) {
    apiSingleton = createBaseApi(() => authHeaderRef.current ?? undefined)

    if (import.meta.env.DEV) {
      ;(apiSingleton as any).__createdAt = Date.now()
      console.log("API CREATED (SINGLETON)", (apiSingleton as any).__createdAt)
    }
  }

  return apiSingleton
}
