import { useEffect, useState, useRef } from "react"
import { Howl } from "howler"
import { motion, useAnimation } from "framer-motion"
import { useGame } from "../../context/GameContext"

type Props = {
  title: string
  description: string
  audio: string
  background?: string
  hasBackgroundMusic?: boolean
  duration: number
  onComplete?: () => void
}

/**
 * 🔊 Meditation – endgültige, sichere Version
 * Kein mehrfaches Laden, keine Poolfehler, kein Silent Fail.
 */
export default function Meditation({
  title,
  description,
  audio,
  background,
  hasBackgroundMusic = false,
  duration,
  onComplete,
}: Props) {
  const { avatarId } = useGame()
  const avatar = avatarId || "tim"

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const controls = useAnimation()

  const meditationSound = useRef<Howl | null>(null)
  const ambientSound = useRef<Howl | null>(null)
  const startTime = useRef<number | null>(null)
  const cleanupDone = useRef(false)

  // 🧹 Vollständiger Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (cleanupDone.current) return
      cleanupDone.current = true

      meditationSound.current?.unload()
      ambientSound.current?.unload()
      meditationSound.current = null
      ambientSound.current = null
      startTime.current = null

      if (import.meta.env.DEV) console.log("🧹 Meditation unmounted & cleaned")
    }
  }, [])

  // 🌀 Hintergrundanimation
  useEffect(() => {
    if (playing) {
      controls.start({
        background: [
          "linear-gradient(135deg,#74ABE2,#5563DE)",
          "linear-gradient(135deg,#E27D60,#85DCBA)",
          "linear-gradient(135deg,#C38D9E,#41B3A3)",
          "linear-gradient(135deg,#74ABE2,#5563DE)",
        ],
        transition: { duration: 20, repeat: Infinity, ease: "linear" },
      })
    } else {
      controls.stop()
    }
  }, [playing, controls])

  // 🎚 Fortschrittsanzeige
  useEffect(() => {
    if (!playing) return
    let frame: number
    const update = () => {
      if (startTime.current) {
        const elapsed = (Date.now() - startTime.current) / 1000
        setProgress(Math.min(elapsed / duration, 1))
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [playing, duration])

  // ▶️ Starte Meditation erst beim Klick
  async function startMeditation() {
    try {
      if (playing) return
      if (import.meta.env.DEV) console.log("▶️ Starte Meditation")

      // 🔊 Hauptaudio erst jetzt initialisieren
      if (!meditationSound.current) {
        meditationSound.current = new Howl({
          src: [`/audio/${avatar}/${audio}`],
          html5: true,
          volume: 1.0,
          preload: true,
          onload: () => {
            setLoaded(true)
            meditationSound.current?.play()
            ambientSound.current?.play()
          },
          onend: handleEnd,
          onloaderror: (_, err) => setError(String(err)),
          onplayerror: (_, err) => setError(String(err)),
        })

        if (hasBackgroundMusic && background) {
          ambientSound.current = new Howl({
            src: [`/audio/${background}`],
            loop: true,
            volume: 0.3,
            html5: true,
          })
        }
      } else {
        meditationSound.current.play()
        ambientSound.current?.play()
      }

      startTime.current = Date.now()
      setPlaying(true)
      setLoaded(true)
    } catch (e) {
      console.error("❌ Fehler beim Starten:", e)
      setError("Audio konnte nicht gestartet werden.")
    }
  }

  // ⏹ Stop
  function stopAll() {
    meditationSound.current?.stop()
    ambientSound.current?.stop()
    setPlaying(false)
    setProgress(0)
  }

  // ✅ Abschluss
  function handleEnd() {
    stopAll()
    if (import.meta.env.DEV) console.log("🏁 Meditation beendet")
    onComplete?.()
  }

  return (
    <motion.div
      animate={controls}
      className="flex w-full flex-col items-center justify-center h-full bg-zinc-800 transition-all duration-1000"
    >
      <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-white/80 text-center mb-8 max-w-md">{description}</p>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {!loaded && !error && !playing && (
        <p className="text-white/50 mb-4">▶ Tippe zum Starten</p>
      )}

      <div className="relative w-32 h-32">
        <svg
          className="absolute top-0 left-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeOpacity="0.2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(1 - progress) * 2 * Math.PI * 45}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>

        <button
          onClick={startMeditation}
          disabled={playing}
          className={`absolute inset-0 m-auto w-24 h-24 rounded-full ${
            loaded ? "bg-white text-gray-900" : "bg-gray-300 text-gray-700"
          } font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
        >
          {playing ? "…" : "▶"}
        </button>
      </div>
    </motion.div>
  )
}
