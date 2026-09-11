import useAuthHeader from "react-auth-kit/hooks/useAuthHeader"

const API = import.meta.env.VITE_API_URL

export type PasswordRequestError = Error & { code?: string }

async function postPassword(path: string, body: Record<string, string>): Promise<{ ok?: boolean; code?: string }> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json() as { ok?: boolean; code?: string }
  if (!response.ok || !data.ok) {
    const error = new Error("Die Anfrage konnte nicht verarbeitet werden.") as PasswordRequestError
    error.code = data.code
    throw error
  }
  return data
}

export async function requestPasswordReset(email: string): Promise<void> {
  await postPassword("/users/forgot-password", { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await postPassword("/users/reset-password", { token, password })
}

export function useChangePassword() {
  const authHeader = useAuthHeader()

  const changePassword = async (newPassword: string, currentPassword?: string): Promise<void> => {
    const body: Record<string, string> = { newPassword }
    if (currentPassword !== undefined) body.currentPassword = currentPassword

    const response = await fetch(`${API}/users/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    const data = await response.json() as { ok?: boolean; code?: string }
    if (!response.ok || !data.ok) {
      const error = new Error("Das Passwort konnte nicht geändert werden.") as PasswordRequestError
      error.code = data.code
      throw error
    }
  }

  return { changePassword }
}