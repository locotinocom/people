import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
//import "swiper/css"
import { useGame } from "../context/GameContext"
import type { RefObject } from "react"
import interventionsData from "../data/interventions.json"
import type { Intervention } from "../types/intervention"
import {
  YesNo, Choice, HoldButton, SilenceCounter, EmotionPicker, BeforeAfterScale, BurningExpectation, MultiStep
} from "./interventions"

type Props = {
  // 🔑 spawnXp von oben reinreichen (Partikel-Schicht bleibt in App gemountet)
  spawnXp: (amount: number, durationOverride?: number) => Promise<void> | void
  xpTargetRef: RefObject<HTMLDivElement | null>
  diaTargetRef: RefObject<HTMLDivElement | null>
}




export default function InterventionSwiper({ spawnXp }: Props) {
  const { level, grantReward, markInterventionDone, completedInterventions } = useGame()

  const interventions: Intervention[] = interventionsData as Intervention[]

  // prevent removing a just-completed multistep until user swipes vertically away
  const [pending, setPending] = useState<{ id: number | string; vIndex: number } | null>(null)
  // throttle single-step completion
  const awardingSingle = useRef<Set<number | string>>(new Set())

  const verticalList = interventions.filter(
    (i) => i.level === level && (!completedInterventions.includes(i.id) || (pending && pending.id === i.id))
  )

  const handleSingleComplete = (intervention: Intervention) => {
    if (awardingSingle.current.has(intervention.id)) return
    awardingSingle.current.add(intervention.id)

    const xp = typeof intervention.xp === "number" ? intervention.xp : 20
    const count = Math.min(Math.max(1, Math.floor(xp)), 200)
    const totalMs = ((count - 1) * 50) + 1200

    // 🚀 Partikel + Balken parallel, mit identischer Dauer
    spawnXp(xp, totalMs)
    grantReward({ type: "xp", amount: xp, meta: { duration: totalMs } })

    // Single-Step: erst nach Animation „fertig“
    setTimeout(() => {
      markInterventionDone(intervention.id)
      awardingSingle.current.delete(intervention.id)
    }, totalMs)
  }

  const renderSingle = (intervention: Intervention) => {
    const props = {
      ...intervention.props,
      title: intervention.title,
      xp: intervention.xp,
      onComplete: () => handleSingleComplete(intervention),
    } as any

    switch (intervention.template) {
      case "YesNo": return <YesNo {...props} />
      case "Choice": return <Choice {...props} />
      case "HoldButton": return <HoldButton {...props} />
      case "SilenceCounter": return <SilenceCounter {...props} />
      case "EmotionPicker": return <EmotionPicker {...props} />
      case "BeforeAfterScale": return <BeforeAfterScale {...props} />
      case "BurningExpectation": return <BurningExpectation {...props} />
      case "MultiStep": {
        // Fallback, falls jemand type=single gesetzt hat
        return (
          <MultiStep
            slides={intervention.props?.slides ?? []}
            successXp={intervention.xp ?? 20}
            onAllDone={() => {
              const xp = typeof intervention.xp === "number" ? intervention.xp : 20
              const count = Math.min(Math.max(1, Math.floor(xp)), 200)
              const totalMs = ((count - 1) * 50) + 1200

              spawnXp(xp, totalMs)
              grantReward({ type: "xp", amount: xp, meta: { duration: totalMs } })
              setPending({ id: intervention.id, vIndex: 0 })
            }}
          />
        )
      }
      default: return <div className="text-gray-400">Unbekanntes Template: {intervention.template}</div>
    }
  }

  return (
    <>
      <Swiper
        direction="vertical"
        slidesPerView={1}
        className="h-full w-full"
        onSlideChange={(s) => {
          if (pending && s.activeIndex !== pending.vIndex) {
            markInterventionDone(Number(pending.id))
            setPending(null)
          }
        }}
      >
        {verticalList.map((intervention, vIdx) => (
          <SwiperSlide key={intervention.id}>
            {intervention.template === "MultiStep" || intervention.type !== "single" ? (
              <div className="h-full">
                <MultiStep
                  slides={intervention.props?.slides ?? []}
                  successXp={intervention.xp ?? 20}
                  onAllDone={() => {
                    const xp = typeof intervention.xp === "number" ? intervention.xp : 20
                    const count = Math.min(Math.max(1, Math.floor(xp)), 200)
                    const totalMs = ((count - 1) * 50) + 1200

                    spawnXp(xp, totalMs)
                    grantReward({ type: "xp", amount: xp, meta: { duration: totalMs } })
                    setPending({ id: intervention.id, vIndex: vIdx })
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-zinc-800">
                {renderSingle(intervention)}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {/* ⚠️ entfernt: <RewardParticles /> lebt jetzt stabil in App.tsx */}
    </>
  )
}
