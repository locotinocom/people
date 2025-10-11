import { fakeApi } from "./fakeApi"
import { liveApi } from "./api"
import type { ApiInterface } from "./types"

let hasLoggedApiMode = false

const USE_FAKE = String(import.meta.env.VITE_USE_FAKE_API).toLowerCase() === "true"
export const api: ApiInterface = USE_FAKE ? fakeApi : liveApi

if (!hasLoggedApiMode) {
  console.info("🔌 Aktiver API-Modus:", USE_FAKE ? "FAKE (LocalStorage)" : "LIVE (Server)")
  hasLoggedApiMode = true
}
