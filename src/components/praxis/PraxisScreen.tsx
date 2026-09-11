// src/components/praxis/PraxisScreen.tsx
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import { fetchPraxisContentPool, selectPraxisItems, selectPraxisContentPool } from "@store/slices/praxisSlice"
import type { PraxisContentItem } from "@api/types"
import PraxisItemCard from "./PraxisItemCard"

export default function PraxisScreen() {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const praxisItems = useAppSelector(selectPraxisItems)
  const contentPool = useAppSelector(selectPraxisContentPool)

  useEffect(() => {
    if (contentPool.length === 0) {
      dispatch(fetchPraxisContentPool(api))
    }
  }, [dispatch, api, contentPool.length])

  // Content-Map für schnellen Lookup
  const contentMap: Record<string, PraxisContentItem> = contentPool.reduce(
    (acc, item) => {
      acc[item.contentKey] = item
      return acc
    },
    {} as Record<string, PraxisContentItem>
  )

  // Filtere Items
  const pendingItems = praxisItems.filter((i) => i.status === "pending")
  const activeItems = praxisItems.filter((i) => i.status === "active")
  const completedItems = praxisItems.filter((i) => i.status === "completed")
  const dismissedItems = praxisItems.filter((i) => i.status === "dismissed")

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        <div className="w-full max-w-2xl mx-auto px-5 pt-5 pb-3">
          <h2 className="text-xl font-bold text-white">📋 Aufgaben (Praxis-Schicht)</h2>
          <p className="text-sm text-white/50 mt-0.5">
            Kleine Aufgaben für deinen Alltag – erledige sie und sammle Diamanten
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Pending Items Section */}
          {pendingItems.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                ⏳ Verfügbar
              </h3>
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <PraxisItemCard
                    key={item.id}
                    item={item}
                    contentDef={contentMap[item.contentKey]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Active Items Section (Countdown läuft) */}
          {activeItems.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                🔥 Läuft
              </h3>
              <div className="space-y-3">
                {activeItems.map((item) => (
                  <PraxisItemCard
                    key={item.id}
                    item={item}
                    contentDef={contentMap[item.contentKey]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Items Section */}
          {completedItems.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                ✓ Erledigt ({completedItems.length})
              </h3>
              <div className="space-y-3">
                {completedItems.map((item) => (
                  <PraxisItemCard
                    key={item.id}
                    item={item}
                    contentDef={contentMap[item.contentKey]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dismissed Items Section */}
          {dismissedItems.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                ⊘ Weggelickt ({dismissedItems.length})
              </h3>
              <div className="space-y-3 opacity-60">
                {dismissedItems.map((item) => (
                  <PraxisItemCard
                    key={item.id}
                    item={item}
                    contentDef={contentMap[item.contentKey]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {praxisItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-sm">Herzlichen Glückwunsch!</p>
              <p className="text-xs mt-1">
                Du hast alle Aufgaben erledigt. Das nächste Item kommt in ca. 48h.
              </p>
            </div>
          )}

          {/* Loading State */}
          {praxisItems.length === 0 && contentPool.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40">
              <div className="animate-spin text-2xl mb-3">⏳</div>
              <p className="text-sm">Lädt Aufgaben...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
