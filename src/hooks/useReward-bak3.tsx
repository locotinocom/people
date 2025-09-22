import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { FaGem } from "react-icons/fa"

type Particle = { id:number; dx:number; dy:number; delay:number; startX:number; startY:number }

export function useReward(
  xpTargetRef: React.RefObject<HTMLDivElement>,
  diaTargetRef: React.RefObject<HTMLDivElement>
) {
  const [xpParticles, setXpParticles] = useState<Particle[]>([])
  const [diaParticles, setDiaParticles] = useState<Particle[]>([])
  const xpInFlight = useRef<Promise<void> | null>(null)
  const diaInFlight = useRef<Promise<void> | null>(null)

 const spawnXp = (amount: number) => {
  if (amount <= 0 || !xpTargetRef.current) return Promise.resolve()
  if (xpInFlight.current) return xpInFlight.current

  const target = xpTargetRef.current.getBoundingClientRect()
  const startX = window.innerWidth / 2
  const startY = window.innerHeight / 2
  const dx = target.left + target.width / 2 - startX
  const dy = target.top + target.height / 2 - startY

  const count = Math.min(Math.max(1, Math.floor(amount)), 200)
  const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i + Math.random(), // fix: eindeutiger Key
    dx, dy,
    delay: i * 0.05,
    startX, startY,
  }))
  setXpParticles(particles)

  const totalMs = count * 50 + 1200
  xpInFlight.current = new Promise<void>((resolve) => {
    window.setTimeout(() => {
      setXpParticles([])
      xpInFlight.current = null
      resolve()
    }, totalMs)
  })
  return xpInFlight.current
}


  const spawnDias = (amount: number) => {
    if (amount <= 0 || !diaTargetRef.current) return Promise.resolve()
    if (diaInFlight.current) return diaInFlight.current

    const target = diaTargetRef.current.getBoundingClientRect()
    const startX = window.innerWidth / 2
    const startY = window.innerHeight / 2
    const dx = target.left + target.width / 2 - startX
    const dy = target.top + target.height / 2 - startY

    const particles: Particle[] = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      dx, dy, delay: i * 0.1, startX, startY,
    }))
    setDiaParticles(particles)

    diaInFlight.current = new Promise<void>((resolve) => {
      window.setTimeout(() => setDiaParticles([]), 1700)
      window.setTimeout(() => { diaInFlight.current = null; resolve() }, 1500)
    })
    return diaInFlight.current
  }

  const RewardParticles = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {xpParticles.map(p => (
        <motion.span key={`xp-${p.id}`}
          initial={{ opacity:1, x:0, y:0, scale:1.6 }}
          animate={{
            x:p.dx + (Math.random()-0.5)*40,
            y:p.dy + (Math.random()-0.5)*40,
            opacity:0,
            scale:1
          }}
          transition={{ duration:1.2, delay:p.delay }}
          className="absolute text-[10px] font-bold"
          style={{ left:p.startX, top:p.startY }}
        >
          <span className="px-1 py-[1px] rounded bg-yellow-300/90 text-zinc-900">xp</span>
        </motion.span>
      ))}
      {diaParticles.map(p => (
        <motion.div key={`dia-${p.id}`}
          initial={{ opacity:1, x:0, y:0, scale:2.2 }}
          animate={{
            x:p.dx + (Math.random()-0.5)*30,
            y:p.dy + (Math.random()-0.5)*30,
            opacity:0,
            scale:1.2
          }}
          transition={{ duration:1.5, delay:p.delay }}
          className="absolute"
          style={{ left:p.startX, top:p.startY }}
        >
          <FaGem className="text-cyan-300" />
        </motion.div>
      ))}
    </div>
  )

  return { spawnXp, spawnDias, RewardParticles }
}
