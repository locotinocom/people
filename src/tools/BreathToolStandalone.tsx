// src/tools/BreathToolStandalone.tsx
// Standalone-Version der Atemübung – volle Kontrolle, keine Intervention-Logik
import { memo } from "react"
import BreathingCircleCore from "./BreathingCircleCore"

const STANDALONE_PRESETS = [
  { key: "relax_406",  label: "Runterfahren (4-0-6)",  inhale: 4, hold: 0, exhale: 6 },
  { key: "relax_478",  label: "Entspannen (4-7-8)",    inhale: 4, hold: 7, exhale: 8 },
  { key: "box_4444",   label: "Fokus / Box (4-4-4-4)", inhale: 4, hold: 4, exhale: 4 },
  { key: "sleep_355",  label: "Einschlafen (3-5-5)",   inhale: 3, hold: 5, exhale: 5 },
]

function BreathToolStandalone() {
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <h2 className="text-xl font-bold text-white">🫁 Atemübung</h2>
        <p className="text-sm text-white/50 mt-0.5">
          Wähle ein Preset oder stelle die Werte individuell ein.
        </p>
      </div>

      {/* Core */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <BreathingCircleCore
          title="Atemübung"
          description=""
          defaultInhale={4}
          defaultHold={0}
          defaultExhale={6}
          durationMinutes={5}
          allowUserAdjustment={true}
          presets={STANDALONE_PRESETS}
          audio={{}}
          devTag="BreathToolStandalone"
        />
      </div>
    </div>
  )
}

export default memo(BreathToolStandalone)
