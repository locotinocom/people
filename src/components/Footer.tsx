import { useAppDispatch, useAppSelector } from "@store/hooks"
import { openOverlay } from "@store/slices/uiOverlaySlice"

export default function Footer() {
  const dispatch = useAppDispatch()
  const active = useAppSelector((s) => s.uiOverlay.active)

  // Anzahl neuer Tools für Badge
  const newToolsCount = useAppSelector(
    (s) => s.tools.items.filter((t) => t.is_new && t.owned).length
  )

  const navBtn = (
    label: string,
    icon: string,
    onClick: () => void,
    isActive = false,
    badge = 0
  ) => (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center text-xs transition
        ${isActive ? "text-purple-400" : "hover:text-blue-400"}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <footer className="h-16 bg-black/50 backdrop-blur flex justify-around items-center">

      {navBtn("Home", "🏠", () => dispatch(openOverlay({ type: null })), active === null)}

      {navBtn(
        "Inventar",
        "🔍",
        () => dispatch(openOverlay({ type: "inventory" })),
        active === "inventory"
      )}

      {navBtn(
        "Tools",
        "🛠",
        () => dispatch(openOverlay({ type: "tools" })),
        active === "tools",
        newToolsCount
      )}

      {navBtn("Profil", "👤", () => dispatch(openOverlay({ type: "profile" })), active === "profile")}

    </footer>
  )
}
