// src/features/gratitudeExercise/constants/gratitudeItems.ts

export interface GratitudeItem {
  id: string;
  category: string;
  emoji: string;
  label: string;
  description: string;
}

export const GRATITUDE_ITEMS: GratitudeItem[] = [
  // ─── MENSCHEN ───────────────────────────────────────────────
  {
    id: "g_mother",
    category: "menschen",
    emoji: "👩",
    label: "Meine Mutter",
    description: "Die Person, die dich als erste gekannt hat – noch bevor du ein Wort sagen konntest."
  },
  {
    id: "g_father",
    category: "menschen",
    emoji: "👨",
    label: "Mein Vater",
    description: "Wer er auch war oder ist – er ist ein Teil von dem, was dich ausmacht."
  },
  {
    id: "g_friend",
    category: "menschen",
    emoji: "🫂",
    label: "Ein guter Freund",
    description: "Jemand, der dich kennt – und trotzdem bleibt."
  },
  {
    id: "g_partner",
    category: "menschen",
    emoji: "❤️",
    label: "Mein Partner / meine Partnerin",
    description: "Jemand, der sich entschieden hat, mit dir durch das Leben zu gehen."
  },
  {
    id: "g_child",
    category: "menschen",
    emoji: "🧒",
    label: "Ein Kind in meinem Leben",
    description: "Kinder erinnern uns daran, dass die Welt neu gesehen werden kann."
  },
  {
    id: "g_stranger",
    category: "menschen",
    emoji: "🙂",
    label: "Ein Fremder, der nett war",
    description: "Ein Lächeln, eine Geste, ein kurzer Moment – manchmal reicht das."
  },
  {
    id: "g_teacher",
    category: "menschen",
    emoji: "📖",
    label: "Ein Lehrer / eine Lehrerin",
    description: "Jemand, der geglaubt hat, dass du mehr kannst, als du dachtest."
  },
  {
    id: "g_grandparent",
    category: "menschen",
    emoji: "🧓",
    label: "Meine Großeltern",
    description: "Menschen, die eine Welt kannten, die du nie gesehen hast – und dich trotzdem geformt haben."
  },

  // ─── TIERE ───────────────────────────────────────────────────
  {
    id: "g_dog",
    category: "tiere",
    emoji: "🐕",
    label: "Ein Hund",
    description: "Kein Tier auf der Welt ist so bedingungslos froh, dich zu sehen."
  },
  {
    id: "g_cat",
    category: "tiere",
    emoji: "🐈",
    label: "Eine Katze",
    description: "Sie wählt dich – und das bedeutet mehr als es scheint."
  },
  {
    id: "g_bird",
    category: "tiere",
    emoji: "🐦",
    label: "Ein Vogel",
    description: "Einfach fliegen können. Jeden Morgen neu anfangen."
  },
  {
    id: "g_horse",
    category: "tiere",
    emoji: "🐴",
    label: "Ein Pferd",
    description: "Ein Tier, das Stärke und Sanftheit in sich trägt – gleichzeitig."
  },
  {
    id: "g_bee",
    category: "tiere",
    emoji: "🐝",
    label: "Eine Biene",
    description: "Ohne sie kein Obst, keine Blume, kein Honig. Stille Heldin."
  },
  {
    id: "g_whale",
    category: "tiere",
    emoji: "🐋",
    label: "Ein Wal",
    description: "Das größte Wesen der Erde – und es singt."
  },

  // ─── NATUR: WASSER ────────────────────────────────────────────
  {
    id: "g_ocean",
    category: "natur_wasser",
    emoji: "🌊",
    label: "Das Meer",
    description: "Es war schon da, bevor es Menschen gab – und es wird bleiben. Ruhig und unendlich."
  },
  {
    id: "g_river",
    category: "natur_wasser",
    emoji: "🏞️",
    label: "Ein Fluss",
    description: "Er fließt immer weiter. Er hält nie an. Er findet immer einen Weg."
  },
  {
    id: "g_rain",
    category: "natur_wasser",
    emoji: "🌧️",
    label: "Regen",
    description: "Der Geruch danach. Das Geräusch auf dem Dach. Alles wird sauber."
  },
  {
    id: "g_lake",
    category: "natur_wasser",
    emoji: "🏔️",
    label: "Ein stiller See",
    description: "Manchmal spiegelt die Oberfläche den Himmel so perfekt, dass man nicht mehr weiß, wo oben ist."
  },
  {
    id: "g_waterfall",
    category: "natur_wasser",
    emoji: "💧",
    label: "Ein Wasserfall",
    description: "Kraft ohne Anstrengung. Einfach loslassen."
  },
  {
    id: "g_drinking_water",
    category: "natur_wasser",
    emoji: "🚰",
    label: "Sauberes Wasser",
    description: "Milliarden Menschen haben es nicht. Du kannst es einfach aufdrehen."
  },

  // ─── NATUR: BERGE & ERDE ─────────────────────────────────────
  {
    id: "g_mountain",
    category: "natur_berge",
    emoji: "🏔️",
    label: "Ein Berg",
    description: "Er stand schon da, als deine Urgroßeltern geboren wurden. Er wird noch da sein."
  },
  {
    id: "g_forest",
    category: "natur_berge",
    emoji: "🌲",
    label: "Ein Wald",
    description: "Tausende Lebewesen in einem einzigen Moment. Stille, die atmet."
  },
  {
    id: "g_sunrise",
    category: "natur_berge",
    emoji: "🌅",
    label: "Ein Sonnenaufgang",
    description: "Jeden Tag neu. Unabhängig davon, wie der gestrige war."
  },
  {
    id: "g_sunset",
    category: "natur_berge",
    emoji: "🌇",
    label: "Ein Sonnenuntergang",
    description: "Der Himmel malt jeden Abend ein anderes Bild. Nur für ein paar Minuten."
  },
  {
    id: "g_earth",
    category: "natur_berge",
    emoji: "🌍",
    label: "Die Erde",
    description: "Ein blauer Punkt im All. Das einzige Zuhause, das wir kennen."
  },
  {
    id: "g_stars",
    category: "natur_berge",
    emoji: "✨",
    label: "Der Sternenhimmel",
    description: "Manche dieser Sterne existieren nicht mehr. Ihr Licht reist trotzdem noch zu dir."
  },

  // ─── PFLANZEN ─────────────────────────────────────────────────
  {
    id: "g_flower",
    category: "pflanzen",
    emoji: "🌸",
    label: "Eine Blume",
    description: "Sie blüht, ohne jemanden beeindrucken zu wollen."
  },
  {
    id: "g_tree",
    category: "pflanzen",
    emoji: "🌳",
    label: "Ein alter Baum",
    description: "Jahrzehnte der Stille. Verwurzelt, egal wie stark der Wind war."
  },
  {
    id: "g_grass",
    category: "pflanzen",
    emoji: "🌿",
    label: "Gras unter meinen Füßen",
    description: "Barfuß. Einfach spüren, dass du auf der Erde stehst."
  },
  {
    id: "g_fruit",
    category: "pflanzen",
    emoji: "🍎",
    label: "Frisches Obst",
    description: "Ein Baum hat Monate gearbeitet – nur damit du einen einzigen Bissen nehmen kannst."
  },
  {
    id: "g_herbs",
    category: "pflanzen",
    emoji: "🌱",
    label: "Heilkräuter",
    description: "Die Natur hat Antworten auf Fragen, die wir noch nicht gestellt haben."
  },

  // ─── KÖRPER & ORGANE ──────────────────────────────────────────
  {
    id: "g_heart",
    category: "koerper",
    emoji: "🫀",
    label: "Mein Herz",
    description: "100.000 Schläge pro Tag. Kein Urlaub. Keine Pause. Nur für dich."
  },
  {
    id: "g_lungs",
    category: "koerper",
    emoji: "🫁",
    label: "Meine Lungen",
    description: "Sie holen das Lebensnotwendige herein – und lassen los, was nicht mehr gebraucht wird."
  },
  {
    id: "g_eyes",
    category: "koerper",
    emoji: "👁️",
    label: "Meine Augen",
    description: "Sie nehmen täglich Millionen von Farben, Formen und Gesichtern auf. Einfach so."
  },
  {
    id: "g_hands",
    category: "koerper",
    emoji: "🤲",
    label: "Meine Hände",
    description: "Sie bauen, streicheln, schreiben, halten. Sie sind dein Werkzeug und dein Geschenk."
  },
  {
    id: "g_legs",
    category: "koerper",
    emoji: "🦵",
    label: "Meine Beine",
    description: "Sie tragen dich – jeden Tag, ohne Dank."
  },
  {
    id: "g_brain",
    category: "koerper",
    emoji: "🧠",
    label: "Mein Gehirn",
    description: "Es verarbeitet Millionen Signale pro Sekunde. Es schützt dich, träumt für dich, erinnert sich."
  },
  {
    id: "g_gut",
    category: "koerper",
    emoji: "🌀",
    label: "Mein Bauchgefühl",
    description: "Dein zweites Gehirn. Es weiß oft schon, bevor du es weißt."
  },
  {
    id: "g_immune",
    category: "koerper",
    emoji: "🛡️",
    label: "Mein Immunsystem",
    description: "Es kämpft täglich für dich – lautlos, unsichtbar, unermüdlich."
  },
  {
    id: "g_sleep",
    category: "koerper",
    emoji: "😴",
    label: "Schlaf",
    description: "Jede Nacht repariert sich dein Körper selbst. Du musst nur loslassen."
  },

  // ─── KLEINE DINGE ─────────────────────────────────────────────
  {
    id: "g_coffee",
    category: "kleine_dinge",
    emoji: "☕",
    label: "Mein Morgenkaffee",
    description: "Dieser eine Moment bevor der Tag beginnt. Warm. Still. Nur du."
  },
  {
    id: "g_shower",
    category: "kleine_dinge",
    emoji: "🚿",
    label: "Eine warme Dusche",
    description: "Warmes Wasser. Einfach da. Ein Luxus, der sich wie Selbstverständlichkeit anfühlt."
  },
  {
    id: "g_bed",
    category: "kleine_dinge",
    emoji: "🛏️",
    label: "Mein Bett",
    description: "Ein sicherer Ort. Jeden Abend wartet er auf dich."
  },
  {
    id: "g_music",
    category: "kleine_dinge",
    emoji: "🎵",
    label: "Ein Lied, das mich berührt",
    description: "Manchmal trifft eine Melodie genau das, wofür du keine Worte hast."
  },
  {
    id: "g_book",
    category: "kleine_dinge",
    emoji: "📚",
    label: "Ein gutes Buch",
    description: "Jemand hat sein ganzes Leben in Worte gegossen – damit du es in ein paar Stunden erleben kannst."
  },
  {
    id: "g_laugh",
    category: "kleine_dinge",
    emoji: "😂",
    label: "Ein echter Lacher",
    description: "Der unkontrollierbare. Der, bei dem der Bauch wehtut. Selten und kostbar."
  },
  {
    id: "g_food",
    category: "kleine_dinge",
    emoji: "🍽️",
    label: "Eine Mahlzeit, die ich liebe",
    description: "Essen ist Erinnerung, Wärme und Fürsorge – auf einem Teller."
  },
  {
    id: "g_sunlight",
    category: "kleine_dinge",
    emoji: "☀️",
    label: "Sonnenlicht auf meiner Haut",
    description: "Wärme von 150 Millionen Kilometern Entfernung. Kostenlos. Täglich."
  },
  {
    id: "g_silence",
    category: "kleine_dinge",
    emoji: "🤫",
    label: "Stille",
    description: "In einer lauten Welt ist Stille ein Geschenk, das man lernen muss zu empfangen."
  },
  {
    id: "g_walk",
    category: "kleine_dinge",
    emoji: "🚶",
    label: "Ein Spaziergang",
    description: "Einfach gehen. Ohne Ziel. Der Kopf wird leerer mit jedem Schritt."
  },

  // ─── FÄHIGKEITEN & EIGENSCHAFTEN ─────────────────────────────
  {
    id: "g_empathy",
    category: "faehigkeiten",
    emoji: "🫶",
    label: "Meine Empathie",
    description: "Du spürst, was andere fühlen. Das ist keine Schwäche – das ist eine Gabe."
  },
  {
    id: "g_curiosity",
    category: "faehigkeiten",
    emoji: "🔍",
    label: "Meine Neugier",
    description: "Du fragst. Du willst verstehen. Das hält dich lebendig."
  },
  {
    id: "g_resilience",
    category: "faehigkeiten",
    emoji: "💪",
    label: "Meine Widerstandskraft",
    description: "Du bist durch Dinge gegangen, die dich hätten brechen können. Du bist noch hier."
  },
  {
    id: "g_creativity",
    category: "faehigkeiten",
    emoji: "🎨",
    label: "Meine Kreativität",
    description: "Du kannst Dinge sehen, die noch nicht da sind. Das ist mehr wert als du denkst."
  },
  {
    id: "g_humor",
    category: "faehigkeiten",
    emoji: "😄",
    label: "Mein Humor",
    description: "Über sich selbst lachen können ist eine der schwersten und heilsamsten Fähigkeiten."
  },

  // ─── MOMENTE & ERINNERUNGEN ───────────────────────────────────
  {
    id: "g_childhood_memory",
    category: "erinnerungen",
    emoji: "🧸",
    label: "Eine schöne Kindheitserinnerung",
    description: "Irgendwo in dir lebt noch das Kind, das einfach glücklich sein durfte."
  },
  {
    id: "g_proud_moment",
    category: "erinnerungen",
    emoji: "🏅",
    label: "Ein Moment, auf den ich stolz bin",
    description: "Es muss nichts Großes sein. Nur etwas, das sich richtig angefühlt hat."
  },
  {
    id: "g_helped_someone",
    category: "erinnerungen",
    emoji: "🤝",
    label: "Ein Moment, wo ich jemandem geholfen habe",
    description: "Nicht aus Pflicht. Sondern weil du es wolltest. Das ist der Unterschied."
  },
  {
    id: "g_felt_free",
    category: "erinnerungen",
    emoji: "🕊️",
    label: "Ein Moment, wo ich mich frei gefühlt habe",
    description: "Vielleicht war es kurz. Vielleicht lange her. Aber du weißt, wie es sich anfühlt."
  },
  {
    id: "g_connection",
    category: "erinnerungen",
    emoji: "✨",
    label: "Ein Moment echter Verbindung",
    description: "Wenn zwei Menschen wirklich da sind – ohne Ablenkung, ohne Maske. Selten und unvergesslich."
  }
];