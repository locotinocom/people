import { motion } from "framer-motion"

export default function SwipeHint({ text = "Swipe nach oben, um fortzufahren" }) {
  return (
    <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: "mirror" }}
        className="text-gray-400 text-sm flex flex-col items-center"
      >
        {/* Pfeil-Icon */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: -6 }}
          transition={{ duration: 0.9, repeat: Infinity, repeatType: "mirror" }}
          className="text-2xl"
        >
          ↑
        </motion.div>

        {/* Text */}
        <span className="mt-1">{text}</span>
      </motion.div>
    </div>
  )
}
