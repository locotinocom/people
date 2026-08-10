// src/features/feelingExercise/constants/situationVividQuestions.ts
import type { SituationVividAnswers } from "../types"

export interface VividQuestion {
  id: keyof SituationVividAnswers
  question: string
  options: string[]
}

export const SITUATION_VIVID_QUESTIONS: VividQuestion[] = [
  {
    id: "timeOfDay",
    question: "Was war das für ein Tag – oder war es Nacht?",
    options: ["Morgen", "Vormittag", "Mittag", "Nachmittag", "Abend", "Nacht", "Weiß nicht mehr"],
  },
  {
    id: "weather",
    question: "Wie war das Wetter?",
    options: ["Sonnig", "Bewölkt", "Regnerisch", "Trüb", "War drinnen", "Weiß nicht mehr"],
  },
  {
    id: "posture",
    question: "Warst du während der Situation eher...",
    options: ["Gegangen", "Gestanden", "Gesessen", "Gelegen"],
  },
  {
    id: "shoes",
    question: "Hattest du Schuhe an?",
    options: ["Ja", "Nein, barfuß", "Weiß nicht mehr"],
  },
  {
    id: "social",
    question: "Warst du allein oder waren andere Menschen dabei?",
    options: ["Allein", "Mit einer Person", "Mit mehreren", "Weiß nicht mehr"],
  },
  {
    id: "atmosphere",
    question: "Wie war die Atmosphäre in dem Moment – bevor es passierte?",
    options: ["Ruhig", "Angespannt", "Laut", "Alltäglich", "Unerwartet", "Weiß nicht mehr"],
  },
]
