// Standalone-Version des Burn-Rituals – für den Tools-Screen
// Kein Intervention-Kontext, kein XP, kein SlideManager – nur die Übung selbst.

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useBurnAnimation } from "@hooks/useBurnAnimation"

// ─── Kategorien ────────────────────────────────────────────────────────────────

const BURN_CATEGORIES = [
  {
    id: "guilt",
    emoji: "😔",
    label: "Schuld",
    description: "Etwas, wofür du dich verantwortlich fühlst.",
  },
  {
    id: "shame",
    emoji: "😳",
    label: "Scham",
    description: "Ein Gefühl, nicht gut genug zu sein.",
  },
  {
    id: "negative_thought",
    emoji: "💭",
    label: "Negativer Gedanke",
    description: "Ein Satz der immer wiederkommt.",
  },
  {
    id: "situation",
    emoji: "🌀",
    label: "Eine Situation",
    description: "Etwas das passiert ist und nicht loslässt.",
  },
  {
    id: "expectation",
    emoji: "💔",
    label: "Eine Erwartung",
    description: "Etwas das du dir erhofft hast – und nicht bekommen hast.",
  },
  {
    id: "fear",
    emoji: "😨",
    label: "Eine Befürchtung",
    description: "Etwas das dich ängstigt, aber vielleicht nicht eintritt.",
  },
  {
    id: "other",
    emoji: "✍️",
    label: "Etwas anderes",
    description: "Du weißt selbst am besten, was weg muss.",
  },
]

// ─── Slider Labels ─────────────────────────────────────────────────────────────

function getSliderLabel(value: number): string {
  if (value <= 3) return "Kaum spürbar"
  if (value <= 6) return "Deutlich spürbar"
  if (value <= 9) return "Stark belastend"
  return "Überwältigend"
}

// ─── Hauptkomponente ───────────────────────────────────────────────────────────

type Step = "category" | "text" | "burden_before" | "burn" | "burden_after" | "result"

