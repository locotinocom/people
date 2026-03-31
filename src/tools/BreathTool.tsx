import { memo } from "react"
import BreathExerciseCore, { type BreathPattern } from "@tools/BreathExerciseCore"

const TOOL_PRESETS: BreathPattern[] = [
  { key: "relax_478", label: "Entspannen (4-7-8)", inhaleSec: 4, holdSec: 7, exhaleSec: 8 },
  { key: "panic_406", label: "Akut runter (4-0-6)", inhaleSec: 4, holdSec: 0, exhaleSec: 6 },
  { key: "focus_4444", label: "Fokus (Box 4-4-4-4)", inhaleSec: 4, holdSec: 4, exhaleSec: 4 },
  { key: "sleep_355", label: "Einschlafen (3-5-5)", inhaleSec: 3, holdSec: 5, exhaleSec: 5 },
]

function BreathTool() {
  return (
    <BreathExerciseCore
      title="Atemübung (Tool)"
      subtitle="Passe die Werte an und nutze es jederzeit."
      presets={TOOL_PRESETS}
      defaultPresetKey="relax_478"
      allowCustomize={true}
      defaultMinutes={5}
      devTag="BreathTool"
    />
  )
}

export default memo(BreathTool)
