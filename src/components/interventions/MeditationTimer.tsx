import { motion } from "framer-motion"
import { useState, useEffect } from "react"

// Redux
import { useAppDispatch } from "@store/hooks"
import { completeInterventionThunk } from "@store/slices/gameActionsSlice"

// API
import { useReduxApi } from "@api/reduxApi"

type Subtitle = { time: number; text: string }

type MeditationTimerData = {
  id: number
  duration: number
  xp?: number
  subtitles?: Subtitle[]
  audioUrl?: string
}

export default function MeditationTimer({ data }: { data: MeditationTimerData }) {
  const {
    id,
    duration = 60,
    xp = 0,
    subtitles = [],
    audioUrl = "/audio/breathing.mp3",
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()

  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [subtitle, setSubtitle] = useState("")

  // -------------------------
  // Timer & Audio
  // -------------------------
  useEffect(() => {
    if (!running) return

    const audio = new Audio(audioUrl)
    audio.play()

    const timer = setInterval(() => setTime((t) => t + 1), 1000)

    return () => {
      clearInterval(timer)
      audio.pause()
    }
  }, [running, audioUrl])

  // -------------------------
  // Subtitles wechseln
  // -------------------------
  useEffect(() => {
    const current = subtitles.findLast((s) => time >= s.time)
    if (current) setSubtitle(current.text)
  }, [time, subtitles])

  // -------------------------
  // Auto Finish wenn Zeit abgelaufen
  // -------------------------
  useEffect(() => {
    if (time >= duration && running) {
      handleFinish()
    }
  }, [time, running])

  const handleStart = () => {
    setRunning(true)
  }

  const handleFinish = async () => {
    if (!api) return

    setRunning(false)

    // 🎯 Korrektes Abschließen der Intervention
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: () => {},
        api,
      })
    )

    if (import.meta.env.DEV)
      console.log("🎉 Meditation abgeschlossen", { id, xp })
  }

  const progress = time / duration
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <motion.div
      animate={{ backgroundColor: ["#00111a", "#001a14", "#0a0022", "#00111a"] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="flex flex-col items-center justify-center h-full w-full text-center text-white"
    >
      {!running && time === 0 ? (
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-blue-600 rounded-lg text-lg"
        >
          Starten
        </button>
      ) : running ? (
        <>
          <svg className="w-32 h-32 my-6" viewBox="0 0 100 100">
            <circle
              className="text-gray-500"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
            <circle
              className="text-cyan-400"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {subtitle && (
            <motion.p
              key={subtitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-lg max-w-xs px-4"
            >
              {subtitle}
            </motion.p>
          )}
        </>
      ) : (
        <motion.button
          onClick={handleFinish}
          className="mt-6 px-5 py-3 bg-green-600 rounded-lg"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          Abschließen
        </motion.button>
      )}
    </motion.div>
  )
}
