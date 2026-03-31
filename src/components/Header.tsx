import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { FaGem } from "react-icons/fa"
import { useEffect, useState, type RefObject, useMemo } from "react"

import DiamondCounter from "./DiamondsCounter"
import { useAppSelector } from "@store/hooks"
import { selectGame } from "@store/slices/gameSlice"

type HeaderProps = {
  xpTargetRef?: RefObject<HTMLDivElement | null>
  diaTargetRef?: RefObject<HTMLDivElement | null>
}

export default function Header({ xpTargetRef, diaTargetRef }: HeaderProps) {
  const { levelStats, diamondBalance } = useAppSelector(selectGame)

  // -----------------------------
  // SAFE LEVEL + XP
  // -----------------------------
  const { level, xpNeeded, xpInLevel, progress } = useMemo(() => {
    if (!levelStats) {
      return {
        level: 1,
        xpNeeded: 100,
        xpInLevel: 0,
        progress: 0,
      }
    }

    const lvl = levelStats.level
    const needed = levelStats.xp_needed
    const inLevel = levelStats.xp_in_level

    let pct = Number(levelStats.progress_percent)
    if (!Number.isFinite(pct)) {
      pct = needed > 0 ? (inLevel / needed) * 100 : 0
    }
    pct = Math.max(0, Math.min(100, pct))

    return {
      level: lvl,
      xpNeeded: needed,
      xpInLevel: inLevel,
      progress: pct,
    }
  }, [levelStats])

  // -----------------------------
  // DIAMONDS
  // -----------------------------
  const dias = diamondBalance ?? 0

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

  // -----------------------------
  // XP Animation
  // -----------------------------
  const motionXp = useMotionValue(xpInLevel)
  const roundedXp = useTransform(motionXp, Math.round)
  const [xpDisplay, setXpDisplay] = useState(xpInLevel)

  useEffect(() => {
    const controls = animate(motionXp, xpInLevel, { duration: 0.5 })
    const unsub = roundedXp.on("change", (v) => setXpDisplay(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [xpInLevel])

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="flex flex-col h-20 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg text-white">
      <div id="Loco_ProgressBar_XP" className="flex h-full w-full items-center">

        {/* LEVEL + XP */}
        <div className="flex flex-col flex-1 items-center">
          <div className="text-center">
            <p className="font-bold text-base leading-tight">
              Level {level}
            </p>
            <p className="text-[10px] opacity-80">
              {xpDisplay} / {xpNeeded} XP
            </p>
          </div>

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

        {/* DIAMONDS */}
        <div
        id="loco_DiamondCounter"
          ref={diaTargetRef}
          className="flex items-center justify-center h-full px-3"
        >
          <div className="flex items-center gap-1 px-2 py-1 bg-cyan-900 rounded-full shadow">
            <FaGem className="text-cyan-300 text-lg" />
            <DiamondCounter value={diasDisplay} />
          </div>
        </div>

      </div>
    </div>
  )
}
