// src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthOutlet from "@auth-kit/react-router/AuthOutlet"
import GameApp from "../GameApp"
import Login from "../features/auth/Login"
import Logout from "../features/auth/Logout"
import LogoutSuccess from "../features/auth/LogoutSuccess"
import AdminRoute from "./AdminRoute"
import Admin from "../admin/Admin"
import { ProtectedProviders } from "../AppProviders"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* öffentlich */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/logout-success" element={<LogoutSuccess />} />

        {/* geschützt: nur eingeloggt */}
        <Route element={<AuthOutlet fallbackPath="/login" />}>
          <Route
            path="/"
            element={
              <ProtectedProviders>
                <GameApp />
              </ProtectedProviders>
            }
          />
        </Route>

        {/* Admin: zusätzlich rollenbasiert */}
        <Route element={<AdminRoute fallbackPath="/login" />}>
          <Route
            path="/admin/*"
            element={
              <ProtectedProviders>
                <Admin />
              </ProtectedProviders>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
