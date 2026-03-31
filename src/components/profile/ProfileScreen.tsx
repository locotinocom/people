// src/components/profile/ProfileScreen.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { closeOverlay } from "@store/slices/uiOverlaySlice"
import { useReduxApi } from "@api/reduxApi"
import type { UserProfilePatch } from "@api/types"
import type { ReactNode } from "react"

// ---------------------------------------------------------------------------
// Tab-Typen
// ---------------------------------------------------------------------------
type Tab = "info" | "subscription" | "payment"

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "info", label: "Allgemein", icon: "👤" },
  { id: "subscription", label: "Abo", icon: "⭐" },
  { id: "payment", label: "Zahlung", icon: "💳" },
]

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const user = useAppSelector((s) => s.session.user)

  const [activeTab, setActiveTab] = useState<Tab>("info")

  const handleLogout = () => {
    dispatch(closeOverlay())
    navigate("/logout")
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-800">
        <div className="w-full max-w-2xl mx-auto px-5 pt-12 pb-3">
          <h2 className="text-xl font-bold text-white">Mein Profil</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {user?.email ?? "Nicht eingeloggt"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-gray-800">
        <div className="w-full max-w-2xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium flex flex-col items-center gap-0.5 transition-colors
                ${
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab-Inhalt */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-2xl mx-auto">
          {activeTab === "info" && <TabInfo onLogout={handleLogout} />}
          {activeTab === "subscription" && <TabSubscription />}
          {activeTab === "payment" && <TabPayment />}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Allgemein / Infos
// ---------------------------------------------------------------------------
function TabInfo({ onLogout }: { onLogout: () => void }) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const user = useAppSelector((s) => s.session.user)
  const profile = useAppSelector((s) => s.session.profile)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(profile?.name ?? user?.name ?? "")
  const [age, setAge] = useState<string>(profile?.age != null ? String(profile.age) : "")
  const [gender, setGender] = useState<string>(profile?.gender ?? "")
  const [country, setCountry] = useState(profile?.country ?? "")
  const [occupation, setOccupation] = useState(profile?.occupation ?? "")

  const handleSave = async () => {
    if (!api) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const patch: UserProfilePatch = {}

    if (name !== (profile?.name ?? user?.name ?? "")) patch.name = name || null
    if (age !== (profile?.age != null ? String(profile.age) : "")) patch.age = age ? parseInt(age, 10) : null
    if (gender !== (profile?.gender ?? "")) patch.gender = (gender as any) || null
    if (country !== (profile?.country ?? "")) patch.country = country || null
    if (occupation !== (profile?.occupation ?? "")) patch.occupation = occupation || null

    if (Object.keys(patch).length === 0) {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    try {
      await dispatch(patchUserProfile({ api, patch })).unwrap()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 py-5 space-y-5">
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Account
        </h3>
        <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
          <InfoRow label="E-Mail" value={user?.email ?? "–"} />
          <InfoRow
            label="Mitglied seit"
            value={
              user?.created
                ? new Date(user.created).toLocaleDateString("de-AT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "–"
            }
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Profil
        </h3>

        <div className="space-y-3">
          <FormField label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </FormField>

          <FormField label="Alter">
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="z.B. 28"
              min={10}
              max={120}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </FormField>

          <FormField label="Geschlecht">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">– Keine Angabe –</option>
              <option value="m">Männlich</option>
              <option value="f">Weiblich</option>
              <option value="divers">Divers</option>
              <option value="unbekannt">Keine Angabe</option>
            </select>
          </FormField>

          <FormField label="Land">
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="z.B. Österreich"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </FormField>

          <FormField label="Beruf">
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="z.B. Lehrerin"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </FormField>
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto sm:min-w-[220px] px-6 py-2.5 rounded-xl font-semibold text-sm transition
              ${
                saving
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : saved
                  ? "bg-green-600 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
          >
            {saving ? "Speichern…" : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
        </div>
      </section>

      <section className="pt-2 pb-6">
        <div className="flex justify-center">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto sm:min-w-[220px] px-6 py-2.5 rounded-xl font-semibold text-sm bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800/50 transition"
          >
            🚪 Abmelden
          </button>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Abo
// ---------------------------------------------------------------------------
function TabSubscription() {
  return (
    <div className="px-5 py-5 space-y-4">
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Aktuelles Abo
        </h3>
        <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🆓</span>
          <div>
            <p className="font-semibold text-white">Kostenlos</p>
            <p className="text-xs text-gray-400 mt-0.5">Voller Zugang zu Level 1–3</p>
          </div>
          <span className="ml-auto text-xs bg-green-800/50 text-green-400 px-2 py-1 rounded-full font-medium">
            Aktiv
          </span>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Verfügbare Pläne
        </h3>

        <div className="space-y-3">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Free</p>
                <p className="text-xs text-gray-400 mt-0.5">Level 1–3 · Basis-Features</p>
              </div>
              <span className="text-sm font-bold text-white shrink-0">0 €</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-800/40 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] bg-purple-700/60 text-purple-200 px-2 py-0.5 rounded-full font-medium">
              Coming Soon
            </div>

            <div className="flex items-center justify-between gap-3 opacity-60">
              <div>
                <p className="font-semibold text-white flex items-center gap-1.5">
                  ⭐ Pro
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Alle Level · KI-Features · Priority Support
                </p>
              </div>
              <span className="text-sm font-bold text-white shrink-0">9,99 € / Jahr</span>
            </div>

            <div className="mt-3 flex justify-center sm:justify-start">
              <button
                disabled
                className="w-full sm:w-auto sm:min-w-[220px] px-6 py-2 rounded-lg text-sm font-semibold bg-purple-800/30 text-purple-400 cursor-not-allowed"
              >
                Bald verfügbar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Automatische Verlängerung
        </h3>
        <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Auto-Verlängerung</p>
            <p className="text-xs text-gray-500 mt-0.5">Derzeit deaktiviert</p>
          </div>
          <div className="w-11 h-6 bg-gray-700 rounded-full relative cursor-not-allowed opacity-50 shrink-0">
            <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 px-1">
          Abrechnung einmal jährlich. Keine monatlichen Abbuchungen.
        </p>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Zahlung
// ---------------------------------------------------------------------------
function TabPayment() {
  return (
    <div className="px-5 py-5 space-y-4">
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Zahlungsart
        </h3>

        <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-sm text-gray-400">Keine Zahlungsart hinterlegt</p>
            <p className="text-xs text-gray-600 mt-0.5">Wird für Pro-Abo benötigt</p>
          </div>
        </div>

        <div className="mt-3 flex justify-center sm:justify-start">
          <button
            disabled
            className="w-full sm:w-auto sm:min-w-[240px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
          >
            + Zahlungsart hinzufügen (Coming Soon)
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Rechnungen
        </h3>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-500 text-center py-4">
            Noch keine Rechnungen vorhanden
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Zahlungshistorie
        </h3>

        <div className="space-y-2">
          {[
            { date: "–", desc: "Noch keine Transaktionen", amount: "" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm text-gray-400">{item.desc}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.date}</p>
              </div>
              {item.amount && (
                <span className="text-sm font-semibold text-white shrink-0">
                  {item.amount}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hilfs-Komponenten
// ---------------------------------------------------------------------------
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium text-right">{value}</span>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 font-medium">{label}</label>
      {children}
    </div>
  )
}