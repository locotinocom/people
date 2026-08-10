// src/components/interventions/OpponentProfileCard.tsx
// Template: "OpponentProfile" – Schrittweise Erfassung des Opponents (Level 6)
// Wird von GamePlay.tsx via import.meta.glob automatisch als Template erkannt.

import { memo, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useTemplateContext } from "@helpers/useTemplateContext"
import { applyTemplate } from "@helpers/template.tsx"
import type { UserProfilePatch } from "@api/types"
import AvatarBubble from "../../ui/AvatarBubble"

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

type GenderOption = { id: string; label: string }
type AgeGroupOption = { id: string; label: string }
type TraitOption = { id: string; label: string; emoji: string }
type BehaviorOption = { id: string; label: string; emoji: string }

type SaveToConfig = {
  gender: string
  ageGroup: string
  traits: string
  typicalBehaviors: string
  typicalPhrases: string
}

type OpponentProfileData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  saveTo: SaveToConfig
  nextCardId?: string
  genderOptions: GenderOption[]
  ageGroupOptions: AgeGroupOption[]
  traitOptions: TraitOption[]
  behaviorOptions: BehaviorOption[]
}

// ---------------------------------------------------------------------------
// Hilfsfunktion: Patch-Wert setzen (analog zu Form.tsx)
// ---------------------------------------------------------------------------

function assignPatchValue(
  patch: Record<string, unknown>,
  saveTo: string,
  value: unknown
): void {
  const dotIndex = saveTo.indexOf(".")
  if (dotIndex === -1) {
    patch[saveTo] = value
  } else {
    const top = saveTo.slice(0, dotIndex)
    const rest = saveTo.slice(dotIndex + 1)
    if (!patch[top] || typeof patch[top] !== "object" || Array.isArray(patch[top])) {
      patch[top] = {}
    }
    assignPatchValue(patch[top] as Record<string, unknown>, rest, value)
  }
}

// ---------------------------------------------------------------------------
// Schritt-Typen
// ---------------------------------------------------------------------------

type Step = "gender" | "ageGroup" | "traits" | "behaviors" | "phrases" | "done"

const STEP_ORDER: Step[] = ["gender", "ageGroup", "traits", "behaviors", "phrases", "done"]

// ---------------------------------------------------------------------------
// Chip-Komponente
// ---------------------------------------------------------------------------

function Chip({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji?: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
        selected
          ? "bg-green-600/30 border-green-500/70 text-green-200"
          : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white/90"
      )}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------

