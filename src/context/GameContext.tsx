import { createContext, useContext, useState, ReactNode } from "react"

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
  pendingReward: Reward | null
  showLevelUp: boolean
  grantReward: (reward: Reward) => void
  claimReward: () => void
}

//
// Context
//
const GameContext = createContext<GameState | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [xpToNext, setXpToNext] = useState(100)
  const [dias, setDias] = useState(0)

  const [pendingReward, setPendingReward] = useState<Reward | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  //
  // Zentrale Rewards-Funktion
  //
  const grantReward = (reward: Reward) => {
    switch (reward.type) {
      case "xp": {
        setXp((prev) => {
          const newXp = prev + reward.amount
          if (newXp >= xpToNext) {
            const overflow = newXp - xpToNext
            setLevel((l) => l + 1)
            setXp(overflow)
            setXpToNext((t) => Math.floor(t * 1.5))

            // Dias-Belohnung für Level-Up ins Overlay
            setPendingReward({ type: "dias", amount: 5 })
            setShowLevelUp(true)
            return overflow
          }
          return newXp
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
        // TODO: ins Inventar packen
        console.log("Item eingelöst:", pendingReward.meta)
        break
      // XP wird sofort verarbeitet → kein Claim nötig
    }

    setPendingReward(null)
    setShowLevelUp(false)
  }

  return (
    <GameContext.Provider
      value={{
        level,
        xp,
        xpToNext,
        dias,
        pendingReward,
        showLevelUp,
        grantReward,
        claimReward,
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
