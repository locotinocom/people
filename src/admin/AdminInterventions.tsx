import { useState } from 'react'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export default function AdminInterventions() {
  const API = import.meta.env.VITE_API_URL
  const authHeader = useAuthHeader()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const upload = async () => {
    if (!file || !authHeader) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API}/admin/interventionsUpload`, {
        method: 'POST',
        headers: { Authorization: authHeader },
        body: formData,
      })

      const json = await res.json()
      const updated = json.data?.updated ?? json.updated
      const message = json.message ?? 'Interventions importiert'

      if (json.success) {
        alert(`✅ Upload erfolgreich (${updated ?? 0} Einträge)\n${message}`)
      } else {
        alert(`❌ Fehler: ${json.error || 'Unbekannter Fehler'}`)
      }
    } catch (err) {
      alert(`❌ Upload fehlgeschlagen: ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  const updateMaster = async () => {
    if (!authHeader) return
    setUpdating(true)
    try {
      const res = await fetch(`${API}/admin/updateMaster`, {
        method: 'POST',
        headers: { Authorization: authHeader },
      })
      const json = await res.json()
      const updated = json.data?.updated ?? json.updated
      const message = json.message ?? 'Master aktualisiert'

      if (json.success) {
        alert(`✅ ${message} (${updated ?? 0} Einträge)`)
      } else {
        alert(`❌ Fehler: ${json.error || 'Unbekannter Fehler'}`)
      }
    } catch (err) {
      alert(`❌ Update fehlgeschlagen: ${(err as Error).message}`)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Master-Interventionen</h2>

      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-2 rounded"
      />

      <button
        onClick={upload}
        disabled={!file || uploading}
        className="ml-3 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? 'Lädt...' : 'Hochladen'}
      </button>

      <button
        onClick={updateMaster}
        disabled={updating}
        className="ml-3 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {updating ? 'Aktualisiert...' : 'Update Master'}
      </button>
    </div>
  )
}
