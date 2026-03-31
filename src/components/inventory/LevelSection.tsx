// components/inventory/LevelSection.tsx

import ItemCard from "./ItemCard"
import type { InventoryItem } from "@api/types"

type Props = {
  level: number | null          // null = Equipped-Section
  items: InventoryItem[]
  isEquippedSection?: boolean   // optional
}

export default function LevelSection({ level, items, isEquippedSection = false }: Props) {
  return (
    <div className="w-full">

      {/* Header */}
      {!isEquippedSection && level !== null && (
        <p className="text-lg font-semibold text-gray-300 mb-3">Level {level}</p>
      )}

      {isEquippedSection && (
        <p className="text-lg font-semibold text-yellow-400 mb-3">Ausgestattet</p>
      )}

      {/* GRID statt flex-col */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <ItemCard key={item.asset_id} item={item} />
        ))}
      </div>

    </div>
  )
}
