import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AvatarSelect from './playground/AvatarSelect.tsx'
import AvatarCustomizer from './playground/AvatarCustomizer.tsx'
import GetAssets from './playground/GetAssets.tsx'
import TopSelector from './playground/TopSelector.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <TopSelector />
  </StrictMode>,
)
