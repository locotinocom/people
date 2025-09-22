import { createContext, useContext, useState, ReactNode } from "react"
import interventions from "../data/interventions.json"

//
// Types
//
type RewardType = "xp" | "dias" | "item"

export type Reward = {
  type: RewardType
  amount: number
  autoClaim?: boolean
  meta?: Record<string, any>
}

type GameState = {
  level: number
  xp: number
  xpToNext: number
  dias: number
  completedInterventions: number[]
  pendingReward: Reward | null
  showLevelUp: boolean
  grantReward: (reward: Reward) => void
  claimReward: () => void
  markInterventionDone: (id: number) => void
}

//
// Helpers
//
function xpNeededForLevel(lvl: number) {
  const arr = interventions.filter((i: any) => i.level === lvl)
  return arr.reduce((sum: number, i: any) => sum + (typeof i.xp === "number" ? i.xp : 20), 0)
}

// Smooth XP Gain über 'duration' ms
function animateXpGain(amount: number, duration: number, update: (delta: number) => void) {
  const start = performance.now()
  let lastVal = 0

  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const current = Math.floor(progress * amount)

    if (current !== lastVal) {
      update(current - lastVal)
      lastVal = current
    }

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

//
// Context
//
const GameContext = createContext<GameState | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [xpToNext, setXpToNext] = useState(() => xpNeededForLevel(1))
  const [dias, setDias] = useState(0)

  const [completedInterventions, setCompletedInterventions] = useState<number[]>([])
  const [pendingReward, setPendingReward] = useState<Reward | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  //
  // Zentrale Rewards-Funktion
  //
  const grantReward = (reward: Reward) => {
    switch (reward.type) {
     case "xp": {
  const duration = reward.meta?.duration ?? 1500
  animateXpGain(reward.amount, duration, (delta) => {
    setXp((prevXp) => {
      const newXp = prevXp + delta
      if (newXp >= xpToNext) {
        const overflow = newXp - xpToNext
        const nextLevel = level + 1
        setLevel(nextLevel)
        setXp(overflow)
        setXpToNext(xpNeededForLevel(nextLevel))
        setPendingReward({ type: "dias", amount: 5 })
        setShowLevelUp(true)
        return overflow
      }
      return newXp
    })
  })
  break
}


      case "dias": {
        if (reward.autoClaim) {
          setDias((prev) => prev + reward.amount)
        } else {
          setPendingReward(reward)
          setShowLevelUp(true)
        }
        break
      }

      case "item": {
        console.log("Item reward:", reward.meta)
        if (reward.autoClaim) {
          // TODO: direkt ins Inventar
        } else {
          setPendingReward(reward)
          setShowLevelUp(true)
        }
        break
      }
    }
  }

  //
  // Reward einlösen
  //
  const claimReward = () => {
    if (!pendingReward) return

    switch (pendingReward.type) {
      case "dias":
        setDias((prev) => prev + pendingReward.amount)
        break
      case "item":
        console.log("Item eingelöst:", pendingReward.meta)
        break
    }

    setPendingReward(null)
    setShowLevelUp(false)
  }

  //
  // Intervention als erledigt markieren
  //
  const markInterventionDone = (id: number) => {
    setCompletedInterventions((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  return (
    <GameContext.Provider
      value={{
        level,
        xp,
        xpToNext,
        dias,
        completedInterventions,
        pendingReward,
        showLevelUp,
        grantReward,
        claimReward,
        markInterventionDone,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be used within GameProvider")
  return ctx
}
