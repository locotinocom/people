import { useAppSelector } from "@store/hooks"
import LevelSection from "./LevelSection"
import type { InventoryItem } from "@api/types"

type Props = {
  category: string
}

export default function ItemsPanel({ category }: Props) {
  const items = useAppSelector((s) => s.inventory.items) as InventoryItem[]

  // richtig: nach item.type filtern
  const filtered = items.filter((i) => i.type === category)

  // Level-Gruppen extrahieren (required_level)
  const levels = [...new Set(filtered.map((i) => i.required_level))].sort(
    (a, b) => a - b
  )

  if (filtered.length === 0) {
    return (
      <div className="text-gray-400 text-center py-4">
        Keine Items in dieser Kategorie
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {levels.map((lvl) => (
        <LevelSection
          key={lvl}
          level={lvl}
          items={filtered.filter((i) => i.required_level === lvl)}
        />
      ))}
    </div>
  )
}
