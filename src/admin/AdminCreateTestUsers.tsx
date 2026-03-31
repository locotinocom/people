import { useState, useCallback, useEffect } from "react"
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader"

type UserResult = {
  email: string
  status: "success" | "error"
  message?: string
}

type AppUser = {
  id: number
  email: string
  role: string
  is_verified: boolean
  created: string
}

export default function AdminCreateTestUsers() {
  const API = import.meta.env.VITE_API_URL
  const authHeader = useAuthHeader()

  // ── Anlegen ──────────────────────────────────────────
  const [emailInput, setEmailInput] = useState("")
  const [password, setPassword] = useState("test99")
  const [isCreating, setIsCreating] = useState(false)
  const [createResults, setCreateResults] = useState<UserResult[]>([])

  // ── User-Liste ────────────────────────────────────────
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [resettingId, setResettingId] = useState<number | null>(null)
  const [resetMsg, setResetMsg] = useState<{ id: number; ok: boolean; msg: string } | null>(null)

  const parseEmails = (raw: string): string[] =>
    raw.split(/[,\n]+/).map((e) => e.trim()).filter((e) => e.length > 0)

  // User-Liste laden
  const loadUsers = useCallback(async () => {
    if (!authHeader) return
    setLoadingUsers(true)
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { Authorization: authHeader },
      })
      const json = await res.json()
      // nur role=user anzeigen (keine superadmins/admins)
      const list: AppUser[] = (json.data ?? []).filter((u: AppUser) => u.role === "user")
      setUsers(list)
    } catch {
      // still
    } finally {
      setLoadingUsers(false)
    }
  }, [authHeader, API])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Testuser anlegen
  const handleCreate = useCallback(async () => {
    if (!authHeader) return
    const emails = parseEmails(emailInput)
    if (emails.length === 0) return

    setIsCreating(true)
    setCreateResults([])
    const newResults: UserResult[] = []

    for (const email of emails) {
      try {
        const res = await fetch(`${API}/admin/create-test-user`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json()
        newResults.push({
          email,
          status: json.success ? "success" : "error",
          message: json.message ?? undefined,
        })
      } catch (err) {
        newResults.push({ email, status: "error", message: (err as Error).message })
      }
    }

    setCreateResults(newResults)
    setIsCreating(false)

    // Liste neu laden wenn was angelegt wurde
    if (newResults.some((r) => r.status === "success")) {
      loadUsers()
      setEmailInput("")
    }
  }, [authHeader, emailInput, password, API, loadUsers])

  // User resetten
  const handleReset = useCallback(async (user: AppUser) => {
    if (!authHeader) return
    if (!window.confirm(`Alle Spieldaten von "${user.email}" löschen?\nDer Account bleibt erhalten.`)) return

    setResettingId(user.id)
    setResetMsg(null)

    try {
      const res = await fetch(`${API}/admin/reset-user/${user.id}`, {
        method: "POST",
        headers: { Authorization: authHeader },
      })
      const json = await res.json()
      setResetMsg({ id: user.id, ok: json.success, msg: json.message ?? "" })
    } catch (err) {
      setResetMsg({ id: user.id, ok: false, msg: (err as Error).message })
    } finally {
      setResettingId(null)
    }
  }, [authHeader, API])

  const emails = parseEmails(emailInput)
  const canCreate = emails.length > 0 && password.length > 0 && !isCreating

  return (
    <div className="space-y-8">

      {/* ── Testuser anlegen ── */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Testuser anlegen</h2>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Email(s) — Komma oder Zeilenumbruch getrennt
          </label>
          <textarea
            rows={3}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={"max@test.com, lisa@test.com\noder eine pro Zeile"}
            className="w-full border p-2 rounded text-sm resize-none"
          />
          {emails.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {emails.length} Email{emails.length > 1 ? "s" : ""} erkannt
            </p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded text-sm"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isCreating ? "Lege an…" : `${emails.length > 0 ? emails.length + "x " : ""}User anlegen`}
        </button>

        {createResults.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {createResults.map((r) => (
              <div
                key={r.email}
                className={`text-sm px-3 py-2 rounded border ${
                  r.status === "success"
                    ? "bg-green-50 border-green-300 text-green-800"
                    : "bg-red-50 border-red-300 text-red-800"
                }`}
              >
                {r.status === "success" ? "✅" : "❌"} <strong>{r.email}</strong>
                {r.message && <span className="ml-2 opacity-70">{r.message}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Testuser Liste + Reset ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Testuser ({users.length})</h2>
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {loadingUsers ? "Lädt…" : "↻ Aktualisieren"}
          </button>
        </div>

        {users.length === 0 && !loadingUsers && (
          <p className="text-sm text-gray-400">Keine User mit role=user gefunden.</p>
        )}

        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between border rounded px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{u.email}</span>
                <span className="ml-2 text-xs text-gray-400">ID: {u.id}</span>
                {resetMsg?.id === u.id && (
                  <span className={`ml-3 text-xs ${resetMsg.ok ? "text-green-600" : "text-red-600"}`}>
                    {resetMsg.ok ? "✅" : "❌"} {resetMsg.msg}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleReset(u)}
                disabled={resettingId === u.id}
                className="ml-4 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
              >
                {resettingId === u.id ? "Resette…" : "🔄 Reset"}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
