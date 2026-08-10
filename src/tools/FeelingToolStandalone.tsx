// src/tools/FeelingToolStandalone.tsx
// Standalone-Version der Fühl-Übung – für den Tools-Screen
// Kein Level-Intro, kein XP-Level-Up – direkt zur Atemübung
import { memo } from "react"
import { FeelingExercise } from "../features/feelingExercise"
import type { FeelingExerciseResult } from "../features/feelingExercise"

function FeelingToolStandalone() {
  const handleComplete = (_result: FeelingExerciseResult) => {
    // Im Standalone-Modus: kein Level-Up, kein XP-Dispatch
    // Ergebnis könnte für spätere Auswertung gespeichert werden
    if (import.meta.env.DEV) {
      console.log("🌊 FeelingToolStandalone complete:", _result)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
      <FeelingExercise
        mode="standalone"
        onComplete={handleComplete}
      />
    </div>
  )
}

export default memo(FeelingToolStandalone)
