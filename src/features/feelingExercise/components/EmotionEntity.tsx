import type { CSSProperties } from "react"
import type { EmotionType } from "../types"
import { EMOTION_CONFIG_MAP } from "../constants/emotionConfig"

interface EmotionEntityProps {
  emotion: EmotionType
  intensity: number
  className?: string
}

const MIN_SIZE = 80
const MAX_SIZE = 170

function clampIntensity(value: number): number {
  return Math.min(Math.max(value, 1), 10)
}

function getEntitySize(intensity: number): number {
  const safeIntensity = clampIntensity(intensity)
  return Math.round(
    MIN_SIZE + ((safeIntensity - 1) / 9) * (MAX_SIZE - MIN_SIZE)
  )
}

function getPulseDuration(intensity: number): number {
  const safeIntensity = clampIntensity(intensity)
  return Number((2.8 - ((safeIntensity - 1) / 9) * 1.9).toFixed(2))
}

const css = `
  @keyframes emotion-entity-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.98;
    }
    50% {
      transform: scale(1.08);
      opacity: 1;
    }
  }

  @keyframes emotion-entity-morph {
    0%, 100% {
      border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
    }
    50% {
      border-radius: 60% 40% 40% 60% / 55% 60% 40% 45%;
    }
  }

  .emotion-entity-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 220px;
  }

  .emotion-entity-blob {
    position: relative;
    display: block;
    width: var(--emotion-entity-size);
    height: var(--emotion-entity-size);
    background: var(--emotion-entity-color);
    border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
    transform-origin: center;
    animation:
      emotion-entity-pulse var(--emotion-entity-pulse-duration) ease-in-out infinite,
      emotion-entity-morph calc(var(--emotion-entity-pulse-duration) * 2.2) ease-in-out infinite;
    transition: background-color 180ms ease;
  }
`

export default function EmotionEntity({ emotion, intensity, className = "" }: EmotionEntityProps) {
  const config = EMOTION_CONFIG_MAP[emotion]
  const size = getEntitySize(intensity)
  const pulseDuration = getPulseDuration(intensity)

  const entityStyle: CSSProperties = {
    ["--emotion-entity-color" as string]: config.color,
    ["--emotion-entity-size" as string]: `${size}px`,
    ["--emotion-entity-pulse-duration" as string]: `${pulseDuration}s`,
  }

  return (
    <div
      className={`emotion-entity-shell ${className}`.trim()}
      style={entityStyle}
      aria-label={config.label}
    >
      <style>{css}</style>
      <div className="emotion-entity-blob" />
    </div>
  )
}
