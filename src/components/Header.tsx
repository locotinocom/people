import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { FaGem } from "react-icons/fa"
import { useGame } from "../context/GameContext"
import { useEffect, useState } from "react"
import DiamondCounter from "./DiamondsCounter"

type HeaderProps = {
  xpTargetRef?: React.RefObject<HTMLDivElement>
  diaTargetRef?: React.RefObject<HTMLDivElement>
}

export default function Header({ xpTargetRef, diaTargetRef }: HeaderProps) {
  const { level, xp, xpToNext, dias } = useGame()
  const progress = Math.min((xp / xpToNext) * 100, 100)

  // Dias Counter
  const motionDias = useMotionValue(dias)
  const roundedDias = useTransform(motionDias, Math.round)
  const [diasDisplay, setDiasDisplay] = useState(dias)

  useEffect(() => {
    const controls = animate(motionDias, dias, { duration: 0.5 })
    const unsub = roundedDias.on("change", (v) => setDiasDisplay(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [dias])

  // XP Counter
  const motionXp = useMotionValue(xp)
  const roundedXp = useTransform(motionXp, Math.round)
  const [xpDisplay, setXpDisplay] = useState(xp)

  useEffect(() => {
    const controls = animate(motionXp, xp, { duration: 0.5 })
    const unsub = roundedXp.on("change", (v) => setXpDisplay(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [xp])

  return (
  <div className="flex flex-col h-20 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-t-[20px] shadow-lg text-white">
    <div className="flex h-full w-full items-center">
      {/* Linke Seite: Level + XP + Fortschrittsbalken */}
      <div className="flex flex-col flex-1 items-center">
        <div className="text-center">
          <p className="font-bold text-base leading-tight">
            Level {level}: Einführung
          </p>
          <p className="text-[10px] opacity-80">
            {xpDisplay} / {xpToNext} XP
          </p>
        </div>

        {/* Fortschrittsbalken */}
        <div
          ref={xpTargetRef}
          className="w-full mt-1 h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Rechte Seite: Dias Anzeige */}
      <div
        ref={diaTargetRef}
        className="flex items-center justify-center h-full px-3"
      >
        <div className="flex items-center gap-1 px-2 py-1 bg-cyan-900 rounded-full shadow">
          <FaGem className="text-cyan-300 text-lg" />
          <DiamondCounter value={dias} />
        </div>
      </div>
    </div>
  </div>
)

}
