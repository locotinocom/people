// src/components/inventory/OverviewPanel.tsx
import { useAppSelector } from "@store/hooks"
import ItemCard from "./ItemCard"
import type { InventoryItem } from "@api/types"

export default function OverviewPanel() {
  const items = useAppSelector((s) => s.inventory.items) as InventoryItem[]

  // Aktuell angezogene Items
  const equippedItems = items.filter((i) => i.equipped === true)

  // Alle Level-Gruppen aus allen Items
  const levels = [...new Set(items.map((i) => i.required_level))].sort(
    (a, b) => a - b
  )

  return (
    <div className="p-4 space-y-6">

      {/* Aktuell angezogen */}
      <div>
        <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
          ✨ Aktuell angezogen
        </h2>
        {equippedItems.length === 0 ? (
          <p className="text-gray-500 text-sm">Noch nichts ausgestattet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {equippedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700" />

      {/* Alle Items nach Level */}
      {levels.map((lvl) => {
        const levelItems = items.filter((i) => i.required_level === lvl)
        return (
          <div key={lvl}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Level {lvl}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {levelItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}