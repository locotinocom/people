import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { usePlayerData } from "../../hooks/usePlayerData"

type Subtitle = { time: number; text: string }

const subtitles: Subtitle[] = [
  { time: 0, text: "Schließe deine Augen und atme tief ein..." },
  { time: 10, text: "Spüre, wie sich dein Brustkorb hebt und senkt..." },
  { time: 25, text: "Lass den Atem ruhig fließen, ganz natürlich..." },
  { time: 45, text: "Atme Frieden ein – und Anspannung aus." },
]

export default function MeditationTimer() {
  const { addXP } = usePlayerData()
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [subtitle, setSubtitle] = useState("")
  const duration = 60

  useEffect(() => {
    if (!running) return
    const audio = new Audio("/audio/breathing.mp3")
    audio.play()

    const timer = setInterval(() => {
      setTime((t) => t + 1)
    }, 1000)

    return () => {
      clearInterval(timer)
      audio.pause()
    }
  }, [running])

  useEffect(() => {
    const current = subtitles.findLast((s) => time >= s.time)
    if (current) setSubtitle(current.text)
  }, [time])

  const progress = time / duration
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference * (1 - progress)

  if (time >= duration) {
    addXP(40)
  }

  return (
    <motion.div
      animate={{ backgroundColor: ["#00111a", "#001a14", "#0a0022", "#00111a"] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="flex flex-col items-center justify-center h-full w-full text-center text-white"
    >
      {!running ? (
        <button
          onClick={() => setRunning(true)}
          className="px-4 py-2 bg-blue-600 rounded-lg text-lg"
        >
          Starten
        </button>
      ) : time < duration ? (
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
          <motion.p
            key={subtitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-lg max-w-xs px-4"
          >
            {subtitle}
          </motion.p>
        </>
      ) : (
        <motion.button
          onClick={() => addXP(40)}
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
