import { useState, useCallback } from "react"

export type BurnPhase = "idle" | "burning" | "complete"

export function useBurnAnimation() {
  const [phase, setPhase] = useState<BurnPhase>("idle")

  const startBurn = useCallback(() => {
    setPhase("burning")
    
    // Nach 3.5s Animation → 600ms Pause → complete
    setTimeout(() => {
      setPhase("complete")
    }, 3500 + 600)
  }, [])

  const reset = useCallback(() => {
    setPhase("idle")
  }, [])

  return {
    phase,
    startBurn,
    reset,
    isBurning: phase === "burning",
    isComplete: phase === "complete",
  }
}
