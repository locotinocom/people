import { useState } from "react"
import { Link } from "react-router-dom"
import { requestPasswordReset } from "./usePassword"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Die Anfrage konnte nicht verarbeitet werden.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 px-6 text-white">
      <div className="w-full max-w-md">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <h2 className="text-center text-4xl font-semibold tracking-tight">Passwort vergessen</h2>
            <p className="mt-4 text-center text-gray-300">Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.</p>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="E-Mail-Adresse" className="mt-8 h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-base text-white outline-none focus:border-indigo-500" />
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="mt-6 h-12 w-full rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:opacity-70">{loading ? "Wird geladen..." : "Link anfordern"}</button>
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-semibold">Prüfe dein Postfach</h2>
            <p className="mt-4 text-gray-300">Wenn es zu dieser Adresse ein Konto gibt, ist die Mail unterwegs.</p>
          </div>
        )}
        <div className="mt-8 text-center"><Link to="/login" className="text-indigo-400 hover:underline">Zum Login</Link></div>
      </div>
    </div>
  )
}