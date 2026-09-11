import { useLogin, type AuthRequestError } from "./useLogin"

const API = import.meta.env.VITE_API_URL

export async function resendVerificationEmail(email: string): Promise<void> {
  const response = await fetch(`${API}/users/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throw new Error("Die E-Mail konnte nicht erneut angefordert werden.")
  }
}

export function useRegister() {
  const { login } = useLogin()

  const register = async (email: string, password: string, name?: string): Promise<{ requiresVerification: boolean }> => {
    let response: Response
    try {
      response = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
    } catch {
      throw new Error("Verbindung zur API fehlgeschlagen.")
    }

    const data = await response.json() as { ok?: boolean; code?: string; field?: string }
    if (!response.ok || !data.ok) {
      if (response.status === 429 || data.code === "rate_limited") {
        const error = new Error("Zu viele Registrierungsversuche. Bitte versuche es später erneut.") as AuthRequestError
        error.code = data.code
        throw error
      }
      const error = new Error(
        data.field === "password" ? "Das Passwort muss mindestens 8 Zeichen enthalten." : "Bitte überprüfe deine E-Mail-Adresse.",
      ) as AuthRequestError
      error.code = data.code
      throw error
    }

    try {
      await login(email, password)
      return { requiresVerification: false }
    } catch (error) {
      const authError = error as AuthRequestError
      if (authError.code === "email_not_verified") {
        return { requiresVerification: true }
      }
      throw error
    }
  }

  return { register }
}