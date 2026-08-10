import { useMemo } from "react"
import { useAppSelector } from "@store/hooks"
import animalsData from "@data/animals.de-en.v1.json"

type TemplateContext = Record<string, string | number | null | undefined>

/* =======================
   Tier-ID → lesbarer Name (einmalig aufgebaut, nicht pro Render)
======================= */

type AnimalItem = {
  unicode_sequence: string
  labels: { de: string; en: string }
}

const ANIMAL_NAME_LOOKUP: Record<string, string> = (
  (animalsData as { items: AnimalItem[] }).items ?? []
).reduce((acc, item) => {
  acc[item.unicode_sequence] = item.labels.de
  return acc
}, {} as Record<string, string>)

/**
 * useTemplateContext
 * Holt spezifische User- und Profil-Daten aus dem Redux-Store und bereitet
 * Pfade für Assets (wie das Gegner-Tier) vor.
 *
 * Unterstützt auch dynamische meta.* Variablen aus profile.meta,
 * damit Level 8+ Daten aus früheren Levels (z.B. {{meta.chat_reflection_l6}}) anzeigen können.
 */
export function useTemplateContext(): TemplateContext {
  const profile = useAppSelector((s) => (s as any).session?.profile)
  const user = useAppSelector((s) => (s as any).session?.user)

  const avatarName = useMemo(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("avatarName") || ""
  }, [])

  return useMemo(() => {
    const userName = profile?.name ?? ""
    const opponentId = profile?.opponent_animal ?? null

    const opponentIconPath = opponentId
      ? `/assets/animals/svg/${opponentId}.svg`
      : null

    // Lesbarer deutscher Name statt roher Unicode-ID (z.B. "1F412" → "Affe")
    const opponentAnimalName = opponentId
      ? ANIMAL_NAME_LOOKUP[opponentId] ?? "dein Gegenüber"
      : "dein Gegenüber"

    const ctx: TemplateContext = {
      user_name: userName,
      user_email: user?.email ?? "",
      avatarName: avatarName
        ? avatarName.charAt(0).toUpperCase() + avatarName.slice(1)
        : "dein Begleiter",
      opponent_animal: opponentId ?? "unbekannt",
      opponent_animal_name: opponentAnimalName, // NEU: lesbarer Name, z.B. "Affe"
      opponent_icon: opponentIconPath,
      "meta.theme": profile?.meta?.theme ?? "",
      "meta.colorScheme": profile?.meta?.colorScheme ?? "",
      "meta.fontScale": profile?.meta?.fontScale ?? "",
    }

    const meta = profile?.meta
    if (meta && typeof meta === "object") {
      for (const [key, value] of Object.entries(meta)) {
        const ctxKey = `meta.${key}`
        if (typeof value === "string" || typeof value === "number") {
          ctx[ctxKey] = value
        } else if (value === null || value === undefined) {
          ctx[ctxKey] = ""
        } else if (typeof value === "object") {
          ctx[ctxKey] = ""
        }
      }
    }

    return ctx
  }, [profile, user, avatarName])
}