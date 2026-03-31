import { memo, useCallback, useRef, useState } from "react"
import AvatarBubble from "../../ui/AvatarBubble"

import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { completeInterventionThunk, handleActionThunk } from "@store/slices/gameActionsSlice"
import { useAnimation } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"

import BreathingCircleCore from "@tools/BreathingCircleCore"

type Lang = "de" | "en"

type PropsJson = {
  title: string
  description?: string
  mode?: "breathing_circle"
  defaultInhale?: number
  defaultHold?: number
  defaultExhale?: number
  allowUserAdjustment?: boolean
  
  duration?: number // minutes
  // optional später: presetKey, presets etc.
}

type BreathInterventionData = {
  id: number
  title: string
  question?: string
  xp?: number
  lang?: Lang
  props: PropsJson
   mode?: "intervention" | "tool"  // ← neu
}

function BreathIntervention({ data }: { data: BreathInterventionData }) {
  const { id, title: slideTitle, question, xp = 30, mode= "intervention" } = data
  const p = data.props ?? {}
  const isToolMode = mode === "tool"  // ← der Schalter

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimation()

  const avatar = useAppSelector((s) => s.session.avatar)
  const rawName = avatar?.name || "dein Begleiter"
  const avatarName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const [isCompleting, setIsCompleting] = useState(false)
  const xpFromRef = useRef<HTMLDivElement | null>(null)

  const bubbleText =
    (question && question.trim().length > 0 ? question : slideTitle).replace(/\{\{avatarName\}\}/g, avatarName)

  const onSessionComplete = useCallback(async () => {
    if (!api) return
    if (isCompleting) return
    setIsCompleting(true)

    if (import.meta.env.DEV) console.log("✅ BreathIntervention session complete -> completeInterventionThunk", { id, xp })

    // XP-Animation + API-Call + Level-Reload passieren im Thunk
    await dispatch(
      completeInterventionThunk({
        interventionId: id,
        xp,
        playAnimation: startAnimation,
        api,
      })
    )

    await dispatch(
      handleActionThunk({
        action: { type: "next", goNext: () => slideManager.goNext() },
        playAnimation: startAnimation,
        api,
      })
    )

    setIsCompleting(false)
  }, [api, isCompleting, id, xp, dispatch, startAnimation, slideManager])

  // Presets (kannst du später aus JSON liefern)
  const presets = [
    { key: "relax_406", label: "Runterfahren", inhale: 4, hold: 0, exhale: 6 },
    { key: "relax_478", label: "Entspannen", inhale: 4, hold: 7, exhale: 8 },
    { key: "box_4444", label: "Fokus", inhale: 4, hold: 4, exhale: 4 },
  ]

  return (
<div className="flex flex-col h-full min-h-0">
  {/* Header: oben, aber mit sauberem Seitenabstand */}
  <div className="shrink-0 overflow-visible pt-2 px-10">
    <AvatarBubble title={bubbleText} />
  </div>

  <div ref={xpFromRef} className="h-0 w-0" />

  {/* Content: gleicher Seitenabstand wie oben */}
  <div className="flex-1 min-h-0 overflow-y-auto mt-0 px-0 pr-0 overflow-x-hidden">
<BreathingCircleCore
  title={p.title ?? "Atemübung"}
  description={(p.description ?? "").replace(/\{\{user_name\}\}/g, avatarName)}
  defaultInhale={p.defaultInhale ?? 4}
  defaultHold={p.defaultHold ?? 0}
  defaultExhale={p.defaultExhale ?? 6}
  
  /* --- Nutze deine MOCK_MODE Variable --- */
  durationMinutes={import.meta.env.VITE_MOCK_MODE === "true" ? (1 / 60) : (p.duration ?? 1)} 
  /* -------------------------------------- */
allowUserAdjustment={isToolMode} 
 // allowUserAdjustment={p.allowUserAdjustment ?? true}
    
    presets={isToolMode ? presets : []} // ← nur im Tool-Modus

  audio={{}}
  onSessionComplete={onSessionComplete}
/>
  </div>
</div>

  )
}

export default memo(BreathIntervention)
