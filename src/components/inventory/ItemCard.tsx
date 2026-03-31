// src/components/inventory/ItemCard.tsx
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { updateLayer, resolveDefaultLayers } from "@store/slices/avatarSlice"
import type { AvatarLayerKey } from "@store/slices/avatarSlice"
import {
  buyAssetThunk,
  equipAssetThunk,
  unequipAssetThunk,
} from "@store/slices/inventorySlice"
import { fetchDiamonds } from "@store/slices/gameSlice"
import type { InventoryItem } from "@api/types"
import { useReduxApi } from "@api/reduxApi"
import PurchaseSuccessToast from "@components/PurchaseSuccessToast"
import InsufficientDiasToast from "@components/InsufficientDiasToast"

type Props = {
  item: InventoryItem
}

export default function ItemCard({ item }: Props) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const avatar = useAppSelector((s) => s.avatar.avatar)
  const diamondBalance = useAppSelector((s) => s.game.diamondBalance)

  // Lokaler Kauf-State (verhindert Race-Condition)
  const [buying, setBuying] = useState(false)
  const [justBought, setJustBought] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showNoDiasToast, setShowNoDiasToast] = useState(false)

  const locked = !item.unlocked
  // owned = entweder vom Backend oder gerade lokal gekauft
  const owned = item.owned || justBought
  const equipped = item.equipped
  const canAfford = diamondBalance >= item.price_dias

  // ---------------------------
  // ACTIONS
  // ---------------------------

  const handleBuy = async () => {
    if (!api || locked || owned || buying) return
    // Zu wenig Dias → freundliche Meldung statt blockierter Button
    if (!canAfford) {
      setShowNoDiasToast(true)
      setTimeout(() => setShowNoDiasToast(false), 3000)
      return
    }
    setBuying(true)
    try {
      const result = await dispatch(buyAssetThunk({ api, assetId: item.id })).unwrap()
      if (result.success) {
        setJustBought(true)
        setShowToast(true)
        dispatch(fetchDiamonds(api))
        setTimeout(() => setShowToast(false), 2500)
      }
    } catch (err) {
      console.error("Kauf fehlgeschlagen:", err)
    } finally {
      setBuying(false)
    }
  }

  const handleEquip = async () => {
    // Nur wenn wirklich owned (Backend-State ODER gerade gekauft)
    if (!api || locked || !owned) return
    console.log("Equip Asset:", item.name, "(ID:", item.id, ")")
    await dispatch(equipAssetThunk({ api, assetId: item.id })).unwrap()

    // Layer sofort updaten
    if (avatar) {
      const category = item.type as AvatarLayerKey
      const svgPath = `/avatars/${avatar.avatar_id}/${category}/${item.name}.svg`
      dispatch(updateLayer({ category, svgPath }))
    }
  }

  const handleUnequip = async () => {
    if (!api || !equipped) return

    await dispatch(unequipAssetThunk({ api, assetId: item.id })).unwrap()

    // Layer entfernen oder Default wiederherstellen
    if (avatar) {
      const category = item.type as AvatarLayerKey
      const defaults = resolveDefaultLayers(avatar.avatar_id)
      const hasDefault = !!defaults[category]

      dispatch(updateLayer({
        category,
        svgPath: hasDefault ? defaults[category]! : null,
      }))
    }
  }

  // COLOR STATES
  const borderColor = equipped ? "border-yellow-500" : "border-gray-700"

  return (
    <>
      {/* Kauf-Erfolgs-Toast */}
      <PurchaseSuccessToast
        visible={showToast}
        icon={item.icon_url}
        iconIsUrl={true}
        name={item.description || item.name}
      />

      <div
        className={`relative bg-gray-900 rounded-xl border ${borderColor} p-3 flex flex-col items-center gap-2
                    ${locked ? "opacity-40" : ""}`}
      >
        {/* Thumbnail */}
        <img
          src={item.icon_url}
          className="w-24 h-24 object-contain rounded-md bg-black/40"
        />

        {/* Equipped Badge */}
        {equipped && (
          <span className="absolute top-2 right-2 text-xs bg-yellow-600 px-2 py-0.5 rounded">
            Aktiv
          </span>
        )}

        {/* Locked Overlay */}
        {locked && (
          <span className="absolute bottom-2 text-xs bg-gray-700 px-2 py-0.5 rounded">
            Level {item.required_level}
          </span>
        )}

        {/* Kaufen – nur wenn nicht owned und nicht locked */}
          {!locked && !owned && (
            <button
              onClick={handleBuy}
              disabled={buying}
              className={`w-full py-1 rounded text-sm transition
                ${buying
                  ? "bg-gray-500 cursor-wait"
                  : canAfford
                  ? "bg-purple-700 hover:bg-purple-600"
                  : "bg-purple-900/70 hover:bg-purple-800/80 text-purple-200"
                }`}
            >
              {buying ? "..." : `Kaufen – ${item.price_dias} 💎`}
            </button>
          )}

        {/* Ausstatten – NUR wenn owned UND nicht equipped */}
        {!locked && owned && !equipped && (
          <button
            onClick={handleEquip}
            className="w-full py-1 rounded bg-green-700 hover:bg-green-600 text-sm transition"
          >
            Ausstatten
          </button>
        )}

        {/* Ablegen */}
        {equipped && (
          <button
            onClick={handleUnequip}
            className="w-full py-1 rounded bg-red-700 hover:bg-red-600 text-sm transition"
          >
            Ablegen
          </button>
        )}

        {/* Name */}
        <p className="text-xs text-gray-300 text-center">{item.description}</p>
      </div>

      {/* Zu-wenig-Dias Toast */}
      <InsufficientDiasToast visible={showNoDiasToast} needed={item.price_dias} />
    </>
  )
}
