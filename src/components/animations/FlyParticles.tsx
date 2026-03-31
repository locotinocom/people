// components/animations/FlyParticles.tsx
import { useEffect, useMemo } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadAll } from "@tsparticles/all"
import type { Engine, ISourceOptions } from "@tsparticles/engine"

export function FlyParticles({
  from,
  to,
  count = 8,
  duration = 1.2,
  size = 12,
  content = "XP",
  color = "#22c55e",
  variant = "xp",
  onDone,
}: {
  from?: HTMLElement | null
  to?: HTMLElement | null
  count?: number
  duration?: number
  size?: number
  content?: string
  color?: string
  variant?: "xp" | "diamond"
  onDone?: () => void
}) {

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadAll(engine)
    })
  }, [])

  const options: ISourceOptions = useMemo(() => {
    if (!from || !to) return {}

    const fromRect = from.getBoundingClientRect()
    const toRect = to.getBoundingClientRect()

    const x = ((fromRect.left + fromRect.width / 2) / window.innerWidth) * 100
    const y = ((fromRect.top + fromRect.height / 2) / window.innerHeight) * 100

    const delay = 0.05
    const lifeDuration = count * delay + 0.2
   // const spread = 5
    const speed = { min: 10, max: 12 }

    return {
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 36,

      emitters: [
        {
          position: { x, y },
          rate: { quantity: 1, delay },
          life: { count: 1, duration: lifeDuration },

          particles: {
            move: {
            enable: true,
            speed,
            straight: false,
            gravity: {
              enable: false
            },
            attract: {
              enable: variant === "diamond",
              rotate: { x: 3000, y: 3000 }
            },
            direction: variant === "xp" ? "top" : "none",
            outModes: { default: "destroy" }
          },


            life: { count: 1, duration: { min: 0.8, max: 1.2 } },

            collisions: { enable: false },

            shape: {
              type: "text",
              options: {
                text: {
                  value: [content],
                  font: "Verdana",
                  weight: "700",
                  fill: true,
                  size: 3,
                },
              },
            },

            color: { value: color },

            // 🔥 EINZIG WICHTIGE STELLE:
            // Partikelgröße abhängig von variant
            size: {
              value:
                variant === "diamond"
                  ? { min: size * 2.0, max: size * 2.4 } // große Dias
                  : { min: size * 0.3, max: size * 0.4 }, // kleine XP
            },

            opacity: { value: { min: 0.9, max: 1 } },
          },
        },
      ],

      absorbers: [
        {
          position: {
            x: ((toRect.left + toRect.width / 2) / window.innerWidth) * 100,
            y: ((toRect.top + toRect.height / 2) / window.innerHeight) * 100,
          },

          // NICHT verändern – Absorbergröße bleibt klein
          size: { value: 8 },

          opacity: 0,
          destroy: true,
        },
      ],
    }
  }, [from, to, count, size, content, color, variant])

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), (duration ?? 1.2) * 1000 + 500)
    return () => clearTimeout(t)
  }, [duration, onDone])

  if (!from || !to) return null

  return (
    <Particles
      id="fly-particles"
      options={options}
      className="absolute inset-0 pointer-events-none z-[9999]"
    />
  )
}
