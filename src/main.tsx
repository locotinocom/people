import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.tsx'
//import TopSelector from './playground/TopSelector.tsx'
//import GetAssets from './playground/GetAssets.tsx'
//import App from './App.tsx'
//import GetAvatarTemplates from './playground/GetAvatarTemplates.tsx'
//import MakePermanentAvatars from './playground/MakePermanentAvatars.tsx'
import App from './App.tsx'
//import AvatarPlayground from './playground/AvatarPlayground.tsx'
//import Avatar2DEmotions from './playground/Avatar2DEmotions.tsx'
//import ShowAvatar from './playground/ShowAvatar.tsx'
//import GetAssets from './playground/GetAssets.tsx'
//import TopSelector from './playground/TopSelector.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
<App />
  </StrictMode>,
)
