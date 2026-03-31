import { useNavigate } from "react-router-dom"
import useSignIn from "react-auth-kit/hooks/useSignIn"
//import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated"

export function useLogin() {
  const signIn = useSignIn()
 // const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL

  const login = async (email: string, password: string) => {
    let res
    try {
      res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error("Verbindung zur API fehlgeschlagen.")
    }

    const data = await res.json()
    if (!res.ok || !data.token) {
      throw new Error(data.message || "Login fehlgeschlagen.")
    }

    // 🔥 Token, User usw. hier direkt verfügbar
    console.log("🔑 Login erfolgreich → Token:", data.token)
    console.log("👤 User:", data.user)

    // JWT speichern
    const ok = signIn({
      auth: { token: data.token, type: "Bearer" },
      refresh: data.refreshToken,
      userState: {
        email,
        role: data.user.role,
        user_avatar_id: data.user.user_avatar_id,
        name: data.user.name,
        id: data.user.id,
      },
    })

    console.log("🔐 useLogin -> signIn result:", ok)

    if (!ok) throw new Error("Session konnte nicht gespeichert werden.")
window.scrollTo(0, 0)
    // 🔥 nach dem Login direkt weiter
    navigate("/", { replace: true })
  }

  return { login }
}
