import { useEffect, useState, useRef } from "react"
import { Howl } from "howler"
import { motion, useAnimation } from "framer-motion"
import { useAppSelector } from "@store/hooks"
import { useSlideManager } from "@context/SlideManagerContext"

type Props = {
  title: string
  description: string
  audio: string
  background?: string
  hasBackgroundMusic?: boolean
  onComplete?: () => void
}

export default function Meditation({ data }: { data: Props }) {
  const {
    title,
    description,
    audio,
    background,
    hasBackgroundMusic,
    
  } = data

  const avatarData = useAppSelector((state) => state.avatar?.avatar)
  const avatar = (avatarData?.name || "tim").toLowerCase()

  const slideManager = useSlideManager()

  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [, setLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)

  const meditationSound = useRef<Howl | null>(null)
  const ambientSound = useRef<Howl | null>(null)
  const startTime = useRef<number | null>(null)
  const pauseOffset = useRef<number>(0)
  const frameRef = useRef<number | null>(null)

  const cleanupDone = useRef(false)
  const controls = useAnimation()
  // Cleanup
  useEffect(() => {
    return () => {
      if (cleanupDone.current) return
      cleanupDone.current = true

      meditationSound.current?.unload()
      ambientSound.current?.unload()
    }
  }, [])

  // Background Animation
  useEffect(() => {
    if (playing && !paused) {
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
  }, [playing, paused])

  // Fortschritt
  useEffect(() => {
    if (!playing || paused || duration === 0) return

    const update = () => {
      if (startTime.current) {
        const elapsed = (Date.now() - startTime.current) / 1000 + pauseOffset.current
        setProgress(Math.min(elapsed / duration, 1))
      }
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [playing, paused, duration])

  // Start
  async function startMeditation() {
    try {
      if (playing && !paused) return

      console.log("▶️ Meditation Start")

      // Wenn pausiert → Resume statt Neuerstellung
      if (paused) {
        console.log("⏯ Resume")
        meditationSound.current?.play()
        ambientSound.current?.play()
        setPaused(false)
        startTime.current = Date.now()
        return
      }

      // Neu starten
      meditationSound.current = new Howl({
        src: [`/audio/${avatar}/${audio}`],
        html5: true,
        volume: 1.0,
        preload: true,
        onload: () => {
          const d = meditationSound.current?.duration() ?? 0
          console.log("⏱ Dauer:", d.toFixed(2), "Sekunden")

          setDuration(d)
          setLoaded(true)

          meditationSound.current?.play()
          ambientSound.current?.play()
          startTime.current = Date.now()
          setPlaying(true)
        },
        onend: () => {
          console.log("🏁 Meditation END")
          handleEnd()
        },
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
    } catch {
      setError("Audio konnte nicht gestartet werden.")
    }
  }

  // Pause
  function pauseMeditation() {
    if (!playing || paused) return
    console.log("⏸ Pause")

    meditationSound.current?.pause()
    ambientSound.current?.pause()

    pauseOffset.current += (Date.now() - (startTime.current ?? 0)) / 1000
    setPaused(true)
  }

  // Restart
  function restartMeditation() {
    console.log("🔄 Neustart")

    pauseOffset.current = 0
    startTime.current = Date.now()
    meditationSound.current?.seek(0)
    meditationSound.current?.play()
    ambientSound.current?.play()

    setPaused(false)
    setProgress(0)
  }

  function handleEnd() {
    console.log("➡️ weiter zur nächsten Slide")
    slideManager.goNext()
  }

  return (
    <motion.div
      animate={controls}
      className="flex w-full flex-col items-center justify-center h-full bg-zinc-800"
    >
      <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-white/80 text-center mb-8 max-w-md">{description}</p>

      {error && <p className="text-red-400">{error}</p>}

      <div className="relative w-32 h-32 mb-4">
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="6" fill="none" strokeOpacity="0.2" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(1 - progress) * 2 * Math.PI * 45}
          />
        </svg>

        {!playing && (
          <button
            onClick={startMeditation}
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-white text-black font-bold text-xl"
          >
            ▶
          </button>
        )}

        {playing && !paused && (
          <button
            onClick={pauseMeditation}
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-yellow-400 text-black font-bold text-xl"
          >
            ⏸
          </button>
        )}

        {paused && (
          <button
            onClick={startMeditation}
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-green-400 text-black font-bold text-xl"
          >
            ⏯
          </button>
        )}
      </div>

      {playing && (
        <button
          onClick={restartMeditation}
          className="mt-4 px-4 py-2 bg-gray-700 rounded-lg text-white"
        >
          Von vorne starten
        </button>
      )}
    </motion.div>
  )
}
