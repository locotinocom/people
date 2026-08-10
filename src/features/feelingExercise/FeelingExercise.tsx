// src/features/feelingExercise/FeelingExercise.tsx
// Haupt-Orchestrator – steuert alle Phasen der Fühl-Übung
import { useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import type { FeelingExerciseProps, FeelingExerciseResult } from "./types"
import { useFeelingExercise } from "./hooks/useFeelingExercise"

// Phasen
import PhaseIntro from "./phases/PhaseIntro"
import PhaseBreathing from "./phases/PhaseBreathing"
import PhaseSituationSetup from "./phases/PhaseSituationSetup"
import PhaseSituationVivid from "./phases/PhaseSituationVivid"
import PhaseEmotionSelect from "./phases/PhaseEmotionSelect"
import PhaseIntensityBefore from "./phases/PhaseIntensityBefore"
import PhaseFeelingProcess from "./phases/PhaseFeelingProcess"
import PhaseIntensityAfter from "./phases/PhaseIntensityAfter"
import PhaseCompletion from "./phases/PhaseCompletion"

export default function FeelingExercise({
  mode,
  levelNumber = 5,
  opponentAnimalName,
  onComplete,
}: FeelingExerciseProps) {
  const {
    state,
    goToPhase,
    goNextPhase,
    setSituationText,
    setSituationTimeframe,
    setVividAnswer,
    setEmotion,
    setIntensityBefore,
    setIntensityAfter,
    incrementLoop,
    complete,
  } = useFeelingExercise(mode)

  // Phase 8 abschließen und Ergebnis zurückgeben
  const handleDone = useCallback(() => {
    complete()
    if (
      state.chosenEmotion &&
      state.intensityBefore !== null &&
      state.intensityAfter !== null
    ) {
      const result: FeelingExerciseResult = {
        mode,
        situationText: state.situationText,
        situationTimeframe: state.situationTimeframe,
        vividAnswers: state.vividAnswers,
        chosenEmotion: state.chosenEmotion,
        intensityBefore: state.intensityBefore,
        intensityAfter: state.intensityAfter,
        loopCount: state.loopCount,
        completedAt: new Date().toISOString(),
      }
      onComplete?.(result)
    } else {
      onComplete?.({
        mode,
        situationText: state.situationText,
        situationTimeframe: state.situationTimeframe,
        vividAnswers: state.vividAnswers,
        chosenEmotion: state.chosenEmotion ?? "neutral",
        intensityBefore: state.intensityBefore ?? 0,
        intensityAfter: state.intensityAfter ?? 0,
        loopCount: state.loopCount,
        completedAt: new Date().toISOString(),
      })
    }
  }, [complete, state, mode, onComplete])

  // Loop: zurück zu Phase 6 (Fühl-Prozess)
  const handleLoop = useCallback(() => {
    incrementLoop()
    goToPhase(6)
  }, [incrementLoop, goToPhase])

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Phase 0 – Intro (nur Level-Modus) */}
        {state.phase === 0 && mode === "level" && (
          <div key="phase-0" className="w-full h-full">
            <PhaseIntro
              levelNumber={levelNumber}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 1 – Atemübung */}
        {state.phase === 1 && (
          <div key="phase-1" className="w-full h-full">
            <PhaseBreathing onComplete={goNextPhase} />
          </div>
        )}

        {/* Phase 2 – Situation auswählen */}
        {state.phase === 2 && (
          <div key="phase-2" className="w-full h-full">
            <PhaseSituationSetup
              situationText={state.situationText}
              situationTimeframe={state.situationTimeframe}
              onSituationText={setSituationText}
              onSituationTimeframe={setSituationTimeframe}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 3 – Situation lebendig machen */}
        {state.phase === 3 && (
          <div key="phase-3" className="w-full h-full">
            <PhaseSituationVivid
              situationText={state.situationText}
              vividAnswers={state.vividAnswers}
              onAnswer={setVividAnswer}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 4 – Emotion auswählen */}
        {state.phase === 4 && (
          <div key="phase-4" className="w-full h-full">
            <PhaseEmotionSelect
              chosenEmotion={state.chosenEmotion}
              onSelect={setEmotion}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 5 – Intensität vor dem Fühlen */}
        {state.phase === 5 && state.chosenEmotion && (
          <div key="phase-5" className="w-full h-full">
            <PhaseIntensityBefore
              emotion={state.chosenEmotion}
              intensity={state.intensityBefore}
              onIntensity={setIntensityBefore}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 6 – Geführter Fühl-Prozess */}
        {state.phase === 6 && state.chosenEmotion && (
          <div key={`phase-6-loop-${state.loopCount}`} className="w-full h-full">
            <PhaseFeelingProcess
              emotion={state.chosenEmotion}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 7 – Re-Skalierung + Loop */}
        {state.phase === 7 && state.chosenEmotion && (
          <div key="phase-7" className="w-full h-full">
            <PhaseIntensityAfter
              emotion={state.chosenEmotion}
              loopCount={state.loopCount}
              onIntensity={setIntensityAfter}
              onLoop={handleLoop}
              onComplete={goNextPhase}
            />
          </div>
        )}

        {/* Phase 8 – Abschluss */}
        {state.phase === 8 && (
          <div key="phase-8" className="w-full h-full">
            <PhaseCompletion
              mode={mode}
              opponentAnimalName={opponentAnimalName}
              onDone={handleDone}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
