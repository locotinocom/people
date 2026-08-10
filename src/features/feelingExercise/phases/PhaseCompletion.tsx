// src/features/feelingExercise/phases/PhaseCompletion.tsx
// Phase 8 – Abschluss (Level-Modus: XP + Tool-Freischaltung; Standalone: kurze Bestätigung)
import { useEffect } from "react"
import { motion } from "framer-motion"
import type { ExerciseMode } from "../types"

interface Props {
  mode: ExerciseMode
  opponentAnimalName?: string
  onDone: () => void
}

export default function PhaseCompletion({ mode, opponentAnimalName, onDone }: Props) {
  // Im Standalone-Modus nach kurzer Zeit automatisch abschließen (optional)
  useEffect(() => {
    if (mode === "standalone") {
      const timer = setTimeout(onDone, 8000)
      return () => clearTimeout(timer)
    }
  }, [mode, onDone])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full items-center justify-center p-8 text-white text-center"
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #111827 60%, #0f172a 100%)",
      }}
    >
      {/* Emoji */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-5xl mb-6"
      >
        💛
      </motion.div>

      {/* Nachricht */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/8 rounded-2xl rounded-tl-sm px-5 py-4 text-left mb-6">
          {mode === "level" ? (
            <>
              <p className="text-white/90 text-sm leading-relaxed">
                Du hast heute etwas Wichtiges getan: Du hast ein unangenehmes Gefühl nicht weggeschoben – du hast es gefühlt. Das ist der Beginn von echtem Wandel. 💛
              </p>
              <p className="text-white/90 text-sm leading-relaxed mt-3">
                Das Tool „Gefühle zulassen" wurde freigeschaltet. Du kannst es jederzeit nutzen, wenn dich eine Situation beschäftigt.
              </p>
              {opponentAnimalName && (
                <p className="text-white/90 text-sm leading-relaxed mt-3">
                  Im Laufe deiner Reise wirst du deine Gefühle rund um {opponentAnimalName} direkt konfrontieren. Heute hast du den ersten Schritt gemacht.
                </p>
              )}
            </>
          ) : (
            <p className="text-white/90 text-sm leading-relaxed">
              Gut gemacht. Du hast dir Zeit genommen, etwas zu fühlen – das ist nicht selbstverständlich. 💛
            </p>
          )}
        </div>

        {/* Weiter-Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all shadow-lg"
        >
          {mode === "level" ? "Level abschließen ✓" : "Fertig"}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
