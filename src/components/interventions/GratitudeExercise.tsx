// src/components/interventions/GratitudeExercise.tsx
// Template: "GratitudeExercise" – Dankbarkeitsübung für Level 9
// Wird von GamePlay.tsx via import.meta.glob automatisch als Template erkannt.

import { memo, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { unlockTools } from "@store/slices/toolsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { GRATITUDE_ITEMS, type GratitudeItem } from "../../features/feelingExercise/constants/gratitudeItems"
import type { UserProfilePatch } from "@api/types"
import AvatarBubble from "../../ui/AvatarBubble"

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

type GratitudeExerciseData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  saveTo: string
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: 3 zufällige Items auswählen
// ---------------------------------------------------------------------------

function getRandomGratitudeItems(count: number = 3): GratitudeItem[] {
  const shuffled = [...GRATITUDE_ITEMS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

function GratitudeExercise({ data }: { data: GratitudeExerciseData }) {
  const { id, xp = 80, title, subtitle, saveTo } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  // State
  const [step, setStep] = useState<"select" | "reflect" | "done">("select")
  const [randomItems, setRandomItems] = useState(() => getRandomGratitudeItems(3))
  const [selectedItem, setSelectedItem] = useState<GratitudeItem | null>(null)
  const [customText, setCustomText] = useState("")
  const [reflection, setReflection] = useState("")
  const [saving, setSaving] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const [allEntries, setAllEntries] = useState<any[]>([])

  const handleSelectItem = (item: GratitudeItem) => {
    setSelectedItem(item)
    setCustomText("") // Reset custom text wenn vorgefertigtes Item gewählt
  }

  const handleSelectCustom = () => {
    setSelectedItem(null)
  }

  const canProceedToReflect = selectedItem !== null || customText.trim().length > 0

  const handleProceedToReflect = () => {
    if (!canProceedToReflect) return
    setStep("reflect")
  }

  const canComplete = reflection.trim().length > 0

  const handleComplete = useCallback(async () => {
    if (!api || !canComplete || saving) return
    setSaving(true)

    // Daten sammeln
    const gratitudeEntry = {
      timestamp: new Date().toISOString(),
      item: selectedItem
        ? {
            id: selectedItem.id,
            label: selectedItem.label,
            emoji: selectedItem.emoji,
            description: selectedItem.description,
          }
        : null,
      customText: customText.trim() || null,
      reflection: reflection.trim(),
    }

    // Zu allen Einträgen hinzufügen
    const newEntries = [...allEntries, gratitudeEntry]
    setAllEntries(newEntries)

    // Patch-Objekt aufbauen - speichern als Array
    const profilePatch: UserProfilePatch = {
      meta: {
        [saveTo]: newEntries,
      },
    }

    try {
      await dispatch(patchUserProfile({ api, patch: profilePatch })).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[GratitudeExercise] patchUserProfile fehlgeschlagen:", err)
      setSaving(false)
      return
    }

    // Tool freischalten (nur beim ersten Mal)
    if (roundCount === 0) {
      dispatch(unlockTools(["gratitude_tool"]))
    }

    // Intervention abschließen (nur beim ersten Mal - XP nur einmal)
    if (roundCount === 0) {
      await dispatch(
        completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
      ).unwrap()
    }

    setSaving(false)
    setStep("done")
  }, [api, canComplete, saving, selectedItem, customText, reflection, saveTo, allEntries, roundCount, id, xp, dispatch, startAnimation])

  const handleAnotherRound = () => {
    if (roundCount >= 4) {
      // Max 5 Runden erreicht
      handleFinish()
      return
    }
    
    // Reset für nächste Runde
    setRoundCount((prev) => prev + 1)
    setStep("select")
    setSelectedItem(null)
    setCustomText("")
    setReflection("")
    setRandomItems(getRandomGratitudeItems(3))
  }

  const handleFinish = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400))

    // Weiter zum nächsten Slide
    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [dispatch, slideManager, startAnimation, api])

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble title={title} subtitle={subtitle} />
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4">
        <AnimatePresence mode="wait">
          {/* Schritt 1: Auswahl */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <p className="text-white/60 text-sm">
                Wähle etwas aus, wofür du dankbar bist – oder schreibe selbst etwas:
              </p>

              {/* Vorgefertigte Items */}
              <div className="flex flex-col gap-3">
                {randomItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200",
                      selectedItem?.id === item.id
                        ? "bg-green-600/30 border-green-500/70"
                        : "bg-white/5 border-white/15 hover:bg-white/10"
                    )}
                  >
                    <span className="text-3xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white/90 mb-1">{item.label}</p>
                      <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Eigener Text */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleSelectCustom}
                  className={clsx(
                    "px-4 py-2 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                    selectedItem === null && customText.length === 0
                      ? "bg-green-600/30 border-green-500/70 text-green-200"
                      : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                  )}
                >
                  ✍️ Oder schreibe selbst etwas
                </button>

                {selectedItem === null && (
                  <motion.textarea
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Wofür bist du dankbar?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/25 resize-none focus:outline-none focus:border-white/30 transition-all duration-200"
                  />
                )}
              </div>

              {/* Weiter-Button */}
              <motion.button
                onClick={handleProceedToReflect}
                disabled={!canProceedToReflect}
                whileTap={canProceedToReflect ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-4",
                  canProceedToReflect
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                Weiter →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 2: Reflexion */}
          {step === "reflect" && (
            <motion.div
              key="reflect"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              {/* Gewähltes Item anzeigen */}
              <div className="bg-white/8 rounded-2xl p-4 flex items-start gap-3">
                {selectedItem ? (
                  <>
                    <span className="text-3xl shrink-0">{selectedItem.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white/90">{selectedItem.label}</p>
                      <p className="text-sm text-white/60 mt-1">{selectedItem.description}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1">
                    <p className="text-white/90 italic">„{customText}"</p>
                  </div>
                )}
              </div>

              <p className="text-white/60 text-sm">
                Nimm dir einen Moment. Schließe die Augen, wenn du magst.
              </p>

              <p className="text-white/80 text-sm leading-relaxed">
                Spüre die Dankbarkeit in deinem Körper. Wo sitzt sie? Wie fühlt sie sich an?
              </p>

              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Was spürst du? Was kommt dir in den Sinn?"
                rows={5}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white/90 text-sm placeholder-white/25 resize-none focus:outline-none focus:border-white/30 transition-all duration-200"
              />

              <motion.button
                onClick={handleComplete}
                disabled={!canComplete || saving}
                whileTap={canComplete && !saving ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-2",
                  canComplete && !saving
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                {saving ? "Wird gespeichert..." : "Abschließen →"}
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 3: Fertig - Noch eine Runde? */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-6 py-12"
            >
              <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center">
                <span className="text-5xl">✓</span>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Gespeichert!</h3>
                <p className="text-white/60 text-sm">
                  {roundCount === 0 
                    ? "Dein erster Dankbarkeits-Eintrag wurde gespeichert."
                    : `${roundCount + 1} Einträge gespeichert.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {roundCount < 4 && (
                  <motion.button
                    onClick={handleAnotherRound}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                  >
                    🙏 Noch eine Runde ({roundCount + 1}/5)
                  </motion.button>
                )}
                <motion.button
                  onClick={handleFinish}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
                >
                  Level abschließen →
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(GratitudeExercise)
