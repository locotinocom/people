import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

import { Wheel } from "./Wheel"
import { SettingRow } from "./SettingRow"

type BreathPhase = "inhale" | "hold" | "exhale"
type Preset = {
  key: string
  label: string
  inhale: number
  hold: number
  exhale: number
  durationSec?: number // optional: Preset kann auch Dauer setzen
}

type AudioSet = {
  inhaleUrl?: string
  holdUrl?: string
  exhaleUrl?: string
  startUrl?: string
}

type Props = {
  title: string
  description?: string

  defaultInhale: number
  defaultHold: number
  defaultExhale: number

  durationMinutes: number
  durationSeconds?: number // neu: default seconds part

  allowUserAdjustment: boolean
  presets: Preset[]

  audio?: AudioSet
  onSessionComplete?: () => void
  devTag?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function phaseLabel(p: BreathPhase) {
  if (p === "inhale") return "Einatmen"
  if (p === "hold") return "Halten"
  return "Ausatmen"
}

function useOptionalAudio(audio?: AudioSet) {
  const [enabled, setEnabled] = useState(false)

  const audiosRef = useRef<{
    start?: HTMLAudioElement
    inhale?: HTMLAudioElement
    hold?: HTMLAudioElement
    exhale?: HTMLAudioElement
  }>({})

  useEffect(() => {
    const mk = (url?: string) => {
      if (!url) return undefined
      try {
        const a = new Audio(url)
        a.preload = "auto"
        return a
      } catch {
        return undefined
      }
    }

    const start = mk(audio?.startUrl)
    const inhale = mk(audio?.inhaleUrl)
    const hold = mk(audio?.holdUrl)
    const exhale = mk(audio?.exhaleUrl)

    audiosRef.current = { start, inhale, hold, exhale }
    setEnabled(!!(start || inhale || hold || exhale))

    const onErr = () => setEnabled(false)
    ;[start, inhale, hold, exhale].forEach((a) => a?.addEventListener("error", onErr))

    return () => {
      ;[start, inhale, hold, exhale].forEach((a) => a?.removeEventListener("error", onErr))
    }
  }, [audio?.startUrl, audio?.inhaleUrl, audio?.holdUrl, audio?.exhaleUrl])

  const play = useCallback(
    (key: "inhale" | "hold" | "exhale" | "start") => {
      if (!enabled) return
      const map: Record<string, HTMLAudioElement | undefined> = {
        start: audiosRef.current.start,
        inhale: audiosRef.current.inhale,
        hold: audiosRef.current.hold,
        exhale: audiosRef.current.exhale,
      }
      const a = map[key]
      if (!a) return
      try {
        a.currentTime = 0
        void a.play()
      } catch {
        // still
      }
    },
    [enabled]
  )

  return { enabled, play }
}

function msToMMSS(ms: number) {
  const sec = Math.ceil(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function BreathingCircleCore({
  //title,
  //description,

  defaultInhale,
  defaultHold,
  defaultExhale,

  durationMinutes,
  //durationSeconds = 0,

  allowUserAdjustment,
  presets,

  audio,
  onSessionComplete,
  devTag = "BreathingCircleCore",
}: Props) {
  const { enabled: audioEnabled, play } = useOptionalAudio(audio)

  // Immer ein "custom" anbieten, damit wir sauber zurückschalten können
  const normalizedPresets = useMemo<Preset[]>(() => {
    const hasCustom = presets.some((p) => p.key === "custom")
    if (hasCustom) return presets
    return [
      { key: "custom", label: "Individuell", inhale: defaultInhale, hold: defaultHold, exhale: defaultExhale },
      ...presets,
    ]
  }, [presets, defaultInhale, defaultHold, defaultExhale])

  const [presetKey, setPresetKey] = useState<string>(normalizedPresets[0]?.key ?? "custom")
  const preset = useMemo(
    () => normalizedPresets.find((p) => p.key === presetKey),
    [normalizedPresets, presetKey]
  )

  const [inhale, setInhale] = useState(defaultInhale)
  const [hold, setHold] = useState(defaultHold)
  const [exhale, setExhale] = useState(defaultExhale)

  // Dauer: min + sec
const totalSec = Math.round(durationMinutes * 60)
const [durMin, setDurMin] = useState<number>(Math.floor(totalSec / 60))
const [durSec, setDurSec] = useState<number>(totalSec % 60)

  // Preset übernehmen
  useEffect(() => {
    if (!preset) return
    setInhale(preset.inhale)
    setHold(preset.hold)
    setExhale(preset.exhale)

    if (typeof preset.durationSec === "number") {
      const total = clamp(preset.durationSec, 0, 20 * 60)
      setDurMin(Math.floor(total / 60))
      setDurSec(total % 60)
    }
  }, [preset?.key])

  const markCustom = useCallback(() => {
    setPresetKey((k) => (k === "custom" ? k : "custom"))
  }, [])

  const durationTotalSec = durMin * 60 + durSec
  const sessionMsTotal = clamp(durationTotalSec, 10, 20 * 60) * 1000 // min 10s

  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<BreathPhase>("inhale")
  const [sessionLeftMs, setSessionLeftMs] = useState(0)

  const startBtnRef = useRef<HTMLButtonElement | null>(null)
  const timeoutsRef = useRef<number[]>([])
  const intervalRef = useRef<number | null>(null)

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t))
    timeoutsRef.current = []
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  useEffect(() => {
    return () => clearAll()
  }, [clearAll])

  const stop = useCallback(() => {
    clearAll()
    setIsRunning(false)
    setPhase("inhale")
    setSessionLeftMs(0)
    if (import.meta.env.DEV) console.log(`🛑 ${devTag} stop`)
  }, [clearAll, devTag])

  const start = useCallback(() => {
    if (isRunning) return

    clearAll()
    setIsRunning(true)
    setSessionLeftMs(sessionMsTotal)

    if (import.meta.env.DEV) {
      console.log(`🫁 ${devTag} start`, {
        inhale,
        hold,
        exhale,
        durMin,
        durSec,
        sessionMsTotal,
        audioEnabled,
      })
    }

    play("start")

    const cycle = [
      { p: "inhale" as const, ms: inhale * 1000 },
      ...(hold > 0 ? [{ p: "hold" as const, ms: hold * 1000 }] : []),
      { p: "exhale" as const, ms: exhale * 1000 },
    ]

    let idx = 0
    const runNext = () => {
      const step = cycle[idx]
      setPhase(step.p)
      play(step.p)
      idx = (idx + 1) % cycle.length
      const id = window.setTimeout(runNext, step.ms)
      timeoutsRef.current.push(id)
    }

    runNext()

    const startedAt = Date.now()
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const left = Math.max(0, sessionMsTotal - elapsed)
      setSessionLeftMs(left)

      if (left <= 0) {
        clearAll()
        setIsRunning(false)
        if (import.meta.env.DEV) console.log(`✅ ${devTag} complete`)
        onSessionComplete?.()
      }
    }, 200)
  }, [
    isRunning,
    clearAll,
    sessionMsTotal,
    inhale,
    hold,
    exhale,
    durMin,
    durSec,
    play,
    audioEnabled,
    onSessionComplete,
    devTag,
  ])

  const ringScale = useMemo(() => {
    if (!isRunning) return 1
    if (phase === "inhale") return 1.35
    if (phase === "hold") return 1.35
    return 1.0
  }, [isRunning, phase])

  const ringTransition = useMemo(() => {
    const dur = phase === "inhale" ? inhale : phase === "hold" ? hold : exhale
    return { duration: Math.max(0.1, dur), ease: "linear" as const }
  }, [phase, inhale, hold, exhale])

  const canRun = inhale >= 1 && exhale >= 1 && durationTotalSec >= 0

  return (
    <div className="flex flex-col h-full p-6 text-white">
      {/* Circle Area */}
      <div className="mt-0 p-6 flex flex-col items-center justify-center gap-0">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="w-56 h-56 rounded-full border border-white/15 bg-white/5"
            animate={{ scale: ringScale }}
            transition={ringTransition}
          />

          <button
            ref={startBtnRef}
            type="button"
            onClick={isRunning ? stop : start}
            disabled={!canRun}
            className={clsx(
              "absolute w-24 h-24 rounded-full font-extrabold text-lg",
              "border border-white/15 shadow-xl",
              canRun ? "bg-green-600 hover:bg-green-500" : "bg-gray-700 cursor-not-allowed",
              "focus:outline-none"
            )}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </div>

        <div className="text-center mt-2">
          <div className="text-white font-extrabold text-2xl">
            {isRunning ? phaseLabel(phase) : "Bereit"}
          </div>
          <div className="text-white/60 text-sm">
            {isRunning ? `Verbleibend: ${msToMMSS(sessionLeftMs)}` : `Dauer: ${durMin}m ${durSec}s`}
          </div>
        </div>
      </div>

      {/* Controls */}
      {allowUserAdjustment && (
      <div className="mt-0 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/70 text-xs mb-2">Voreinstellungen</div>

        <select
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          disabled={isRunning}
        >
          {normalizedPresets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} ({p.inhale}-{p.hold}-{p.exhale})
            </option>
          ))}
        </select>



        <div className="mt-3 border-t border-white/10 pt-2">
          <SettingRow label="Dauer">
            <Wheel
              value={durMin}
              min={0}
              max={20}
              unit="min"
              disabled={isRunning}
              widthClass="w-20"
              onChange={(v) => {
                setDurMin(v)
                markCustom()
              }}
            />
            <Wheel
              value={durSec}
              min={0}
              max={59}
              unit="sec"
              disabled={isRunning}
              widthClass="w-20"
              onChange={(v) => {
                setDurSec(v)
                markCustom()
              }}
            />
          </SettingRow>

          <SettingRow label="Einatmen">
            <Wheel
              value={inhale}
              min={1}
              max={20}
              unit="sec"
              disabled={isRunning || !allowUserAdjustment}
              onChange={(v) => {
                setInhale(v)
                markCustom()
              }}
            />
          </SettingRow>

          <SettingRow label="Halten">
            <Wheel
              value={hold}
              min={0}
              max={20}
              unit="sec"
              disabled={isRunning || !allowUserAdjustment}
              onChange={(v) => {
                setHold(v)
                markCustom()
              }}
            />
          </SettingRow>

          <SettingRow label="Ausatmen">
            <Wheel
              value={exhale}
              min={1}
              max={30}
              unit="sec"
              disabled={isRunning || !allowUserAdjustment}
              onChange={(v) => {
                setExhale(v)
                markCustom()
              }}
            />
          </SettingRow>

          <div className="mt-2 text-white/50 text-xs">
            Zyklus: {inhale}-{hold}-{exhale}
          </div>
        </div>
      </div>
)}
 {/* Ende  Controls */}

    </div>
  )
}

export default memo(BreathingCircleCore)
