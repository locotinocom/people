import { useEffect } from "react"
import useSignOut from "react-auth-kit/hooks/useSignOut"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@store/hooks"
import { clearSession } from "@store/slices/sessionSlice"
import { clearLevelUp } from "@store/slices/gameSlice"

export default function Logout() {
  const signOut = useSignOut()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  useEffect(() => {
    signOut()                          // Token + UserSession löschen
    localStorage.removeItem("token")   // falls du zusätzlich speicherst

    // Redux-State und LevelUp-Storage vollständig zurücksetzen
    // clearSession() ruft intern clearAllLevelUpStorage() auf
    dispatch(clearSession())
    dispatch(clearLevelUp())

    navigate("/logout-success")        // sofort weiterleiten
  }, [signOut, navigate, dispatch])

  return null // nichts anzeigen – der Redirect geschieht sofort
}
