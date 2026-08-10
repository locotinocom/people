import {
  useRef,
  useState,
  useCallback,
  memo,
} from "react"
import { motion } from "framer-motion"
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
import type { UserProfilePatch } from "@api/types"

/* =======================
   Types
======================= */

type TypeOption = {
  id: string
  emoji: string
  label: string
  description: string
}

type TypeSelectData = {
  id: number
  xp?: number
  title: string
  saveTo: string
  saveLabelTo?: string
  nextCardId?: string
  types: TypeOption[]
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
   TypeSelect
======================= */

function TypeSelect({ data }: { data: TypeSelectData }) {
  const { id, xp = 0, title, saveTo, saveLabelTo, nextCardId, types } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  const selectedType = types.find((t) => t.id === selectedTypeId)

  const handleComplete = useCallback(async () => {
    if (!api || !selectedTypeId) return

    const profilePatch: Record<string, unknown> = {}
    assignPatchValue(profilePatch, saveTo, selectedTypeId)

    // Wenn saveLabelTo angegeben ist, speichere auch das Label
    if (saveLabelTo) {
      assignPatchValue(profilePatch, saveLabelTo, selectedType?.label ?? selectedTypeId)
    }

    if (import.meta.env.DEV) {
      console.log("[TypeSelect] Gewählter Typ:", selectedTypeId)
      console.log("[TypeSelect] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[TypeSelect] patchUserProfile fehlgeschlagen:", err)
      return
    }

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
  }, [api, selectedTypeId, saveTo, nextCardId, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Avatar oben fix */}
      <div className="shrink-0">
        <AvatarBubble title={title} />
      </div>

      {/* Scrollbarer Mittelbereich */}
      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-3 pb-2">
          {types.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setSelectedTypeId(type.id)}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-start gap-4 px-4 py-4 rounded-xl border text-left transition-all duration-200",
                selectedTypeId === type.id
                  ? "bg-green-900/30 border-green-500"
                  : "border-gray-700 hover:border-gray-500"
              )}
            >
              <span className="text-2xl mt-0.5 shrink-0">{type.emoji}</span>

              <div className="flex flex-col gap-1 min-w-0">
                <span
                  className={clsx(
                    "font-semibold transition-colors",
                    selectedTypeId === type.id ? "text-green-300" : "text-white"
                  )}
                >
                  {type.label}
                </span>
                <span className="text-sm text-gray-400 leading-snug">
                  {type.description}
                </span>
              </div>

              <div
                className={clsx(
                  "ml-auto mt-1 w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                  selectedTypeId === type.id
                    ? "border-green-500 bg-green-500"
                    : "border-gray-600"
                )}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Weiter-Button unten fix */}
      <motion.button
        ref={btnRef}
        onClick={handleComplete}
        disabled={!selectedTypeId}
        animate={{ opacity: selectedTypeId ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          selectedTypeId
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        {selectedType ? `${selectedType.emoji} Das bin ich` : "Auswählen..."}
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(TypeSelect)