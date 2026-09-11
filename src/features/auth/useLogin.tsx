import { useNavigate } from "react-router-dom"
import useSignIn from "react-auth-kit/hooks/useSignIn"
import { clearRefreshToken, setRefreshToken } from "@api/refreshTokenCookie"
//import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated"

export type AuthRequestError = Error & { code?: string }

export function useLogin() {
  const signIn = useSignIn()
 // const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL

  const login = async (email: string, password: string, remember = false) => {
    let res
    try {
      res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      })
    } catch {
      throw new Error("Verbindung zur API fehlgeschlagen.")
    }

    const data = await res.json() as {
      token?: string
      refreshToken?: string
      user?: { email?: string; role?: string; user_avatar_id?: number; name?: string | null; id?: number }
      message?: string
      code?: string
    }
    if (!res.ok || !data.token || !data.user) {
      const error = new Error(data.message || "Login fehlgeschlagen.") as AuthRequestError
      error.code = data.code
      throw error
    }

    // JWT speichern
    const ok = signIn({
      auth: { token: data.token, type: "Bearer" },
      userState: {
        email,
        role: data.user.role,
        user_avatar_id: data.user.user_avatar_id,
        name: data.user.name,
        id: data.user.id,
      },
    })

    if (!ok) throw new Error("Session konnte nicht gespeichert werden.")
    if (remember && data.refreshToken) setRefreshToken(data.refreshToken)
    else clearRefreshToken()
window.scrollTo(0, 0)
    // 🔥 nach dem Login direkt weiter
    navigate("/", { replace: true })
  }

  return { login }
}
