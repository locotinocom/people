import './App.css'
import { GameProvider } from "./context/GameContext"
import MainSwiper from "./MainSwiper"

export default function App() {
  return (
    <GameProvider>
      <MainSwiper />
    </GameProvider>
  )
}
