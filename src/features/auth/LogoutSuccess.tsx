// src/pages/LogoutSuccess.tsx
import { Link } from "react-router-dom"

export default function LogoutSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4">
        Du bist erfolgreich ausgeloggt.
      </h1>
      <p className="text-gray-400 mb-8">Bis bald hoffentlich!</p>
      <Link
        to="/login"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded text-white"
      >
        Hier einloggen
      </Link>
    </div>
  )
}
