// src/tools/BreathExerciseCore.tsx
// Adapter zwischen BreathTool (BreathPattern-API) und BreathingCircleCore (inhale/hold/exhale-API)

import { memo, useMemo } from "react"
import BreathingCircleCore from "./BreathingCircleCore"

export type BreathPattern = {
  key: string
  label: string
  inhaleSec: number
  holdSec: number
  exhaleSec: number
  durationSec?: number
}

type Props = {
  title: string
  subtitle?: string
  presets: BreathPattern[]
  defaultPresetKey?: string
  allowCustomize?: boolean
  defaultMinutes?: number
  devTag?: string
  onSessionComplete?: () => void
}

function BreathExerciseCore({
  title,
  subtitle,
  presets,
  defaultPresetKey,
  allowCustomize = false,
  defaultMinutes = 5,
  devTag = "BreathExerciseCore",
  onSessionComplete,
}: Props) {
  // BreathPattern (inhaleSec/holdSec/exhaleSec) → Preset (inhale/hold/exhale)
  const mappedPresets = useMemo(
    () =>
      presets.map((p) => ({
        key: p.key,
        label: p.label,
        inhale: p.inhaleSec,
        hold: p.holdSec,
        exhale: p.exhaleSec,
        ...(typeof p.durationSec === "number" ? { durationSec: p.durationSec } : {}),
      })),
    [presets]
  )

  const defaultPreset = presets.find((p) => p.key === defaultPresetKey) ?? presets[0]

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {subtitle && (
        <div className="shrink-0 px-5 pt-5 pb-2">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <BreathingCircleCore
          title={title}
          description=""
          defaultInhale={defaultPreset?.inhaleSec ?? 4}
          defaultHold={defaultPreset?.holdSec ?? 0}
          defaultExhale={defaultPreset?.exhaleSec ?? 6}
          durationMinutes={defaultMinutes}
          allowUserAdjustment={allowCustomize}
          presets={mappedPresets}
          audio={{}}
          devTag={devTag}
          onSessionComplete={onSessionComplete}
        />
      </div>
    </div>
  )
}

export default memo(BreathExerciseCore)
