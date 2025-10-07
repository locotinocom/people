import { useGame } from "../context/GameContext"

export function usePlayerData() {
  const {
    avatarId,
    avatarName,
    setAvatarId,
    setAvatarName,
    answers,
    setAnswers,
    grantReward,
    xp,
  } = useGame()

  const saveAnswer = (questionId: number, answer: string | number | boolean) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)
    localStorage.setItem("answers", JSON.stringify(newAnswers))
  }

  const getAnswer = (questionId: number): string | number | boolean | null => {
    return answers?.[questionId] ?? null
  }

  const saveAvatar = (id: string, name: string) => {
    setAvatarId(id)
    setAvatarName(name)
    localStorage.setItem("avatarId", id)
    localStorage.setItem("avatarName", name)
  }

  const addXP = (amount: number) => {
    grantReward({ type: "xp", amount })
  }

  return {
    avatarId,
    avatarName,
    answers,
    xp,
    saveAnswer,
    getAnswer,
    saveAvatar,
    addXP,
  }
}
