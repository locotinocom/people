// src/features/feelingExercise/hooks/useFeelingLoop.ts
// Steuert die Loop-Logik nach der Re-Skalierung (Phase 7)

const MAX_LOOPS = 3
const INTENSITY_THRESHOLD = 3

export interface LoopDecision {
  shouldLoop: boolean
  isMaxLoopsReached: boolean
  message: string
}

export function evaluateLoop(
  intensityAfter: number,
  loopCount: number
): LoopDecision {
  const isMaxLoopsReached = loopCount >= MAX_LOOPS

  if (isMaxLoopsReached) {
    return {
      shouldLoop: false,
      isMaxLoopsReached: true,
      message:
        "Du hast heute schon viel geleistet. Das reicht für jetzt.",
    }
  }

  if (intensityAfter > INTENSITY_THRESHOLD) {
    return {
      shouldLoop: true,
      isMaxLoopsReached: false,
      message:
        "Das Gefühl ist noch da – das ist völlig okay. Lass uns nochmal einen Moment dabei bleiben.",
    }
  }

  return {
    shouldLoop: false,
    isMaxLoopsReached: false,
    message: "",
  }
}
