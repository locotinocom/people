import { useState, useEffect } from 'react'
import { useLogin } from './useLogin'

export default function Login() {
  const { login } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sicherstellen, dass beim Laden der Seite alles auf Null steht
  useEffect(() => {
    window.scrollTo(0, 0);
    // Hard-Reset für iOS Scroll-Bug
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setError(null)
    setLoading(true)

    // Keyboard schließen, bevor der Request/Redirect startet
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    try {
      await login(email, password)
      // Nach dem Login nochmal hart auf 0 setzen, damit GameApp sauber lädt
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    } catch (err: any) {
      setError(err.message ?? 'Login fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    // fixed inset-0 hält den Container bombenfest auf dem Screen
    <div className="fixed inset-0 flex flex-col bg-gray-900 text-white font-sans overflow-x-hidden overflow-y-auto selection:bg-indigo-500/30">
      
      {/* Rechter Loginbereich (wird auf Mobile zentriert) */}
      <div className="w-full max-w-md mx-auto h-full flex flex-col justify-center px-6 py-10 sm:py-16">
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          
          {/* Header - Zentral wie im alten Design */}
          <h2 className="text-4xl font-semibold tracking-tight text-center">Einloggen</h2>
          <p className="text-sm text-gray-400 mt-3 text-center max-w-[280px]">
            Willkommen zurück! Bitte log dich ein, um fortzufahren
          </p>

          {/* Google Button - Altes Design Look */}
          <button
            type="button"
            className="w-full mt-8 bg-gray-700/40 flex items-center justify-center h-12 border border-gray-600 hover:bg-gray-700 transition-colors rounded-lg active:scale-[0.98]"
          >
            <img
              src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg"
              alt="Google"
              className="h-5"
            />
          </button>

          {/* Trenner */}
          <div className="flex items-center gap-4 w-full my-6">
            <div className="flex-1 h-px bg-gray-700" />
            <p className="text-sm text-gray-400 whitespace-nowrap">oder mit E-Mail</p>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* E-Mail Feld - Altes Design Look (Dunkle Box + Icon) */}
          <div className="flex items-center w-full border border-gray-700 h-12 bg-gray-800 rounded-lg focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all pl-5">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="shrink-0">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                fill="#9CA3AF"
              />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              // text-base (16px) verhindert iOS Auto-Zoom!
              className="bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base w-full h-full px-3"
              placeholder="E-Mail-Adresse"
            />
          </div>

          {/* Passwort Feld - Altes Design Look (Dunkle Box + Icon) */}
          <div className="flex items-center mt-4 w-full border border-gray-700 h-12 bg-gray-800 rounded-lg focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all pl-5">
            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" className="shrink-0">
              <path
                d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                fill="#9CA3AF"
              />
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="bg-transparent text-gray-300 placeholder-gray-500 outline-none text-base w-full h-full px-3"
              placeholder="Passwort"
            />
          </div>

          {/* Zusatzoptionen */}
          <div className="w-full flex items-center justify-between mt-6 text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-offset-gray-900 group-hover:border-indigo-500/50"
              />
              <span className="text-sm group-hover:text-gray-200 transition-colors">Angemeldet bleiben</span>
            </label>
            <a href="/forgot-password" title='Passwort vergessen' className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              Passwort vergessen?
            </a>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center mt-6">
              {error}
            </div>
          )}

          {/* Submit Button - Altes Design Look */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-8 w-full h-12 text-white font-semibold rounded-lg shadow-lg active:scale-[0.98] transition-all ${
              loading ? 'bg-indigo-800 opacity-70' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10'
            }`}
          >
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </button>

          {/* Registrieren Link */}
          <p className="text-gray-400 text-sm mt-8 text-center">
            Noch kein Konto?{' '}
            <a href="/register" className="text-indigo-400 font-medium hover:underline">
              Jetzt registrieren
            </a>
          </p>

        </form>
          
      </div>
    </div>
  )
}