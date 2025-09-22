import { motion } from "framer-motion"
import Confetti from "react-confetti"

type Props = {
  level: number
  reward: number
  onClaim: () => void
}

export default function LevelUpOverlay({ level, reward, onClaim }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      {/* 🎉 Confetti dauerhaft aktiv */}
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={true} // läuft permanent
        numberOfPieces={300} // Menge Konfetti
      />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-white rounded-2xl shadow-2xl p-6 text-center max-w-sm"
      >
        <p className="text-6xl mb-4">😃</p>

        <h2 className="text-2xl font-bold text-purple-600">
          Level {level} erreicht!
        </h2>

        <p className="mt-2 text-gray-700 text-lg">
          Du hast <span className="font-bold text-cyan-500">{reward} 💎</span> verdient!
        </p>

        <button
          onClick={onClaim}
          className="mt-6 px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700"
        >
          💎 Einfordern
        </button>
      </motion.div>
    </div>
  )
}
