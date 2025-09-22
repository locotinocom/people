import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

// unser Layout-Demo importieren
import ResponsiveLayoutDemo from "./components/ResponsiveLayoutDemo"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ResponsiveLayoutDemo />
  </React.StrictMode>
)
