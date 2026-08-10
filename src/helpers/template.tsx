import React from "react";

type TemplateContext = Record<string, string | number | undefined | null>;

export type GenderedLabel = {
  male: string
  female: string
  neutral: string // Fallback für "divers", "unbekannt", NULL oder unbekannte Werte
}

/**
 * Hilfsfunktion: Pronomen basierend auf opponent_gender
 * @param gender - "male" | "female" | "neutral" | undefined/null
 * @param form - "subject" (er/sie) | "object" (ihn/sie) | "possessive" (sein/ihr)
 */
function getPronoun(
  gender: string | undefined | null,
  form: "subject" | "object" | "possessive" = "subject"
): string {
  const g = String(gender || "").toLowerCase();

  if (form === "subject") {
    if (g === "male") return "er";
    if (g === "female") return "sie";
    return "er/sie";
  }
  if (form === "object") {
    if (g === "male") return "ihn";
    if (g === "female") return "sie";
    return "ihn/sie";
  }
  if (form === "possessive") {
    if (g === "male") return "sein";
    if (g === "female") return "ihr";
    return "sein/ihr";
  }
  return "er/sie";
}

/**
 * Löst ein Label auf, das je nach Nutzer-Geschlecht unterschiedlich
 * lauten soll (z.B. "König" / "Königin" / "König/Königin").
 *
 * Erwartet die echten DB-Werte aus user_profiles.gender:
 * enum('m', 'f', 'divers', 'unbekannt') – 'divers' und 'unbekannt'
 * fallen bewusst auf 'neutral' zurück, ebenso NULL/fehlender Wert.
 *
 * Nimmt entweder einen einfachen String (unverändert zurückgegeben,
 * für Rückwärtskompatibilität mit bereits bestehenden Levels) oder
 * ein GenderedLabel-Objekt.
 */
export function resolveGenderedLabel(
  value: string | GenderedLabel,
  gender: string | number | null | undefined
): string {
  if (typeof value === "string") return value;

  const g = String(gender || "").toLowerCase();
  if (g === "m") return value.male;
  if (g === "f") return value.female;
  // 'divers', 'unbekannt', NULL, oder alles andere → neutral
  return value.neutral;
}

/**
 * Platzhalter-Syntax: {{key}} oder {{key|Fallback-Text}}
 * Der Fallback-Teil nach dem Pipe-Zeichen wird verwendet, wenn der Wert
 * unter "key" nicht im Context existiert (undefined/null) – z.B.
 * {{meta.l19_shadow_finder_dominant_label|Tyrann oder Schwächling}}.
 * Ohne "|" verhält sich der Platzhalter wie bisher.
 *
 * Wichtig: Der Fallback-Text darf selbst kein "}"-Zeichen enthalten,
 * sonst bricht die Erkennung des Platzhalter-Endes zu früh ab.
 */
const PLACEHOLDER_REGEX = /\{\{\s*[a-zA-Z0-9_.-]+(?:\s*\|[^}]*)?\s*\}\}/;
const SPLIT_REGEX = /(\{\{\s*[a-zA-Z0-9_.-]+(?:\s*\|[^}]*)?\s*\}\})/g;
const MATCH_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)(?:\s*\|([^}]*))?\s*\}\}/;
const MAX_DEPTH = 5;

/**
 * Ersetzt Platzhalter im Text für die DARSTELLUNG (Rendering).
 * Gibt ein gemischtes Array aus Strings und React-Elementen zurück.
 *
 * REKURSIV: Wenn ein aufgelöster Wert selbst wieder {{...}}-Platzhalter
 * enthält (z.B. ein gespeicherter Glaubenssatz wie
 * "Ich sollte meine {{meta.l18_violated_value}} bei {{opponent_icon_small}}
 * nicht aufgeben müssen."), wird dieser Wert erneut aufgelöst – inklusive
 * Icon-Rendering. MAX_DEPTH verhindert Endlosschleifen bei versehentlichen
 * zirkulären Referenzen zwischen meta-Feldern.
 *
 * WICHTIG: NIEMALS mit String(...) oder .join("") in einen reinen String
 * zwingen – das zerstört enthaltene <img>-Elemente. Das Array direkt als
 * JSX-Children rendern (React kann Arrays aus Strings/Elementen direkt
 * anzeigen).
 *
 * Unterstützt:
 * - {{opponent_icon}}, {{opponent_icon_small}}, {{opponent_icon_large}}
 * - {{opponent_pronoun}} → er/sie
 * - {{opponent_pronoun_object}} → ihn/sie
 * - {{opponent_pronoun_possessive}} → sein/ihr
 * - {{key|Fallback}} → Fallback-Text, falls "key" nicht im Context existiert
 * - Alle anderen Keys aus ctx (inkl. dynamischer meta.* Felder)
 */
