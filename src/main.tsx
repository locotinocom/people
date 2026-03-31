// src/main.tsx
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { AppProviders } from "./AppProviders"
import { Toaster } from "react-hot-toast"
import { ErrorBoundary } from "./components/ErrorBoundary" // <-- Importieren

// Ein hübsches Fallback-Design für den Notfall
const GlobalErrorFallback = (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-slate-200">
      <span className="text-5xl">⚡</span>
      <h1 className="text-2xl font-bold text-slate-800 mt-4">System-Check nötig</h1>
      <p className="text-slate-600 mt-2">
        Ein unerwarteter Fehler hat den Flow unterbrochen. Keine Sorge, deine Daten sind sicher.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
      >
        App neu starten
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <ErrorBoundary fallback={GlobalErrorFallback}>
      <App />
    </ErrorBoundary>

    <Toaster 
      position="top-center" 
      toastOptions={{
        style: {
          zIndex: 200000,
        }
      }}
    />
  </AppProviders>
)