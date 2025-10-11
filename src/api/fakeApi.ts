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

    // 🚫 Keine Änderung → kein Schreiben → kein Re-Render-Loop
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

  // 💾 Spielzustand speichern (nur wenn sich Daten ändern)
  async saveGameState(data: GameState) {
    await delay(100)

    const current = JSON.stringify(data)
    const prev = localStorage.getItem("gameState")
    if (prev === current) return { success: false }

    localStorage.setItem("gameState", current)
    return { success: true }
  },

  // 📘 Interventionen eines Levels laden
  async getInterventions(level: number) {
    await delay(300)
    return (interventionsData as any[])
      .map((item, index) => ({ ...item, id: index + 1, order: index + 1 }))
      .filter((i) => i.level === level)
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

  // 💎 Diamanten vergeben
  async grantDiamonds(amount: number) {
    const state = JSON.parse(localStorage.getItem("gameState") || "{}") || {}
    state.dias = (state.dias || 0) + amount
    localStorage.setItem("gameState", JSON.stringify(state))
    return { success: true, dias: state.dias }
  },

  // 📍 Aktuellen Fortschritt abrufen
  async getCurrentStep(): Promise<StepProgress> {
    const idx = Number(localStorage.getItem("currentStep") || "0")
    return { stepIndex: idx }
  },

  // 📍 Fortschritt speichern (nur wenn geändert)
  async updateCurrentStep(stepIndex: number) {
    const prev = Number(localStorage.getItem("currentStep") || "0")
    if (prev === stepIndex) return { success: false }

    await delay(100)
    localStorage.setItem("currentStep", String(stepIndex))
    if (import.meta.env.DEV) console.log("🧪 fakeApi.updateCurrentStep", stepIndex)
    return { success: true }
  },

  // 🔄 Fortschritt komplett zurücksetzen
  async resetProgress(): Promise<{ success: boolean }> {
    localStorage.clear()
    return { success: true }
  },
}
