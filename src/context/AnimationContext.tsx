import { createContext, useContext, useState, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import { AnimationOverlay } from "@components/animations/AnimationOverlay"
import { FlyParticles } from "@components/animations/FlyParticles"

export type FlyConfig = {
  from?: HTMLElement | null
  to?: HTMLElement | null
  count?: number
  duration?: number
  size?: number
}

export type AnimationType = "xp" | "diamond" | "levelup"

type AnimationContextType = {
  start: (type: AnimationType, fly?: FlyConfig) => void
}

const AnimationContext = createContext<AnimationContextType>({ start: () => {} })
export const useAnimation = () => useContext(AnimationContext)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<AnimationType | null>(null)
  const [fly, setFly] = useState<
    (FlyConfig & {
      content: string
      color: string
      shapeType: "character"
    }) | null
  >(null)

  const flyKey = useRef(0)

  // 🔥 unverändert, nur skalierbares Symbol für Diamant
  const visuals: Record<AnimationType, { content: string; color: string }> = {
    xp: { content: "XP", color: "#22c55e" },
    diamond: { content: "◆", color: "#3b82f6" },
    levelup: { content: "↑", color: "#facc15" },
  }

  const start = useCallback(
    (type: AnimationType, flyConfig?: FlyConfig) => {
      const visual = visuals[type]

      // -------------------------------------------------------
      // Minimale Änderung: Ziel abhängig vom Typ bestimmen
      // -------------------------------------------------------
      const xpTarget = document.getElementById("Loco_ProgressBar_XP")
      const diaTarget = document.getElementById("loco_DiamondCounter")

      const to =
        flyConfig?.to ??
        (type === "diamond" ? diaTarget : xpTarget) ??
        document.body

      // -------------------------------------------------------
      // Dummy-Startpunkt, falls kein from angegeben wurde
      // -------------------------------------------------------
      let fromEl: HTMLElement | null = flyConfig?.from ?? null
      let tempDummy: HTMLElement | null = null

      if (!fromEl) {
        const dummy = document.createElement("div")
        dummy.style.position = "fixed"
        dummy.style.left = `${window.innerWidth / 2}px`
        dummy.style.top = `${window.innerHeight / 2}px`
        dummy.style.width = "1px"
        dummy.style.height = "1px"
        dummy.style.pointerEvents = "none"
        dummy.style.opacity = "0"
        document.body.appendChild(dummy)

        fromEl = dummy
        tempDummy = dummy
      }

      // -------------------------------------------------------
      // Nur hier minimal ergänzt: Größe je Typ setzen
      // XP klein, Diamond groß
      // -------------------------------------------------------
      const defaultSize = type === "diamond" ? 32 : 18

      // -------------------------------------------------------
      // Start Fly Particles (XP & Diamond)
      // -------------------------------------------------------
      if (type === "xp" || type === "diamond") {
        flyKey.current++

        setFly({
          from: fromEl!,
          to,
          count: flyConfig?.count ?? (type === "xp" ? 10 : 6),
          duration: flyConfig?.duration ?? (type === "xp" ? 1.4 : 1.8),
          size: flyConfig?.size ?? defaultSize,
          content: visual.content,
          color: visual.color,
          shapeType: "character",
        })
      }

      // -------------------------------------------------------
      // LEVEL-UP Overlay (unverändert)
      // -------------------------------------------------------
      if (type === "levelup") {
        setActive("levelup")
        setTimeout(() => setActive(null), 1800)
      }

      // Dummy entfernen
      if (tempDummy) {
        setTimeout(() => tempDummy?.remove(), 1600)
      }
    },
    [visuals]
  )

  return (
    <AnimationContext.Provider value={{ start }}>
      {children}

      {active === "levelup" && <AnimationOverlay active="levelup" />}

      {fly && (
        <FlyParticles
          key={flyKey.current}
          {...fly}
          onDone={() => setFly(null)}
        />
      )}
    </AnimationContext.Provider>
  )
}
