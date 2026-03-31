// src/api/adminApi.ts
import { request } from './request'
//import { type ApiResponse as GlobalApiResponse } from './types' // Importiere den globalen Typ, falls vorhanden

export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  is_verified: boolean
  provider?: string
  created?: string
  modified?: string
}

// Wir machen data optional bzw. erlauben null, damit es zum request-Helper passt
export type ApiResponse<T> = {
  success: boolean
  data: T | null  // <--- Hier war der Fehler: null muss erlaubt sein
  message?: string
  error?: string | null
}

export const adminApi = {
  /** GET /admin/users */
  getUsers(token?: string): Promise<ApiResponse<AdminUser[]>> {
    // Wir casten den Rückgabetyp explizit, um die Kompatibilität zu erzwingen
    return request('/admin/users', {}, token) as Promise<ApiResponse<AdminUser[]>>
  },

  /** POST /admin/interventionsUpload */
  uploadInterventions(
    formData: FormData,
    token?: string
  ): Promise<ApiResponse<{ updated: number }>> {
    return request('/admin/interventionsUpload', { method: 'POST', body: formData }, token) as Promise<ApiResponse<{ updated: number }>>
  },

  /** POST /admin/updateMaster */
  updateMaster(token?: string): Promise<ApiResponse<{ updated: number }>> {
    return request('/admin/updateMaster', { method: 'POST' }, token) as Promise<ApiResponse<{ updated: number }>>
  },

  /** DELETE /admin/userDelete/{id} */
  deleteUser(id: number, token?: string): Promise<ApiResponse<null>> {
    return request(`/admin/userDelete/${id}`, { method: 'DELETE' }, token) as Promise<ApiResponse<null>>
  },
}