function OpponentProfileCard({ data }: { data: OpponentProfileData }) {
  const {
    id,
    xp = 60,
    title,
    subtitle,
    saveTo,
    nextCardId,
    genderOptions,
    ageGroupOptions,
    traitOptions,
    behaviorOptions,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const ctx = useTemplateContext()

  // Lokaler State für alle Schritte
  const [currentStep, setCurrentStep] = useState<Step>("gender")
  const [gender, setGender] = useState<string | null>(null)
  const [ageGroup, setAgeGroup] = useState<string | null>(null)
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([])
  const [phrases, setPhrases] = useState<[string, string, string]>(["", "", ""])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const renderedTitle = applyTemplate(title, ctx)
  const renderedSubtitle = subtitle ? applyTemplate(subtitle, ctx) : null

  const goNextStep = () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[idx + 1])
    }
  }

  const toggleTrait = (id: string) => {
    setSelectedTraits((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    )
  }

  const toggleBehavior = (id: string) => {
    setSelectedBehaviors((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    )
  }

  const updatePhrase = (index: number, value: string) => {
    setPhrases((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string]
      next[index] = value
      return next
    })
  }

  const handleSave = useCallback(async () => {
    if (!api || saving) return
    setSaving(true)

    // Patch-Objekt aufbauen
    const profilePatch: Record<string, unknown> = {}
    if (gender) assignPatchValue(profilePatch, saveTo.gender, gender)
    if (ageGroup) assignPatchValue(profilePatch, saveTo.ageGroup, ageGroup)
    if (selectedTraits.length > 0) assignPatchValue(profilePatch, saveTo.traits, selectedTraits)
    if (selectedBehaviors.length > 0) assignPatchValue(profilePatch, saveTo.typicalBehaviors, selectedBehaviors)
    const nonEmptyPhrases = phrases.filter((p) => p.trim().length > 0)
    if (nonEmptyPhrases.length > 0) assignPatchValue(profilePatch, saveTo.typicalPhrases, nonEmptyPhrases)

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[OpponentProfile] patchUserProfile fehlgeschlagen:", err)
      setSaving(false)
      return
    }

    // Kurze Bestätigungsanimation
    setSaved(true)
    await new Promise((r) => setTimeout(r, 800))

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    await dispatch(
      handleActionThunk({
        action: {
          type: "next",
          goNext: () => slideManager.goNext(),
          ...(nextCardId ? { targetCardId: nextCardId } : {}),
        },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, saving, gender, ageGroup, selectedTraits, selectedBehaviors, phrases, saveTo, id, xp, nextCardId, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header mit AvatarBubble */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <AvatarBubble 
          title={renderedTitle}
          subtitle={renderedSubtitle}
        />
      </div>

      {/* Fortschritts-Dots */}
      <div className="shrink-0 flex justify-center gap-1.5 py-2">
        {(["gender", "ageGroup", "traits", "behaviors", "phrases"] as Step[]).map((step) => {
          const stepIdx = STEP_ORDER.indexOf(step)
          const currentIdx = STEP_ORDER.indexOf(currentStep)
          return (
            <div
              key={step}
              className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                currentIdx > stepIdx
                  ? "bg-green-500"
                  : currentIdx === stepIdx
                  ? "bg-white/70 w-3"
                  : "bg-white/20"
              )}
            />
          )
        })}
      </div>

      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-4">
        <AnimatePresence mode="wait">

          {/* Schritt 1: Geschlecht */}
          {currentStep === "gender" && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <p className="text-white/60 text-xs uppercase tracking-wide">Geschlecht</p>
              <div className="flex flex-col gap-2">
                {genderOptions.map((opt) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => setGender(opt.id)}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                      gender === opt.id
                        ? "bg-green-600/30 border-green-500/70 text-green-200"
                        : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <motion.button
                onClick={goNextStep}
                disabled={!gender}
                whileTap={gender ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-2",
                  gender
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                Weiter →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 2: Altersgruppe */}
          {currentStep === "ageGroup" && (
            <motion.div
              key="ageGroup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <p className="text-white/60 text-xs uppercase tracking-wide">Altersgruppe</p>
              <div className="flex flex-col gap-2">
                {ageGroupOptions.map((opt) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => setAgeGroup(opt.id)}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                      ageGroup === opt.id
                        ? "bg-green-600/30 border-green-500/70 text-green-200"
                        : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <motion.button
                onClick={goNextStep}
                disabled={!ageGroup}
                whileTap={ageGroup ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-2",
                  ageGroup
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                Weiter →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 3: Charaktereigenschaften (max 4) */}
          {currentStep === "traits" && (
            <motion.div
              key="traits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Charaktereigenschaften</p>
                <p className="text-white/40 text-xs mt-0.5">Wähle bis zu 4 aus</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {traitOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={selectedTraits.includes(opt.id)}
                    onClick={() => toggleTrait(opt.id)}
                  />
                ))}
              </div>
              <motion.button
                onClick={goNextStep}
                disabled={selectedTraits.length === 0}
                whileTap={selectedTraits.length > 0 ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-2",
                  selectedTraits.length > 0
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                Weiter ({selectedTraits.length}/4) →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 4: Typische Verhaltensweisen (max 3) */}
          {currentStep === "behaviors" && (
            <motion.div
              key="behaviors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Typische Verhaltensweisen</p>
                <p className="text-white/40 text-xs mt-0.5">Wähle bis zu 3 aus</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {behaviorOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={selectedBehaviors.includes(opt.id)}
                    onClick={() => toggleBehavior(opt.id)}
                  />
                ))}
              </div>
              <motion.button
                onClick={goNextStep}
                disabled={selectedBehaviors.length === 0}
                whileTap={selectedBehaviors.length > 0 ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 mt-2",
                  selectedBehaviors.length > 0
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                Weiter ({selectedBehaviors.length}/3) →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 5: Typische Sätze (3 Freitextfelder) */}
          {currentStep === "phrases" && (
            <motion.div
              key="phrases"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 pt-2"
            >
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Typische Sätze</p>
                <p className="text-white/40 text-xs mt-0.5">Optional – aber sehr hilfreich</p>
              </div>
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-white/40 text-xs px-1">Satz {i + 1}</p>
                  <textarea
                    value={phrases[i]}
                    onChange={(e) => updatePhrase(i, e.target.value)}
                    placeholder="Was sagt er/sie oft?"
                    rows={2}
                    className={clsx(
                      "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3",
                      "text-white/90 text-sm placeholder-white/25 resize-none",
                      "focus:outline-none focus:border-white/30 focus:bg-white/8",
                      "transition-all duration-200"
                    )}
                  />
                </div>
              ))}
              <motion.button
                onClick={goNextStep}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all duration-200 mt-2"
              >
                Weiter →
              </motion.button>
            </motion.div>
          )}

          {/* Schritt 6: Zusammenfassung + Speichern */}
          {currentStep === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 pt-2"
            >
              <div className="bg-white/8 rounded-2xl px-4 py-3 flex flex-col gap-2">
                <p className="text-white/50 text-xs uppercase tracking-wide">Zusammenfassung</p>
                {gender && (
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">Geschlecht: </span>
                    {genderOptions.find((o) => o.id === gender)?.label}
                  </p>
                )}
                {ageGroup && (
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">Alter: </span>
                    {ageGroupOptions.find((o) => o.id === ageGroup)?.label}
                  </p>
                )}
                {selectedTraits.length > 0 && (
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">Eigenschaften: </span>
                    {selectedTraits
                      .map((id) => {
                        const t = traitOptions.find((o) => o.id === id)
                        return t ? `${t.emoji} ${t.label}` : id
                      })
                      .join(", ")}
                  </p>
                )}
                {selectedBehaviors.length > 0 && (
                  <p className="text-white/80 text-sm">
                    <span className="text-white/40">Verhalten: </span>
                    {selectedBehaviors
                      .map((id) => {
                        const b = behaviorOptions.find((o) => o.id === id)
                        return b ? `${b.emoji} ${b.label}` : id
                      })
                      .join(", ")}
                  </p>
                )}
                {phrases.some((p) => p.trim().length > 0) && (
                  <div>
                    <p className="text-white/40 text-sm">Typische Sätze:</p>
                    {phrases
                      .filter((p) => p.trim().length > 0)
                      .map((p, i) => (
                        <p key={i} className="text-white/70 text-sm italic ml-2">
                          „{p}"
                        </p>
                      ))}
                  </div>
                )}
              </div>

              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileTap={!saving ? { scale: 0.97 } : {}}
                className={clsx(
                  "w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
                  saved
                    ? "bg-green-700 text-green-200"
                    : saving
                    ? "bg-green-600/50 text-white/50 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 text-white shadow-lg"
                )}
              >
                {saved ? "Gespeichert ✓" : saving ? "Speichern..." : "Speichern & Weiter →"}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(OpponentProfileCard)
