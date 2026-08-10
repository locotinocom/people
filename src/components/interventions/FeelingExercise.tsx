// src/components/interventions/FeelingExercise.tsx
// Intervention-Wrapper für Level 5 – "Erstes Gefühl zulassen"
// Wird von GamePlay.tsx via import.meta.glob automatisch als Template erkannt.
// Delegiert an die Feature-Komponente src/features/feelingExercise/FeelingExercise.tsx

import { memo, useCallback } from "react"
import { useReduxApi } from "@api/reduxApi"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { completeInterventionThunk } from "@store/slices/gameActionsSlice"
import { unlockTools } from "@store/slices/toolsSlice"
import { useAnimation as useAnimationContext } from "@context/AnimationContext"
import { useSlideManager } from "@context/SlideManagerContext"
import { FeelingExercise as FeelingExerciseFeature } from "../../features/feelingExercise"
import type { FeelingExerciseResult } from "../../features/feelingExercise"

// ---------------------------------------------------------------------------
// Typen (analog zu anderen Interventionen wie Grounding)
// ---------------------------------------------------------------------------

type FeelingExerciseData = {
  id: number
  xp?: number
  mode?: "level" | "standalone"
  levelNumber?: number
}

// ---------------------------------------------------------------------------
// Komponente
// ---------------------------------------------------------------------------

function FeelingExercise({ data }: { data: FeelingExerciseData }) {
  const { id, xp = 100, mode = "level", levelNumber = 5 } = data

  const dispatch = useAppDispatch()
  const api = useReduxApi()
  const slideManager = useSlideManager()
  const { start: startAnimation } = useAnimationContext()

  // opponentAnimalName aus dem Session-Profil lesen
  const opponentAnimalName = useAppSelector(
    (s) => (s.session?.profile as any)?.meta?.trigger_animal_name as string | undefined
  )

  const handleComplete = useCallback(
    async (result: FeelingExerciseResult) => {
      if (!api) return

      // 1. Alle User-Eingaben als meta.* speichern – damit höhere Level
      //    die Daten für KI-personalisierte Interventionen nutzen können.
      //    patchProfile mergt meta serverseitig (bestehende Keys bleiben erhalten).
      try {
        await api.patchProfile({
          meta: {
            feeling_situation_text: result.situationText,
            feeling_situation_timeframe: result.situationTimeframe,
            feeling_vivid_answers: result.vividAnswers,
            feeling_chosen_emotion: result.chosenEmotion,
            feeling_intensity_before: result.intensityBefore,
            feeling_intensity_after: result.intensityAfter,
            feeling_loop_count: result.loopCount,
            feeling_completed_at: result.completedAt,
          },
        })
      } catch {
        // Meta-Saving ist nicht kritisch – Fehler still ignorieren
      }

      // 2. Intervention abschließen + XP vergeben
      await dispatch(
        completeInterventionThunk({
          interventionId: id,
          xp,
          playAnimation: startAnimation,
          api,
        })
      ).unwrap()

      // 3. Tool freischalten (optimistisch)
      dispatch(unlockTools(["feeling_tool"]))

      // 4. Kurze Pause, dann weiter
      await new Promise((r) => setTimeout(r, 400))

      slideManager.goNext()
    },
    [api, id, xp, dispatch, startAnimation, slideManager]
  )

  return (
    <div className="w-full h-full overflow-hidden">
      <FeelingExerciseFeature
        mode={mode}
        levelNumber={levelNumber}
        opponentAnimalName={opponentAnimalName}
        onComplete={handleComplete}
      />
    </div>
  )
}

export default memo(FeelingExercise)
