import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { resetPassword, type PasswordRequestError } from "./usePassword"

type ResetState = "form" | "success" | "expired" | "invalid"

export default function ResetPassword() {
  const token = new URLSearchParams(useLocation().search).get("token") ?? ""
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [state, setState] = useState<ResetState>(token ? "form" : "invalid")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen enthalten.")
      return
    }
    if (password !== repeat) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setState("success")
    } catch (requestError) {
      const authError = requestError as PasswordRequestError
      if (authError.code === "expired_token") setState("expired")
      else if (authError.code === "invalid_token") setState("invalid")
      else setError("Das Passwort konnte nicht geändert werden.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 px-6 text-white">
      <div className="w-full max-w-md text-center">
        {state === "form" && <form onSubmit={handleSubmit}><h2 className="text-4xl font-semibold">Neues Passwort</h2><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" placeholder="Neues Passwort" className="mt-8 h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-white outline-none focus:border-indigo-500" /><input type="password" value={repeat} onChange={(event) => setRepeat(event.target.value)} required autoComplete="new-password" placeholder="Passwort wiederholen" className="mt-4 h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-white outline-none focus:border-indigo-500" />{error && <p className="mt-4 text-sm text-red-400">{error}</p>}<button type="submit" disabled={loading} className="mt-6 h-12 w-full rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:opacity-70">{loading ? "Wird gespeichert..." : "Passwort speichern"}</button></form>}
        {state === "success" && <><h2 className="text-4xl font-semibold">Passwort geändert</h2><p className="mt-4 text-gray-300">Du kannst dich jetzt mit deinem neuen Passwort einloggen.</p><Link to="/login" className="mt-8 inline-block text-indigo-400 hover:underline">Zum Login</Link></>}
        {state === "expired" && <><h2 className="text-4xl font-semibold">Der Link ist abgelaufen</h2><p className="mt-4 text-gray-300">Fordere einen neuen Link zum Zurücksetzen an.</p><Link to="/forgot-password" className="mt-8 inline-block text-indigo-400 hover:underline">Neuen Link anfordern</Link></>}
        {state === "invalid" && <><h2 className="text-4xl font-semibold">Link nicht gültig</h2><p className="mt-4 text-gray-300">Der Link stimmt nicht oder wurde bereits verwendet.</p><Link to="/forgot-password" className="mt-8 inline-block text-indigo-400 hover:underline">Passwort zurücksetzen</Link></>}
      </div>
    </div>
  )
}