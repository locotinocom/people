import { useRef } from "react"
import Header from "./components/Header"
import InterventionSwiper from "./components/InterventionSwiper"
import LevelUpOverlay from "./components/LevelUpOverlay"
import { useGame } from "./context/GameContext"
import Footer from "./components/Footer"

export default function MainSwiper() {
  const xpTargetRef = useRef<HTMLDivElement>(null)
  const diaTargetRef = useRef<HTMLDivElement>(null)

  const { showLevelUp, pendingReward, claimReward, level } = useGame()

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div
        className="grid h-full w-full max-w-[500px] bg-zinc-900 md:h-[800px] md:w-4/5 grid-rows-[auto,1fr,auto] overflow-hidden shadow-lg"
      >
        {/* Header */}
        <Header xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} />

        {/* Interventionen-Swiper */}
        <InterventionSwiper xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} spawnXp={function (_amount: number, _durationOverride?: number): Promise<void> | void {
          throw new Error("Function not implemented.")
        } } />

        {/* Overlay bei Level-Up */}
        {showLevelUp && pendingReward && (
          <LevelUpOverlay
            level={level}
            reward={pendingReward.amount}
            onClaim={claimReward}
          />
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
