import { useMemo } from "react"
import { useAppSelector } from "@store/hooks"

type TemplateContext = Record<string, string | number | null | undefined>

/**
 * useTemplateContext
 * Holt spezifische User- und Profil-Daten aus dem Redux-Store und bereitet
 * Pfade für Assets (wie das Gegner-Tier) vor.
 */
export function useTemplateContext(): TemplateContext {
  // Zugriff auf den Session-Store (Passe die Pfade ggf. an deine Store-Struktur an)
  const profile = useAppSelector((s) => (s as any).session?.profile)
  const user = useAppSelector((s) => (s as any).session?.user)

  // Memo für den Avatar-Namen aus dem LocalStorage
  const avatarName = useMemo(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("avatarName") || ""
  }, [])

  return useMemo(() => {
    // 1. Daten-Vorbereitung
    const userName = profile?.name ?? ""
    const opponentId = profile?.opponent_animal ?? null
    
    // 2. Pfad-Generierung für das Tier-SVG
    // Entspricht: public/assets/animals/svg/ID.svg
    const opponentIconPath = opponentId 
      ? `/assets/animals/svg/${opponentId}.svg` 
      : null

    const ctx: TemplateContext = {
      // User & Profil Basis-Daten
      user_name: userName,
      user_email: user?.email ?? "",
      
      // Begleiter-Name (erster Buchstabe groß)
      avatarName: avatarName
        ? avatarName.charAt(0).toUpperCase() + avatarName.slice(1)
        : "dein Begleiter",

      // Gegner-Tier Daten
      opponent_animal: opponentId ?? "unbekannt",
      
      // ✅ Das ist der Key für dein Icon im Template
      opponent_icon: opponentIconPath,

      // Meta-Daten für Styles/Themes
      "meta.theme": profile?.meta?.theme ?? "",
      "meta.colorScheme": profile?.meta?.colorScheme ?? "",
      "meta.fontScale": profile?.meta?.fontScale ?? "",
    }

    return ctx
  }, [profile, user, avatarName])
}