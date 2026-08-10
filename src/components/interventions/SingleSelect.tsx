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

type SelectOption = {
  id: string
  label: string
}

type SingleSelectData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  saveTo: string
  options: SelectOption[]
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
   SingleSelect
======================= */

function SingleSelect({ data }: { data: SingleSelectData }) {
  const { id, xp = 0, title, subtitle, saveTo, options } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedOption = options.find((o) => o.id === selectedId)

  const handleComplete = useCallback(async () => {
    if (!api || !selectedId) return

    const profilePatch: Record<string, unknown> = {}
    assignPatchValue(profilePatch, saveTo, selectedId)

    if (import.meta.env.DEV) {
      console.log("[SingleSelect] Gewählte Option:", selectedId)
      console.log("[SingleSelect] Patch:", JSON.stringify(profilePatch, null, 2))
    }

    try {
      await dispatch(
        patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
      ).unwrap()
    } catch (err) {
      if (import.meta.env.DEV) console.error("[SingleSelect] patchUserProfile fehlgeschlagen:", err)
      return
    }

    await dispatch(
      completeInterventionThunk({ interventionId: id, xp, playAnimation: startAnimation, api })
    ).unwrap()

    await new Promise((r) => setTimeout(r, 400))

    // Level neu laden um Conditions neu zu evaluieren
    await dispatch(
      handleActionThunk({
        action: {
          type: "reload_level",
        },
        playAnimation: startAnimation,
        api,
      })
    ).unwrap()
    
    // Nach dem Reload zum nächsten Slide springen
    await new Promise((r) => setTimeout(r, 100))
    slideManager.goNext()
  }, [api, selectedId, saveTo, xp, id, dispatch, startAnimation, slideManager])

  return (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      {/* Avatar oben fix */}
      <div className="shrink-0">
        <AvatarBubble title={title} subtitle={subtitle} />
      </div>

      {/* Scrollbarer Mittelbereich */}
      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-3 pb-2">
          {options.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => setSelectedId(option.id)}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200",
                selectedId === option.id
                  ? "bg-green-900/30 border-green-500"
                  : "border-gray-700 hover:border-gray-500"
              )}
            >
              <span
                className={clsx(
                  "font-medium transition-colors text-base",
                  selectedId === option.id ? "text-green-300" : "text-white"
                )}
              >
                {option.label}
              </span>

              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                  selectedId === option.id
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
        disabled={!selectedId}
        animate={{ opacity: selectedId ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          selectedId
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        {selectedOption ? selectedOption.label : "Auswählen..."}
      </motion.button>

      {xp > 0 && (
        <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
      )}
    </div>
  )
}

export default memo(SingleSelect)
