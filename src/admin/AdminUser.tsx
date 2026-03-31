import { useEffect, useState } from 'react'
import { adminApi } from '@api/adminApi'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export default function AdminUser() {
  const [users, setUsers] = useState<any[]>([])
  const authHeader = useAuthHeader()
useEffect(() => {
  if (!authHeader) return

  adminApi
    .getUsers(authHeader)
    .then((res) => {
      console.log('🔍 API response:', res)
      if (res.success && Array.isArray(res.data)) setUsers(res.data)
      else if (Array.isArray(res)) setUsers(res) // fallback falls request() data direkt liefert
      else setUsers([])
    })
    .catch(() => setUsers([]))
}, [authHeader])



  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Benutzerverwaltung</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">ID</th>
            <th className="p-2">E-Mail</th>
            <th className="p-2">Name</th>
            <th className="p-2">Rolle</th>
            <th className="p-2">Verifiziert</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.name || '-'}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.is_verified ? '✔' : '✘'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
