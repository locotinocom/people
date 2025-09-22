import React, { useRef } from "react"
import Header from "./components/Header"
import Footer from "./components/Footer"
import InterventionSwiper from "./components/InterventionSwiper"
import LevelUpOverlay from "./components/LevelUpOverlay"
import { GameProvider, useGame } from "./context/GameContext"
import { useReward } from "./hooks/useReward"

function AppInner({
  xpTargetRef,
  diaTargetRef,
  spawnXp,
}: {
  xpTargetRef: React.RefObject<HTMLDivElement>
  diaTargetRef: React.RefObject<HTMLDivElement>
  spawnXp: (amount: number, durationOverride?: number) => Promise<void> | void
}) {
  const { showLevelUp, pendingReward, claimReward, level } = useGame()

  return (
    <div className="h-dvh flex items-center justify-center bg-gray-900 text-white">
      {/* Wrapper: Mobile = fullscreen, Desktop = Box */}
      <div className="h-full w-full flex flex-col bg-gray-900 sm:rounded-lg sm:shadow-lg sm:max-w-3xl sm:max-h-[700px] overflow-hidden">
        {/* Header */}
        <Header xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} />

        {/* Content */}
        <main className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <InterventionSwiper
              xpTargetRef={xpTargetRef}
              diaTargetRef={diaTargetRef}
              spawnXp={spawnXp}
            />
          </div>
        </main>

        {/* Footer */}
        <Footer />

        {/* Overlay bei Level-Up */}
        {showLevelUp && pendingReward && (
          <LevelUpOverlay
            level={level}
            reward={pendingReward.amount}
            onClaim={claimReward}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  const xpTargetRef = useRef<HTMLDivElement>(null)
  const diaTargetRef = useRef<HTMLDivElement>(null)

  const { spawnXp, RewardParticles } = useReward(xpTargetRef, diaTargetRef)

  return (
    <GameProvider>
      <AppInner
        xpTargetRef={xpTargetRef}
        diaTargetRef={diaTargetRef}
        spawnXp={spawnXp}
      />
      <RewardParticles />
    </GameProvider>
  )
}
