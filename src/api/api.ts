import type { ApiInterface } from "./types"

const API_BASE = import.meta.env.VITE_API_BASE_URL

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json()
}

export const liveApi: ApiInterface = {
  async getUser() {
    return request("/user")
  },

  async setAvatar(name: string, avatarId: string) {       // 👈 identisch zur Fake-API!
    return request("/avatar", {
      method: "POST",
      body: JSON.stringify({ name, avatarId }),
    })
  },

  async getGameState() {
    return request("/game/state")
  },

  async saveGameState(data) {
    return request("/game/state", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async getInterventions(level) {
    return request(`/interventions?level=${level}`)
  },

  async updateProgress(interventionId, xp) {
    return request("/progress", {
      method: "POST",
      body: JSON.stringify({ interventionId, xp }),
    })
  },

  async getCurrentStep() {
    return request("/progress/current")
  },

  async updateCurrentStep(stepIndex) {
    return request("/progress/step", {
      method: "POST",
      body: JSON.stringify({ stepIndex }),
    })
  },

  async getRewards() {
    return request("/rewards")
  },

  async resetProgress() {
    return request("/progress/reset", { method: "POST" })
  },
}
