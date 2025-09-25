import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.tsx'
//import TopSelector from './playground/TopSelector.tsx'
import App from './App.tsx'
//import GetAssets from './playground/GetAssets.tsx'
//import TopSelector from './playground/TopSelector.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
 <App />
  </StrictMode>,
)
