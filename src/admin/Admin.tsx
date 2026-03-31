import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import AdminUser from './AdminUser';
import AdminInterventions from './AdminInterventions';
import AdminCreateTestUsers from './AdminCreateTestUsers';

//import AdminSettings from './AdminSettings';

export default function Admin() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-900 text-white p-4 space-y-3">
        <h1 className="text-lg font-semibold mb-4">Adminbereich</h1>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin/users" className="hover:text-blue-400">Benutzer</NavLink>
          <NavLink to="/admin/interventions" className="hover:text-blue-400">Interventionen</NavLink>
          <NavLink to="/admin/settings" className="hover:text-blue-400">Einstellungen</NavLink>
          <NavLink to="/admin/testuser" className="hover:text-blue-400">Testbenutzer</NavLink>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Navigate to="users" replace />} />
          <Route path="/users" element={<AdminUser />} />
          <Route path="/interventions" element={<AdminInterventions />} />
           <Route path="/testuser" element={<AdminCreateTestUsers />} />
          {/* <Route path="settings" element={<AdminSettings />} /> */}
        </Routes>
      </main>
    </div>
  );
}
