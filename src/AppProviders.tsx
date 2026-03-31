// src/context/AppProviders.tsx
import type { ReactNode } from "react"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@store/store"

import { AnimationProvider } from "@context/AnimationContext"
import { SlideManagerProvider } from "@context/SlideManagerContext"

import AuthProvider from "react-auth-kit"
import createStore from "react-auth-kit/createStore"

// 🔐 Auth-Setup (wie bisher)
const authStore = createStore({
  authName: "_auth",
  authType: "cookie",
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === "https:",
})

function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <SlideManagerProvider>
      {children}
    </SlideManagerProvider>
  )
}


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider store={authStore}>
      <ReduxProvider store={store}>
        
        {/* 🔥 AnimationProvider ganz oben, außerhalb von ProtectedProviders */}
        <AnimationProvider>

          <ProtectedProviders>{children}</ProtectedProviders>

        </AnimationProvider>

      </ReduxProvider>
    </AuthProvider>
  )
}


export { ProtectedProviders }
