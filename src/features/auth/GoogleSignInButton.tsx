import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string
            scope: string
            ux_mode: "popup"
            callback: (response: GoogleCodeResponse) => void
            error_callback?: (error: GoogleCodeClientError) => void
          }) => GoogleCodeClient
        }
      }
    }
  }
}

interface GoogleCodeClient {
  requestCode: () => void
}

interface GoogleCodeResponse {
  code?: string
  scope?: string
  error?: string
}

interface GoogleCodeClientError {
  type: string
  message?: string
}

const CALM_HINT = "Die Google-Anmeldung ist gerade nicht möglich. Nutze bitte das Formular darunter."

let googleScript: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (googleScript) return googleScript
  googleScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Google-Skript konnte nicht geladen werden.")))
      if (window.google) resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google-Skript konnte nicht geladen werden."))
    document.head.appendChild(script)
  })
  return googleScript
}

/**
 * Klassischer OAuth-Code-Flow statt One-Tap/prompt(): Der Klick öffnet das
 * bekannte "Weiter mit Locotino"-Popup mit Konto-/Scope-Auswahl, statt ein
 * bereits im Browser angemeldetes Google-Konto vorauszusetzen. Der Code aus
 * dem Popup geht an onCode() -> useGoogleLogin, das ihn ans Backend schickt,
 * wo er gegen ein id_token eingelöst und wie bisher über Googles JWKS
 * verifiziert wird.
 */
export default function GoogleSignInButton({ onCode }: { onCode: (code: string) => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const codeClientRef = useRef<GoogleCodeClient | null>(null)

  // Ref statt Closure-Dependency: der Google-Client wird nur einmal pro
  // Mount erzeugt, soll aber immer die aktuelle onCode-Prop aufrufen.
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false)
      setMessage(CALM_HINT)
      return
    }

    let cancelled = false

    void loadGoogleScript()
      .then(() => {
        if (cancelled) return
        if (!window.google) throw new Error("Google-Skript nicht verfügbar")

        codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response) => {
            setIsLoading(false)
            if (!response.code) {
              console.warn("[GoogleSignIn] Popup ohne code beendet:", response)
              setMessage(CALM_HINT)
              return
            }
            setMessage(null)
            onCodeRef.current(response.code)
          },
          error_callback: (error) => {
            // Deckt sowohl "Nutzer hat das Popup geschlossen" als auch echte
            // Fehler ab (z.B. popup_closed, popup_failed_to_open). Details
            // nur ins Log, UI bleibt ruhig.
            console.warn("[GoogleSignIn] Popup abgebrochen oder fehlgeschlagen:", error)
            setIsLoading(false)
            setMessage(CALM_HINT)
          },
        })

        setIsLoading(false)
      })
      .catch((error) => {
        if (cancelled) return
        console.warn("[GoogleSignIn] Initialisierung fehlgeschlagen:", error)
        setIsLoading(false)
        setMessage(CALM_HINT)
      })

    return () => {
      cancelled = true
      codeClientRef.current = null
    }
  }, [clientId])

  const handleClick = () => {
    if (isLoading || !codeClientRef.current) return
    setMessage(null)
    setIsLoading(true)

    try {
      codeClientRef.current.requestCode()
    } catch (error) {
      console.warn("[GoogleSignIn] requestCode() fehlgeschlagen:", error)
      setIsLoading(false)
      setMessage(CALM_HINT)
    }
  }

  return (
    <div className="w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={isLoading}
        onClick={handleClick}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 text-gray-300 transition-all hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" role="img">
            <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.21Z" />
            <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.75Z" />
            <path fill="#FBBC05" d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.27.31-1.85V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.37l3.24-2.52Z" />
            <path fill="#EA4335" d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.23 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.52C7.31 7.84 9.46 6.12 12 6.12Z" />
          </svg>
        </span>
        <span>Weiter mit Google</span>
      </button>
      {message && <p className="mt-3 text-center text-sm text-gray-400">{message}</p>}
    </div>
  )
}
