import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { FaGem } from "react-icons/fa"
import { useGame } from "../context/GameContext"

export default function RewardTest({ xpTargetRef, diaTargetRef }: any) {
  const { addXp, addDias } = useGame()
  const buttonXpRef = useRef<HTMLButtonElement>(null)
  const buttonDiaRef = useRef<HTMLButtonElement>(null)

  const [xpParticles, setXpParticles] = useState<any[]>([])
  const [diaParticles, setDiaParticles] = useState<any[]>([])

  const spawnXp = () => {
    if (!xpTargetRef.current || !buttonXpRef.current) return
    const target = xpTargetRef.current.getBoundingClientRect()
    const start = buttonXpRef.current.getBoundingClientRect()

    const dx = target.left + target.width / 2 - (start.left + start.width / 2)
    const dy = target.top - start.top

    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      dx,
      dy,
    }))
    setXpParticles(newParticles)

    // Cleanup leicht nach der Animation
    setTimeout(() => setXpParticles([]), 1400)
  }

  const spawnDias = () => {
    if (!diaTargetRef.current || !buttonDiaRef.current) return
    const target = diaTargetRef.current.getBoundingClientRect()
    const start = buttonDiaRef.current.getBoundingClientRect()

    const dx = target.left - start.left
    const dy = target.top - start.top

    const newParticles = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      dx,
      dy,
    }))
    setDiaParticles(newParticles)

    // Wichtig: länger warten als transition.duration (1.5s)
    setTimeout(() => setDiaParticles([]), 1800)
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-6 bg-zinc-900 text-white">
      {/* Buttons */}
      <div className="flex gap-4">
        <button
          ref={buttonXpRef}
          onClick={spawnXp}
          className="px-4 py-2 bg-blue-500 rounded-lg shadow hover:bg-blue-600 transition"
        >
          +20 XP
        </button>
        <button
          ref={buttonDiaRef}
          onClick={spawnDias}
          className="px-4 py-2 bg-pink-500 rounded-lg shadow hover:bg-pink-600 transition"
        >
          +3 Dias
        </button>
      </div>

      {/* XP Particles */}
      {xpParticles.map((p, idx) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale:10 }}
          animate={{
            x: p.dx + (Math.random() - 0.5) * 50,
            y: p.dy - 50 + Math.random() * 30,
            opacity: 0,
            scale: 1,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.2 }}
          onAnimationComplete={() => {
            if (idx === xpParticles.length - 1) {
              console.log("XP angekommen!") // ✅ Debug
              addXp(20)
            }
          }}
          className="absolute text-green-400 font-bold"
        >
          +XP
        </motion.span>
      ))}

      {/* Dia Particles */}
      {diaParticles.map((p, idx) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 20}}
          animate={{
            x: p.dx + (Math.random() - 0.5) * 30,
            y: p.dy - 30,
            opacity: 0,
            scale: 2,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.5 }}
          onAnimationComplete={() => {
            if (idx === diaParticles.length - 1) {
              console.log("Dias angekommen!") // ✅ Debug
              addDias(3)
            }
          }}
          className="absolute text-cyan-300"
        >
          <FaGem size={20} />
        </motion.div>
      ))}
    </div>
  )
}
