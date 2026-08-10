# People Pleasing App – Agent Mode Master Referenz

> **Status:** Final & Konsolidiert  
> **Zielgruppe:** Cline (AI Codepilot) & Backend-/Frontend-Architektur  
> **Gültigkeit:** Ab Level 14+ (Agent Mode)  
> **Beschreibung:** Dieses Dokument ist die "Single Source of Truth" für die Implementierung des Agent Mode. Es enthält alle Datenstrukturen, API-Kontexte, die vollständige Roadmap (Level 14–30) und den exakten technischen Implementierungsplan.

---

## 1. Architektur-Prinzipien & Zwei-Track-System

Die App wird ab Level 14 in zwei parallelen Tracks geführt. Das UI-Rendering bleibt im Frontend identisch; der Unterschied liegt rein in der Datenquelle und der Personalisierungstiefe.

| Merkmal | Free Track (Standard) | Agent Mode (Premium Track) |
| :--- | :--- | :--- |
| **Level-Bereich** | Level 1 – 13 (Standard) | Level 14 – 30 (Freischaltung ab Level 14) |
| **Inhalts-Typus** | Generisch, fest vordefiniert, statisch. | KI-generiert, hochgradig personalisiert auf User-Muster. |
| **Datenhaltung** | Feste JSON-Dateien direkt in der Codebase. | Dynamisch befüllte Templates, persistiert in der DB. |
| **Nutzerreise** | Linear und identisch für alle Anwender. | Adaptiv, maßgeschneidert auf Core Belief und Fortschritt. |
| **API-Kosten** | Null (rein lokale Client-Auswertung). | Variabel (wird über Rolling-Window generiert). |
| **UI-Rendering** | Identisch — der Client unterscheidet nicht. | Identisch — nutzt dieselben Basiskomponenten. |

---

## 2. Datenstruktur & Level-Parser

Um Abwärtskompatibilität für die Levels 1–13 zu garantieren, unterstützt der Parser sowohl das flache Array-Format (Legacy) als auch das erweiterte Objekt-Format der KI-Phasen (Level 14+).

