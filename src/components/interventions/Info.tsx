import { motion } from "framer-motion"

type InfoProps = {
  title?: string
  message: string
}
const avatarId = localStorage.getItem("avatarId")
console.log("Gefundene Avatar-ID:", avatarId)

export default function Info({ title = "Info", message }: InfoProps) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center text-center px-6 relative">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
        {title} 🎉
      </h1>

      {/* Message */}
      <p className="text-lg md:text-xl text-white leading-relaxed mb-16">
        {message} 🤩✨
      </p>

      {/* Swipe Up Arrow Animation */}
      <motion.div
        className="absolute bottom-10 flex flex-col items-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span className="text-white text-sm mb-1">Nach oben wischen</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="white"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l-7-7-7 7" />
        </svg>
      </motion.div>
    </div>
  )
}
