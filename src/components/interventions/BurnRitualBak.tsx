import { useRef, useState, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
  handleActionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { useBurnAnimation } from "@hooks/useBurnAnimation"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

type BurnRitualData = {
  id: number
  xp?: number
  slug: string
  title: string
  burnText: string
  instructionBefore: string
  burnButtonText: string
  instructionAfter: string
  saveTo: string
}

/* =======================
   Hilfsfunktion: assignPatchValue
======================= */

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

/* =======================
   BurnRitual
======================= */

function BurnRitual({ data }: { data: BurnRitualData }) {
  const {
    id,
    xp = 0,
    slug,
    title,
    burnText,
    instructionBefore,
    burnButtonText,
    instructionAfter,
    saveTo,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const { phase, startBurn, isComplete } = useBurnAnimation()
  const [hasCompleted, setHasCompleted] = useState(false)

  const handleBurn = useCallback(() => {
    startBurn()
  }, [startBurn])

  const handleComplete = useCallback(async () => {
    if (!api || hasCompleted) return
    setHasCompleted(true)

    const profilePatch: Record<string, unknown> = {}
    const timestamp = new Date().toISOString()
    assignPatchValue(profilePatch, saveTo, timestamp)

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[BurnRitual] patchUserProfile fehlgeschlagen:", err)
      setHasCompleted(false)
      return
    }

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
  }, [api, hasCompleted, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Scrollbarer Inhaltsbereich */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-6">
          {/* Titel */}
          <AvatarBubble title={title} />

          <AnimatePresence mode="wait">
            {/* Phase 1: Vor dem Verbrennen */}
            {phase === "idle" && (
              <motion.div
                key="before"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed">{instructionBefore}</p>

                {/* Papier-Karte */}
                <div className="mx-auto w-full max-w-[320px]">
                  <div
                    className="relative bg-amber-50 text-gray-900 p-6 rounded-lg shadow-lg"
                    style={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{burnText}</p>
                  </div>
                </div>

                {/* Burn-Button */}
                <motion.button
                  onClick={handleBurn}
                  whileTap={{ scale: 0.97 }}
                  className="mx-auto px-8 py-3 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 transition text-white"
                >
                  {burnButtonText}
                </motion.button>
              </motion.div>
            )}

            {/* Phase 2: Animation (Verbrennung) */}
            {phase === "burning" && (
              <motion.div
                key="burning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed">{instructionBefore}</p>

                {/* Brennende Papier-Karte */}
                <div className="mx-auto w-full max-w-[320px]">
                  <div className="relative">
                    {/* Papier mit Burn-Animation */}
                    <motion.div
                      className="relative bg-amber-50 text-gray-900 p-6 rounded-lg shadow-lg overflow-hidden"
                      animate={{
                        backgroundColor: ["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#f59e0b", "#ea580c", "#9a3412", "#1c1917"],
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
              </motion.div>
            )}

            {/* Phase 3: Nach der Animation */}
            {isComplete && (
              <motion.div
                key="after"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col gap-6"
              >
                <p className="text-gray-300 leading-relaxed">{instructionAfter}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Weiter-Button (nur nach Verbrennung) */}
      {isComplete && (
        <motion.button
          ref={btnRef}
          onClick={handleComplete}
          disabled={hasCompleted}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={clsx(
            "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
            hasCompleted
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500"
          )}
        >
          Weiter
        </motion.button>
      )}

      {xp > 0 && isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-2 shrink-0 text-sm text-gray-400"
        >
          +{xp} XP
        </motion.p>
      )}
    </div>
  )
}

export default memo(BurnRitual)