export default function BurnRitualToolStandalone() {
  const [step, setStep] = useState<Step>("category")
  const [category, setCategory] = useState<string | null>(null)
  const [burnText, setBurnText] = useState("")
  const [burdenBefore, setBurdenBefore] = useState(5)
  const [burdenAfter, setBurdenAfter] = useState(5)

  const { phase, startBurn, reset: resetBurn, isComplete } = useBurnAnimation()

  const selectedCategory = BURN_CATEGORIES.find((c) => c.id === category)

  // ─── Schritt 1: Kategorie wählen ───────────────────────────────────────────

  const handleCategorySelect = useCallback((categoryId: string) => {
    setCategory(categoryId)
    setStep("text")
  }, [])

  // ─── Schritt 2: Text eingeben ──────────────────────────────────────────────

  const handleTextSubmit = useCallback(() => {
    if (burnText.trim().length < 3) return
    setStep("burden_before")
  }, [burnText])

  // ─── Schritt 3: Belastung vorher ───────────────────────────────────────────

  const handleBurdenBeforeSubmit = useCallback(() => {
    setStep("burn")
  }, [])

  // ─── Schritt 4: Verbrennung ────────────────────────────────────────────────

  const handleStartBurn = useCallback(() => {
    startBurn()
  }, [startBurn])

  // Wenn Burn-Animation complete → automatisch zu Schritt 5
  const handleBurnComplete = useCallback(() => {
    if (isComplete && step === "burn") {
      setStep("burden_after")
    }
  }, [isComplete, step])

  // Effect für automatischen Übergang nach Burn
  useState(() => {
    if (isComplete && step === "burn") {
      setTimeout(() => setStep("burden_after"), 1000)
    }
  })

  // ─── Schritt 5: Belastung nachher ──────────────────────────────────────────

  const handleBurdenAfterSubmit = useCallback(() => {
    setStep("result")
  }, [])

  // ─── Schritt 6: Ergebnis ───────────────────────────────────────────────────

  const diff = burdenBefore - burdenAfter

  const handleReset = useCallback(() => {
    setStep("category")
    setCategory(null)
    setBurnText("")
    setBurdenBefore(5)
    setBurdenAfter(5)
    resetBurn()
  }, [resetBurn])

  const handleClose = useCallback(() => {
    // Tool schließen via uiOverlay
    window.history.back()
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 text-white">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔥 Verbrennen</h1>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {/* ─── Schritt 1: Kategorie ─────────────────────────────────────── */}
          {step === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold">Was möchtest du verbrennen?</h2>

              <div className="flex flex-col gap-3">
                {BURN_CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-start gap-4 px-4 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-left transition-all"
                  >
                    <span className="text-2xl mt-0.5 shrink-0">{cat.emoji}</span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-white">{cat.label}</span>
                      <span className="text-sm text-gray-400 leading-snug">
                        {cat.description}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── Schritt 2: Text eingeben ─────────────────────────────────── */}
          {step === "text" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCategory?.emoji}</span>
                <h2 className="text-2xl font-bold">Was genau möchtest du loslassen?</h2>
              </div>

              <textarea
                value={burnText}
                onChange={(e) => setBurnText(e.target.value)}
                placeholder="Schreib es auf – so wie es in dir ist..."
                className="w-full h-40 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500"
                autoFocus
              />

              <button
                onClick={handleTextSubmit}
                disabled={burnText.trim().length < 3}
                className={clsx(
                  "px-6 py-3 rounded-lg font-bold transition",
                  burnText.trim().length >= 3
                    ? "bg-orange-600 hover:bg-orange-500"
                    : "bg-gray-700 cursor-not-allowed"
                )}
              >
                Weiter
              </button>
            </motion.div>
          )}

          {/* ─── Schritt 3: Belastung vorher ──────────────────────────────── */}
          {step === "burden_before" && (
            <motion.div
              key="burden_before"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold">Wie sehr belastet dich das gerade?</h2>

              <div className="flex flex-col gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={burdenBefore}
                  onChange={(e) => setBurdenBefore(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-orange-500">{burdenBefore}</span>
                  <span className="text-gray-400">{getSliderLabel(burdenBefore)}</span>
                </div>
              </div>

              <button
                onClick={handleBurdenBeforeSubmit}
                className="px-6 py-3 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 transition"
              >
                Weiter
              </button>
            </motion.div>
          )}

          {/* ─── Schritt 4: Verbrennung ────────────────────────────────────── */}
          {step === "burn" && (
            <motion.div
              key="burn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              {phase === "idle" && (
                <>
                  <h2 className="text-2xl font-bold">Bereit loszulassen?</h2>

                  {/* Papier-Karte */}
                  <div className="mx-auto w-full max-w-[320px]">
                    <div
                      className="relative bg-amber-50 text-gray-900 p-6 rounded-lg shadow-lg"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{burnText}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartBurn}
                    className="mx-auto px-8 py-3 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 transition text-white"
                  >
                    Verbrennen 🔥
                  </button>
                </>
              )}

              {phase === "burning" && (
                <div className="mx-auto w-full max-w-[320px]">
                  <div className="relative">
                    {/* Papier mit Burn-Animation */}
                    <motion.div
                      className="relative bg-amber-50 text-gray-900 p-6 rounded-lg shadow-lg overflow-hidden"
                      animate={{
                        backgroundColor: [
                          "#fffbeb",
                          "#fef3c7",
                          "#fde68a",
                          "#fcd34d",
                          "#f59e0b",
                          "#ea580c",
                          "#9a3412",
                          "#1c1917",
                        ],
                        opacity: [1, 1, 0.9, 0.7, 0.5, 0.3, 0.1, 0],
                      }}
                      transition={{ duration: 3.5, ease: "easeIn" }}
                    >
                      <motion.p
                        className="text-base leading-relaxed whitespace-pre-wrap"
                        animate={{
                          opacity: [1, 1, 0.8, 0.6, 0.4, 0.2, 0, 0],
                        }}
                        transition={{ duration: 3.5, ease: "easeIn" }}
                      >
                        {burnText}
                      </motion.p>

                      {/* Flammen am unteren Rand */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: [0, 1, 1, 0.8, 0], y: [20, 0, -10, -20, -30] }}
                        transition={{ duration: 3.5, ease: "easeOut" }}
                      >
                        <svg
                          viewBox="0 0 100 50"
                          className="w-full h-full"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#EF4444" />
                              <stop offset="50%" stopColor="#F97316" />
                              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.5" />
                            </linearGradient>
                          </defs>
                          <motion.path
                            d="M0,50 Q10,30 20,40 T40,35 T60,40 T80,35 T100,40 L100,50 Z"
                            fill="url(#flameGradient)"
                            animate={{
                              d: [
                                "M0,50 Q10,30 20,40 T40,35 T60,40 T80,35 T100,40 L100,50 Z",
                                "M0,50 Q10,25 20,35 T40,30 T60,35 T80,30 T100,35 L100,50 Z",
                                "M0,50 Q10,30 20,40 T40,35 T60,40 T80,35 T100,40 L100,50 Z",
                              ],
                            }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </svg>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              )}

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <p className="text-gray-300 text-lg">Es ist weg.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Schritt 5: Belastung nachher ─────────────────────────────── */}
          {step === "burden_after" && (
            <motion.div
              key="burden_after"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold">Wie sehr belastet es dich jetzt noch?</h2>

              <div className="flex flex-col gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={burdenAfter}
                  onChange={(e) => setBurdenAfter(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-green-500">{burdenAfter}</span>
                  <span className="text-gray-400">{getSliderLabel(burdenAfter)}</span>
                </div>
              </div>

              <button
                onClick={handleBurdenAfterSubmit}
                className="px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
              >
                Ergebnis ansehen
              </button>
            </motion.div>
          )}

          {/* ─── Schritt 6: Ergebnis ───────────────────────────────────────── */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold">Dein Ergebnis</h2>

              <div className="flex items-center justify-center gap-4 py-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-orange-500">{burdenBefore}</div>
                  <div className="text-sm text-gray-400 mt-1">Vorher</div>
                </div>
                <div className="text-3xl text-gray-600">→</div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-500">{burdenAfter}</div>
                  <div className="text-sm text-gray-400 mt-1">Nachher</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                {diff >= 3 && (
                  <p className="text-gray-300 leading-relaxed">
                    Von {burdenBefore} auf {burdenAfter}. Das ist ein echter Unterschied.
                  </p>
                )}
                {diff > 0 && diff < 3 && (
                  <p className="text-gray-300 leading-relaxed">
                    Ein kleiner Schritt. Manchmal reicht das.
                  </p>
                )}
                {diff <= 0 && (
                  <p className="text-gray-300 leading-relaxed">
                    Manchmal braucht Loslassen mehrere Versuche. Das ist völlig normal.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 transition"
                >
                  Nochmal verbrennen
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-lg font-bold bg-gray-700 hover:bg-gray-600 transition"
                >
                  Fertig
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
