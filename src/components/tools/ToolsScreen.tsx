// src/components/tools/ToolsScreen.tsx
// Eigener Screen für alle Tools – erreichbar über Footer "Tools"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { syncToolsByLevel, markToolSeen, selectTools } from "@store/slices/toolsSlice"
import { closeTool } from "@store/slices/uiOverlaySlice"
import ToolCard from "./ToolCard"
import BreathToolStandalone from "@tools/BreathToolStandalone"
import GroundingToolStandalone from "@tools/GroundingToolStandalone"
import FeelingToolStandalone from "@tools/FeelingToolStandalone"
import TheWorkToolStandalone from "@tools/TheWorkToolStandalone"
import GratitudeToolStandalone from "@tools/GratitudeToolStandalone"

/** Mapping: toolKey → Standalone-Komponente */
const TOOL_COMPONENTS: Record<string, React.ReactNode> = {
  breath_tool: <BreathToolStandalone />,
  grounding_tool: <GroundingToolStandalone />,
  feeling_tool: <FeelingToolStandalone />,
  the_work_tool: <TheWorkToolStandalone />,
  gratitude_tool: <GratitudeToolStandalone onClose={() => {}} />,
}

export default function ToolsScreen() {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector(selectTools)
  const userLevel = useAppSelector((s) => s.game.level)
  const activeToolKey = useAppSelector((s) => s.uiOverlay.activeToolKey)

  useEffect(() => {
    dispatch(syncToolsByLevel(userLevel))
  }, [dispatch, userLevel])

  useEffect(() => {
    if (activeToolKey) {
      dispatch(markToolSeen(activeToolKey))
    }
  }, [activeToolKey, dispatch])

  if (activeToolKey) {
    const ToolComponent = TOOL_COMPONENTS[activeToolKey]

    return (
      <div className="w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
        {/* Zurück-Bereich */}
        <div className="shrink-0 border-b border-white/10">
          <div className="w-full max-w-2xl mx-auto px-5 pt-4 pb-2">
            <button
              onClick={() => dispatch(closeTool())}
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition"
            >
              ← Zurück
            </button>
          </div>
        </div>

        {/* Tool-Inhalt */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto h-full px-4 py-4">
            {ToolComponent ?? (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                Tool nicht gefunden
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const unlockedTools = items.filter((t) => t.unlocked)
  const lockedTools = items.filter((t) => !t.unlocked)

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        <div className="w-full max-w-2xl mx-auto px-5 pt-5 pb-3">
          <h2 className="text-xl font-bold text-white">🛠 Meine Tools</h2>
          <p className="text-sm text-white/50 mt-0.5">
            Freischaltbare Hilfsmittel für deinen Alltag
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-4">
          {unlockedTools.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                Verfügbar
              </h3>
              <div className="space-y-3">
                {unlockedTools.map((tool) => (
                  <ToolCard key={tool.key} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {lockedTools.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                Noch gesperrt
              </h3>
              <div className="space-y-3">
                {lockedTools.map((tool) => (
                  <ToolCard key={tool.key} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40">
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-sm">Noch keine Tools verfügbar.</p>
              <p className="text-xs mt-1">
                Steige im Level auf, um Tools freizuschalten.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}