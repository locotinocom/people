import { useRef, useState } from "react"
import Header from "./components/Header"
import RewardTest from "./components/RewardTest"
import LevelUpOverlay from "./components/LevelUpOverlay"

export default function MainSwiper() {
  const xpTargetRef = useRef<HTMLDivElement>(null)
  const diaTargetRef = useRef<HTMLDivElement>(null)

  // Overlay Test-State
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="grid h-full w-full max-w-[500px] 
      bg-zinc-900 md:h-[800px] md:w-4/5 grid-rows-[auto,1fr,auto]">
        <Header xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} />
        <RewardTest xpTargetRef={xpTargetRef} diaTargetRef={diaTargetRef} />

        {/* Overlay nur zeigen, wenn showOverlay true */}
        {showOverlay && (
          <LevelUpOverlay
            level={2}
            reward={5}
            onClaim={() => {
              console.log("Dias gutgeschrieben! 💎")
              setShowOverlay(false)
            }}
          />
        )}
      </div>

      {/* Test-Button nur zum Auslösen */}
      <button
        onClick={() => setShowOverlay(true)}
        className="absolute bottom-5 right-5 px-4 py-2 bg-purple-600 text-white rounded-lg shadow"
      >
        Level-Up testen
      </button>
    </div>
  )
}
