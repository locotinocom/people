// src/api/types.ts

// 👤 Benutzer-Datenstruktur
export type User = {
  id: number
  name: string
  avatarId: string
  level: number
  xp: number
  rewards: Reward[]
  data: Record<string, any>
}

// 🎁 Belohnungen
export type Reward = {
  id?: number
  name?: string
  type?: string
  description?: string
  unlocked?: boolean
}

// 💬 Interventionen (Übungen, Aufgaben, Meditationen, etc.)
export type Intervention = {
  id: number
  title: string
  template: string
  type?: "single" | "multi"
  level: number
  order: number
  xp?: number
  skippable?: boolean
  props?: Record<string, any>
}

// 🪜 Fortschritt innerhalb eines Levels
export type StepProgress = {
  stepIndex: number
}

// 🧠 Spielzustand (User-spezifisch)
export type GameState = {
  level: number
  xp: number
  dias: number
  completedInterventions: number[]  // ✅ korrigierter Tippfehler
  avatarId: string | null
  avatarName: string | null
  answers: Record<string, string | number | boolean>
}

// 🌐 Gemeinsames API-Interface (Fake + Live)
export interface ApiInterface {
  // 👤 Benutzer
  getUser(): Promise<User>
  setAvatar(name: string, avatarId: string): Promise<{ success: boolean }>

  // 🧠 Spielzustand
  getGameState(): Promise<GameState>
  saveGameState(data: GameState): Promise<{ success: boolean }>

  // 📘 Interventionen & Fortschritt
  getInterventions(level: number): Promise<Intervention[]>
  updateProgress(interventionId: number, xp: number): Promise<{ success: boolean; xp?: number }>

  // 💎 Belohnungen
  getRewards(): Promise<Reward[]>
  grantDiamonds?(amount: number): Promise<{ success: boolean; dias: number }>

  // 📍 Aktueller Fortschritt
  getCurrentStep(): Promise<StepProgress>
  updateCurrentStep(stepIndex: number): Promise<{ success: boolean }>

  // 🔄 Reset
  resetProgress(): Promise<{ success: boolean }>
}
