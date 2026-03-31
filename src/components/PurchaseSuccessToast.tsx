// src/components/PurchaseSuccessToast.tsx
// Kurze Erfolgs-Animation nach einem Kauf (Asset oder Tool)
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  visible: boolean
  icon?: string        // Emoji oder URL
  iconIsUrl?: boolean  // true → <img>, false → Emoji-Text
  name: string
  onDone?: () => void
}

export default function PurchaseSuccessToast({
  visible,
  icon = "🎉",
  iconIsUrl = false,
  name,
  onDone,
}: Props) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="purchase-toast"
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3 max-w-[260px] text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
              className="w-20 h-20 flex items-center justify-center"
            >
              {iconIsUrl ? (
                <img
                  src={icon}
                  alt={name}
                  className="w-20 h-20 object-contain rounded-xl"
                />
              ) : (
                <span className="text-6xl select-none">{icon}</span>
              )}
            </motion.div>

            {/* Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 400 }}
              className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center -mt-1"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <p className="text-gray-800 font-bold text-base leading-tight">
              {name}
            </p>
            <p className="text-green-600 font-semibold text-sm">Erfolgreich gekauft! 🎉</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
