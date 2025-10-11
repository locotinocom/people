import { Swiper, SwiperSlide } from "swiper/react"
import { useGame } from "../../context/GameContext"
import { useCallback, useMemo, type RefObject } from "react"
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

  if (import.meta.env.DEV) {
    console.group("🌀 InterventionSwiper render")
    console.time("render-time")
    console.log("Props:", { spawnXp, swiperRef, setStepIndex, setInitialSlide })
  }

  const interventions: Intervention[] = useMemo(
    () =>
      (interventionsData as Intervention[]).map((item, index) => ({
        ...item,
        id: index + 1,
        order: index + 1,
        skippable: item.skippable !== false,
      })),
    []
  )

  const verticalList = useMemo(
    () =>
      interventions
        .filter((i) => i.level === level && !completedInterventions.includes(i.id!))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [interventions, level, completedInterventions]
  )

  const handleGrantMultiXp = useCallback(
    (intervention: Intervention) => grantMultiXp(intervention),
    [grantMultiXp]
  )

  const handleSingle = useCallback(
    (intervention: Intervention) => handleSingleComplete(intervention),
    [handleSingleComplete]
  )

  const slides = useMemo(
    () =>
      verticalList.map((intervention, idx) => {
        const nonSwipeClass = intervention.skippable ? "" : "swiper-no-swiping"

        if (import.meta.env.DEV) {
          console.log(
            `${intervention.skippable ? "➡️" : "🚫"} Slide "${intervention.title}" [#${idx}] ${
              intervention.skippable ? "skippable" : "NOT skippable"
            }`
          )
        }

        return (
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
        )
      }),
    [verticalList, renderMultiStep, renderSingle, handleGrantMultiXp, handleSingle]
  )

  if (import.meta.env.DEV) {
    console.timeEnd("render-time")
    console.groupEnd()
  }

  return (
    <>
      <Swiper
        onSwiper={(swiper) => {
          if (swiperRef) (swiperRef as any).current = swiper
          if (import.meta.env.DEV) {
            const cur = verticalList[swiper.activeIndex]
            console.log(
              `${cur?.skippable !== false ? "➡️" : "🚫"} Initial slide "${cur?.title}" [${
                swiper.activeIndex
              }]`
            )
          }
        }}
        direction="vertical"
        slidesPerView={1}
        className="h-full w-full overflow-hidden"
        initialSlide={initialSlide}
        onSlideChange={(s) => {
          const current = verticalList[s.activeIndex]
          if (import.meta.env.DEV) {
            console.log(
              `${current?.skippable !== false ? "➡️" : "🚫"} SlideChange "${
                current?.title
              }" [#${s.activeIndex}]`
            )
          }
          setProgress(s.activeIndex)
        }}
        noSwiping={true}
        noSwipingClass="outer-no-swipe"
        nested={true}
        virtual={false}
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
