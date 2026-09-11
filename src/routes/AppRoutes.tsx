// src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthOutlet from "@auth-kit/react-router/AuthOutlet"
import GameApp from "../GameApp"
import Login from "../features/auth/Login"
import Register from "../features/auth/Register"
import VerifyEmail from "../features/auth/VerifyEmail"
import ForgotPassword from "../features/auth/ForgotPassword"
import ResetPassword from "../features/auth/ResetPassword"
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
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
