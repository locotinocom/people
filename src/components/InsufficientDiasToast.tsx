// src/components/InsufficientDiasToast.tsx
// Freundliche Meldung wenn der User zu wenig Diamanten hat
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  visible: boolean
  needed: number
}

export default function InsufficientDiasToast({ visible, needed }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="no-dias-toast"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3 max-w-[300px]">
            <span className="text-2xl select-none mt-0.5">💎</span>
            <div>
              <p className="text-white font-semibold text-sm leading-snug">
                Noch {needed} 💎 benötigt
              </p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Führe deine Reise fort, um mehr Diamanten zu verdienen!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
