import { motion, AnimatePresence } from "framer-motion"

export function AnimationOverlay({ active }: { active: string | null }) {
  if (!active) return null

  const base =
    "fixed inset-0 pointer-events-none flex items-center justify-center z-[9999] select-none"

  switch (active) {
    case "levelup":
      return (
        <AnimatePresence>
          <motion.div
            key="levelup"
            className={base}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="bg-yellow-400/80 text-white px-8 py-4 rounded-2xl text-4xl font-extrabold shadow-lg">
              LEVEL&nbsp;UP!
            </div>
          </motion.div>
        </AnimatePresence>
      )

    case "check":
      return (
        <AnimatePresence>
          <motion.div
            key="check"
            className={base}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-green-400 text-5xl font-bold drop-shadow-lg">
              ✅
            </div>
          </motion.div>
        </AnimatePresence>
      )

    case "meditation":
      return (
        <AnimatePresence>
          <motion.div
            key="meditation"
            className={base}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <div className="animate-pulse text-indigo-400 text-3xl font-semibold opacity-90">
              🧘‍♀️&nbsp;Ruhe
            </div>
          </motion.div>
        </AnimatePresence>
      )

    default:
      return null
  }
}
