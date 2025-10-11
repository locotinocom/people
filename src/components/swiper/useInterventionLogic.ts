import { useRef } from "react"
import { useGame } from "../../context/GameContext"
import type { Intervention } from "../../types/intervention"

export function useInterventionLogic(spawnXp: (amount: number, durationOverride?: number) => void) {
  const { grantReward, markInterventionDone } = useGame()
  const awardingSingle = useRef<Set<number>>(new Set())

  const handleSingleComplete = (intervention: Intervention) => {
    if (!intervention.id || awardingSingle.current.has(intervention.id)) return
    awardingSingle.current.add(intervention.id)

    const xp = typeof intervention.xp === "number" ? intervention.xp : 0
    if (xp > 0) {
      const count = Math.min(Math.max(1, Math.floor(xp)), 200)
      const totalMs = (count - 1) * 50 + 1200
      spawnXp(xp, totalMs)
      grantReward({ type: "xp", amount: xp, meta: { duration: totalMs } })

      setTimeout(() => {
        markInterventionDone(intervention.id!)
        awardingSingle.current.delete(intervention.id!)
      }, totalMs)
    } else {
      markInterventionDone(intervention.id!)
      awardingSingle.current.delete(intervention.id!)
    }
  }

  const grantMultiXp = async (intervention: Intervention) => {
    if (!intervention.xp) return

    if (import.meta.env.DEV) console.log("🎯 grantMultiXp – starte XP-Vergabe", intervention.xp)

    // await spawnXp(intervention.xp)
    // grantReward({ type: "xp", amount: intervention.xp })

    if (import.meta.env.DEV) console.log("✅ XP-Vergabe abgeschlossen")
  }

  return { handleSingleComplete, grantMultiXp }
}
