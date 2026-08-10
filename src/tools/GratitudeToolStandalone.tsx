// src/tools/GratitudeToolStandalone.tsx
// Standalone Tool: Danke-Tagebuch
// Wird im Tools-Screen angezeigt und kann jederzeit genutzt werden

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { GRATITUDE_ITEMS, type GratitudeItem } from "../features/feelingExercise/constants/gratitudeItems"
import type { UserProfilePatch } from "@api/types"

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

export default function GratitudeToolStandalone({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch()
  const api = useReduxApi()

  // Gespeicherte Einträge aus Redux laden
  const gratitudeJournal = useAppSelector(
    (s) => (s.session?.profile as any)?.meta?.gratitude_journal as any[] | undefined
  ) || []

  // State
  const [view, setView] = useState<"list" | "new">("list")
  const [step, setStep] = useState<"select" | "reflect" | "done">("select")
  const [randomItems, setRandomItems] = useState(() => getRandomGratitudeItems(3))
  const [selectedItem, setSelectedItem] = useState<GratitudeItem | null>(null)
  const [customText, setCustomText] = useState("")
  const [reflection, setReflection] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSelectItem = (item: GratitudeItem) => {
    setSelectedItem(item)
    setCustomText("")
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

    // Patch-Objekt aufbauen - speichern in meta.gratitude_journal als Array
    const profilePatch: UserProfilePatch = {
      meta: {
        gratitude_journal: gratitudeEntry, // Backend fügt zum Array hinzu
      },
    }

    try {
      await dispatch(patchUserProfile({ api, patch: profilePatch })).unwrap()
      setStep("done")
    } catch (err) {
      if (import.meta.env.DEV) console.error("[GratitudeTool] patchUserProfile fehlgeschlagen:", err)
    } finally {
      setSaving(false)
    }
  }, [api, canComplete, saving, selectedItem, customText, reflection, dispatch])

  const handleReset = () => {
    setStep("select")
    setSelectedItem(null)
    setCustomText("")
    setReflection("")
    setRandomItems(getRandomGratitudeItems(3))
  }

  const handleBackToList = () => {
    setView("list")
    handleReset()
  }

  const handleNewEntry = () => {
    setView("new")
    handleReset()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view === "new" && (
            <button
              onClick={handleBackToList}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              ←
            </button>
          )}
          <h2 className="text-xl font-bold">🙏 Danke-Tagebuch</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4">
        {/* Liste der gespeicherten Einträge */}
        {view === "list" && (
          <div className="flex flex-col gap-4">
            {gratitudeJournal.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">🙏</div>
                <p className="text-white/60 text-sm mb-6">
                  Noch keine Einträge vorhanden.
                  <br />
                  Starte dein erstes Dankbarkeits-Tagebuch!
                </p>
                <motion.button
                  onClick={handleNewEntry}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
                >
                  + Neuer Eintrag
                </motion.button>
              </div>
            ) : (
              <>
                <motion.button
                  onClick={handleNewEntry}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
                >
                  + Neuer Eintrag
                </motion.button>

                <div className="space-y-3 mt-2">
                  {[...gratitudeJournal].reverse().map((entry, idx) => {
                    const date = new Date(entry.timestamp)
                    const formattedDate = date.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    const formattedTime = date.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {entry.item ? (
                            <>
                              <span className="text-3xl shrink-0">{entry.item.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white/90">{entry.item.label}</p>
                                <p className="text-xs text-white/40 mt-1">
                                  {formattedDate} • {formattedTime}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1">
                              <p className="text-white/90 italic mb-1">„{entry.customText}"</p>
                              <p className="text-xs text-white/40">
                                {formattedDate} • {formattedTime}
                              </p>
                            </div>
                          )}
                        </div>

                        {entry.reflection && (
                          <div className="bg-white/5 rounded-xl p-3 mt-3">
                            <p className="text-sm text-white/70 leading-relaxed">
                              {entry.reflection}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Neuer Eintrag erstellen */}
        {view === "new" && (
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
                Wofür bist du heute dankbar?
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
                {saving ? "Wird gespeichert..." : "Speichern →"}
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 3: Fertig */}
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
                  Dein Dankbarkeits-Eintrag wurde gespeichert.
                </p>
              </div>

              <div className="flex gap-3 w-full">
                <motion.button
                  onClick={handleReset}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
                >
                  Noch ein Eintrag
                </motion.button>
                <motion.button
                  onClick={handleBackToList}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
                >
                  Zurück zur Liste
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </div>
  )
}
