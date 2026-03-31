import { useCallback, useMemo, useState } from "react"
import clsx from "clsx"
import { motion } from "framer-motion"

// Redux / API / Slides
import { useAppDispatch } from "@store/hooks"
import { useReduxApi } from "@api/reduxApi"
import { useSlideManager } from "@context/SlideManagerContext"
import { setAvatar } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"

/* =======================
   Types
======================= */

type AvatarKey = "eva" | "tim"

type ChooseAvatarData = {
  id: number
  xp: number
  title?: string
  subtitle?: string
}

type AvatarOption = {
  key: AvatarKey
  label: string
  previewSrc: string
  gender: "male" | "female"
}

/* =======================
   Component
======================= */

export default function ChooseAvatar({ data }: { data: ChooseAvatarData }) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()

  // Prüfen, ob wir uns im Mock-Modus befinden
  const isMockMode = import.meta.env.VITE_MOCK_MODE === "true"

  const options: AvatarOption[] = useMemo(
    () => [
      { key: "tim", label: "Tim", previewSrc: "/avatars/tim.png", gender: "male" },
      { key: "eva", label: "Eva", previewSrc: "/avatars/eva.png", gender: "female" },
    ],
    []
  )

  const [selected, setSelected] = useState<AvatarKey | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePick = useCallback((key: AvatarKey, isLocked: boolean) => {
    if (isLocked) return // Klick auf gesperrten Avatar verhindern
    setSelected(key)
    setError(null)
  }, [])

  const handleContinue = useCallback(async () => {
    if (!api) {
      setError("API nicht verfügbar (useReduxApi).")
      return
    }
    if (!data?.id) {
      setError("Intervention-Daten fehlen (data.id).")
      return
    }
    if (!selected || isSaving) return

    const chosenOption = options.find((o) => o.key === selected)
    if (!chosenOption) return

    setIsSaving(true)
    setError(null)

    try {
      // API Call zum Speichern
      const res = await api.setAvatar(selected, selected, chosenOption.gender)

      if (!res.success || !res.data?.avatar) {
        throw new Error(res.error || res.message || "Avatar speichern fehlgeschlagen.")
      }

      // Redux State aktualisieren
      dispatch(setAvatar(res.data.avatar))

      // Intervention abschließen
      await dispatch(
        completeInterventionThunk({
          interventionId: data.id,
          xp: data.xp,
          api,
          playAnimation: () => {},
        })
      ).unwrap()

      // Zur nächsten Slide navigieren
      await dispatch(
        handleActionThunk({
          action: { type: "next", goNext: () => slideManager.goNext() },
          api,
          playAnimation: () => {},
        })
      ).unwrap()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Speichern fehlgeschlagen."
      setError(msg)
    } finally {
      setIsSaving(false)
    }
  }, [api, data?.id, data?.xp, selected, isSaving, dispatch, slideManager, options])

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden text-white">
      {/* Header */}
      <div className="mb-6 shrink-0 text-center">
        <h2 className="text-xl font-bold leading-tight">
          {data?.title ?? "Wähle deinen Charakter"}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {data?.subtitle ?? "Wer soll dich durch deine Reise begleiten?"}
        </p>
      </div>

      {/* Avatar Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 md:gap-8 items-stretch max-w-2xl mx-auto w-full">
        {options.map((opt) => {
          const isActive = selected === opt.key
          const isLocked = isMockMode && opt.key === "tim"

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handlePick(opt.key, isLocked)}
              disabled={isSaving || isLocked}
              className={clsx(
                "relative flex flex-col rounded-3xl border-2 p-4 transition-all duration-300 overflow-hidden group",
                "focus:outline-none",
                isActive
                  ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  : "border-white/10 bg-white/5 hover:border-white/30",
                isLocked && "opacity-40 cursor-not-allowed grayscale"
              )}
            >
              {/* Name & Sperrhinweis */}
              <div className="mb-3 shrink-0">
                <div className={clsx(
                  "font-bold text-lg transition-colors",
                  isActive ? "text-green-400" : "text-white"
                )}>
                  {opt.label}
                </div>
                
                {isLocked && (
                  <div className="text-[10px] uppercase tracking-wider text-orange-400 font-bold mt-1 leading-tight">
                    In der Testversion<br/>nur Eva verfügbar
                  </div>
                )}
              </div>

              {/* Bild Container */}
              <div className="flex-1 min-h-0 w-full relative">
                <img
                  src={opt.previewSrc}
                  alt={opt.label}
                  draggable={false}
                  className={clsx(
                    "absolute inset-0 w-full h-full object-contain select-none transition-transform duration-500",
                    isActive && "scale-110"
                  )}
                  onError={() => setError(`Bild fehlt: ${opt.previewSrc}`)}
                />
              </div>

              {/* Visual Indicator für Auswahl */}
              {isActive && !isLocked && (
                <motion.div
                  layoutId="avatarPickIndicator"
                  className="absolute inset-0 border-4 border-green-500 rounded-3xl pointer-events-none"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Footer / Continue Button */}
      <div className="mt-8 flex justify-center shrink-0">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || isSaving}
          className={clsx(
            "w-full max-w-xs py-4 rounded-2xl text-base font-bold transition-all duration-300 shadow-xl",
            !selected || isSaving
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500 text-white shadow-green-900/20 active:scale-95"
          )}
        >
          {isSaving ? "Wird gespeichert..." : "Charakter bestätigen"}
        </button>
      </div>
    </div>
  )
}