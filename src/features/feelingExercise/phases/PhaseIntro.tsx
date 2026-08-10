// src/features/feelingExercise/phases/PhaseIntro.tsx
// Phase 0 – Intro (nur mode="level")
import { motion } from "framer-motion"
import AvatarBubble from "../../../ui/AvatarBubble"

interface Props {
  levelNumber: number
  onComplete: () => void
}

export default function PhaseIntro({ levelNumber, onComplete }: Props) {
  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit Avatar */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble
          title="Jetzt ist es an der Zeit, etwas tiefer zu gehen."
          subtitle="In diesem Level lernst du, in unangenehmen Situationen bewusst wahrzunehmen, was du wirklich fühlst – und das in einer sicheren Umgebung, genau hier."
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onComplete}
            className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
          >
            Los geht's →
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
