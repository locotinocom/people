// src/features/feelingExercise/constants/emotionConfig.ts
import type { EmotionType } from "../types"

export interface EmotionConfig {
  key: EmotionType
  label: string
  color: string
  colorBg: string
  colorBorder: string
  bodyLabel: string
}

export const EMOTION_CONFIGS: EmotionConfig[] = [
  {
    key: "stressed",
    label: "Gestresst",
    color: "#E8A87C",
    colorBg: "rgba(232,168,124,0.15)",
    colorBorder: "rgba(232,168,124,0.5)",
    bodyLabel: "den Stress",
  },
  {
    key: "angry",
    label: "Wütend",
    color: "#C0392B",
    colorBg: "rgba(192,57,43,0.15)",
    colorBorder: "rgba(192,57,43,0.5)",
    bodyLabel: "die Wut",
  },
  {
    key: "guilty_ashamed",
    label: "Schuld / Scham",
    color: "#8E44AD",
    colorBg: "rgba(142,68,173,0.15)",
    colorBorder: "rgba(142,68,173,0.5)",
    bodyLabel: "die Schuld",
  },
  {
    key: "fear",
    label: "Angst",
    color: "#7FB3D3",
    colorBg: "rgba(127,179,211,0.15)",
    colorBorder: "rgba(127,179,211,0.5)",
    bodyLabel: "die Angst",
  },
  {
    key: "sad_disappointed",
    label: "Traurig",
    color: "#5D8AA8",
    colorBg: "rgba(93,138,168,0.15)",
    colorBorder: "rgba(93,138,168,0.5)",
    bodyLabel: "die Traurigkeit",
  },
  {
    key: "neutral",
    label: "Neutral",
    color: "#95A5A6",
    colorBg: "rgba(149,165,166,0.15)",
    colorBorder: "rgba(149,165,166,0.5)",
    bodyLabel: "das Gefühl",
  },
]

export const EMOTION_CONFIG_MAP: Record<EmotionType, EmotionConfig> = Object.fromEntries(
  EMOTION_CONFIGS.map((c) => [c.key, c])
) as Record<EmotionType, EmotionConfig>

export function getEmotionConfig(emotion: EmotionType): EmotionConfig {
  return EMOTION_CONFIG_MAP[emotion]
}
