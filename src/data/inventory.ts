// src/data/inventory.ts

// Technische Keys (aus DB)
export const INVENTORY_CATEGORIES = [
  "hair",
  "glasses",
  "headwear",
  "top",
  "outfit",
  "bottom",
  "footwear",
] as const

// UI Labels für die Kategorie-Anzeige
export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  hair: "Frisuren",
  glasses: "Brillen",
  headwear: "Kopfbedeckungen",
  top: "Oberteile",
  outfit: "Outfits",
  bottom: "Hosen",
  footwear: "Schuhe",
}
