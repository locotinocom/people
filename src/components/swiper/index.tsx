import { Swiper, SwiperSlide } from "swiper/react"
import { useGame } from "../../context/GameContext"
import { useCallback, useMemo, useEffect, type RefObject } from "react"
import interventionsData from "../../data/interventions.json"
import type { Intervention } from "../../types/intervention"
import { useInterventionLogic } from "./useInterventionLogic"
import { useRenderHelpers } from "./useRenderHelpers"
import { useInterventionProgress } from "./useInterventionProgress"

type Props = {
  spawnXp: (amount: number, durationOverride?: number) => Promise<void> | void
  xpTargetRef: RefObject<HTMLDivElement | null>
  diaTargetRef: RefObject<HTMLDivElement | null>
  swiperRef?: React.RefObject<any>
  setStepIndex?: (idx: number) => void
  setInitialSlide?: (idx: number) => void
}

export default function InterventionSwiper({
  spawnXp,
  swiperRef,
  setStepIndex,
  setInitialSlide,
}: Props) {
  const { level, completedInterventions } = useGame()
  const { handleSingleComplete, grantMultiXp } = useInterventionLogic(spawnXp)
  const { renderSingle, renderMultiStep } = useRenderHelpers(spawnXp)
  const { initialSlide, setProgress, resetProgress } =
    useInterventionProgress(setStepIndex, setInitialSlide)

const interventionsByLevel = interventionsData as unknown as Record<string, Intervention[]>
 console.log("alle level" + interventionsByLevel)
  const interventionsForLevel = useMemo(() => {
    const list = interventionsByLevel[String(level)] ?? []
    return list.map((item, index) => ({
      ...item,
      id: index + 1,
      order: index + 1,
      skippable: item.skippable !== false,
      
    }))
  }, [level])

  const verticalList = useMemo(
    () =>
      interventionsForLevel.filter((i) => !completedInterventions.includes(i.id!)),
    [interventionsForLevel, completedInterventions]
  )

  const handleGrantMultiXp = useCallback(
    (intervention: Intervention) => grantMultiXp(intervention),
    [grantMultiXp]
  )

  const handleSingle = useCallback(
    (intervention: Intervention) => handleSingleComplete(intervention),
    [handleSingleComplete]
  )

  useEffect(() => {
    if (swiperRef?.current?.slideTo) {
      swiperRef.current.slideTo(0, 0)
    }
    console.log(`🔁 Level ${level} geladen (${verticalList.length} Slides)`)
  }, [level])

  const slides = useMemo(
    () =>
      verticalList.map((intervention, idx) => (
        <SwiperSlide
          key={intervention.id}
          className={`!h-full overflow-hidden ${
            intervention.skippable === false ? "outer-no-swipe" : ""
          }`}
        >
          {intervention.template === "MultiStep" || intervention.type !== "single"
            ? renderMultiStep(intervention, () => handleGrantMultiXp(intervention))
            : renderSingle(intervention, () => handleSingle(intervention))}
        </SwiperSlide>
      )),
    [verticalList, renderMultiStep, renderSingle, handleGrantMultiXp, handleSingle]
  )
console.log("🧩 InterventionSwiper Render")
console.log("slides:", slides)
console.log("slides type:", Array.isArray(slides) ? "array" : typeof slides)
console.log("slides count:", Array.isArray(slides) ? slides.length : "—")

console.log("initialSlide:", initialSlide)

  return (
    <>
      <Swiper
      className="h-full w-full flex-1 bg-zinc-900"
  style={{ minHeight: "100%", height: "100%" }}
        onSwiper={(swiper) => {
          if (swiperRef) (swiperRef as any).current = swiper
        }}
        direction="vertical"
        slidesPerView={1}
       
        initialSlide={initialSlide}
        onSlideChange={(s) => setProgress(s.activeIndex)}
        noSwiping={true}
        noSwipingClass="outer-no-swipe"
        nested={true}
        observer={true}
        observeParents={true}
        watchSlidesProgress={true}
        updateOnWindowResize={false}
      >

        {slides}
      </Swiper>

      <div className="absolute bottom-2 right-2">
        <button
          onClick={() => resetProgress(swiperRef)}
          className="px-3 py-1 bg-red-600 rounded text-sm"
        >
          Neustart
        </button>
      </div>
    </>
  )
}
