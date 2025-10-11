import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import interventions from "../data/interventions.json"
import { api } from "../api"
import type { User } from "../api/types"

type RewardType = "xp" | "dias" | "item"

export type Reward = {
  type: RewardType
  amount: number
  autoClaim?: boolean
  meta?: Record<string, any>
}

export type GameState = {
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
  avatarId: string | null
  avatarName: string | null
  answers: Record<number, string | number | boolean>
  setAvatarId: (id: string | null) => void
  setAvatarName: (name: string | null) => void
  setAnswers: (answers: Record<number, string | number | boolean>) => void
}

function xpNeededForLevel(lvl: number) {
  const list = (interventions as Record<string, any[]>)[String(lvl)] ?? []
  return list.reduce(
    (sum, i) => sum + (typeof i.xp === "number" ? i.xp : 20),
    0
  )
}

function animateXpGain(
  amount: number,
  duration: number,
  update: (delta: number) => void
) {
  const start = performance.now()
  let lastVal = 0
  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const current = Math.floor(progress * amount)
    if (current !== lastVal) {
      update(current - lastVal)
      lastVal = current
    }
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const GameContext = createContext<GameState | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [xpToNext, setXpToNext] = useState(() => xpNeededForLevel(1))
  const [dias, setDias] = useState(0)
  const [completedInterventions, setCompletedInterventions] = useState<number[]>([])
  const [pendingReward, setPendingReward] = useState<Reward | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarName, setAvatarName] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({})
// ungenutzte States behalten, aber neutral benennen
const [_user, setUser] = useState<User | null>(null)
const [_justLeveledUp, setJustLeveledUp] = useState(false)


  useEffect(() => {
    const load = async () => {
      try {
        const [userData, gameData] = await Promise.all([
          api.getUser(),
          api.getGameState(),
        ])
        setUser(userData)
        setAvatarId(userData.avatarId ?? null)
        setAvatarName(userData.name ?? null)
        if (gameData) {
          setLevel(gameData.level ?? 1)
          setXp(gameData.xp ?? 0)
          setDias(gameData.dias ?? 0)
          setCompletedInterventions(gameData.completedInterventions ?? [])
          setAnswers(gameData.answers ?? {})
          setXpToNext(xpNeededForLevel(gameData.level ?? 1))
        }
      } catch (err) {
        console.warn("⚠️ Konnte Daten nicht laden:", err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let prevState = ""
    const save = async () => {
      try {
        const current = JSON.stringify({
          level,
          xp,
          dias,
          completedInterventions,
          avatarId,
          avatarName,
          answers,
        })
        if (current === prevState) return
        prevState = current
        await api.saveGameState(JSON.parse(current))
      } catch (err) {
        console.warn("⚠️ Konnte GameState nicht speichern:", err)
      }
    }
    save()
  }, [level, xp, dias, completedInterventions, avatarId, avatarName, answers])

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
              const diamondReward = Math.floor(nextLevel * 10)
              setLevel(nextLevel)
              setXpToNext(xpNeededForLevel(nextLevel))
              setPendingReward({ type: "dias", amount: diamondReward })
              setShowLevelUp(true)
              setJustLeveledUp(true)
              return overflow
            }
            return newXp
          })
        })
        break
      }

      case "dias":
        if (reward.autoClaim) {
          setDias((prev) => prev + reward.amount)
        } else {
          setPendingReward(reward)
          setShowLevelUp(true)
        }
        break

      case "item":
        if (!reward.autoClaim) setPendingReward(reward)
        setShowLevelUp(true)
        break
    }
  }

  const claimReward = async () => {
    if (!pendingReward) return
    switch (pendingReward.type) {
      case "dias": {
        const newTotal = dias + pendingReward.amount
        setDias(newTotal)
        localStorage.setItem("dias", String(newTotal))
        try {
          await api.saveGameState({
            level,
            xp,
            dias: newTotal,
            completedInterventions,
            avatarId,
            avatarName,
            answers,
          })
        } catch (err) {
          console.warn("⚠️ Diamanten konnten nicht gespeichert werden:", err)
        }
        break
      }
      case "item":
        console.log("🎁 Item eingelöst:", pendingReward.meta)
        break
    }
    setPendingReward(null)
    setShowLevelUp(false)
    setJustLeveledUp(false)
  }

  const markInterventionDone = (id: number) => {
    setCompletedInterventions((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    )
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
        avatarId,
        avatarName,
        answers,
        setAvatarId,
        setAvatarName,
        setAnswers,
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
