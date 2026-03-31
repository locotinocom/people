// src/components/inventory/AvatarView.tsx
import { useAppSelector } from "@store/hooks"
import { AVATAR_LAYER_ORDER } from "@store/slices/avatarSlice"

// zIndex pro Layer — exakt wie im Playground
const LAYER_Z_INDEX: Record<string, number> = {
  base:             0,
  bottom:           10,
  shoes:            20,
  top:              30,
  fullbody:         35,
  accessory:        40,
  hair_base:        50,
  head_base:        60,
  emotion_fullbody: 70,
  head_accessory:   75,  // ← zwischen emotion_fullbody (70) und hair_top (80)
  hair_top:         80,
}

export default function AvatarView() {
  const avatar = useAppSelector((s) => s.avatar.avatar)
  const uat = useAppSelector((s) => s.avatar.avatarImageUat)

console.log("Avatar in AvatarView:", avatar)

  if (!avatar) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Kein Avatar geladen
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-900">
      {/* Container — gleiche Proportionen wie im Playground */}
      <div className="relative h-full w-auto aspect-[340/720] overflow-hidden">
        {AVATAR_LAYER_ORDER.map((layer) => {
          const src = avatar.layers[layer]
          console.log(`Layer ${layer}:`, src)
          if (!src) return null

          return (
            <img
              key={layer}
              src={`${src}?uat=${uat}`}
              alt={layer}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{ zIndex: LAYER_Z_INDEX[layer] }}
              draggable={false}
            />
          )
        })}
      </div>
    </div>
  )
}