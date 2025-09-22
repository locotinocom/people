import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import { useGame } from "../context/GameContext"
import interventionsData from "../data/interventions.json"
import { Intervention } from "../types/intervention"
import { useReward } from "../hooks/useReward"
import {
  YesNo, Choice, HoldButton, SilenceCounter, EmotionPicker, BeforeAfterScale, BurningExpectation, MultiStep
} from "./interventions"

type Props = {
  xpTargetRef: React.RefObject<HTMLDivElement>
  diaTargetRef: React.RefObject<HTMLDivElement>
}

export default function InterventionSwiper({ xpTargetRef, diaTargetRef }: Props) {
  const { level, grantReward, markInterventionDone, completedInterventions } = useGame()
  const { spawnXp, RewardParticles } = useReward(xpTargetRef, diaTargetRef)

  const interventions: Intervention[] = interventionsData as Intervention[]

  // prevent removing a just-completed multistep until user swipes vertically away
  const [pending, setPending] = useState<{ id: number | string; vIndex: number } | null>(null)
  // throttle single-step completion
  const awardingSingle = useRef<Set<number | string>>(new Set())

  const verticalList = interventions.filter(
    (i) => i.level === level && (!completedInterventions.includes(i.id) || (pending && pending.id === i.id))
  )

  const handleSingleComplete = async (intervention: Intervention) => {
    if (awardingSingle.current.has(intervention.id)) return
    awardingSingle.current.add(intervention.id)

    const xp = typeof intervention.xp === "number" ? intervention.xp : 20
 
    grantReward({ type: "xp", amount: xp })
    spawnXp(xp)
    markInterventionDone(intervention.id)

    awardingSingle.current.delete(intervention.id)
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
        // in case someone set type single but template MultiStep
        return (
          <MultiStep
            slides={intervention.props?.slides ?? []}
            successXp={intervention.xp ?? 20}
            onAllDone={async () => {
              const xp = typeof intervention.xp === "number" ? intervention.xp : 20
              
              grantReward({ type: "xp", amount: xp })
              spawnXp(xp)
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
            markInterventionDone(pending.id)
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
                  onAllDone={async () => {
                    const xp = typeof intervention.xp === "number" ? intervention.xp : 20
                 
                    grantReward({ type: "xp", amount: xp })
                     spawnXp(xp)
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

      <RewardParticles />
    </>
  )
}
