// src/components/GlobalOverlay.tsx
import { useEffect, useRef } from "react"
import { useAppSelector, useAppDispatch } from "@store/hooks"
import { closeOverlay } from "@store/slices/uiOverlaySlice"
import InventoryScreen from "@components/inventory/InventoryScreen"
import ToolsScreen from "@components/tools/ToolsScreen"
import ProfileScreen from "@components/profile/ProfileScreen"
import { useReduxApi } from "@api/reduxApi"

export default function GlobalOverlay() {
  const active = useAppSelector((s) => s.uiOverlay.active)
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const prevActiveRef = useRef<typeof active>(null)

  useEffect(() => {
    const prev = prevActiveRef.current

    // INVENTORY wurde GESCHLOSSEN
    if (prev === "inventory" && active !== "inventory") {
      if (!api) return
      // ggf. Avatar neu laden etc.
    }

    prevActiveRef.current = active
  }, [active, api])

  if (!active) return null

  const screens: Record<string, React.ReactNode> = {
    inventory: <InventoryScreen />,
    tools:     <ToolsScreen />,
    profile:   <ProfileScreen />,
  }

  // Profil-Overlay: kein eigener Schließen-Button oben rechts –
  // ProfileScreen hat eigene Navigation (Abmelden etc.)
  // Alle anderen Overlays: Schließen-Button oben rechts
  //const hideCloseButton = active === "profile"

  return (
    <div
      id="overlay"
      // fixed statt absolute: verhindert Viewport-Shift wenn mobile Tastatur aufgeht
      className="fixed inset-0 z-[8888] bg-black/60 backdrop-blur-lg flex flex-col"
    >
      <button
        onClick={() => dispatch(closeOverlay())}
        className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl z-10 leading-none"
        aria-label="Schließen"
      >
        ×
      </button>

      <div className="grow overflow-hidden">
        {screens[active] ?? null}
      </div>
    </div>
  )
}
