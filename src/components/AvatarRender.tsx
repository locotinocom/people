import { useMemo } from "react"
import clsx from "clsx"
import { useAppSelector } from "@store/hooks"
import type { ReactNode } from "react"
import { shallowEqual } from "react-redux"

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

export type Emotion =
  | "stressed"
  | "angry"
  | "guilty_ashamed"
  | "fear"
  | "sad_disappointed"
  | "neutral"
  | "happy_warm"
  | "happy_default"
  | "lol"

export type Pose = "standing" | "relaxed" | "thumbs-up" | "power-stance" | "waving"
export type Camera = "portrait" | "fullbody" | "head"
export type Variant = "default" | "bubble"

type Slot =
  | "accessory"
  | "base"
  | "bottom"
  | "emotion"
  | "hair_base"
  | "hair_top"
  | "head_accessory"
  | "head_base"
  | "shoes"
  | "top"

type Equipped = Partial<Record<Slot, string | null>>

type Props = {
  children?: ReactNode
  userId?: number
  name?: string
  emotion?: Emotion
  pose?: Pose
  camera?: Camera
  variant?: Variant
  className?: string
  onFail?: () => void
  equipped?: Equipped
}

/* ------------------------------------------------------------------ */
/* EMOTION FILE MAP                                                    */
/* ------------------------------------------------------------------ */

const EMOTION_FILE: Record<Emotion, string> = {
  stressed: "stressed",
  angry: "angry",
  guilty_ashamed: "guilty_ashamed",
  fear: "fear",
  sad_disappointed: "sad_disappointed",
  neutral: "neutral",
  happy_warm: "happy_warm",
  happy_default: "happy_default",
  lol: "lol",
}

/* ------------------------------------------------------------------ */
/* LAYER SETTINGS                                                      */
/* ------------------------------------------------------------------ */

const LAYER_ORDER: Slot[] = [
  "base",
  "hair_base",
  "head_base",
  "emotion",
  "head_accessory",
  "hair_top",
  "top",
  "bottom",
  "shoes",
  
  "accessory",
]



// Slots die optional sind – kein Fallback auf default_X
const OPTIONAL_SLOTS: Slot[] = [
  "head_accessory",
  "accessory",
  "hair_base",
  "hair_top",
  "head_base",
]

function buildLayerSrc(avatarKey: string, slot: Slot, item: string) {
  return `/avatars/${avatarKey}/${slot}/${item}.svg`
}

/**
 * Extrahiert den Dateinamen ohne .svg aus einem vollen Pfad.
 * z.B. "/avatars/eva/hair_top/default_hair_top.svg" → "default_hair_top"
 */
function extractItemFromPath(fullPath: string): string | null {
  return fullPath.split("/").pop()?.replace(".svg", "") ?? null
}

function getStandaloneEmotionFile(avatarKey: string, emotion: Emotion): string {
  switch (emotion) {
    case "lol":
      return `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_lol.svg`

    case "happy_default":
    case "happy_warm":
      return `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_smile.svg`

    case "neutral":
    case "stressed":
    case "angry":
    case "guilty_ashamed":
    case "fear":
    case "sad_disappointed":
    default:
      return `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_default.svg`
  }
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export default function AvatarRender({
  children,
  name,
  emotion = "neutral",
  pose = "standing",
  camera = "fullbody",
  variant = "default",
  className = "",
  onFail,
  equipped,
}: Props) {
  // shallowEqual verhindert Re-renders wenn sich das layers-Objekt
  // referenziell ändert, aber der Inhalt gleich bleibt
  const avatarLayers = useAppSelector(
    (s) => s.avatar.avatar?.layers ?? null,
    shallowEqual
  )
  const avatarId = useAppSelector((s) => s.avatar.avatar?.avatar_id ?? null)

  // Avatar-Key: erst name-Prop, dann aus Store, dann Fallback "eva"
  const avatarKeyRaw = (name ?? avatarId ?? "eva").toLowerCase()
  const avatarKey = avatarKeyRaw === "tim" || avatarKeyRaw === "eva" ? avatarKeyRaw : "eva"

  const isBubble = variant === "bubble"

  /* ------------------------------------------------------------ */
  /* LAYER MERGE LOGIC                                             */
  /* ------------------------------------------------------------ */

  // equipped-Objekt stabil halten: JSON-Serialisierung als Memo-Key
  // verhindert dass ein inline-Objekt {} bei jedem Render den useMemo invalidiert
  const equippedKey = equipped ? JSON.stringify(equipped) : ""

  const layers = useMemo(() => {
    if (camera === "head") {
      return [
        {
          slot: "base" as Slot,
          src: `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_base.svg`,
        },
        {
          slot: "emotion" as Slot,
          src: getStandaloneEmotionFile(avatarKey, emotion),
        },
        {
          slot: "hair_top" as Slot,
          src: `/avatars/${avatarKey}/emotions_standalone/${avatarKey}_emotion_top.svg`,
        },
      ]
    }

    return LAYER_ORDER
      .map((slot) => {
        if (slot === "emotion") {
          return { slot, src: buildLayerSrc(avatarKey, slot, EMOTION_FILE[emotion]) }
        }

        let item: string | null | undefined = equipped?.[slot]

        if (item === undefined && avatarLayers) {
          const fullPath = avatarLayers[slot as keyof typeof avatarLayers]
          item = fullPath ? extractItemFromPath(fullPath) : null
        }

        if (!item || item === "none") {
          if (OPTIONAL_SLOTS.includes(slot)) return null
          item = `default_${slot}`
        }

        return { slot, src: buildLayerSrc(avatarKey, slot, item) }
      })
      .filter(Boolean) as { slot: Slot; src: string }[]
  // equippedKey statt equipped-Objekt → stabile primitive Dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarKey, avatarLayers, equippedKey, emotion, camera])

  /* ------------------------------------------------------------ */
  /* TRANSFORMATIONS (CROP)                                        */
  /* ------------------------------------------------------------ */

  const getTransform = () => {
    switch (camera) {
      case "head":
        return "translateX(-50%) translateY(-5%) scale(1)"
      case "portrait":
        return "translateX(-50%) translateY(-15%) scale(1.6)"
      case "fullbody":
      default:
        return "translateX(-50%) scale(1)"
    }
  }

  /* ------------------------------------------------------------ */
  /* RENDERING                                                     */
  /* ------------------------------------------------------------ */

  if (pose === "waving") {
    return (
      <figure
        className={clsx(
          "relative overflow-hidden",
          isBubble ? "rounded-full" : "rounded-xl",
          className
        )}
      >
        <img
          src={`/avatars/${avatarKey}_waving.png`}
          alt="waving"
          className="w-full h-auto"
        />
      </figure>
    )
  }

  return (
    <figure
      className={clsx(
        "relative overflow-hidden w-full h-full",
        isBubble ? "rounded-full" : "rounded-xl",
        className
      )}
    >
      {layers.map((layer) => (
        <img
          key={layer.slot}
          src={layer.src}
          alt={layer.slot}
          draggable={false}
          className="absolute left-1/2 top-0 h-full w-auto max-w-none select-none pointer-events-none transition-opacity duration-300"
          style={{ transform: getTransform() }}
          onError={() => {
            console.error(`Layer failed: ${layer.src}`)
            onFail?.()
          }}
        />
      ))}

      {children && (
        <div className="relative z-20 w-full h-full">{children}</div>
      )}
    </figure>
  )
}