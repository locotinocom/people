// src/features/feelingExercise/constants/feelingBubbleTexts.ts
import type { EmotionType } from "../types"

export const FEELING_BUBBLE_TEXTS: Record<string, string[]> = {
  stressed: [
    "Atme einfach.",
    "Du musst jetzt nichts lösen.",
    "Spür, wo der Stress im Körper sitzt.",
    "Schultern, Kiefer, Bauch – wo hältst du die Anspannung?",
    "Es ist okay, gestresst zu sein.",
    "Lass die Anspannung einfach da sein.",
    "Du bist hier sicher.",
  ],
  angry: [
    "Lass die Energie da sein.",
    "Wut zeigt dir, was dir wichtig ist.",
    "Du musst nichts damit machen.",
    "Wo im Körper spürst du die Wut?",
    "Brust, Arme, Kiefer?",
    "Bleib einfach dabei.",
    "Wut darf da sein.",
  ],
  guilty_ashamed: [
    "Du darfst Fehler gemacht haben.",
    "Schuld zeigt, dass du Werte hast.",
    "Bleib sanft mit dir.",
    "Wo spürst du das im Körper?",
    "Es ist okay, das zu fühlen.",
    "Du bist mehr als dieser Moment.",
    "Scham braucht keine Strafe.",
  ],
  fear: [
    "Du bist gerade sicher.",
    "Bleib beim Gefühl, nicht beim Gedanken.",
    "Wo im Körper sitzt die Angst?",
    "Dein Körper passt auf dich auf.",
    "Atme sanft.",
    "Angst darf da sein.",
    "Du überlebst dieses Gefühl.",
  ],
  sad_disappointed: [
    "Lass die Schwere da sein.",
    "Du darfst dich traurig fühlen.",
    "Wo spürst du die Traurigkeit im Körper?",
    "Brust? Kehle? Bauch?",
    "Tränen dürfen kommen.",
    "Du musst das jetzt nicht lösen.",
    "Traurigkeit ist kein Fehler.",
    "Wir überleben das.",
  ],
  neutral: [
    "Nimm wahr, was da ist.",
    "Vielleicht ist da mehr als Neutralität.",
    "Spür einfach in den Körper.",
    "Was nimmst du wahr?",
    "Kein Druck.",
    "Bleib bei dir.",
  ],
  
  // ERWEITERUNG: Die tieferen Primäremotionen für das Wut-Coaching
  helplessness: [
    "Atme in die Ohnmacht hinein.",
    "Du musst gerade nichts kontrollieren oder erzwingen.",
    "Die Hilflosigkeit darf für diesen Moment einfach da sein.",
    "Spür den Körper. Lass den Widerstand gegen das Gefühl los.",
    "Du bist trotz dieser Lähmung absolut sicher.",
  ],
  shame: [
    "Du bist vollkommen okay, genau so wie du bist.",
    "Scham verzieht sich, wenn wir sie liebevoll anblicken.",
    "Atme durch die Hitze oder den Druck hindurch.",
    "Dieses Gefühl definiert nicht deinen Wert.",
    "Sanft einatmen, sanft ausatmen. Du darfst da sein."
  ],
  guilty: [
    "Es ist okay. Du hast nach bestem Wissen gehandelt.",
    "Spüre den Druck im Körper, ohne dich selbst zu verurteilen.",
    "Atme tief ein und erlaube dir, weich zu werden.",
    "Fehler machen gehört zum Menschsein dazu."
  ],
  despair: [
    "Lass die Schwere und die Tränen ruhig zu.",
    "Du musst die Situation in diesem Moment nicht reparieren.",
    "Atme einfach weiter. Schritt für Schritt.",
    "Auch diese tiefe Verzweiflung zieht wieder vorbei."
  ],
  hopelessness: [
    "Erlaube der Leere, für einen Moment da zu sein.",
    "Du musst jetzt keine Antworten oder Lösungen parat haben.",
    "Atme sanft in den Bauch. Du bist hier geborgen.",
    "Gib den Kampf für einen kurzen Augenblick einfach ab."
  ]
}