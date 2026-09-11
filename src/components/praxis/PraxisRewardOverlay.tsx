// src/components/praxis/PraxisRewardOverlay.tsx
import { motion } from "framer-motion"
import { useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import {
  claimPraxisDiamonds,
  clearPraxisReward,
  selectPraxisRewardPending,
} from "@store/slices/praxisSlice"
import { addDiamondsLocally } from "@store/slices/sessionSlice"
import { FlyParticles } from "@components/animations/FlyParticles"

export default function PraxisRewardOverlay() {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const rewardPending = useAppSelector(selectPraxisRewardPending)

  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [flyTriggered, setFlyTriggered] = useState(false)

  const fromRef = useRef<HTMLDivElement | null>(null)

  if (!rewardPending) return null

  const handleClaim = async () => {
    if (claiming || claimed || flyTriggered || !api) return

    setClaiming(true)
    setFlyTriggered(true)

    dispatch(addDiamondsLocally(rewardPending.diamondAmount))

    try {
      await dispatch(
        claimPraxisDiamonds({ api, transactionId: rewardPending.transactionId })
      ).unwrap()
    } catch (err) {
      console.error("💎 Fehler beim Einlösen der Praxis-Dias:", err)
      dispatch(addDiamondsLocally(-rewardPending.diamondAmount))
    }

    setTimeout(() => {
      setFlyTriggered(false)
      setClaiming(false)
      setClaimed(true)
    }, 2000)
  }

  const handleClose = () => {
    setClaiming(false)
    setClaimed(false)
    setFlyTriggered(false)
    dispatch(clearPraxisReward())
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9998]">
      {flyTriggered && (
        <FlyParticles
          key="praxis-diamond-animation"
          from={fromRef.current}
          to={document.getElementById("loco_DiamondCounter") || document.body}
          content="💎"
          color="#06b6d4"
          count={rewardPending.diamondAmount}
          size={12}
          duration={3.2}
          variant="diamond"
        />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        className="relative bg-white rounded-3xl shadow-2xl p-7 text-center w-[340px] max-w-sm mx-4"
      >
        {claimed && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}

        <div className="text-5xl mb-2">🎉</div>

        <h2 className="text-2xl font-extrabold text-purple-600">
          Aufgabe erledigt!
        </h2>

        <p className="mt-1 text-gray-600 text-sm">
          Gut gemacht – das war nicht nichts.
        </p>

        <div ref={fromRef} className="mt-4">
          <p className="text-gray-700 text-md">
            Belohnung:{" "}
            <span className="text-cyan-500 font-bold">
              {rewardPending.diamondAmount} 💎
            </span>
          </p>
        </div>

        <div className="mt-6">
          {!claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md ${
                claiming ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {claiming ? "..." : <>{rewardPending.diamondAmount} × 💎 Einfordern</>}
            </button>
          )}

          {claimed && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600"
            >
              Schließen
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