export function applyTemplate(
  text: string,
  ctx: TemplateContext,
  _depth: number = 0
): (string | React.ReactNode)[] {
  if (!text) return [];

  const parts = text.split(SPLIT_REGEX);
  const result: (string | React.ReactNode)[] = [];

  parts.forEach((part, i) => {
    const match = part.match(MATCH_REGEX);

    if (!match) {
      if (part) result.push(part);
      return;
    }

    const key = match[1];
    const fallback = match[2]; // undefined, wenn kein "|..." angegeben wurde
    const iconPath = ctx.opponent_icon;

    // ─── Icon-Tags ───────────────────────────────────────────────────────
    if (iconPath && (key === "opponent_icon" || key === "opponent_icon_small" || key === "opponent_icon_large")) {
      let sizeClasses = "";
      let displayClass = "inline-block";

      if (key === "opponent_icon_small") {
        sizeClasses = "w-[30px] h-[30px] mx-1";
        displayClass = "inline-block align-middle";
      } else if (key === "opponent_icon_large") {
        sizeClasses = "w-[200px] h-[200px] my-6";
        displayClass = "block mx-auto";
      } else {
        sizeClasses = "w-[150px] h-[150px] my-6";
        displayClass = "inline-block";
      }

      result.push(
        <img
          key={`icon-${_depth}-${i}`}
          src={String(iconPath)}
          alt="Opponent Icon"
          className={`${displayClass} ${sizeClasses} object-contain`}
        />
      );
      return;
    }

    // ─── Pronomen-Tags ───────────────────────────────────────────────────
    if (key === "opponent_pronoun") {
      result.push(getPronoun(ctx.opponent_gender as string, "subject"));
      return;
    }
    if (key === "opponent_pronoun_object") {
      result.push(getPronoun(ctx.opponent_gender as string, "object"));
      return;
    }
    if (key === "opponent_pronoun_possessive") {
      result.push(getPronoun(ctx.opponent_gender as string, "possessive"));
      return;
    }

    // ─── Normaler Text-Platzhalter ────────────────────────────────────────
    const value = ctx[key];
    if (value === undefined || value === null) {
      if (fallback !== undefined) {
        result.push(fallback);
      } else {
        result.push(import.meta.env.DEV ? `⟦${key}?⟧` : "");
      }
      return;
    }

    const strValue = String(value);

    // REKURSION: enthält der aufgelöste Wert selbst Platzhalter, nochmal auflösen
    if (_depth < MAX_DEPTH && PLACEHOLDER_REGEX.test(strValue)) {
      result.push(...applyTemplate(strValue, ctx, _depth + 1));
      return;
    }

    result.push(strValue);
  });

  return result;
}

/**
 * Ersetzt Platzhalter für DATENWERTE, die garantiert reiner String sein
 * müssen (z.B. wenn eine Komponente wirklich keine JSX-Icons speichern
 * kann). Icon-Platzhalter werden zu einem Text-Fallback (dem lesbaren
 * Tiernamen aus opponent_animal_name statt der rohen Unicode-ID).
 *
 * Unterstützt ebenfalls die {{key|Fallback}}-Syntax.
 *
 * Hinweis: Für Glaubenssätze etc., die später mit Icon angezeigt werden
 * sollen, NICHT verwenden – dafür wird der Rohtext ungetempelt gespeichert
 * und erst bei der Anzeige über applyTemplate() aufgelöst (siehe TheWorkSelect).
 */
export function applyTemplateText(
  text: string,
  ctx: TemplateContext,
  _depth: number = 0
): string {
  if (!text) return "";

  const parts = text.split(SPLIT_REGEX);

  return parts
    .map((part) => {
      const match = part.match(MATCH_REGEX);
      if (!match) return part;

      const key = match[1];
      const fallback = match[2];

      if (key === "opponent_icon" || key === "opponent_icon_small" || key === "opponent_icon_large") {
        return String(ctx.opponent_animal_name ?? "dein Gegenüber");
      }
      if (key === "opponent_pronoun") return getPronoun(ctx.opponent_gender as string, "subject");
      if (key === "opponent_pronoun_object") return getPronoun(ctx.opponent_gender as string, "object");
      if (key === "opponent_pronoun_possessive") return getPronoun(ctx.opponent_gender as string, "possessive");

      const value = ctx[key];
      if (value === undefined || value === null) {
        return fallback !== undefined ? fallback : "";
      }
      const strValue = String(value);

      if (_depth < MAX_DEPTH && PLACEHOLDER_REGEX.test(strValue)) {
        return applyTemplateText(strValue, ctx, _depth + 1);
      }
      return strValue;
    })
    .join("");
}