// src/GameApp.tsx
import GameLayout from "./layouts/GameLayout"
import GamePlay from "@game/GamePlay"

export default function GameApp() {
  return (
    <GameLayout>
      <GamePlay />
    </GameLayout>
  )
}
