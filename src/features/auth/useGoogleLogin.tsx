import { useNavigate } from "react-router-dom"
import useSignIn from "react-auth-kit/hooks/useSignIn"
import type { AuthRequestError } from "./useLogin"
import { setRefreshToken } from "@api/refreshTokenCookie"

const API = import.meta.env.VITE_API_URL

export function useGoogleLogin() {
  const signIn = useSignIn()
  const navigate = useNavigate()

  const loginWithGoogle = async (code: string): Promise<void> => {
    let response: Response
    try {
      response = await fetch(`${API}/users/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
    } catch {
      throw new Error("Verbindung zur API fehlgeschlagen.")
    }

    const data = await response.json() as { token?: string; refreshToken?: string; user?: Record<string, unknown>; code?: string }
    if (!response.ok || !data.token || !data.user || !data.refreshToken) {
      const error = new Error("Die Anmeldung mit Google hat nicht geklappt. Versuche es erneut oder nutze das Formular.") as AuthRequestError
      error.code = data.code
      throw error
    }

    const ok = signIn({
      auth: { token: data.token, type: "Bearer" },
      userState: {
        email: data.user.email,
        role: data.user.role,
        user_avatar_id: data.user.user_avatar_id,
        name: data.user.name,
        id: data.user.id,
      },
    })
    if (!ok) throw new Error("Session konnte nicht gespeichert werden.")
    setRefreshToken(data.refreshToken)
    navigate("/", { replace: true })
  }

  return { loginWithGoogle }
}