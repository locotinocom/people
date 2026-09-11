# Handoff: XP-/Level-Progression Bugfix (Phase B)

Diese Datei ist der vollständige Einstieg. Der vorherige Chatverlauf wird nicht
benötigt. Lies sie zuerst, prüfe dann den tatsächlichen Stand im Code, bevor du
etwas änderst.

---

## 1. Arbeitsweise in diesem Projekt

- **Keine Befehle ausführen.** Kein `bin/cake`, kein `composer`, kein `npm`,
  kein SQL. Das Backend läuft live auf webgo Shared Hosting, lokal liegen nur
  die Dateien. PHP ist in der lokalen Umgebung nicht verfügbar.
- Alles, was normalerweise per CLI liefe, wird als manueller Schritt in
  `AUSFUEHREN.md` im Projektwurzelverzeichnis dokumentiert. Bestehende
  Abschnitte dort **nie überschreiben**, nur anhängen.
- Minimale Änderungen an bestehenden Dateien. Keine neuen Composer-/npm-Pakete
  ohne Rückfrage.
- Keine Methode doppelt anlegen — vorher prüfen, ob eine gleichnamige existiert.
- Keine Änderungen an Auth-Flow, Login, `.htaccess` oder CORS in diesem Auftrag.
- Am Ende jedes Schritts: Liste aller angefassten Dateien, eine Zeile pro Änderung.
- **Nach jedem Schritt anhalten** und das Ergebnis zeigen, bevor es weitergeht.

## 2. Stack

- Frontend: React / Vite / TypeScript, Redux Toolkit, Swiper, react-auth-kit
  (`webapp/`)
- Backend: CakePHP / MySQL, JWT über MixerApi (`api/`)
- Level-Content: statische JSONs unter `api/webroot/levels/level-1.json` bis
  `level-24.json`

---

## 3. Der Bug

**Symptom:** Beim Ausfüllen eines Formulars am Ende eines Levels verhielt sich
die App, als wäre „Weiter" geklickt worden. Die letzte Card des Levels wurde
übersprungen, die Abschluss-XP nicht vergeben. Der User landete im Content des
nächsten Levels, während `level` und `xp` in der DB auf dem alten Stand blieben
(beobachtet: Content Level 7, DB Level 6 mit 150/220 XP).

**Ursachenanalyse (abgeschlossen):**

- Kein `<form>` im Card-Flow, kein globaler Space-/Enter-Listener. Diese
  Hypothesen sind widerlegt.
- Der Fokus blieb nach einem Klick auf dem alten Button liegen; es gab kein
  Fokusmanagement nach Card-Wechsel.
- `GamePlay` lädt aktuelles **und** nächstes Level in ein gemeinsames
  Swiper-Array. Zwischen der letzten Card von Level N und der ersten Card von
  Level N+1 existiert keine Grenze — ein einzelnes `slideNext()` genügt, um
  ohne Completion in Level-N+1-Content zu landen.
- Completion und Navigation waren zwei getrennte Schritte.
- `allowTouchMove={false}` im Haupt-Swiper; kein Mousewheel-/Keyboard-Modul.
  `SwiperBase` (Multi-Slides) hat keine Touch-Sperre.
- Ein stale `currentInterventionId` fällt stumm auf Index 0 zurück.

---

## 4. Bereits erledigt

### Instrumentierung

Debug-Logging hinter `import.meta.env.DEV && VITE_DEBUG_SLIDES === "true"`,
in Production automatisch aus. Loggt Mount-Daten (`startIndex`,
`currentInterventionId`, Länge/Reihenfolge des Arrays) sowie bei jedem
Slide-Wechsel: alter/neuer Index, Intervention-ID, Auslöser (goNext, slideTo,
Touch, Mousewheel, Keyboard), Completion-Status der verlassenen Card,
HTTP-Status und XP. `ApiResponse` hat dafür zusätzlich `httpStatus`.

**Das Logging bleibt vorerst aktiv und wird nicht entfernt.**

### Phase A

