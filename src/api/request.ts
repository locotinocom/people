import type { ApiResponse } from "./types"
import { toast } from "react-hot-toast"
//import { getRandomErrorIcon } from "@utils/errorIcons"

const BASE_URL = import.meta.env.VITE_API_URL

// Speicher für laufende Requests, Cache und Fehler-Sperren
const IN_FLIGHT = new Map<string, Promise<ApiResponse<any>>>()
const GET_CACHE = new Map<string, { expires: number; value: ApiResponse<any> }>()
const RECENT_ERRORS = new Map<string, number>()

/**
 * Löscht alle GET-Cache-Einträge, deren URL den angegebenen Teilstring enthält.
 * Muss nach schreibenden Operationen (completeIntervention, saveProgress) aufgerufen
 * werden, damit die nächsten GET-Requests frische Daten vom Server holen.
 */
export function invalidateCacheFor(...urlParts: string[]): void {
  for (const [key] of GET_CACHE) {
    if (urlParts.some((part) => key.includes(part))) {
      GET_CACHE.delete(key)
    }
  }
}

// NEU: Globaler Stopper bei schweren Serverfehlern (Status 500)
let GLOBAL_ERROR_LOCKOUT = 0;

const GET_CACHE_TTL = 5_000 
const ERROR_COOLDOWN = 4_000 // Einzelsperre für eine URL
const GLOBAL_LOCKOUT_MS = 4_000 // Gesamtsperre für alle URLs bei Crash

function makeKey(url: string, options: RequestInit, authHeader?: string) {
  const method = (options.method ?? "GET").toUpperCase()
  const body = options.body ? String(options.body) : ""
  return `${method}|${authHeader ?? ""}|${url}|${body}`
}

export async function request<T>(
  url: string,
  options: RequestInit = {},
  authHeader?: string
): Promise<ApiResponse<T>> {
  // 1. GLOBALER LOCKOUT CHECK
  // Wenn der Server vor kurzem gecrasht ist, blockieren wir sofort alles.
  if (Date.now() < GLOBAL_ERROR_LOCKOUT) {
    throw new Error("SILENT_CANCEL");
  }

  const key = makeKey(url, options, authHeader)
  const method = (options.method ?? "GET").toUpperCase()

  // 2. EINZEL-COOLDOWN CHECK
  const lastErrorTime = RECENT_ERRORS.get(key)
  if (lastErrorTime && Date.now() - lastErrorTime < ERROR_COOLDOWN) {
    throw new Error("SILENT_CANCEL")
  }

  // 3. GET CACHE
  if (method === "GET") {
    const cached = GET_CACHE.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.value as ApiResponse<T>
    }
  }

  // 4. DEDUPLIZIERUNG (In-Flight)
  const existing = IN_FLIGHT.get(key)
  if (existing) {
    return existing as Promise<ApiResponse<T>>
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...options.headers,
  }

  const promise = (async (): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(BASE_URL + url, {
        ...options,
        headers,
      })

      // --- SCHWERER SERVERFEHLER (Status 500) ---
      if (response.status >= 500) {
        GLOBAL_ERROR_LOCKOUT = Date.now() + GLOBAL_LOCKOUT_MS;
        toast.error("Kritischer Serverfehler (500). Ich pausiere kurz...");
        throw new Error("SERVER_CRASH");
      }

      const text = await response.text();
      let json: ApiResponse<T>;

      try {
        json = JSON.parse(text);
      } catch (err) {
        // --- UNGÜLTIGES FORMAT (HTML statt JSON) ---
        GLOBAL_ERROR_LOCKOUT = Date.now() + GLOBAL_LOCKOUT_MS;
        console.error("❌ JSON Fehler (wahrscheinlich HTML Error Page):", text.substring(0, 100));
        toast.error("Serverfehler: Ungültiges Datenformat.");
        throw new Error("INVALID_JSON");
      }

      // API meldet success: false
     if (json.success === false || (!json.success && json.message)) {
       // In deiner request.ts beim Fehler-Handling:
const msg = json.message || json.error || "Ein Fehler ist aufgetreten";

// Falls msg ein Objekt ist (was bei CakePHP Fehlern passieren kann), 
// mache einen String daraus:
const finalMessage = typeof msg === 'object' ? JSON.stringify(msg) : msg;

toast.error(finalMessage);
      }

      // Erfolg: Sperren löschen
      RECENT_ERRORS.delete(key);
      if (method === "GET") {
        GET_CACHE.set(key, { expires: Date.now() + GET_CACHE_TTL, value: json })
      }

      return json
    } catch (error: any) {
      throw error;
    }
  })()

  IN_FLIGHT.set(key, promise)
  promise.finally(() => IN_FLIGHT.delete(key))

  return promise
}