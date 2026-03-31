import {
  useRef,
  useCallback,
  memo,
} from "react"
import { motion } from "framer-motion"
import AvatarBubble from "../../ui/AvatarBubble"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch } from "@store/hooks"
import { patchUserProfile } from "@store/slices/sessionSlice"
import {
  completeInterventionThunk,
} from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

// Typen erweitern
type ScreeningScores = {
  fear_reaction?: number
  need_love?: number
  avoid_conflict?: number
}

type HypothesisRevealData = {
  id: number
  xp?: number
  title: string
  hypothesis: string
  description: string
  hypothesisType?: string          // NEU: z.B. "fear_reaction"
  screeningScores?: ScreeningScores // NEU: aus meta.screening_scores
  confirmText?: string
  rejectText?: string
  confirmNextCardId?: string
  rejectNextCardId?: string
  saveTo?: string
}

// Hilfsfunktion: nächstbeste Hypothese finden
const HYPOTHESIS_CARD_MAP: Record<string, string> = {
  fear_reaction: "l3_hypothesis_fear",
  need_love: "l3_hypothesis_love",
  avoid_conflict: "l3_hypothesis_conflict",
}

function getNextHypothesisCardId(
  scores: ScreeningScores,
  currentType: string,
  fallback: string
): string {
  const sorted = Object.entries(scores)
    .filter(([type]) => type !== currentType)
    .sort(([, a], [, b]) => b - a)

  const nextType = sorted[0]?.[0]
  return nextType ? (HYPOTHESIS_CARD_MAP[nextType] ?? fallback) : fallback
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
   HypothesisReveal
======================= */

function HypothesisReveal({ data }: { data: HypothesisRevealData }) {
  const {
    id,
    xp = 0,
    title,
    hypothesis,
    description,
    confirmText = "Ja, das trifft zu.",
    rejectText = "Nein, nicht ganz.",
    confirmNextCardId,
    rejectNextCardId,
    saveTo,
  } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

const handleChoice = useCallback(
  async (confirmed: boolean) => {
    if (!api) return

    if (saveTo) {
      const profilePatch: Record<string, unknown> = {}
      assignPatchValue(profilePatch, saveTo, confirmed ? "confirmed" : "rejected")
      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[HypothesisReveal] patch fehlgeschlagen:", err)
        return
      }
    }

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    if (confirmed) {
      // Confirm: direkt zur nächsten Card oder goNext
      if (confirmNextCardId) {
        slideManager.goToCard(confirmNextCardId)
      } else {
        slideManager.goNext()
      }
    } else {
      // Reject: nächste Hypothese basierend auf Scores, sonst rejectNextCardId, sonst goNext
      if (data.screeningScores && data.hypothesisType) {
        const nextCardId = getNextHypothesisCardId(
          data.screeningScores,
          data.hypothesisType,
          data.rejectNextCardId ?? ""
        )
        if (nextCardId) {
          slideManager.goToCard(nextCardId)
        } else {
          slideManager.goNext()
        }
      } else if (rejectNextCardId) {
        slideManager.goToCard(rejectNextCardId)
      } else {
        slideManager.goNext()
      }
    }
  },
  [api, saveTo, xp, id, confirmNextCardId, rejectNextCardId, data, dispatch, startAnimation, slideManager]
)

  return (
    <div className="flex flex-col h-full p-6 text-white">
      <div className="flex-1 flex flex-col gap-6 justify-center">

        {/* Avatar spricht — Titel */}
        <AvatarBubble title={title} />

        {/* Hypothese — hervorgehoben */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-green-600/40 bg-green-900/20 px-5 py-4"
        >
          <p className="text-lg font-semibold text-green-300 leading-snug">
            {hypothesis}
          </p>
        </motion.div>

        {/* Beschreibung */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-gray-300 text-sm leading-relaxed whitespace-pre-line"
        >
          {description}
        </motion.p>
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="flex flex-col gap-3 mt-6"
      >
        <button
          ref={btnRef}
          onClick={() => handleChoice(true)}
          className="px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
        >
          {confirmText}
        </button>
        <button
          onClick={() => handleChoice(false)}
          className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-400 transition"
        >
          {rejectText}
        </button>
      </motion.div>

      {xp > 0 && (
        <p className="mt-2 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(HypothesisReveal)
