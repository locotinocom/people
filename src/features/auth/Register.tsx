import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { resendVerificationEmail, useRegister } from "./useRegister"
import GoogleSignInButton from "./GoogleSignInButton"
import { useGoogleLogin } from "./useGoogleLogin"

export default function Register() {
  const { register } = useRegister()
  const { loginWithGoogle } = useGoogleLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordRepeat, setPasswordRepeat] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.style.overflowX = "hidden"
    document.body.style.overflowX = "hidden"
  }, [])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setInterval(() => setResendSeconds((seconds) => seconds - 1), 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError(null)
    setResendMessage(null)
    if (password !== passwordRepeat) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setLoading(true)
    try {
      const result = await register(email, password)
      if (result.requiresVerification) setNeedsVerification(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Registrierung fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (resendSeconds > 0) return
    setResendMessage(null)
    try {
      await resendVerificationEmail(email)
      setResendSeconds(60)
      setResendMessage("Eine neue Mail wurde angefordert.")
    } catch (requestError) {
      setResendMessage(requestError instanceof Error ? requestError.message : "Die Mail konnte nicht erneut angefordert werden.")
    }
  }

  if (needsVerification) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 px-6 text-white">
        <div className="w-full max-w-md text-center">
          <h2 className="text-4xl font-semibold tracking-tight">Schau in dein Postfach</h2>
          <p className="mt-4 text-gray-300">Wir haben einen Bestätigungslink an {email} gesendet.</p>
          <button
            type="button"
            onClick={resend}
            disabled={resendSeconds > 0}
            className="mt-8 h-12 w-full rounded-lg bg-indigo-600 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-900 disabled:opacity-70"
          >
            {resendSeconds > 0 ? `Erneut senden in ${resendSeconds}s` : "Mail erneut senden"}
          </button>
          {resendMessage && <p className="mt-4 text-sm text-gray-300">{resendMessage}</p>}
          <Link to="/login" className="mt-8 inline-block text-indigo-400 hover:underline">Zum Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-x-hidden overflow-y-auto bg-gray-900 font-sans text-white selection:bg-indigo-500/30">
      <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-6 py-10 sm:py-16">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center">
          <h2 className="text-center text-4xl font-semibold tracking-tight">Registrieren</h2>
          <p className="mt-3 max-w-[280px] text-center text-sm text-gray-400">Erstelle dein Konto und beginne deinen Weg.</p>
          <div className="mt-8 w-full"><GoogleSignInButton onCode={(code) => void loginWithGoogle(code).catch((err: unknown) => setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen."))} /></div>
          <div className="my-6 flex w-full items-center gap-4"><div className="h-px flex-1 bg-gray-700" /><span className="whitespace-nowrap text-sm text-gray-400">oder mit E-Mail</span><div className="h-px flex-1 bg-gray-700" /></div>

          <div className="mt-8 flex h-12 w-full items-center rounded-lg border border-gray-700 bg-gray-800 pl-5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="h-full w-full bg-transparent px-3 text-base text-gray-300 outline-none placeholder:text-gray-500" placeholder="E-Mail-Adresse" />
          </div>
          <div className="mt-4 flex h-12 w-full items-center rounded-lg border border-gray-700 bg-gray-800 pl-5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required className="h-full w-full bg-transparent px-3 text-base text-gray-300 outline-none placeholder:text-gray-500" placeholder="Passwort" />
          </div>
          <div className="mt-4 flex h-12 w-full items-center rounded-lg border border-gray-700 bg-gray-800 pl-5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30">
            <input type="password" value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} autoComplete="new-password" required className="h-full w-full bg-transparent px-3 text-base text-gray-300 outline-none placeholder:text-gray-500" placeholder="Passwort wiederholen" />
          </div>

          {error && <div className="mt-6 w-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className={`mt-8 h-12 w-full rounded-lg font-semibold text-white shadow-lg transition-all ${loading ? "bg-indigo-800 opacity-70" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {loading ? "Wird geladen..." : "Konto erstellen"}
          </button>
          <p className="mt-4 text-center text-xs text-gray-500">Mit der Registrierung akzeptierst du die <a href="/datenschutz" className="text-indigo-400 hover:underline">Datenschutzerklärung</a> und die <a href="/agb" className="text-indigo-400 hover:underline">AGB</a>.</p>
          <p className="mt-8 text-center text-sm text-gray-400">Du hast bereits ein Konto? <Link to="/login" className="font-medium text-indigo-400 hover:underline">Zum Login</Link></p>
        </form>
      </div>
    </div>
  )
}