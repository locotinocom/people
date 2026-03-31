import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadAll } from "@tsparticles/all"
import type { Engine, ISourceOptions } from "@tsparticles/engine"
import { motion, useSpring } from "framer-motion"

export default function XPPlayground() {
  const [ready, setReady] = useState(false)
  const [emitters, setEmitters] = useState<ISourceOptions["emitters"]>([])
  const [absorbers, setAbsorbers] = useState<ISourceOptions["absorbers"]>([])

  // -------- XP STATE ----------
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  const xpNeededFor = (lvl: number) => lvl * 250
  const xpToNext = xpNeededFor(level)
  const progress = Math.min(xp / xpToNext, 1)

  const barRef = useRef<HTMLDivElement | null>(null)
  const springProgress = useSpring(progress, { stiffness: 100, damping: 15 })

  // -------- INIT PARTICLES ----------
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadAll(engine)
    }).then(() => setReady(true))
  }, [])

  // -------- XP ADD LOGIC ----------
  const addXp = useCallback(
    (amount: number) => {
      let residue = amount
      let curLevel = level
      let curXp = xp
      let leveledUp = false

      while (residue > 0) {
        const need = xpNeededFor(curLevel) - curXp
        if (residue >= need) {
          residue -= need
          curLevel += 1
          curXp = 0
          leveledUp = true
        } else {
          curXp += residue
          residue = 0
        }
      }

      setLevel(curLevel)
      setXp(curXp)

      return { leveledUp, amount }
    },
    [level, xp]
  )

  // -------- PARTICLE EFFECT ----------
  const handleGainXP = useCallback(
    (amount: number, button: HTMLButtonElement | null) => {
      if (!button || !barRef.current) return
      //const { leveledUp } = addXp(amount)

      const btnRect = button.getBoundingClientRect()
      const barRect = barRef.current.getBoundingClientRect()

      const x = ((btnRect.left + btnRect.width / 2) / window.innerWidth) * 100
      const y = ((btnRect.top + btnRect.height / 2) / window.innerHeight) * 100

      const pixelRadius = Math.max(8, barRect.height)
      const step = pixelRadius * 1.2
      const count = Math.ceil(barRect.width / step)
      const startX = barRect.left + (barRect.width - (count - 1) * step) / 2

      const band = Array.from({ length: count }, (_, i) => {
        const cx = startX + i * step
        const xPct = (cx / window.innerWidth) * 100
        const yPct = ((barRect.bottom + pixelRadius * 0.4) / window.innerHeight) * 100
        return {
          position: { x: xPct, y: yPct },
          size: { value: pixelRadius },
          opacity: 0,
          destroy: true,
        }
      })
      setAbsorbers(band)

  
const quantity = amount           // wie viele XP-Partikel sollen fliegen
const delay = 0.05                // Abstand zwischen den Partikeln (Sekunden)
const lifeDuration = quantity * delay + 0.05
const spread = 15
const speed = { min: 10, max: 12 }

setEmitters([
  {
    position: { x, y },

    // feuert EIN Partikel pro Tick
    rate: { quantity: 1, delay },

    // lebt genau so lange, dass alle abgefeuert werden
    life: { count: 1, duration: lifeDuration },

    particles: {
      move: {
        enable: true,
        direction: "top",
        angle: { value: spread },
        speed,
        outModes: { default: "destroy" },
      },
      life: {
        count: 1,
        duration: { min: 0.8, max: 1.2 },
      },
      collisions: { enable: false },
      shape: {
        type: "text",
        options: {
          text: { value: ["XP"], font: "Verdana", weight: "700", fill: true },
        },
      },
      color: { value: "#22c55e" },
      size: { value: { min: 8, max: 10 } },
      opacity: { value: { min: 0.9, max: 1 } },
    },
  },
])




      setTimeout(() => {
        setEmitters([])
        setAbsorbers([])
      }, (lifeDuration + 1.2) * 1000)
    },
    [addXp]
  )

  // -------- PARTICLE OPTIONS ----------
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      emitters,
      absorbers,
    }),
    [emitters, absorbers]
  )

  // -------- RENDER ----------
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {ready && <Particles id="xp-fly" options={options} className="absolute inset-0 z-0" />}

      {/* HEADER / XP BAR */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg text-white flex flex-col items-center">
        <p className="font-bold text-base leading-tight">Level {level}</p>
        <p className="text-[10px] opacity-80">
          {xp} / {xpToNext} XP
        </p>

        <div
          ref={barRef}
          className="w-3/4 mt-1 h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            style={{ scaleX: springProgress, transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {[7, 25, 40, 3, 9, 12].map((amount) => {
          const ref = useRef<HTMLButtonElement | null>(null)
          return (
            <button
              key={amount}
              ref={ref}
              onClick={() => handleGainXP(amount, ref.current)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-transform active:scale-95"
            >
              +{amount} XP
            </button>
          )
        })}
      </div>
    </div>
  )
}
