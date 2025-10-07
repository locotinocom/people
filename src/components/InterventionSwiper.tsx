import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { useGame } from "../context/GameContext"
import type { RefObject } from "react"
import interventionsData from "../data/interventions.json"
import type { Intervention } from "../types/intervention"
import MultiStep from "./interventions/MultiStep"

// 🪄 Dynamisch alle Intervention-Komponenten laden
const modules = import.meta.glob("./interventions/*.tsx", { eager: true })
const componentMap: Record<string, React.ComponentType<any>> = {}

for (const path in modules) {
  const mod: any = modules[path]
  const name = path.split("/").pop()?.replace(".tsx", "") || ""
  if (mod?.default) {
    componentMap[name] = mod.default
  }
}

type Props = {
  spawnXp: (amount: number, durationOverride?: number) => Promise<void> | void
  xpTargetRef: RefObject<HTMLDivElement | null>
  diaTargetRef: RefObject<HTMLDivElement | null>
}

export default function InterventionSwiper({ spawnXp }: Props) {
  const { level, grantReward, markInterventionDone, completedInterventions } = useGame()
  const interventions: Intervention[] = interventionsData as Intervention[]

  const [pending, setPending] = useState<{ id: number | string; vIndex: number } | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const awardingSingle = useRef<Set<number | string>>(new Set())

  // Nur aktuelle Level-Interventionen anzeigen
  const verticalList = interventions
    .filter(
      (i) =>
        i.level === level &&
        (!completedInterventions.includes(i.id) || (pending && pending.id === i.id))
    )
    .sort((a, b) => a.order - b.order)

  const handleSingleComplete = (intervention: Intervention) => {
    if (awardingSingle.current.has(intervention.id)) return
    awardingSingle.current.add(intervention.id)

    const xp = typeof intervention.xp === "number" ? intervention.xp : 0

    if (xp > 0) {
      const count = Math.min(Math.max(1, Math.floor(xp)), 200)
      const totalMs = (count - 1) * 50 + 1200
      spawnXp(xp, totalMs)
      grantReward({ type: "xp", amount: xp, meta: { duration: totalMs } })

      setTimeout(() => {
        markInterventionDone(intervention.id)
        awardingSingle.current.delete(intervention.id)
      }, totalMs)
    } else {
      // kein Reward → sofort als erledigt markieren
      markInterventionDone(intervention.id)
      awardingSingle.current.delete(intervention.id)
    }
  }

  const renderSingle = (intervention: Intervention) => {
    const rawAvatarName = localStorage.getItem("avatarName") || "dein Begleiter"
const avatarName =
  rawAvatarName.charAt(0).toUpperCase() + rawAvatarName.slice(1)


const replaceAvatarName = (value: any) => {
  if (typeof value === "string") {
    return value.replace(/\{\{avatarName\}\}/g, avatarName)
  } else if (typeof value === "object" && value !== null) {
    const result: Record<string, any> = {}
    for (const key in value) {
      result[key] = replaceAvatarName(value[key])
    }
    return result
  }
  return value
}

const props = replaceAvatarName({
  ...intervention.props,
  title: intervention.title,
  xp: intervention.xp,
  onComplete: () => handleSingleComplete(intervention),
})


    const Component = componentMap[intervention.template]
    if (!Component) {
      return (
        <div className="text-gray-400">
          ❌ Unbekanntes Template: {intervention.template}
        </div>
      )
    }
    return <Component {...props} />
  }

  return (
    <Swiper
      direction="vertical"
      slidesPerView={1}
      className="h-full w-full overflow-hidden"
      allowSlideNext={verticalList[stepIndex]?.skippable !== false} // Standard: true
      onSlideChange={(s) => {
        setStepIndex(s.activeIndex)
        if (pending && s.activeIndex !== pending.vIndex) {
          markInterventionDone(Number(pending.id))
          
          setPending(null)
        }
      }}
    >
      {verticalList.map((intervention, vIdx) => {
        const type = intervention.type ?? "single" // Default-Wert

        return (
          <SwiperSlide className="!h-full overflow-hidden" key={intervention.id}>
            {intervention.template === "MultiStep" || type !== "single" ? (
              <div className="max-h-full overflow-y-auto overflow-x-hidden flex justify-center items-center bg-zinc-900">
                <MultiStep
                  slides={intervention.props?.slides ?? []}
                  successXp={intervention.xp ?? 20}
                  onAllDone={() => {
                    const xp = typeof intervention.xp === "number" ? intervention.xp : 20
                    const count = Math.min(Math.max(1, Math.floor(xp)), 200)
                    const totalMs = (count - 1) * 50 + 1200
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
        )
      })}
    </Swiper>
  )
}
