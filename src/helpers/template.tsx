import React from "react";

type TemplateContext = Record<string, string | number | undefined | null>;

/**
 * Ersetzt Platzhalter im Text. 
 * Wenn der Key 'opponent_icon' ist, wird ein <img> Tag zurückgegeben.
 */
// utils/template.tsx


export function applyTemplate(
  text: string,
  ctx: TemplateContext
): (string | React.ReactNode)[] {
  if (!text) return [];

  const parts = text.split(/(\{\{\s*[a-zA-Z0-9_.-]+\s*\}\})/g);

  return parts.map((part, i) => {
    const match = part.match(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/);
    
    if (match) {
      const key = match[1];
      const iconPath = ctx.opponent_icon;

      // Prüfen, ob es einer unserer Icon-Tags ist
      if (iconPath && (key === "opponent_icon" || key === "opponent_icon_small" || key === "opponent_icon_large")) {
        
        let sizeClasses = "";
        let displayClass = "inline-block"; // Standardmäßig inline

        if (key === "opponent_icon_small") {
          // Klein: 30x30px
          sizeClasses = "w-[30px] h-[30px] mx-1";
          displayClass = "inline-block align-middle";
        } else if (key === "opponent_icon_large") {
          // Groß: 200x200px
          sizeClasses = "w-[200px] h-[200px] my-6";
          displayClass = "block mx-auto"; // Zentriert in eigener Zeile
        } else {
          // Standard: {{opponent_icon}} 
          // Hier lassen wir die Größe weg, damit die umschließende Komponente (z.B. AvatarBubble) entscheidet
           sizeClasses = "w-[150px] h-[150px] my-6";
          displayClass = "inline-block";
        }

        return (
          <img
            key={`icon-${i}`}
            src={String(iconPath)}
            alt="Opponent Icon"
            className={`${displayClass} ${sizeClasses} object-contain`}
          />
        );
      }

      // Normaler Text-Platzhalter
      const value = ctx[key];
      if (value === undefined || value === null) {
        return import.meta.env.DEV ? `⟦${key}?⟧` : "";
      }
      return String(value);
    }

    return part;
  });
}