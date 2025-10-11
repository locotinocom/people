import { useState, useEffect, useRef } from "react"
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

export default function Meditation({
  title,
  description,
  audio,
  background,
  hasBackgroundMusic = false,
  duration,
  onComplete,
}: Props) {
  const { avatarId, avatarName } = useGame()
  const avatar = avatarId || "tim"

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controls = useAnimation()

  const meditationSound = useRef<Howl | null>(null)
  const ambientSound = useRef<Howl | null>(null)
  const startTime = useRef<number | null>(null)
  const hasAnimated = useRef(false)
  const initializedKey = useRef<string | null>(null)
  const initRan = useRef(false) // 👈 blockiert StrictMode-Doppelaufruf

  // 🔒 Lazy Audio Init – 100 % sicher gegen Doppelstart
  useEffect(() => {
    const key = `${avatar}-${audio}`
    if (initRan.current) return
    initRan.current = true // blockiert StrictMode-Doppelinit

    // Wenn Avatar oder Audio nicht bereit → nicht laden
    if (!audio || !avatar) return

    // Falls gleicher Key schon initialisiert → nicht nochmal
    if (initializedKey.current === key) return
    initializedKey.current = key

    console.log("🎶 Initialisiere Hauptaudio:", `/audio/${avatar}/${audio}`)

    const main = new Howl({
      src: [`/audio/${avatar}/${audio}`],
      html5: true,
      volume: 1.0,
      onload: () => {
        console.log("✅ Hauptaudio geladen:", key)
        setLoaded(true)
      },
      onend: handleEnd,
      onloaderror: (_, err) => setError(String(err)),
      onplayerror: (_, err) => setError(String(err)),
    })
    meditationSound.current = main

    if (hasBackgroundMusic && background) {
      ambientSound.current = new Howl({
        src: [`/audio/${background}`],
        loop: true,
        volume: 0.3,
        html5: true,
      })
    }

    return () => {
      console.log("🧹 Clean-up Meditation")
      main.unload()
      ambientSound.current?.unload()
      meditationSound.current = null
      ambientSound.current = null
      initializedKey.current = null
      initRan.current = false
    }
  }, [audio, avatar, background, hasBackgroundMusic])

  // 🌀 Animation
  useEffect(() => {
    if (playing && !hasAnimated.current) {
      hasAnimated.current = true
      controls.start({
        background: [
          "linear-gradient(135deg,#74ABE2,#5563DE)",
          "linear-gradient(135deg,#E27D60,#85DCBA)",
          "linear-gradient(135deg,#C38D9E,#41B3A3)",
          "linear-gradient(135deg,#74ABE2,#5563DE)",
        ],
        transition: { duration: 20, repeat: Infinity, ease: "linear" },
      })
    } else if (!playing) {
      hasAnimated.current = false
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

  function startMeditation() {
    if (playing || !loaded) return
    const main = meditationSound.current
    if (!main) return

    console.log("▶️ Starte Meditation:", audio)
    startTime.current = Date.now()
    setPlaying(true)
    main.play()
    ambientSound.current?.play()
  }

  function stopAll() {
    meditationSound.current?.stop()
    ambientSound.current?.stop()
    setPlaying(false)
    setProgress(0)
  }

  function handleEnd() {
    stopAll()
    onComplete?.()
  }

  return (
    <motion.div
      animate={controls}
      className="flex w-full flex-col items-center justify-center h-screen transition-all duration-1000 bg-zinc-800"
    >
      <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-white/80 text-center mb-8 max-w-md">{description}</p>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {!loaded && !error && <p className="text-white/50 mb-4">⏳ Lade Audio…</p>}

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
          disabled={!loaded || playing}
          className={`absolute inset-0 m-auto w-24 h-24 rounded-full ${
            loaded ? "bg-white text-gray-900" : "bg-gray-400 text-gray-700"
          } font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
        >
          {playing ? "…" : "▶"}
        </button>
      </div>
    </motion.div>
  )
}
