import { useRef, useState } from "react"
import type { RefObject } from "react"

import Header from "./components/Header"
import Footer from "./components/Footer"
import InterventionSwiper from "./components/swiper"

import LevelUpOverlay from "./components/LevelUpOverlay"
import { GameProvider, useGame } from "./context/GameContext"
import { useReward } from "./hooks/useReward"
import FooterControls from "./components/FooterControls"


function AppInner({
  xpTargetRef,
  diaTargetRef,
  spawnXp,
}: {
  xpTargetRef: RefObject<HTMLDivElement>
  diaTargetRef: RefObject<HTMLDivElement>
  spawnXp: (amount: number, durationOverride?: number) => Promise<void> | void
}) {
  const { showLevelUp, pendingReward, claimReward, level } = useGame()
  const swiperRef = useRef<any>(null)

const [stepIndex, setStepIndex] = useState(0)
const [initialSlide, setInitialSlide] = useState(0)


  return (
    <div className="h-dvh flex items-center justify-center bg-gray-900 text-white">
      <div className="h-full w-full flex flex-col bg-gray-900 sm:rounded-lg sm:shadow-lg sm:max-w-3xl sm:max-h-[700px] overflow-hidden">
        <Header xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} />

        <main className="flex-1 min-h-0 flex items-center justify-center">
          <InterventionSwiper
            xpTargetRef={xpTargetRef}
            diaTargetRef={diaTargetRef}
            spawnXp={spawnXp}
             swiperRef={swiperRef}
            setStepIndex={setStepIndex}
            setInitialSlide={setInitialSlide}
          />
        </main>

        <Footer />
       {import.meta.env.DEV && (
  <FooterControls
    swiperRef={swiperRef}
    setStepIndex={setStepIndex}
    setInitialSlide={setInitialSlide}
  />
)}


       {showLevelUp && pendingReward && (
 <LevelUpOverlay
  level={level} // der neue Level, nicht der alte
  reward={pendingReward.amount}
  onClaim={claimReward}
/>

)}
      </div>
    </div>
  )
}

export default function App() {
const xpTargetRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>
  const diaTargetRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>
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