- Aktiver Swiper-Slide bekommt nach jedem Wechsel `tabIndex={-1}` und Fokus.
- Navigations- und Completion-Buttons explizit `type="button"`.
- `Form.tsx`: Completion wird awaited, Navigation nur nach Erfolg, „Weiter"
  während des Requests deaktiviert, Fehler bleiben auf der Card sichtbar.
- Completion-Thunk wirft bei fehlgeschlagener API-Antwort einen Fehler, statt
  weiterzunavigieren.

### Phase B, Schritt 1 — Quelle der Wahrheit

Befund: Die vermutete Doppelquelle bestätigt sich **nicht**.
`user_progress.current_level` und `user_progress.xp_total` werden nirgends für
eine Entscheidung gelesen — sie werden nur initial geschrieben. Die aktive
Berechnung aggregiert bereits ausschließlich `user_intervention_progress`.

Zwei aktive Berechnungsstellen, die synchron bleiben müssen:
- `GameController::calculateLevel()` — Spiel-Level und Level-Up
- `AppController::calculateUserLevel()` — von `ToolsController` für Level-Gates

### Phase B, Schritt 2 — Deadlock-Prüfung

Die Schwelle für den Aufstieg von Level N nach N+1 ist die XP-Summe der
Interventionen von Level N. Der statische Check über alle 24 Level ergab: auf
dem ungünstigsten Pfad (alle `skippable`-Cards übersprungen) unterschreiten
neun Level ihre eigene Schwelle.

| Level | XP gesamt | XP ungünstigster Pfad | Differenz |
|---:|---:|---:|---:|
| 1 | 60 | 55 | -5 |
| 7 | 100 | 90 | -10 |
| 13 | 85 | 70 | -15 |
| 15 | 205 | 190 | -15 |
| 18 | 190 | 175 | -15 |
| 19 | 75 | 60 | -15 |
| 20 | 75 | 60 | -15 |
| 23 | 75 | 60 | -15 |
| 24 | 110 | 60 | -50 |

Da das Level kumulativ aus der Gesamt-XP berechnet wird, addieren sich diese
Defizite über die Level auf. Ein `409` mit der alten Schwelle hätte User
permanent ausgesperrt.

### Getroffene Entscheidung

**Die Schwelle für den Levelaufstieg ist die XP-Summe der VERPFLICHTENDEN
Cards eines Levels, nicht aller Cards.** XP aus `skippable`-Cards zählen
weiterhin zur Gesamt-XP des Users, sind aber Bonus und nie Voraussetzung.

Diese Änderung war zuletzt in Umsetzung (siehe Abschnitt 5).

---

## 5. Hier weitermachen

### Zuerst: Stand verifizieren

Die letzte Session wurde mitten in der Umsetzung unterbrochen. Prüfe, was
tatsächlich im Code steht, bevor du weiterbaust:

1. Verwenden `GameController::calculateLevel()` **und**
   `AppController::calculateUserLevel()` bereits die Schwelle über
   `skippable = false`? Beide müssen dieselbe Logik verwenden — sonst gibt es
   zwei Wahrheiten.
2. Existiert der Deadlock-Test bereits, und ist er vollständig?
3. Gibt es halbfertige oder verwaiste Dateien aus dem Abbruch?

Berichte den Ist-Zustand, bevor du änderst.

### Schritt 2 abschließen

Deadlock-Check als **dauerhaften automatisierten Test** anlegen (PHPUnit, im
Stil der vorhandenen Tests unter `api/tests/TestCase/`), der datengetrieben über
`api/webroot/levels/level-*.json` läuft und für jedes Level prüft:
XP-Summe des ungünstigsten Pfades >= Schwelle. Bricht eine künftige
Content-Änderung das wieder, fällt es sofort auf.

Der Test kann lokal nicht ausgeführt werden. Dokumentiere den Aufruf in
`AUSFUEHREN.md`. Alle Differenzen müssen >= 0 sein, bevor es weitergeht.

### Schritt 3 — Reparaturskript, Dry-Run zuerst

CLI-Command oder geschützter Maintenance-Endpoint (nur superadmin/CLI):

- liest `user_intervention_progress`
- summiert die tatsächlichen XP
- berechnet das Level über dieselbe zentrale Funktion wie der normale Flow
- **Dry-Run als Default**: Tabelle mit `user_id`, xp alt/neu, level alt/neu,
  nur bei Abweichung
