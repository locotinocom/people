import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { resendVerificationEmail } from "./useRegister"

type VerificationState = "loading" | "success" | "expired" | "invalid" | "error"

export default function VerifyEmail() {
  const location = useLocation()
  const token = new URLSearchParams(location.search).get("token") ?? ""
  const [state, setState] = useState<VerificationState>("loading")
  const [email, setEmail] = useState("")
  const [resendSeconds, setResendSeconds] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState("invalid")
      return
    }
    const verify = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await response.json() as { ok?: boolean; code?: string }
        if (response.ok && data.ok) setState("success")
        else if (data.code === "expired_token") setState("expired")
        else setState("invalid")
      } catch {
        setState("error")
      }
    }
    void verify()
  }, [token])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setInterval(() => setResendSeconds((seconds) => seconds - 1), 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  const resend = async () => {
    if (resendSeconds > 0) return
    setMessage(null)
    try {
      await resendVerificationEmail(email)
      setResendSeconds(60)
      setMessage("Eine neue Mail wurde angefordert.")
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Die Mail konnte nicht angefordert werden.")
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 px-6 text-white">
      <div className="w-full max-w-md text-center">
        {state === "loading" && <p className="text-gray-300">Bestätigung wird geprüft.</p>}
        {state === "success" && <><h2 className="text-4xl font-semibold">E-Mail bestätigt</h2><p className="mt-4 text-gray-300">Deine E-Mail-Adresse ist bestätigt.</p><Link to="/login" className="mt-8 inline-block h-12 rounded-lg bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-700">Zum Login</Link></>}
        {state === "expired" && <><h2 className="text-4xl font-semibold">Der Link ist abgelaufen</h2><p className="mt-4 text-gray-300">Fordere einen neuen Bestätigungslink an.</p><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail-Adresse" className="mt-8 h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-white outline-none" /><button type="button" onClick={resend} disabled={resendSeconds > 0 || !email} className="mt-4 h-12 w-full rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:opacity-70">{resendSeconds > 0 ? `Erneut senden in ${resendSeconds}s` : "Neuen Link senden"}</button>{message && <p className="mt-4 text-sm text-gray-300">{message}</p>}</>}
        {state === "invalid" && <><h2 className="text-4xl font-semibold">Link nicht gültig</h2><p className="mt-4 text-gray-300">Der Bestätigungslink stimmt nicht oder wurde bereits verwendet.</p><Link to="/register" className="mt-8 inline-block text-indigo-400 hover:underline">Zur Registrierung</Link></>}
        {state === "error" && <><h2 className="text-4xl font-semibold">Bestätigung nicht möglich</h2><p className="mt-4 text-gray-300">Bitte versuche es später erneut.</p><Link to="/login" className="mt-8 inline-block text-indigo-400 hover:underline">Zum Login</Link></>}
      </div>
    </div>
  )
}