// src/api/fakeApi.ts
import interventionsData from "../data/interventions.json"
import type { StepProgress, GameState } from "./types"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fakeApi = {
  // 👤 Benutzer abrufen
  async getUser() {
    await delay(200)
    return {
      id: 1,
      name: localStorage.getItem("avatarName") || "Tim",
      avatarId: localStorage.getItem("avatarId") || "tim-dummy",
      level: Number(localStorage.getItem("level")) || 1,
      xp: Number(localStorage.getItem("xp")) || 0,
      rewards: JSON.parse(localStorage.getItem("rewards") || "[]"),
      data: JSON.parse(localStorage.getItem("data") || "{}"),
    }
  },

  // 👤 Avatar setzen (nur wenn geändert)
  async setAvatar(avatarName: string, avatarId: string) {
    const prevName = localStorage.getItem("avatarName")
    const prevId = localStorage.getItem("avatarId")

    if (prevName === avatarName && prevId === avatarId) return { success: false }

    console.log("💾 fakeApi.setAvatar", { avatarName, avatarId })
    localStorage.setItem("avatarName", avatarName)
    localStorage.setItem("avatarId", avatarId)
    return { success: true }
  },

  // 🎮 Spielzustand abrufen
  async getGameState(): Promise<GameState> {
    await delay(150)
    const raw = localStorage.getItem("gameState")
    if (!raw) {
      return {
        level: 1,
        xp: 0,
        dias: 0,
        completedInterventions: [],
        avatarId: null,
        avatarName: null,
        answers: {},
      }
    }
    return JSON.parse(raw)
  },

  // 💾 Spielzustand speichern
  async saveGameState(data: GameState) {
    await delay(100)
    const current = JSON.stringify(data)
    const prev = localStorage.getItem("gameState")
    if (prev === current) return { success: false }

    localStorage.setItem("gameState", current)
    return { success: true }
  },

  // 📘 Interventionen eines Levels laden (mehrstufige Struktur)
  async getInterventions(level: number) {
    await delay(200)
    const data = (interventionsData as Record<string, any[]>)[String(level)] ?? []
    return data.map((item, index) => ({
      ...item,
      id: index + 1,
      order: index + 1,
      level,
    }))
  },

  // 👤 Avatar aktualisieren (redundant, aber konsistent)
  async updateAvatar(name: string, avatarId: string) {
    const prevName = localStorage.getItem("avatarName")
    const prevId = localStorage.getItem("avatarId")
    if (prevName === name && prevId === avatarId) return { success: false }

    await delay(150)
    localStorage.setItem("avatarName", name)
    localStorage.setItem("avatarId", avatarId)
    return { success: true }
  },

  // 🪄 Fortschritt speichern (Intervention abgeschlossen)
  async updateProgress(interventionId: number, xp: number) {
    await delay(150)
    const state = JSON.parse(localStorage.getItem("gameState") || "{}") || {}
    const completed = state.completedInterventions || []

    if (!completed.includes(interventionId)) completed.push(interventionId)
    state.completedInterventions = completed
    state.xp = (state.xp || 0) + xp

    localStorage.setItem("gameState", JSON.stringify(state))
    return { success: true, xp: state.xp }
  },

  // 💎 Belohnungen abrufen
  async getRewards() {
    await delay(200)
    return JSON.parse(localStorage.getItem("rewards") || "[]")
  },

  // 💎 Diamanten speichern (für spätere Persistenz)
  async saveDiamonds(amount: number) {
    localStorage.setItem("diamonds", String(amount))
    return { success: true }
  },

  // 💎 Diamanten vergeben
  async grantDiamonds(amount: number) {
    const state = JSON.parse(localStorage.getItem("gameState") || "{}") || {}
    state.dias = (state.dias || 0) + amount
    localStorage.setItem("gameState", JSON.stringify(state))
    return { success: true, dias: state.dias }
  },

  // 📍 Aktuellen Fortschritt abrufen (mit oder ohne Level)
  async getCurrentStep(level?: number): Promise<StepProgress> {
    const key = level ? `currentStep_L${level}` : "currentStep"
    const idx = Number(localStorage.getItem(key) || "0")
    if (import.meta.env.DEV)
      console.log(`📤 fakeApi.getCurrentStep(${key}):`, idx)
    return { stepIndex: idx }
  },

  // 📍 Fortschritt speichern (mit oder ohne Level)
  async updateCurrentStep(stepIndex: number, level?: number) {
    const key = level ? `currentStep_L${level}` : "currentStep"
    const prev = Number(localStorage.getItem(key) || "0")
    if (prev === stepIndex) return { success: false }

    await delay(100)
    localStorage.setItem(key, String(stepIndex))
    if (import.meta.env.DEV)
      console.log(`🧪 fakeApi.updateCurrentStep(${key}):`, stepIndex)
    return { success: true }
  },

  // 🔄 Fortschritt zurücksetzen (optional pro Level)
  async resetProgress(level?: number): Promise<{ success: boolean }> {
    if (level) {
      localStorage.removeItem(`currentStep_L${level}`)
      if (import.meta.env.DEV)
        console.log(`♻️ fakeApi.resetProgress(L${level})`)
    } else {
      localStorage.removeItem("currentStep")
      if (import.meta.env.DEV)
        console.log("♻️ fakeApi.resetProgress(all)")
    }
    return { success: true }
  },
}
