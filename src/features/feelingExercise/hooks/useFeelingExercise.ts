// src/features/feelingExercise/hooks/useFeelingExercise.ts
import { useCallback, useReducer } from "react"
import type {
  EmotionType,
  ExerciseMode,
  FeelingExercisePhase,
  FeelingExerciseState,
  SituationVividAnswers,
} from "../types"

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SET_PHASE"; phase: FeelingExercisePhase }
  | { type: "SET_SITUATION_TEXT"; text: string }
  | { type: "SET_SITUATION_TIMEFRAME"; timeframe: string }
  | { type: "SET_VIVID_ANSWER"; key: keyof SituationVividAnswers; value: string }
  | { type: "SET_EMOTION"; emotion: EmotionType }
  | { type: "SET_INTENSITY_BEFORE"; value: number }
  | { type: "SET_INTENSITY_AFTER"; value: number }
  | { type: "INCREMENT_LOOP" }
  | { type: "COMPLETE" }
  | { type: "NEXT_PHASE" }

function buildInitialState(mode: ExerciseMode): FeelingExerciseState {
  return {
    mode,
    phase: mode === "level" ? 0 : 1,
    situationText: "",
    situationTimeframe: "",
    vividAnswers: {},
    chosenEmotion: null,
    intensityBefore: null,
    intensityAfter: null,
    loopCount: 0,
    completed: false,
  }
}

function reducer(state: FeelingExerciseState, action: Action): FeelingExerciseState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase }

    case "NEXT_PHASE": {
      const next = (state.phase + 1) as FeelingExercisePhase
      return { ...state, phase: next }
    }

    case "SET_SITUATION_TEXT":
      return { ...state, situationText: action.text }

    case "SET_SITUATION_TIMEFRAME":
      return { ...state, situationTimeframe: action.timeframe }

    case "SET_VIVID_ANSWER":
      return {
        ...state,
        vividAnswers: { ...state.vividAnswers, [action.key]: action.value },
      }

    case "SET_EMOTION":
      return { ...state, chosenEmotion: action.emotion }

    case "SET_INTENSITY_BEFORE":
      return { ...state, intensityBefore: action.value }

    case "SET_INTENSITY_AFTER":
      return { ...state, intensityAfter: action.value }

    case "INCREMENT_LOOP":
      return { ...state, loopCount: state.loopCount + 1 }

    case "COMPLETE":
      return {
        ...state,
        completed: true,
        phase: 8,
        completedAt: new Date().toISOString(),
      }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeelingExercise(mode: ExerciseMode) {
  const [state, dispatch] = useReducer(reducer, mode, buildInitialState)

  const goToPhase = useCallback((phase: FeelingExercisePhase) => {
    dispatch({ type: "SET_PHASE", phase })
  }, [])

  const goNextPhase = useCallback(() => {
    dispatch({ type: "NEXT_PHASE" })
  }, [])

  const setSituationText = useCallback((text: string) => {
    dispatch({ type: "SET_SITUATION_TEXT", text })
  }, [])

  const setSituationTimeframe = useCallback((timeframe: string) => {
    dispatch({ type: "SET_SITUATION_TIMEFRAME", timeframe })
  }, [])

  const setVividAnswer = useCallback(
    (key: keyof SituationVividAnswers, value: string) => {
      dispatch({ type: "SET_VIVID_ANSWER", key, value })
    },
    []
  )

  const setEmotion = useCallback((emotion: EmotionType) => {
    dispatch({ type: "SET_EMOTION", emotion })
  }, [])

  const setIntensityBefore = useCallback((value: number) => {
    dispatch({ type: "SET_INTENSITY_BEFORE", value })
  }, [])

  const setIntensityAfter = useCallback((value: number) => {
    dispatch({ type: "SET_INTENSITY_AFTER", value })
  }, [])

  const incrementLoop = useCallback(() => {
    dispatch({ type: "INCREMENT_LOOP" })
  }, [])

  const complete = useCallback(() => {
    dispatch({ type: "COMPLETE" })
  }, [])

  return {
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
  }
}
