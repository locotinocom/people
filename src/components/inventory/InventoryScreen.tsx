// src/components/inventory/InventoryScreen.tsx
import { useEffect, useState } from "react"
import AvatarView from "./AvatarView"
import CategoryBar from "./CategoryBar"
import ItemsPanel from "./ItemsPanel"
import OverviewPanel from "./OverviewPanel"

import { useAppDispatch, useAppSelector } from "@store/hooks"
import { fetchInventory } from "@store/slices/inventorySlice"
import { fetchUserAvatar } from "@store/slices/avatarSlice"
import { useReduxApi } from "@api/reduxApi"

export default function InventoryScreen() {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const [activeCategory, setActiveCategory] = useState("overview")

  const avatar = useAppSelector((s) => s.avatar.avatar)

  useEffect(() => {
    if (api) dispatch(fetchInventory(api))
  }, [api, dispatch])

  useEffect(() => {
    if (api) dispatch(fetchUserAvatar(api))
  }, [api, dispatch])

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">

      {/* Avatar-Anzeige */}
      <div className="h-[55%] border-b border-gray-800 bg-gray-900">
        {avatar ? (
          <AvatarView />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Lade Avatar ...
          </div>
        )}
      </div>

      {/* Kategorie-Bar */}
      <CategoryBar active={activeCategory} onChange={setActiveCategory} />

      {/* Items */}
      <div className="flex-1 overflow-y-auto bg-gray-800">
        {activeCategory === "overview"
          ? <OverviewPanel />
          : <ItemsPanel category={activeCategory} />
        }
      </div>

    </div>
  )
}