### 2.1 Legacy-Format (Level 1–13)
```json
{
  "6": [
    { "id": "l6_start", "template": "Info", "level": 6 },
    { "id": "l6_main", "template": "ChatSimulationCard", "level": 6 }
  ]
}

2.2 Agent-Mode-Format (Level 14–30)
{
  "14": {
    "difficulty": 2,
    "screens": [
      { "id": "l14_start", "template": "Info", "level": 14 },
      { "id": "l14_relaxation", "template": "RelaxationPicker", "level": 14 },
      { "id": "l14_main", "template": "ShadowWorkJournalAI", "level": 14 },
      { "id": "l14_reflection", "template": "Form", "level": 14 },
      { "id": "l14_close", "template": "Info", "level": 14, "props": { "autoComplete": true } }
    ]
  }
}

2.3 TypeScript Parser-Implementierung

type Screen = { id: string; template: string; level: number; [key: string]: any };
type DifficultyScore = 1 | 2 | 3;
type LevelData = Screen[] | { difficulty: DifficultyScore; screens: Screen[] };

function parseLevel(data: LevelData): { difficulty: DifficultyScore; screens: Screen[] } {
  if (Array.isArray(data)) {
    return { difficulty: 1, screens: data }; // Fallback für Legacy-Formate
  }
  return data;
}

3. Schwierigkeitsgrade & Daily Cap System
Zum Schutz vor emotionalem Overload wird ein serverseitig validiertes Punktesystem (Daily Cap) über den User-Status in der Datenbank erzwungen.

Schwierigkeitsgrad 1 (Leicht): Ressourcenfördernd, stabilisierend, geringe Konfrontation.

Schwierigkeitsgrad 2 (Mittel): Reflexionsorientiert, moderate emotionale Aktivierung.

Schwierigkeitsgrad 3 (Schwer): Tiefenpsychologische Schatten- oder Teilarbeit, hohe emotionale Belastung.

3.1 Daily Cap Logik
Maximale Punktebegrenzung: 6 Punkte pro Kalendertag.

Nach Erreichen des Limits (Score == 6) wird eine Sperre aktiv. Erst nach Ablauf des Timestamps ist das nächste Level freigeschaltet.

Mögliche Kombinationen: 2x Level-3 // 3x Level-2 // 1x Level-3 + 1x Level-2 + 1x Level-1.

3.2 Erforderliche DB-Felder im Benutzerschema

type DailyCapState = {
  daily_score: number;           // Aktueller kumulierter Tages-Score (0–6)
  daily_score_reset_at: string;  // ISO-Timestamp des nächsten erlaubten Freischaltpunkts
};

4. Standardisierte Screen-Abfolge je Level
Jedes KI-generierte Level ab Stufe 14 muss zwingend aus folgenden fünf aufeinanderfolgenden Bildschirmen bestehen:

Intro (Info Template): Gratulation, sanfter Einstieg und transparente Zielsetzung. Personalisierte Variables werden wohldosiert eingeflochten.

RelaxationPicker (Eigenes statisches Template, skippable): Lokale, zufällige Zuweisung einer somatischen oder respiratorischen Regulationsübung. Erhält immer 0 XP.

Hauptintervention (1 oder mehrere AI-Templates): Der therapeutische Kern (z. B. ShadowWorkJournalAI). Es können auch zwei komplementäre Vorlagen verkettet werden.

Reflexion (Form Template): Standardisierte, offene Integrationsfrage (z. B. "Was hast du in deinem Körper wahrgenommen?"), entnommen aus einem vordefinierten Fragenpool. Die Antwort wird unter saveTo persistiert.

Abschluss (Info Template): Kurzes Outro mit dem Attribut "autoComplete": true, das den automatischen Abschluss triggert.

5. RelaxationPicker Spezifikationen (RelaxationPicker.tsx)
Das Template arbeitet komplett lokal und autonom ohne API-Anbindung. Es steuert einen fest codierten Pool aus 20 Übungen an:

5.1 Atemübungen (7 Varianten)
Box Breathing (breath_box): 4s Einatmen, 4s Halten, 4s Ausatmen, 4s Halten (3 Durchgänge / 48s).

4-7-8 Atmung (breath_478): 4s Einatmen, 7s Halten, 8s Ausatmen (2 Durchgänge / 38s).

Langer Ausatem (breath_long_exhale): Normal ein, doppelt so lang ausatmen zur Parasympathikus-Aktivierung (5 Zyklen / 30s).

Bauchatmung (breath_belly): Hand auflegen, ausschließlich abdominelle Hebung forcieren (5 Atemzüge / 30s).

Physiologischer Seufzer (breath_sigh): Doppelter Einatem (tief + kurz nachgesetzt), gefolgt von langem Entspannungs-Ausatem (3 Durchgänge / 30s).

Atemzählen (breath_count): Exhalationsphase von 1 bis 10 zählen; bei Fokusverlust Neustart bei 1 (40s).

Die Atempause (breath_pause): Vollständig ausatmen und die natürliche Pause bis zum nächsten Atemimpuls wertungsfrei beobachten (3 Durchgänge / 30s).

5.2 Wahrnehmungs- & Achtsamkeitsübungen (8 Varianten)
Suche Blau (perception_blue): 15 Sekunden lang wertungsfrei alle blauen Objekte im Raum scannen (20s).

Schau auf deine Hände (perception_hands): 10 Sekunden visuelle Fokussierung auf die eigene Handstruktur ohne kognitive Analyse (15s).

Drei Geräusche (perception_sounds): Augen schließen, drei auditive Reize im Umfeld isolieren und innerlich benennen (20s).

Boden spüren (perception_feet): Fußsohlenkontakt intensivieren, kurz bewusst andrücken, dann vollständig lösen (3 Durchgänge / 20s).

Temperatur wahrnehmen (perception_temperature): Thermische Zustände von Händen, Wangen und Füßen sequenziell erfassen (20s).

Schwere spüren (perception_weight): Das physische Eigengewicht an die Unterlage abgeben und Getragenwerden realisieren (20s).

5-4-3-2-1 Methode (perception_five): 5 visuelle, 4 auditive, 3 haptische, 2 olfaktorische und 1 gustatorischen Reiz bestimmen (40s).

Oberfläche ertasten (perception_texture): Eine nahegelegene Struktur berühren und Beschaffenheit explorieren (15s).

5.3 Kurzmeditation & Körperfokus (5 Varianten)
Herzaufmerksamkeit (body_organ_heart): Hand aufs Herz legen, Herzschlag oder reine Gewebewärme für 15 Sekunden fühlen (20s).

Bauchaufmerksamkeit (body_organ_belly): Hand auf den Abdomen legen, tief hineinatmen und Gewebebewegung spüren (20s).

Schultern loslassen (body_shoulders): Schultern maximal zu den Ohren ziehen, 3s halten, abrupt fallen lassen (3 Durchgänge / 20s).

Kiefer entspannen (body_jaw): Lippen leicht öffnen, Zahnreihen trennen und die Zunge schwer im Unterkiefer ablegen (15s).

Inneres Lächeln (body_smile): Minimales Lächeln aufbauen und die Mikromovements gefühlt zum Herzen senden (20s).

6. Rolling-Window-Generierung & Prompt-Architektur
Die Synchronisation zwischen Nutzerfortschritt und KI-Inhaltserstellung wird über eine 2-Level-Voraus-Pipeline geregelt.

6.1 Pipeline-Trigger
Nutzer schließt Level 13 ab -> Backend generiert Level 14 und Level 15 simultan.

Nutzer schließt Level 14 ab -> Backend generiert Level 16 (da Level 15 bereits vorliegt).

Nutzer schließt Level 15 ab -> Backend generiert Level 17, usw.

Der psychologische Kontext wächst kumulativ. Jede Generierung erhält das vollständige, aktualisierte JSON-Konstrukt des Nutzers.

6.2 Vollständiges TypeScript-Kontextschema (AgentModeContext)

type AgentModeContext = {
  // User-Stammdaten
  user_name: string;
  user_gender?: "male" | "female" | "diverse";

  // Opponent-Struktur (Gegenspieler-Profil)
  opponent_name: string;
  opponent_animal: string;
  opponent_relationship: string;      // z.B. "Mutter", "Vorgesetzter"
  opponent_gender: string;
  opponent_traits: string[];
  opponent_typical_behaviors: string[];

  // Historischer Kern-Kontext (Level 1–12)
  core_belief: string;
  core_belief_label: string;
  l3_emotion: string;
  l6_situation: string;
  l6_emotion_1: string;
  l6_thought_1: string;
  l6_impulse_1: string;
  l10_expectations: string[];
  l12_situation: string;
  l12_emotion_check: {
    emotion: string;
    intensity_before: number;
    intensity_after: number;
    loop_count: number;
  };

  // Dynamische Agent-Mode-Zusatzdaten (Inkrementelles Wachstum ab L14)
  shadow_name?: string;
  shadow_description?: string;
  inner_child_age?: number;
  inner_child_belief?: string;
  archetype_aspects?: string[];
  previous_reflections?: string[];    // Array aller Freitext-Reflexionen aus Schritt 4
  user_resistance_level?: 1 | 2 | 3 | 4 | 5; // Extrahiertes Widerstandslevel zur Prompt-Justierung

  // System-Steuerung für das LLM
  completed_levels: number[];
  current_phase: string;
  current_phase_description: string;
  available_templates: string[];
  target_level: number;
  target_difficulty: DifficultyScore;
  level_theme: string;
  level_goal: string;
};

7. Psychologische Phasen & Roadmap (Level 14–30)
Phase I: Schatten entlarven & integrieren (Level 14–17)
Schule: C.G. Jung / Schattenarbeit

Kernbotschaft: Das People-Pleasing ist kein Versagen — es ist ein Schatten-Anteil, der dich schützt. Aber er kostet dich dein echtes Leben.

Level 14 – Wer ist der Saboteur? (Diff: 2): Ersten Kontakt herstellen. KI schneidert Zusammensetzung des Saboteurs exakt auf die l6_situation zu. Template: ShadowWorkJournalAI.

Level 15 – Den Schatten benennen (Diff: 2): Externalisierung via Narrationstherapie. KI wählt Satzanfänge dynamisch basierend auf Level 14 und referenziert direkt opponent_name. Template: BeliefSystemCrackerAI.

Level 16 – Der Schwächling / Die Masochistin (Diff: 3): Schatten-Archetypen nach Moore/Gillette. Geschlechtsspezifische Trennung (Schwächling vs. Opfer/Masochistin). KI charakterisiert das Muster anhand realer Lebensbeispiele des Users. Sanfte Prompt-Rahmung zur Reduzierung von Abwehrhaltungen. Template: ValuesSorterAI + EmotionCheck.

Level 17 – Was der Schatten braucht (Diff: 3): Schattenintegration. Die KI übernimmt die Rolle des Anpassers auf Basis des historischen Profils und antwortet hochgradig immersiv im Gestalt-Stil. Template: EmptyChairRitualAI.

Phase II: Das Innere Kind (Level 18–21)
Schule: Entwicklungspsychologie / Reparenting (John Bradshaw, Alice Miller)

Kernbotschaft: Der Ursprung liegt nicht bei dem Opponent. Er liegt weiter zurück — bei einem Kind, das gelernt hat: Liebe ist an Bedingungen geknüpft.

Level 18 – Das innere Kind kennenlernen (Diff: 2): Erstkontakt & Trance-Imagination. KI deduziert das kritische Entwicklungsalter basierend auf dem core_belief. Template: InnerChildDialogueAI.

Level 19 – Die Glaubenssätze des Kindes (Diff: 2): Identifikation kindlicher Schlussfolgerungen. KI leitet die präzise kindliche Überzeugung ab und stellt sie zur Verifikation/Korrektur zur Verfügung. Template: BeliefSystemCrackerAI + SingleSelect.

Level 20 – Dialog mit dem inneren Kind (Diff: 3): Reparenting und interaktiver Dialogfluss mit EMDR-Elementen. Das Kind spricht hochspezifisch über die Ängste bezüglich opponent_name. Template: InnerChildDialogueAI.

Level 21 – Das innere Kind begleiten (Diff: 2): Verankerung langfristiger Fürsorge (Selbstmitgefühl nach Kristin Neff). KI generiert maßgeschneiderte Leitfragen für einen Brief an das Kind. Template: FutureMeLetterAI.

Phase III: Die Archetypen (Level 22–25)
Schule: Moore & Gillette / Archetypenarbeit

Kernbotschaft: In dir schlummert nicht nur der Anpasser. In dir schlummert auch der König / die Königin — der vollendete Archetyp, der aus Stärke gibt, nicht aus Angst.

Level 22 – Den vollendeten Archetyp kennenlernen (Diff: 1): Einführung des Königs-/Königinnen-Pols. KI kontrastiert den Archetyp mit dem spezifischen User-Defizit. Template: Info + SingleSelect.

Level 23 – Wie handelt die Majestät? (Diff: 2): Kognitives Reframing via Rollenwechsel. KI wählt die historisch dokumentierte Primärsituation (l6_situation) und lässt den Anwender aus der Perspektive des Königs agieren. Template: RoleReversalJournalAI.

Level 24 – Den Archetyp verkörpern (Diff: 2): Somatic Experiencing und psychophysiologisches Embodiment. KI liefert eine maßgeschneiderte, geführte Visualisierung basierend auf den Stresswerten vorangegangener EmotionChecks. Template: SimpleAction + EmotionCheck.

Level 25 – Der Archetyp in der Beziehung (Diff: 3): Interaktive Grenzensetzung im BoundarySimulatorAI. KI berechnet und formuliert 3 präzise Eskalationsstufen, die exakt den Mustern von opponent_name entsprechen. Der integrierte Stress-Score analysiert die Abweichung zwischen Anpasser- und Königs-Reaktion.

Phase IV: Anteile des Opponents / Projektionsarbeit (Level 26–28)
Schule: Systemische Arbeit / IFS (Internal Family Systems) / Projektionsarbeit nach Jung

Kernbotschaft: Was dich am Opponent so triggert — das kennst du. Von dir selbst.

Level 26 – Was der Opponent spiegelt (Diff: 3): Erkennen der Schattenprojektion. KI stellt psychologisch fundierte, sensible Projektionshypothesen auf ("Wo agierst du dir selbst gegenüber genauso fordernd wie dein Opponent?"). Template: ShadowWorkJournalAI.

Level 27 – Den Opponent-Anteil annehmen (Diff: 3): Integration abgespaltener innerer Anteile. Gestalttherapeutische Stuhlarbeit, moderiert von der KI, die den fordernden Anteil mit dem Anpasser aus Phase I verbündet. Template: EmptyChairRitualAI.

Level 28 – Mitgefühl für den Opponent (Diff: 2): Mentalisierung und Empathie ohne Selbstaufgabe (Compassion-Based Therapy). KI entwirft eine plausible psychologische Entwicklungs-Hypothese über den Opponent, um den Trigger zu entmachten. Template: RoleReversalJournalAI.

Phase V: Integration & Synthese (Level 29–30)
Schule: Narrative & Positive Psychologie

Kernbotschaft: Du bist nicht mehr derselbe Mensch, der Level 1 gestartet hat.

Level 29 – Der Rückblick (Diff: 2): Etablierung der neuen Lebensgeschichte. Modifiziertes CostBenefitMatrixAI (Damals vs. Heute). KI zieht explizite quantitative und qualitative Vergleiche zu Daten aus Level 3 und 6.

Level 30 – Der Brief an sich selbst (Diff: 1): Identitätsverankerung. KI verfasst ein maßgeschneidertes, hochgradig emotionales Einstiegs-Narrativ, das als synthetisierter therapeutischer Abschlussbericht fungiert. Template: FutureMeLetterAI.

8. Technische Roadmap & Implementierungs-Priorisierung
Sprint 1: Core AI UI Templates (Sofortiger Bau)
[ ] BeliefSystemCrackerAI.tsx: Komponente für geführte Satzvervollständigungen (5 Felder) mit unmittelbarer KI-Auswertung.

[ ] CostBenefitMatrixAI.tsx: Visuelle 4-Quadranten-Matrix zur strukturierten Kosten-Nutzen-Analyse (Damals vs. Heute).

[ ] ValuesSorterAI.tsx: Interaktives Drag-and-Drop Interface zur Filterung von 10 psychologischen Grundwerten auf die Top 3.

[ ] ShadowWorkJournalAI.tsx: Textbasiertes Deep-Reflexion-Interface zur Beantwortung komplexer, kontextueller Schattenfragen.

[ ] FutureMeLetterAI.tsx: Persistierte Briefkomponente mit zeitgesteuerter Wiedervorlage-Logik im Benutzerprofil.

[ ] RoleReversalJournalAI.tsx: Duales Eingabefeld zur synchronen Simulation von Eigen- und Fremdperspektive.

Sprint 2: Komplexe Dialog- & Prozesstemplates
[ ] InnerChildDialogueAI.tsx: Chat-ähnliche Oberfläche, die über Teilstates einen echten, geführten Dialog mit KI-Sätzen rendert.

[ ] EmptyChairRitualAI.tsx: Drei-Stufen-Interventionskomponente zur Externalisierung und Re-Integration blockierter Anteile.

[ ] TriggerTrackerAI.tsx: Lokales Grid-System zur schnellen Erfassung situativer Trigger im Alltag des Anwenders.

Sprint 3: Simulationen, Somatik & Backend-Infrastruktur
[ ] BoundarySimulatorAI.tsx: Gamifizierter Chat-Simulator mit dynamischer Berechnung eines Stress-Scores auf Basis von Antwort-Vektoren.

[ ] BodyScanAI.tsx: Audio-visuell unterstützte, geführte somatische Reise zur Detektion physischer Stress-Manifestationen.

[ ] RelaxationPicker.tsx: Lokaler Node-Algorithmus zur Auswahl und Steuerung der 20 statischen Übungs-Spezifikationen.

[ ] Backend-Infrastruktur: Implementierung des Parsers, Speicherung der Rolling-Window-Level (14+) und serverseitige Errechnung des Daily Caps (6-Punkte-Validierung).