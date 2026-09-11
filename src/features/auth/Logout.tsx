import { useEffect } from "react"
import useSignOut from "react-auth-kit/hooks/useSignOut"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@store/hooks"
import { clearSession } from "@store/slices/sessionSlice"
import { clearLevelUp } from "@store/slices/gameSlice"
import { clearAuthCookies, getRefreshToken } from "@api/refreshTokenCookie"
import { clearAccessTokenOverride } from "@api/request"

const API = import.meta.env.VITE_API_URL

export default function Logout() {
  const signOut = useSignOut()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const logout = async () => {
      const refreshToken = getRefreshToken()
      try {
        await fetch(`${API}/users/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
      } finally {
        signOut()
        clearAuthCookies()
        clearAccessTokenOverride()
        localStorage.removeItem("token")
        dispatch(clearSession())
        dispatch(clearLevelUp())
        navigate("/logout-success")
      }
    }

    void logout()
  }, [signOut, navigate, dispatch])

  return null // nichts anzeigen – der Redirect geschieht sofort
}
