// src/features/feelingExercise/types.ts

export type EmotionType =
  | "stressed"
  | "angry"
  | "guilty_ashamed"
  | "fear"
  | "sad_disappointed"
  | "neutral"

export type ExerciseMode = "level" | "standalone"

export interface SituationVividAnswers {
  timeOfDay?: string
  weather?: string
  posture?: string
  shoes?: string
  social?: string
  atmosphere?: string
}

export type FeelingExercisePhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface FeelingExerciseState {
  mode: ExerciseMode
  phase: FeelingExercisePhase
  situationText: string
  situationTimeframe: string
  vividAnswers: SituationVividAnswers
  chosenEmotion: EmotionType | null
  intensityBefore: number | null
  intensityAfter: number | null
  loopCount: number
  completed: boolean
  completedAt?: string
}

export interface FeelingExerciseResult {
  mode: ExerciseMode
  situationText: string
  situationTimeframe: string
  vividAnswers: SituationVividAnswers
  chosenEmotion: EmotionType
  intensityBefore: number
  intensityAfter: number
  loopCount: number
  completedAt: string
}

export interface FeelingExerciseProps {
  mode: ExerciseMode
  levelNumber?: number
  opponentAnimalName?: string
  onComplete?: (result: FeelingExerciseResult) => void
}
