// src/data/chapters.ts
//
// Spiegelt api/config/chapters.json auf der Backend-Seite.
// Bewusst als eigene Frontend-Datei statt über einen API-Call geholt,
// weil sich die Kapitel-Struktur nur selten ändert und es keinen Grund
// gibt, dafür einen Request zu machen. Bei Änderungen: hier UND in
// api/config/chapters.json anpassen.

export interface Chapter {
  id: number
  title: string
  subtitle: string
  description: string
  goal: string
  archetype: "koenig" | "krieger" | null
  icon: string
  levelRange: { start: number; end: number }
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "Ankommen",
    subtitle: "Wer bist du, und worum geht's hier eigentlich?",
    description: "Der Einstieg: Avatar, App-Mechanik, und dein persönlicher Opponent bekommt ein Symbol.",
    goal: "Du hast einen Namen, einen Avatar, und eine Person im Kopf, um die sich die nächste Zeit vieles drehen wird.",
    archetype: null,
    icon: "👋",
    levelRange: { start: 1, end: 2 },
  },
  {
    id: 2,
    title: "Das Warum",
    subtitle: "Angst, Liebe oder Konflikt?",
    description: "Ein kurzes Screening findet heraus, welcher Antrieb hinter deinem Anpassungsmuster steckt.",
    goal: "Du kennst deinen primären Auslöser (Angst / Liebe / Konfliktvermeidung) und kannst ihn benennen, wenn er auftaucht.",
    archetype: null,
    icon: "🔍",
    levelRange: { start: 3, end: 3 },
  },
  {
    id: 3,
    title: "Fundament",
    subtitle: "Körper, Gefühl, erste Konfrontation",
    description: "Bevor es an dein Muster geht, baust du die Basis: Verankerung im Körper, Zugang zu deinen Gefühlen – und eine erste, sichere Begegnung mit deinem Opponent.",
    goal: "Du hast ein Grounding-Tool, einen Zugang zu deinen Gefühlen, und weißt, was in dir passiert, wenn dein Opponent Druck macht.",
    archetype: null,
    icon: "🌱",
    levelRange: { start: 4, end: 7 },
  },
  {
    id: 4,
    title: "Glaubenssätze I",
    subtitle: "Was du glaubst, ohne es zu hinterfragen",
    description: "Der erste tiefe Blick auf die Überzeugung, die dein People-Pleasing antreibt – mit The Work nach Byron Katie.",
    goal: "Du hast einen zentralen Glaubenssatz identifiziert, ihn hinterfragt, und eine erste Umkehrung formuliert.",
    archetype: null,
    icon: "💭",
    levelRange: { start: 8, end: 9 },
  },
  {
    id: 5,
    title: "Loslassen",
    subtitle: "Was du nicht mehr brauchst",
    description: "Ein Ritual zum Loslassen alter Erwartungen, gefolgt von einer ersten kontrollierten Übung im Enttäuschen.",
    goal: "Du hast erlebt, dass 'enttäuschen' überlebbar ist – in einer sicheren, kontrollierten Umgebung.",
    archetype: null,
    icon: "🔥",
    levelRange: { start: 10, end: 12 },
  },
  {
    id: 6,
    title: "Innehalten",
    subtitle: "Eine kurze Verschnaufpause",
    description: "Bewusst langsamer: eine leichte Erholungsrunde, dazu erste spontane Einblicke in dein inneres Muster.",
    goal: "Du bist ausgeruht für den nächsten Abschnitt, und dein Subtyp-Profil füllt sich langsam im Hintergrund.",
    archetype: null,
    icon: "🌿",
    levelRange: { start: 13, end: 14 },
  },
  {
    id: 7,
    title: "Glaubenssätze II",
    subtitle: "Kosten und Nutzen gegenüberstellen",
    description: "Ein zweiter Durchgang: was hat dein Muster dich früher gekostet – und was kostet es dich heute?",
    goal: "Du siehst klar, was dein Anpassungsmuster früher gebracht hat – und was es dich jetzt kostet.",
    archetype: null,
    icon: "📊",
    levelRange: { start: 15, end: 16 },
  },
  {
    id: 8,
    title: "Werte",
    subtitle: "Was dir wirklich wichtig ist",
    description: "Weg vom reinen Pattern-Breaking, hin zu einer positiven Frage: Wofür stehst du eigentlich, wenn du nicht gerade jemandem gefallen willst?",
    goal: "Du hast deine wichtigsten Werte sortiert und einen weiteren Glaubenssatz bearbeitet, der ihnen im Weg steht.",
    archetype: null,
    icon: "🧭",
    levelRange: { start: 17, end: 18 },
  },
  {
    id: 9,
    title: "Schatten: König & Königin",
    subtitle: "Die reife Seite deiner Macht",
    description: "Shadow-Work zum König/Königin-Archetyp – wo gibst du deine Macht ab, und wo könntest du sie reif zurücknehmen?",
    goal: "Du erkennst deinen König/Königin-Schattenpol und hast ihn einmal im inneren Dialog konfrontiert.",
    archetype: "koenig",
    icon: "👑",
    levelRange: { start: 19, end: 20 },
  },
  {
    id: 10,
    title: "Inneres Muster",
    subtitle: "Die große Auswertung",
    description: "Alle kleinen Impulsfragen aus den letzten Leveln laufen hier zusammen: dein vollständiges Subtyp-Profil.",
    goal: "Du kennst dein dominantes und sekundäres Muster – und wie es sich je nach Beziehungskontext unterscheidet.",
    archetype: null,
    icon: "🧩",
    levelRange: { start: 21, end: 21 },
  },
  {
    id: 11,
    title: "Schatten: Krieger",
    subtitle: "Die reife Seite deiner Kraft",
    description: "Shadow-Work zum Krieger-Archetyp – wo genau verlierst du deine Kraft, und wo könntest du sie reif einsetzen?",
    goal: "Du erkennst deinen Krieger-Schattenpol und hast ihn einmal im inneren Dialog konfrontiert.",
    archetype: "krieger",
    icon: "⚔️",
    levelRange: { start: 22, end: 23 },
  },
  {
    id: 12,
    title: "Inner Child",
    subtitle: "Das Kind, das gelernt hat, sich anzupassen",
    description: "Der bisher persönlichste Abschnitt: eine direkte Begegnung mit dem inneren Kind, das den Grundstein für dein Muster gelegt hat.",
    goal: "Du hast dein inneres Kind identifiziert, seinem Bedürfnis zugehört, und ihm eine erwachsene Antwort gegeben.",
    archetype: null,
    icon: "🌱",
    levelRange: { start: 24, end: 24 },
  },
]

/** Findet das Kapitel, zu dem ein gegebenes Level gehört (oder null, falls noch keinem zugeordnet). */
export function getChapterForLevel(level: number): Chapter | null {
  return CHAPTERS.find((c) => level >= c.levelRange.start && level <= c.levelRange.end) ?? null
}
