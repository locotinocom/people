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

type Scenario = {
  id: string
  label: string
}

type SituationSetupData = {
  id: number
  xp?: number
  title: string
  subtitle?: string
  scenarios: Scenario[]
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
   SituationSetup
======================= */

function SituationSetup({ data }: { data: SituationSetupData }) {
  const { id, xp = 0, title, subtitle, scenarios, saveTo } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  // State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasOwnSituation, setHasOwnSituation] = useState<boolean | null>(null)
  const [ownSituation, setOwnSituation] = useState("")
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  // Slide 1: Situation wählen (Ja/Nein)
  const renderSlide1 = () => (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble title={title} subtitle={subtitle} />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-3 pb-2">
          <motion.button
            onClick={() => {
              setHasOwnSituation(true)
              setCurrentSlide(1)
            }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-left transition-all duration-200"
          >
            <span className="font-medium text-base text-white">
              Ja, mir fällt was ein
            </span>
            <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0" />
          </motion.button>

          <motion.button
            onClick={() => {
              setHasOwnSituation(false)
              setCurrentSlide(2)
            }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-left transition-all duration-200"
          >
            <span className="font-medium text-base text-white">
              Nein, ich bin ideenlos
            </span>
            <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0" />
          </motion.button>
        </div>
      </div>
    </div>
  )

  // Slide 2: Eigene Situation (Textarea)
  const renderSlide2 = () => (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble 
          title="Was ist die Situation?" 
          subtitle="Schreib sie kurz auf."
        />
      </div>

      <div className="mt-6 flex-1 min-h-0 flex flex-col">
        <textarea
          value={ownSituation}
          onChange={(e) => setOwnSituation(e.target.value)}
          placeholder="z.B. Er/sie bittet mich um etwas, und ich sage Nein..."
          className="flex-1 min-h-0 p-4 bg-zinc-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-500"
        />
      </div>

      <motion.button
        onClick={() => setCurrentSlide(3)}
        disabled={!ownSituation.trim()}
        animate={{ opacity: ownSituation.trim() ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          ownSituation.trim()
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        Weiter
      </motion.button>
    </div>
  )

  // Slide 3: Vorgefertigte Szenarien
  const renderSlide3 = () => (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble 
          title="Kein Problem – wähl eines aus:" 
        />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
        <div className="flex flex-col gap-3 pb-2">
          {scenarios.map((scenario) => (
            <motion.button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200",
                selectedScenario === scenario.id
                  ? "bg-green-900/30 border-green-500"
                  : "border-gray-700 hover:border-gray-500"
              )}
            >
              <span
                className={clsx(
                  "font-medium transition-colors text-base",
                  selectedScenario === scenario.id ? "text-green-300" : "text-white"
                )}
              >
                {scenario.label}
              </span>

              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                  selectedScenario === scenario.id
                    ? "border-green-500 bg-green-500"
                    : "border-gray-600"
                )}
              />
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => setCurrentSlide(3)}
        disabled={!selectedScenario}
        animate={{ opacity: selectedScenario ? 1 : 0.5 }}
        className={clsx(
          "mt-6 shrink-0 px-6 py-3 rounded-lg font-bold transition",
          selectedScenario
            ? "bg-green-600 hover:bg-green-500"
            : "bg-gray-700 cursor-not-allowed"
        )}
      >
        Weiter
      </motion.button>
    </div>
  )

  // Slide 4: Situation vorstellen
  const renderSlide4 = () => (
    <div className="flex flex-col h-full min-h-0 p-6 text-white">
      <div className="shrink-0">
        <AvatarBubble 
          title="Stell dir die Situation vor." 
          subtitle="Nimm dir einen Moment..."
        />
      </div>

      <div className="mt-6 flex-1 min-h-0 flex items-center justify-center">
        <div className="text-center text-gray-400 max-w-md">
          <p className="mb-4">
            Schließ die Augen, wenn du magst.
          </p>
          <p className="mb-4">
            Sieh die Situation vor dir.
          </p>
          <p>
            Spür, wie es sich anfühlt.
          </p>
        </div>
      </div>

      <motion.button
        onClick={() => setCurrentSlide(4)}
        className="mt-6 shrink-0 px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
      >
        Ich bin bereit ✊
      </motion.button>
    </div>
  )

  // Slide 5: Bereit-Check & Abschluss
  const renderSlide5 = () => {
    const handleComplete = async () => {
      if (!api) return

      const profilePatch: Record<string, unknown> = {}
      const situationText = hasOwnSituation ? ownSituation : selectedScenario
      assignPatchValue(profilePatch, saveTo, situationText)

      try {
        await dispatch(
          patchUserProfile({ api, patch: profilePatch as UserProfilePatch })
        ).unwrap()
      } catch (err) {
        if (import.meta.env.DEV) console.error("[SituationSetup] patchUserProfile fehlgeschlagen:", err)
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
          },
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()
    }

    return (
      <div className="flex flex-col h-full min-h-0 p-6 text-white">
        <div className="shrink-0">
          <AvatarBubble 
            title="Bist du bereit?" 
            subtitle="Fühlst du dich voll in der Situation?"
          />
        </div>

        <div className="mt-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center text-gray-400 max-w-md">
            <p>
              Wenn du bereit bist, lass uns weitermachen.
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleComplete}
          className="mt-6 shrink-0 px-6 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 transition"
        >
          Ja, ich bin bereit ✊
        </motion.button>

        {xp > 0 && (
          <p className="mt-2 shrink-0 text-sm text-gray-400">+{xp} XP</p>
        )}
      </div>
    )
  }

  // Render aktuellen Slide
  const slides = [
    renderSlide1,
    renderSlide2,
    renderSlide3,
    renderSlide4,
    renderSlide5,
  ]

  return slides[currentSlide]()
}

export default memo(SituationSetup)
