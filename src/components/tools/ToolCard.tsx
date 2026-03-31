// src/components/tools/ToolCard.tsx
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { buyToolThunk } from "@store/slices/toolsSlice"
import { openTool } from "@store/slices/uiOverlaySlice"
import { fetchDiamonds } from "@store/slices/gameSlice"
import { useReduxApi } from "@api/reduxApi"
import type { ToolItem } from "@api/types"
import PurchaseSuccessToast from "@components/PurchaseSuccessToast"
import InsufficientDiasToast from "@components/InsufficientDiasToast"

type Props = {
  tool: ToolItem
}

export default function ToolCard({ tool }: Props) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const diamondBalance = useAppSelector((s) => s.game.diamondBalance)
  const userLevel = useAppSelector((s) => s.game.level)

  const [buying, setBuying] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showNoDiasToast, setShowNoDiasToast] = useState(false)

  const locked = !tool.unlocked || userLevel < tool.required_level
  const owned = tool.owned
  const canAfford = diamondBalance >= tool.price_dias

  const handleBuy = async () => {
    if (!api || locked || owned || buying) return
    // Zu wenig Dias → freundliche Meldung
    if (!canAfford) {
      setShowNoDiasToast(true)
      setTimeout(() => setShowNoDiasToast(false), 3000)
      return
    }
    setBuying(true)
    try {
      const result = await dispatch(buyToolThunk({ api, toolKey: tool.key }))
      if (buyToolThunk.fulfilled.match(result)) {
        dispatch(fetchDiamonds(api))
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2500)
      }
    } finally {
      setBuying(false)
    }
  }

  const handleOpen = () => {
    if (!owned) return
    dispatch(openTool(tool.key))
  }

  return (
    <>
      {/* Kauf-Erfolgs-Toast */}
      <PurchaseSuccessToast
        visible={showToast}
        icon={tool.icon}
        iconIsUrl={false}
        name={tool.name}
      />

      <div
        className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-all
          ${locked
            ? "bg-gray-800/60 border-gray-700 opacity-50"
            : owned
            ? "bg-gray-800 border-purple-600/60 shadow-lg shadow-purple-900/20"
            : "bg-gray-800 border-gray-600"
          }`}
      >
        {/* Neu-Badge */}
        {tool.is_new && owned && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">
            NEU
          </span>
        )}

        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          <div className="text-4xl select-none w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl">
            {tool.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base leading-tight">{tool.name}</h3>
            {locked && (
              <span className="text-xs text-amber-400 font-medium">
                🔒 Ab Level {tool.required_level}
              </span>
            )}
            {!locked && !owned && (
              <span className="text-xs text-cyan-400 font-medium">
                {tool.price_dias} 💎
              </span>
            )}
            {owned && (
              <span className="text-xs text-green-400 font-medium">✓ Freigeschaltet</span>
            )}
          </div>
        </div>

        {/* Beschreibung */}
        <p className="text-sm text-white/60 leading-relaxed">{tool.description}</p>

        {/* Vorschaubild (optional) */}
        {tool.previewImage && (
          <img
            src={tool.previewImage}
            alt={tool.name}
            className="w-full h-28 object-cover rounded-xl opacity-80"
          />
        )}

        {/* Kaufen-Button */}
        {!locked && !owned && (
          <button
            onClick={handleBuy}
            disabled={buying}
            className={`w-full py-2 rounded-xl font-semibold text-sm transition
              ${buying
                ? "bg-gray-600 cursor-wait text-gray-300"
                : canAfford
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-purple-900/70 hover:bg-purple-800/80 text-purple-200"
              }`}
          >
            {buying ? "..." : `Kaufen – ${tool.price_dias} 💎`}
          </button>
        )}

        {/* Öffnen-Button */}
        {owned && (
          <button
            onClick={handleOpen}
            className="w-full py-2 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white transition"
          >
            Öffnen →
          </button>
        )}

        {/* Gesperrt-Hinweis */}
        {locked && (
          <div className="w-full py-2 rounded-xl text-center text-xs text-gray-500 bg-gray-700/50">
            Erreiche Level {tool.required_level} zum Freischalten
          </div>
        )}
      </div>

      {/* Zu-wenig-Dias Toast */}
      <InsufficientDiasToast visible={showNoDiasToast} needed={tool.price_dias} />
    </>
  )
}
