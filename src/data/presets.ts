// src/data/avatars/presets/presets.ts
import presets from "./all_presets.json"

// Struktur: presets[emotion]["1"][blendShapeName] = number
export default presets as Record<
  string,
  Record<string, Record<string, number>>
>
