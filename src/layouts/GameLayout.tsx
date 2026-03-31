import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

import Header from "../components/Header"
import Footer from "../components/Footer"
import LevelUpOverlay from "@components/LevelUpOverlay"
import GlobalOverlay from "@components/GlobalOverlay"

import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { fetchSessionState, clearSession } from "@store/slices/sessionSlice"
import { fetchProgress, fetchLevelStats, fetchDiamonds } from "@store/slices/gameSlice"
import { fetchUserAvatar } from "@store/slices/avatarSlice"
import { fetchTools } from "@store/slices/toolsSlice"

type Props = { children: ReactNode }

export default function GameLayout({ children }: Props) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  // Wir holen uns Status UND Error aus dem Store
  const { status: sessionStatus, error: sessionError } = useAppSelector((s) => s.session)

  // Merkt sich ob der erste Load bereits abgeschlossen war.
  // Verhindert dass beim Re-fetch (z.B. nach LevelUp) der Loading-Spinner
  // GamePlay.tsx unmountet und den interventionLoadCountRef zurücksetzt.
  const hasBootstrappedRef = useRef(false)

  useEffect(() => {
    if (!api) return
    // NUR wenn idle, wird der Bootstrap gestartet
    if (sessionStatus !== "idle") return

    if (import.meta.env.DEV) console.log("🚀 GameLayout bootstrap (session + data in 1x /game/state)")

    // Alle initialen Daten laden
    dispatch(fetchSessionState(api))
    dispatch(fetchProgress(api))
    dispatch(fetchLevelStats(api))
    dispatch(fetchDiamonds(api))
    dispatch(fetchUserAvatar(api))
    dispatch(fetchTools(api))
  }, [api, sessionStatus, dispatch])

  // Sobald Session einmal "ready" war, merken wir uns das
  useEffect(() => {
    if (sessionStatus === "ready") {
      hasBootstrappedRef.current = true
    }
  }, [sessionStatus])

  // 1. FALL: Fehler aufgetreten (Loop-Bremse aktiv)
  if (sessionStatus === "error") {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center space-y-4 bg-gray-800 p-8 rounded-xl shadow-2xl border border-red-500/50 max-w-md">
          <h2 className="text-2xl font-bold text-red-400">Verbindung fehlgeschlagen</h2>
          <p className="text-gray-300">{sessionError || "Ein unbekannter Fehler ist aufgetreten."}</p>
          <button 
            onClick={() => dispatch(clearSession())} // Setzt Status zurück auf "idle" -> Trigger useEffect
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // 2. FALL: Laden (Verhindert Flackern der UI)
  // WICHTIG: Nur beim ERSTEN Load den Spinner zeigen!
  // Beim Re-fetch (z.B. nach LevelUp via handleClose) darf GamePlay.tsx NICHT unmountet werden,
  // da sonst interventionLoadCountRef zurückgesetzt wird und der Swiper-Jump nicht funktioniert.
  if (sessionStatus === "loading" && !hasBootstrappedRef.current) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Lade Spieldaten...</p>
        </div>
      </div>
    )
  }

  // 3. FALL: Alles okay (Ready)
  return (
    <div className="h-dvh flex items-center justify-center bg-gray-900 text-white">
      <div
        id="overlay-root"
        className="h-full w-full flex flex-col bg-gray-900 sm:rounded-lg sm:shadow-lg sm:max-w-3xl sm:max-h-[700px] overflow-hidden"
      >
        <Header />

<main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {children}
        </main>

        <Footer />

        <LevelUpOverlay />
        <GlobalOverlay />
      </div>
    </div>
  )
}