- Schreiben nur mit explizitem Flag
- keine hartkodierten User-IDs, keine Einzelwerte im Code
- abgeschlossene Interventionen werden nicht verändert

Der Dry-Run muss über alle Beta-User laufen. Die Anzahl betroffener User ist
das entscheidende Ergebnis dieses Schritts.

### Schritt 4 — Idempotenz im Schema

Unique-Constraint auf `(user_id, intervention_id)` in
`user_intervention_progress`. Migration schreiben. Vorher prüfen, ob bereits
Duplikate existieren — die müssen im Reparaturskript bereinigt werden, sonst
schlägt die Migration fehl.

`completeIntervention()` muss den Constraint-Verstoß sauber abfangen und als
„bereits abgeschlossen" behandeln, nicht als Fehler.

### Schritt 5 — Freigabe in completeIntervention integrieren

**Kein separater `/game/next`-Endpoint.** `completeIntervention()` gibt in
einem Roundtrip zusätzlich zurück:

- `can_advance` (bool)
- `next_intervention_id` bzw. `next_level`
- bei `false`: `code`, `current_xp`, `required_xp`, `missing_xp`,
  `open_intervention_id`

Zwei getrennte Calls würden wieder ein Zeitfenster zwischen Abschluss und
Freigabe öffnen — genau das war der Bug.

### Schritt 6 — Frontend auf den Contract umstellen

- Navigation nur, wenn `can_advance` true ist.
- Bei `can_advance` false: **nicht stehenbleiben**, sondern zur
  `open_intervention_id` navigieren. Der User soll sehen, was zu tun ist, nicht
  dass etwas fehlt.
- Harte Levelgrenze in `GamePlay`: Ein lokales `slideNext()` darf eine
  Levelgrenze niemals überschreiten. Innerhalb eines Levels normale Navigation,
  über die Grenze nur nach Serverfreigabe.
- Stale `currentInterventionId`: nicht mehr stumm auf Index 0. Serverstand neu
  laden, erste offene Intervention verwenden, im Debug-Modus warnen.
- `SwiperBase`: prüfen, ob ein interner Multi-Slide-Wisch auf den äußeren
  Level-Swiper durchschlägt. Falls ja, unterbinden.

---

## 6. Ausdrücklich NICHT in diesem Change

- **Level-3-Bedingungsformat.** Befund: Die JSON-Bedingungen von `level-3.json`
  verwenden ein anderes Format, als der Evaluator in `GamePlay.tsx` erwartet.
  Die Hypothesen-Cards werden dadurch vermutlich nicht korrekt gefiltert. Das
  ist ein eigenständiger Bug und kommt separat.
- **Ungenutzte Variablen/Imports** in `TheWorkQuestion.tsx`,
  `ShadowDialogueAI.tsx`, `ValuesSorterAI.tsx`, `ChatSimulationCard.tsx`.
  Bestehen bereits, werden separat aufgeräumt.
- **Avatar-Steuerung in `Info.tsx`** (Kamera-Ausschnitt und Emotion aus dem
  Level-JSON). Eigener Change, eigener Branch.

---

## 7. Relevante Dateien

**Backend**
- `api/src/Controller/GameController.php` — `state()`, `calculateLevel()`,
  `completeIntervention()`
- `api/src/Controller/AppController.php` — `calculateUserLevel()`
- `api/config/routes.php`
- `api/webroot/levels/level-1.json` … `level-24.json`

**Frontend**
- `webapp/src/components/Game/GamePlay.tsx`
- `webapp/src/components/Game/SwiperBase.tsx`
- `webapp/src/context/SlideManagerContext.tsx`
- `webapp/src/components/interventions/Form.tsx`
- `webapp/src/store/gameActionsSlice.ts`, `gameSlice.ts`
- `webapp/src/api/request.ts`, `types.ts`

**Dokumentation**
- `AUSFUEHREN.md` im Projektwurzelverzeichnis — alle manuellen Schritte für
  webgo: Uploads, Umgebungsvariablen, SQL für phpMyAdmin, Prüfschritte.
