import { useMemo, useRef, useState, useCallback, memo, useEffect } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import { patchUserProfile } from "@store/slices/sessionSlice"

import AvatarBubble from "../../ui/AvatarBubble"
import { AnimalIcon } from "@helpers/AnimalIcon"
import animalsRaw from "@data/animals.de-en.v1.json"

import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"

type Lang = "de" | "en"

type AnimalsJsonItem = {
  key: string
  unicode_sequence: string
  active?: boolean // fehlt => true
  labels: Record<string, string>
  tags?: string[]
}

type AnimalOption = {
  key: string
  id: string // unicode_sequence
  label: string
}

type AnimalSelectData = {
  id: number
  title: string
  question?: string
  buttonText?: string
  xp?: number
  lang?: Lang
}

function AnimalSelect({ data }: { data: AnimalSelectData }) {
  const { id, title, question, buttonText = "Auswahl speichern", xp = 15, lang = "de" } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  const avatar = useAppSelector((s) => s.session.avatar)
  const rawName = avatar?.name || "dein Begleiter"
  const avatarName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [selectedId, setSelectedId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) console.log("🐾 AnimalSelect data:", data)
  }, [data.id])

  const animals = useMemo<AnimalOption[]>(() => {
    const items = (animalsRaw.items ?? []) as AnimalsJsonItem[]
    return items
      .filter((it) => it.active !== false) // default true
      .filter((it) => (it.tags ?? []).includes("animal")) // safety
      .map((it) => ({
        key: it.key,
        id: it.unicode_sequence,
        label: it.labels?.[lang] ?? it.labels?.de ?? it.key,
      }))
  }, [lang])

  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === selectedId),
    [animals, selectedId]
  )

  const canSave = !!selectedId && !isSaving

  const handleSave = useCallback(async () => {
    if (!api) return
    if (!selectedId) return
    if (isSaving) return

    setIsSaving(true)

    if (import.meta.env.DEV) {
      console.log("📌 AnimalSelect save", { interventionId: id, selectedId, xp })
    }

    // 1) patch profile
  const result = await dispatch(patchUserProfile({ api, patch: { opponent_animal: selectedId } }))
if (patchUserProfile.rejected.match(result)) {
  setIsSaving(false)
  return
}

    // 2) complete intervention (XP-Animation + API-Call + Level-Reload im Thunk)
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: startAnimation,
        api,
      })
    )

    await new Promise((r) => setTimeout(r, 400))

    // 4) next
    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    )

    setIsSaving(false)
  }, [api, selectedId, isSaving, id, xp, dispatch, startAnimation, slideManager])

  const bubbleText =
    (question && question.trim().length > 0 ? question : title).replace(
      /\{\{avatarName\}\}/g,
      avatarName
    )

  return (
    <div className="flex flex-col h-full p-6 text-white">
      {/* Avatar spricht (wie Form) */}
      <AvatarBubble title={bubbleText} />

      {/* Content */}
      <div className="flex flex-col gap-4 flex-1 min-h-0 mt-6">
        {/* Animal Grid Container */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 min-h-0 h-[52vh] sm:h-[56vh]">
          <div className="h-full overflow-y-auto pr-2 overflow-x-hidden">
            <div className="flex flex-wrap gap-3">
              {animals.map((a) => {
                const isSelected = a.id === selectedId

                return (
                  <div
                    key={a.id}
                    className="shrink-0"
                    style={{
                      width: "calc(33.333% - 0.75rem)", // 3 Spalten minus gap
                      maxWidth: "calc(33.333% - 0.75rem)",
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      whileTap={{ scale: 0.97 }}
                      animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
                      className={clsx(
                        "inline-flex w-full aspect-square",
                        "flex-col items-center justify-center text-center",
                        "rounded-xl p-2 border transition-all duration-150",
                        "focus:outline-none",
                        isSelected
                          ? "border-green-400 bg-green-400/15 ring-2 ring-green-500/40"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                      aria-pressed={isSelected}
                    >
                      <AnimalIcon
                        id={a.id}
                        size={72}
                        format="svg"
                        alt={a.label}
                        className="block mx-auto"
                      />
                      <span
                        className={clsx(
                          "mt-1 text-xs leading-tight w-full text-center px-1",
                          isSelected ? "text-white font-semibold" : "text-white/80"
                        )}
                      >
                        {a.label}
                      </span>
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Auswahl-Info unten */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {selectedAnimal ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <AnimalIcon id={selectedAnimal.id} size={40} alt={selectedAnimal.label} className="block mx-auto" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{selectedAnimal.label}</div>
                <div className="text-white/50 text-xs truncate">
                  Auswahl getroffen – du kannst jederzeit ändern.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white/60 text-sm">Bitte wähle ein Tier aus.</div>
          )}
        </div>
      </div>

      {/* Button */}
      <motion.button
        ref={btnRef}
        onClick={handleSave}
        disabled={!canSave}
        animate={{ opacity: canSave ? 1 : 0.5 }}
        className={clsx(
          "mt-6 px-6 py-4 rounded-2xl font-extrabold text-lg transition",
          canSave ? "bg-green-600 hover:bg-green-500" : "bg-gray-700 cursor-not-allowed"
        )}
      >
        {isSaving ? "Speichere…" : buttonText}
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 text-sm text-gray-400 text-center">
          Auswahl speichern bringt +{xp} XP
        </p>
      )}
    </div>
  )
}

export default memo(AnimalSelect)
