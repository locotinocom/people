/* ==========================================================================
   SUBTYPE & RELATIONAL CONTEXT CONFIGURATION (72 QUESTIONS MATRIX)
   ========================================================================== */

export type RelationalContext =
  | "authority"       // Autoritäten, Dominante Personen
  | "close_rel"        // Enge emotionale Bindungen
  | "vulnerable"       // Schwächere, Jüngere, Schützlinge
  | "public_outer"     // Äußeres/Öffentliches Umfeld
  | "conflict_stress"  // Akute Druck- & Konfliktsituationen
  | "upbringing"       // Erlernte Grundmuster / Aufwachsumfeld

export interface RelationalContextDef {
  id: RelationalContext
  label: string
  description: string
}

export const RELATIONAL_CONTEXTS: Record<RelationalContext, RelationalContextDef> = {
  authority: {
    id: "authority",
    label: "Gegenüber Autoritäten & dominanten Personen",
    description: "Verhalten bei Machtgefälle, Führungskräften oder dominanten Auftritten.",
  },
  close_rel: {
    id: "close_rel",
    label: "In nahen emotionalen Beziehungen",
    description: "Verhalten bei Menschen, die dir emotional am nächsten stehen.",
  },
  vulnerable: {
    id: "vulnerable",
    label: "Gegenüber Schwächeren & Jüngeren",
    description: "Verhalten bei Schutzbedürftigen, Hilfsbedürftigen oder Nachwuchs.",
  },
  public_outer: {
    id: "public_outer",
    label: "Im äußeren & öffentlichen Umfeld",
    description: "Verhalten bei Bekannten, im Netz oder bei entfernteren Kontakten.",
  },
  conflict_stress: {
    id: "conflict_stress",
    label: "Unter starkem Druck & bei Konflikten",
    description: "Spontaner Notfall-Reflex bei spürbarer emotionaler Spannung.",
  },
  upbringing: {
    id: "upbringing",
    label: "Eingeprägte Grundmuster aus der Herkunft",
    description: "Tief sitzende Glaubenssätze aus dem ursprünglichen Aufwachsumfeld.",
  },
}

export interface SubtypeDefinition {
  id: string
  name: string
  description: string
  coachingFocus: string
}

export const SUBTYPES: Record<string, SubtypeDefinition> = {
  caregiver: {
    id: "caregiver",
    name: "Der Retter / Helfer",
    description: "Übernimmt ungefragt Verantwortung für das Wohlbefinden anderer.",
    coachingFocus: "Lernen, dass Hilfe erst bei Eigenverantwortung beginnt und Abgrenzung gesund ist.",
  },
  chameleon: {
    id: "chameleon",
    name: "Der Chamäleon-Anpasser",
    description: "Passt eigene Meinungen und Verhalten extrem an, um dazuzugehören.",
    coachingFocus: "Eigene Werte spüren und trotz Angst vor Ablehnung vertreten.",
  },
  peacemaker: {
    id: "peacemaker",
    name: "Der Friedensstifter",
    description: "Macht fast alles, um Konflikte zu vermeiden, und schluckt Ärger runter.",
    coachingFocus: "Konflikte als Chance zur klaren Klärung sehen lernen.",
  },
  overachiever: {
    id: "overachiever",
    name: "Der Leistungs-Performer",
    description: "Definiert seinen Selbstwert stark über Produktivität und Fehlerfreiheit.",
    coachingFocus: "Selbstwert vom Tun entkoppeln; 'Gut genug' akzeptieren.",
  },
  boundaryless: {
    id: "boundaryless",
    name: "Der Grenzenlose / Ja-Sager",
    description: "Kann schwer Nein sagen und lässt eigene Grenzen ständig überschreiten.",
    coachingFocus: "Klare Stopp-Signale setzen ohne Schuldgefühle.",
  },
  approval_seeker: {
    id: "approval_seeker",
    name: "Der Validierungssucher",
    description: "Braucht ständige Bestätigung von außen, um sich sicher zu fühlen.",
    coachingFocus: "Innere Selbstvalidierung aufbauen anstelle von externem Lob.",
  },
  self_sacrificer: {
    id: "self_sacrificer",
    name: "Der Märtyrer / Passiver Widerstand",
    description: "Opfert sich auf oder wählt inneren Rückzug statt direkte Worte.",
    coachingFocus: "Bedürfnisse und Frust direkt und ohne Aufrechnung kommunizieren.",
  },
  direct_speaker: {
    id: "direct_speaker",
    name: "Der Klartext-Sprecher",
    description: "Kommuniziert Wünsche und Grenzen direkt und unumwunden.",
    coachingFocus: "Empathische Feinabstimmung ohne Härte bewahren.",
  },
}

export interface SubtypeStatement {
  id: string
  typeId: string
  relationalContext: RelationalContext
  isPositive: boolean
  text: string
}

export const SUBTYPE_STATEMENTS: SubtypeStatement[] = [
  // =========================================================================
  // 1. AUTORITÄTEN & DOMINANTE PERSONEN (12 Fragen)
  // =========================================================================
  { id: "cg_auth_1", typeId: "caregiver", relationalContext: "authority", isPositive: true, text: "Gegenüber Autoritäten neige ich dazu, mich ungefragt um deren Entlastung oder Wohlbefinden zu kümmern." },
  { id: "cg_auth_2", typeId: "caregiver", relationalContext: "authority", isPositive: true, text: "Ich biete Führungskräften oder mächtigen Personen oft Hilfe an, um mich für sie unentbehrlich zu machen." },
  
  { id: "ch_auth_1", typeId: "chameleon", relationalContext: "authority", isPositive: true, text: "Gegenüber Menschen mit Macht passe ich meine Meinung schnell an, um keine Angriffsfläche zu bieten." },
  { id: "ch_auth_2", typeId: "chameleon", relationalContext: "authority", isPositive: true, text: "Bei dominanten Auftritten nehme ich automatisch den Verhaltens- und Sprachstil des Gegenübers an." },

  { id: "pm_auth_1", typeId: "peacemaker", relationalContext: "authority", isPositive: true, text: "Wenn eine Autoritätsperson eine Entscheidung trifft, schlucke ich meine Bedenken lieber runter, um die Harmonie nicht zu stören." },
  { id: "pm_auth_2", typeId: "peacemaker", relationalContext: "authority", isPositive: true, text: "In Vorstands- oder Chefgesprächen nicke ich Themen oft ab, nur um potenziellen Auseinandersetzungen auszuweichen." },

  { id: "oa_auth_1", typeId: "overachiever", relationalContext: "authority", isPositive: true, text: "Bei Vorgesetzten setze ich mich enorm unter Druck, um absolut perfekt und fehlerfrei abzuliefern." },
  { id: "oa_auth_2", typeId: "overachiever", relationalContext: "authority", isPositive: true, text: "Es ist für mich eine Katastrophe, wenn eine Respektperson meine Arbeitsleistung infrage stellt." },

  { id: "bl_auth_1", typeId: "boundaryless", relationalContext: "authority", isPositive: true, text: "Wenn eine dominante Person Forderungen an mich stellt, fällt es mir extrem schwer, eine klare Grenze zu ziehen." },
  { id: "bl_auth_2", typeId: "boundaryless", relationalContext: "authority", isPositive: true, text: "Ich lasse mich von Autoritätspersonen oft überrumpeln und stimme Dingen zu, die ich gar nicht leisten kann." },

  { id: "as_auth_1", typeId: "approval_seeker", relationalContext: "authority", isPositive: true, text: "Ein neutrales oder kühles Wort von einer Respektperson wirft mich gedanklich noch stundenlang aus der Bahn." },
  { id: "as_auth_2", typeId: "approval_seeker", relationalContext: "authority", isPositive: true, text: "Ich tue vieles primär dafür, um von Vorgesetzten oder Autoritäten öffentliches Lob zu bekommen." },

  { id: "ss_auth_1", typeId: "self_sacrificer", relationalContext: "authority", isPositive: true, text: "Bei sehr dominanten Personen wähle ich eher inneren Rückzug (z. B. Seufzen oder Dienst nach Vorschrift), statt offen dagegenzureden." },
  { id: "ss_auth_2", typeId: "self_sacrificer", relationalContext: "authority", isPositive: true, text: "Gegenüber Chefs leide ich lieber stumm unter zu viel Arbeit, als ihnen klar aufzuzeigen, dass es zu viel ist." },

  { id: "ds_auth_1", typeId: "direct_speaker", relationalContext: "authority", isPositive: true, text: "Selbst gegenüber Vorgesetzten oder sehr dominanten Typen sage ich unumwunden meine Meinung, wenn die Sache nicht stimmt." },
  { id: "ds_auth_2", typeId: "direct_speaker", relationalContext: "authority", isPositive: true, text: "Wenn Autoritäten Fehlentscheidungen treffen, fordere ich sie ohne großes Zögern direkt heraus." },

  // =========================================================================
  // 2. ENGE EMOTIONALE BINDUNGEN (12 Fragen)
  // =========================================================================
  { id: "cg_close_1", typeId: "caregiver", relationalContext: "close_rel", isPositive: true, text: "In meinem engsten Kreis fühle ich mich automatisch für die Laune und das Seelenheil der anderen verantwortlich." },
  { id: "cg_close_2", typeId: "caregiver", relationalContext: "close_rel", isPositive: true, text: "Ich kümmere mich oft so intensiv um die Probleme meines Partners / meiner Familie, dass ich mich selbst vergesse." },

  { id: "ch_close_1", typeId: "chameleon", relationalContext: "close_rel", isPositive: true, text: "In nahen Beziehungen neige ich dazu, meine eigenen Vorlieben zurückzustellen, um mich dem Partner komplett anzupassen." },
  { id: "ch_close_2", typeId: "chameleon", relationalContext: "close_rel", isPositive: true, text: "Ich verändere meine Gewohnheiten im Privatleben stark, je nachdem, was mein Partner oder meine Familie erwartet." },

  { id: "pm_close_1", typeId: "peacemaker", relationalContext: "close_rel", isPositive: true, text: "Bei Menschen, die mir am Herzen liegen, gebe ich bei Meinungsverschiedenheiten fast immer nach, nur damit wieder Ruhe herrscht." },
  { id: "pm_close_2", typeId: "peacemaker", relationalContext: "close_rel", isPositive: true, text: "Um den häuslichen Frieden nicht zu gefährden, behalte ich meine tiefen Wünsche öfter für mich." },

  { id: "oa_close_1", typeId: "overachiever", relationalContext: "close_rel", isPositive: true, text: "Ich möchte auch in meiner Beziehung/Familie derjenige sein, der alles perfekt im Griff hat und keine Schwächen zeigt." },
  { id: "oa_close_2", typeId: "overachiever", relationalContext: "close_rel", isPositive: true, text: "Ich definiere meinen Wert im privaten Beziehungsnetz stark darüber, wie viel ich für die Familie leiste." },

  { id: "bl_close_1", typeId: "boundaryless", relationalContext: "close_rel", isPositive: true, text: "Wenn mir nahestehende Personen um Hilfe bitten, sage ich 'Ja', obwohl mein gesamter Körper ein klares 'Nein' spürt." },
  { id: "bl_close_2", typeId: "boundaryless", relationalContext: "close_rel", isPositive: true, text: "Partner oder enge Angehörige können meine persönlichen Grenzen oft überschreiten, ohne dass ich Stopp sage." },

  { id: "as_close_1", typeId: "approval_seeker", relationalContext: "close_rel", isPositive: true, text: "Ich brauche von meinen engsten Bezugspersonen regelmäßig Bestätigung, um zu wissen, dass zwischen uns alles gut ist." },
  { id: "as_close_2", typeId: "approval_seeker", relationalContext: "close_rel", isPositive: true, text: "Wenn mein Partner mir gegenüber distanziert wirkt, suche ich sofort händeringend nach Zeichen seiner Liebe." },

  { id: "ss_close_1", typeId: "self_sacrificer", relationalContext: "close_rel", isPositive: true, text: "Wenn mir in einer nahen Beziehung etwas gegen den Strich geht, zeige ich meinen Unmut eher durch Schweigen oder Seufzen." },
  { id: "ss_close_2", typeId: "self_sacrificer", relationalContext: "close_rel", isPositive: true, text: "Ich opfere mich für die Familie auf und hoffe im Stillen, dass man irgendwann sieht, wie sehr ich leide." },

  { id: "ds_close_1", typeId: "direct_speaker", relationalContext: "close_rel", isPositive: true, text: "In nahen Beziehungen spreche ich Störfaktoren direkt und ohne Umschweife an." },
  { id: "ds_close_2", typeId: "direct_speaker", relationalContext: "close_rel", isPositive: true, text: "Auch bei Menschen, die ich liebe, scheue ich mich nicht davor, knallharte Klarheit einzufordern." },

  // =========================================================================
  // 3. SCHWÄCHERE, JÜNGERE & SCHÜTZLINGE (12 Fragen)
  // =========================================================================
  { id: "cg_vuln_1", typeId: "caregiver", relationalContext: "vulnerable", isPositive: true, text: "Wenn ich sehe, dass jemand Unerfahreneres überfordert ist, greife ich sofort ein und nehme der Person die Aufgabe ab." },
  { id: "cg_vuln_2", typeId: "caregiver", relationalContext: "vulnerable", isPositive: true, text: "Ich fühle mich emotional stark verpflichtet, schwächere Personen vor allen Härten des Lebens zu beschützen." },

  { id: "ch_vuln_1", typeId: "chameleon", relationalContext: "vulnerable", isPositive: true, text: "Selbst bei Schwächeren verunsichert es mich, wenn diese mich nicht mögen, weshalb ich mich auch ihnen gegenüber anpasse." },
  { id: "ch_vuln_2", typeId: "chameleon", relationalContext: "vulnerable", isPositive: true, text: "Im Umgang mit jüngeren Menschen ändere ich meine Sprache und Haltung extrem, um von ihnen akzeptiert zu werden." },

  { id: "pm_vuln_1", typeId: "peacemaker", relationalContext: "vulnerable", isPositive: true, text: "Wenn im Umgang mit Jüngeren oder Schwächeren Unruhe entsteht, glätte ich sofort die Wogen, um Konflikte zu vermeiden." },
  { id: "pm_vuln_2", typeId: "peacemaker", relationalContext: "vulnerable", isPositive: true, text: "Ich setze bei Hilfsbedürftigen ungern strengere Regeln durch, weil ich Tränen oder Widerstand vermeiden möchte." },

  { id: "oa_vuln_1", typeId: "overachiever", relationalContext: "vulnerable", isPositive: true, text: "Ich neige dazu, Aufgaben für Unerfahrene lieber selbst zu erledigen, weil ich denke, dass es sonst nicht gründlich genug wird." },
  { id: "oa_vuln_2", typeId: "overachiever", relationalContext: "vulnerable", isPositive: true, text: "Ich messe auch Schützlinge oder jüngere Mitarbeiter an sehr hohen Leistungsstandards." },

  { id: "bl_vuln_1", typeId: "boundaryless", relationalContext: "vulnerable", isPositive: true, text: "Bei Menschen, die Schutz oder Hilfe brauchen, vergesse ich meine eigenen Belastungsgrenzen komplett." },
  { id: "bl_vuln_2", typeId: "boundaryless", relationalContext: "vulnerable", isPositive: true, text: "Ich lasse zu, dass hilfsbedürftige Personen meine Zeit und Energie ohne Grenzen in Anspruch nehmen." },

  { id: "as_vuln_1", typeId: "approval_seeker", relationalContext: "vulnerable", isPositive: true, text: "Mir ist es extrem wichtig, von Schützlingen oder Jüngeren als vorbildlich und beliebt wahrgenommen zu werden." },
  { id: "as_vuln_2", typeId: "approval_seeker", relationalContext: "vulnerable", isPositive: true, text: "Ich brauche auch von Schwächeren das Gefühl, geschätzt und als Heldenfigur gesehen zu werden." },

  { id: "ss_vuln_1", typeId: "self_sacrificer", relationalContext: "vulnerable", isPositive: true, text: "Ich stecke für Schwächere so sehr zurück, dass ich mich im Stillen oft ausgenutzt fühle." },
  { id: "ss_vuln_2", typeId: "self_sacrificer", relationalContext: "vulnerable", isPositive: true, text: "Ich ertrage die Launen von Schützlingen klaglos, empfinde dabei aber eine tiefe innere Bitterkeit." },

  { id: "ds_vuln_1", typeId: "direct_speaker", relationalContext: "vulnerable", isPositive: true, text: "Auch gegenüber Schwächeren sage ich klar und direkt, was Sache ist, ohne die Dinge künstlich zu verschönern." },
  { id: "ds_vuln_2", typeId: "direct_speaker", relationalContext: "vulnerable", isPositive: true, text: "Ich erwarte von Unerfahrenen klare Eigenverantwortung und sage ihnen das ohne Umschweife." },

  // =========================================================================
  // 4. ÄUSSERES & ÖFFENTLICHES UMFELD (12 Fragen)
  // =========================================================================
  { id: "cg_outer_1", typeId: "caregiver", relationalContext: "public_outer", isPositive: true, text: "Auch im entfernten Bekanntenkreis oder bei Fremden springe ich sofort ein, wenn jemand hilflos wirkt." },
  { id: "cg_outer_2", typeId: "caregiver", relationalContext: "public_outer", isPositive: true, text: "Ich biete mich im öffentlichen Raum oft ungefragt als Problemlöser an." },

  { id: "ch_outer_1", typeId: "chameleon", relationalContext: "public_outer", isPositive: true, text: "In Gruppen oder bei Bekannten passe ich meinen Kleidungs-, Sprach- oder Verhaltenstil stark an, um dazuzugehören." },
  { id: "ch_outer_2", typeId: "chameleon", relationalContext: "public_outer", isPositive: true, text: "Ich vertrete in Öffentlichkeit- oder Netzwerken oft die Meinung der Mehrheit, um nicht aufzufallen." },

  { id: "pm_outer_1", typeId: "peacemaker", relationalContext: "public_outer", isPositive: true, text: "Öffentliche Auseinandersetzungen oder Debatten im Bekanntenkreis meide ich strikt, um neutrale Harmonie zu wahren." },
  { id: "pm_outer_2", typeId: "peacemaker", relationalContext: "public_outer", isPositive: true, text: "Bei Kontroversen im Außenraum versuche ich sofort beide Seiten zu beruhigen oder mich rauszuhalten." },

  { id: "oa_outer_1", typeId: "overachiever", relationalContext: "public_outer", isPositive: true, text: "Es ist mir extrem wichtig, im Außen immer kompetent, fehlerfrei und gut organisiert wahrgenommen zu werden." },
  { id: "oa_outer_2", typeId: "overachiever", relationalContext: "public_outer", isPositive: true, text: "Ich nutze Erfolge und Statussymbole, um im öffentlichen Umfeld Respekt zu genießen." },

  { id: "bl_outer_1", typeId: "boundaryless", relationalContext: "public_outer", isPositive: true, text: "Selbst flüchtigen Bekannten fällt es leicht, mir Aufgaben aufzubürden, weil ich nicht Nein sagen kann." },
  { id: "bl_outer_2", typeId: "boundaryless", relationalContext: "public_outer", isPositive: true, text: "Ich lasse mir im öffentlichen Raum oder von Kunden oft Abmachungen aufdrängen, die mich benachteiligen." },

  { id: "as_outer_1", typeId: "approval_seeker", relationalContext: "public_outer", isPositive: true, text: "Ich erwische mich oft dabei, wie ich Dinge im Außen tue oder teile, primär um Anerkennung und Lob zu ernten." },
  { id: "as_outer_2", typeId: "approval_seeker", relationalContext: "public_outer", isPositive: true, text: "Ein Mangel an Bestätigung (z. B. auf Social Media oder bei Bekannten) verunsichert mich rasch." },

  { id: "ss_outer_1", typeId: "self_sacrificer", relationalContext: "public_outer", isPositive: true, text: "Im öffentlichen Raum ziehe ich mich bei Ungerechtigkeiten leise zurück, fühle mich aber innerlich als Opfer." },
  { id: "ss_outer_2", typeId: "self_sacrificer", relationalContext: "public_outer", isPositive: true, text: "Ich erdulde schlechte Dienstleistungen oder unhöfliche Fremde, anstatt vor Ort etwas zu sagen." },

  { id: "ds_outer_1", typeId: "direct_speaker", relationalContext: "public_outer", isPositive: true, text: "Bei Bekannten oder im öffentlichen Raum habe ich überhaupt kein Problem damit, sofort Kante zu zeigen und Stopp zu sagen." },
  { id: "ds_outer_2", typeId: "direct_speaker", relationalContext: "public_outer", isPositive: true, text: "Wenn im öffentlichen Raum Regeln gebrochen werden, weise ich die Betreffenden direkt darauf hin." },

  // =========================================================================
  // 5. DRUCK- & KONFLIKTSITUATIONEN (12 Fragen)
  // =========================================================================
  { id: "cg_stress_1", typeId: "caregiver", relationalContext: "conflict_stress", isPositive: true, text: "Unter hohem Druck versuche ich das Problem zu lösen, indem ich mich noch mehr um die Gefühle anderer kümmere." },
  { id: "cg_stress_2", typeId: "caregiver", relationalContext: "conflict_stress", isPositive: true, text: "Wenn ein Streit eskaliert, versuche ich mich unentbehrlich zu machen, um die Wogen zu glätten." },

  { id: "ch_stress_1", typeId: "chameleon", relationalContext: "conflict_stress", isPositive: true, text: "Bei plötzlichem Stress oder Konflikten schließe ich mich schnell der Meinung der lautesten Person an." },
  { id: "ch_stress_2", typeId: "chameleon", relationalContext: "conflict_stress", isPositive: true, text: "In Krisen passe ich meine Haltung blitzschnell an, um aus dem Fadenkreuz der Kritik zu geraten." },

  { id: "pm_stress_1", typeId: "peacemaker", relationalContext: "conflict_stress", isPositive: true, text: "Sobald im Raum plötzliche Spannung entsteht, versuche ich sofort, die Atmosphäre durch Witze oder Nachgeben zu retten." },
  { id: "pm_stress_2", typeId: "peacemaker", relationalContext: "conflict_stress", isPositive: true, text: "Unter starkem Druck gebe ich sofort nach, auch wenn ich im Recht bin, nur damit der Streit aufhört." },

  { id: "oa_stress_1", typeId: "overachiever", relationalContext: "conflict_stress", isPositive: true, text: "Bei akuter Belastung reagiere ich mit noch mehr Leistung, Perfektionismus und doppelter Kontrolle." },
  { id: "oa_stress_2", typeId: "overachiever", relationalContext: "conflict_stress", isPositive: true, text: "Wenn Fehler passieren, versuche ich krampfhaft, das System durch noch härteres Arbeiten zu retten." },

  { id: "bl_stress_1", typeId: "boundaryless", relationalContext: "conflict_stress", isPositive: true, text: "Unter starkem Druck bricht meine Fähigkeit, mich abzugrenzen, schlagartig ein." },
  { id: "bl_stress_2", typeId: "boundaryless", relationalContext: "conflict_stress", isPositive: true, text: "In Konflikten knicke ich sofort ein und nehme Schuld auf mich, die gar nicht meine ist." },

  { id: "as_stress_1", typeId: "approval_seeker", relationalContext: "conflict_stress", isPositive: true, text: "In Stressmomenten verunsichert mich Kritik extrem und ich suche hektisch nach Absicherung von außen." },
  { id: "as_stress_2", typeId: "approval_seeker", relationalContext: "conflict_stress", isPositive: true, text: "Wenn Druck entsteht, frage ich fieberhaft herum, ob ich auch ja alles richtig gemacht habe." },

  { id: "ss_stress_1", typeId: "self_sacrificer", relationalContext: "conflict_stress", isPositive: true, text: "In Konflikten schalte ich oft auf stumm, ziehe mich völlig zurück und lasse die Gegenseite mein Schweigen spüren." },
  { id: "ss_stress_2", typeId: "self_sacrificer", relationalContext: "conflict_stress", isPositive: true, text: "Bei starkem Druck verfalle ich in innere Schockstarre und fühle mich den Umständen hilflos ausgeliefert." },

  { id: "ds_stress_1", typeId: "direct_speaker", relationalContext: "conflict_stress", isPositive: true, text: "Wenn Druck entsteht, gehe ich direkt in die offene Konfrontation und kläre die Dinge sofort." },
  { id: "ds_stress_2", typeId: "direct_speaker", relationalContext: "conflict_stress", isPositive: true, text: "In akuten Spannungen werde ich oft sehr laut oder deutlich, um das Thema ohne Verzug aus der Welt zu schaffen." },

  // =========================================================================
  // 6. AUFWACHSUMFELD & PRÄGUNG (12 Fragen)
  // =========================================================================
  { id: "cg_upbring_1", typeId: "caregiver", relationalContext: "upbringing", isPositive: true, text: "Ich habe früh gelernt, dass man nur geliebt wird, wenn man sich um die Bedürfnisse der eigenen Familie kümmert." },
  { id: "cg_upbring_2", typeId: "caregiver", relationalContext: "upbringing", isPositive: true, text: "In meiner Kindheit musste ich oft die Rolle des Erwachsenen oder Versorgers für andere übernehmen." },

  { id: "ch_upbring_1", typeId: "chameleon", relationalContext: "upbringing", isPositive: true, text: "In meiner Herkunftsfamilie war es überlebenswichtig, sich den Erwartungen der Eltern lückenlos anzupassen." },
  { id: "ch_upbring_2", typeId: "chameleon", relationalContext: "upbringing", isPositive: true, text: "Ich habe gelernt, meine eigenen Meinungen zu verstecken, um im Elternhaus keine Turbulenzen zu erzeugen." },

  { id: "pm_upbring_1", typeId: "peacemaker", relationalContext: "upbringing", isPositive: true, text: "Ich habe früh gelernt, dass offene Wut oder Streit gefährlich sind und man Wogen besser schnell glättet." },
  { id: "pm_upbring_2", typeId: "peacemaker", relationalContext: "upbringing", isPositive: true, text: "In meiner Kindheit war Harmonie die wichtigste Regel, weshalb eigene Ansprüche zurückgesteckt wurden." },

  { id: "oa_upbring_1", typeId: "overachiever", relationalContext: "upbringing", isPositive: true, text: "In meiner ursprünglichen Prägung gilt: Nur wer viel leistet und funktioniert, wird wirklich geschätzt." },
  { id: "oa_upbring_2", typeId: "overachiever", relationalContext: "upbringing", isPositive: true, text: "Gute Noten oder Spitzenleistungen waren in meiner Herkunftsfamilie die Voraussetzung für Aufmerksamkeit." },

  { id: "bl_upbring_1", typeId: "boundaryless", relationalContext: "upbringing", isPositive: true, text: "Persönliche Grenzen wurden in meiner Kindheit kaum respektiert, weshalb ich nie gelernt habe, sie zu verteidigen." },
  { id: "bl_upbring_2", typeId: "boundaryless", relationalContext: "upbringing", isPositive: true, text: "Ein 'Nein' wurde in meiner Herkunftsfamilie oft als Bestrafung oder Liebesentzug gewertet." },

  { id: "as_upbring_1", typeId: "approval_seeker", relationalContext: "upbringing", isPositive: true, text: "Anerkennung gab es in meinem Elternhaus nur für Wohlverhalten und das Erfüllen von Erwartungen." },
  { id: "as_upbring_2", typeId: "approval_seeker", relationalContext: "upbringing", isPositive: true, text: "Ich habe früh das Gefühl verinnerlicht, erst dann gut genug zu sein, wenn andere mich loben." },

  { id: "ss_upbring_1", typeId: "self_sacrificer", relationalContext: "upbringing", isPositive: true, text: "In meinem frühen Umfeld gab es Vorbilder, die sich ständig aufgeopfert und leise gelitten haben." },
  { id: "ss_upbring_2", typeId: "self_sacrificer", relationalContext: "upbringing", isPositive: true, text: "Mir wurde beigebracht, dass es edel ist, eigene Schmerzen stumm zu tragen, statt Forderungen zu stellen." },

  { id: "ds_upbring_1", typeId: "direct_speaker", relationalContext: "upbringing", isPositive: true, text: "Bei uns Zuhause galt schon immer die Regel: Dinge werden direkt und ohne Umschweife beim Namen genannt." },
  { id: "ds_upbring_2", typeId: "direct_speaker", relationalContext: "upbringing", isPositive: true, text: "In meiner Herkunftsfamilie wurde Konflikten nicht ausgewichen, sondern sie wurden offen und direkt ausgetragen." },
]

/* ==========================================================================
   RANDOM-SAMPLING OHNE DUPLIKATE (für SubTypeFinderAI-Levels)
   ==========================================================================
   Die Frage-Engine soll pro Level nur eine kleine, zufällige, noch nicht
   beantwortete Teilmenge aus SUBTYPE_STATEMENTS ziehen. `answeredQuestionIds`
   kommt aus dem globalen User-State (z.B. profile.meta.subtype_answered_ids)
   und wird über alle Level hinweg fortgeschrieben, damit keine Frage doppelt
   gestellt wird. */

/**
 * Fisher-Yates Shuffle – mischt ein Array ohne das Original zu verändern.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Liefert `count` zufällige, noch UNBEANTWORTETE Statements aus dem
 * SUBTYPE_STATEMENTS-Pool.
 *
 * - Filtert alle bereits in `answeredQuestionIds` enthaltenen IDs heraus.
 * - Mischt den Restpool nach Fisher-Yates.
 * - Gibt `Math.min(count, available.length)` Fragen zurück (Fallback, falls
 *   der Pool zur Neige geht – z.B. gegen Ende der gesamten Fragen-Kampagne).
 *
 * Wichtig: Ist der Pool komplett leer (alle Fragen schon beantwortet),
 * wird bewusst ein leeres Array zurückgegeben – kein automatischer Reset.
 * Ein Reset (z.B. "alle Fragen nochmal") ist eine bewusste Produktentscheidung
 * und müsste explizit vom Aufrufer (z.B. answeredQuestionIds = [] übergeben)
 * ausgelöst werden.
 */
export function getRandomQuestionsForLevel(
  answeredQuestionIds: string[] = [],
  count: number
): SubtypeStatement[] {
  const answeredSet = new Set(answeredQuestionIds)
  const available = SUBTYPE_STATEMENTS.filter((s) => !answeredSet.has(s.id))
  const shuffled = shuffleArray(available)
  const safeCount = Math.max(0, Math.min(count, shuffled.length))
  return shuffled.slice(0, safeCount)
}

/* ==========================================================================
   ZENTRALES SCORING – kumulative Auswertung aller bisherigen Antworten
   ==========================================================================
   `calculateSubtypeResult` bekommt ALLE bisher vom User gesammelten
   Rohantworten (nicht nur die des aktuellen Levels!) und berechnet daraus
   das komplette Subtyp-Profil (Scores je Typ, dominanter Typ, sekundärer
   Typ, sowie die Aufschlüsselung je Beziehungs-Kontext).

   Wird von der SubtypeFinderAI-Komponente verwendet, damit das Ergebnis
   nach jedem Level immer auf Basis ALLER bisher beantworteten Fragen neu
   berechnet wird (kumulativ über die gesamte Fragen-Kampagne hinweg). */

export interface SubtypeScoreEntry {
  totalQuestions: number
  matchedAnswers: number
  scorePercent: number
  name: string
  coachingFocus: string
}

export interface SubtypeContextBreakdownItem {
  contextId: RelationalContext
  contextLabel: string
  dominantTypeId: string
  dominantTypeName: string
  scorePercent: number
  totalQuestionsInContext: number
  matchedAnswersInContext: number
}

export interface SubtypeCalcResult {
  scores: Record<string, SubtypeScoreEntry>
  dominantTypeId: string
  dominantTypeName: string
  secondaryTypeId: string
  secondaryTypeName: string
  contextBreakdown: Partial<Record<RelationalContext, SubtypeContextBreakdownItem>>
  triggeredStatements: Array<{
    id: string
    typeId: string
    relationalContext: RelationalContext
    text: string
  }>
  rawAnswers: Record<string, number>
}

/**
 * Rechnet aus einem Record von Rohantworten (statementId -> 1 | 0, wobei
 * 1 = "trifft zu" / true und 0 = "trifft nicht zu" / false) das komplette
 * Subtyp-Ergebnis aus. Statements, deren ID nicht (mehr) im
 * SUBTYPE_STATEMENTS-Pool existiert, werden übersprungen (robust gegen
 * zukünftige Datenänderungen).
 */
export function calculateSubtypeResult(
  allAnswers: Record<string, number>
): SubtypeCalcResult {
  const statementById = new Map(SUBTYPE_STATEMENTS.map((s) => [s.id, s]))

  const scores: Record<string, SubtypeScoreEntry> = {}
  Object.keys(SUBTYPES).forEach((typeId) => {
    scores[typeId] = {
      totalQuestions: 0,
      matchedAnswers: 0,
      scorePercent: 0,
      name: SUBTYPES[typeId].name,
      coachingFocus: SUBTYPES[typeId].coachingFocus,
    }
  })

  const contextMatrix: Record<string, Record<string, { total: number; matched: number }>> = {}
  const triggeredStatements: SubtypeCalcResult["triggeredStatements"] = []

  Object.entries(allAnswers).forEach(([statementId, rawValue]) => {
    const statement = statementById.get(statementId)
    if (!statement) return // unbekannte/veraltete ID -> ignorieren

    const { typeId, relationalContext, isPositive, text } = statement
    const value = rawValue === 1

    if (scores[typeId]) scores[typeId].totalQuestions += 1

    if (!contextMatrix[relationalContext]) contextMatrix[relationalContext] = {}
    if (!contextMatrix[relationalContext][typeId]) {
      contextMatrix[relationalContext][typeId] = { total: 0, matched: 0 }
    }
    contextMatrix[relationalContext][typeId].total += 1

    const isMatched = isPositive ? value === true : value === false

    if (isMatched) {
      if (scores[typeId]) scores[typeId].matchedAnswers += 1
      contextMatrix[relationalContext][typeId].matched += 1
      triggeredStatements.push({
        id: statementId,
        typeId,
        relationalContext,
        text,
      })
    }
  })

  // Scores in Prozent + dominanten / sekundären Typ ermitteln
  let highestPercent = -1
  let secondHighestPercent = -1
  let dominantTypeId = ""
  let secondaryTypeId = ""

  Object.keys(scores).forEach((typeId) => {
    const item = scores[typeId]
    const percent =
      item.totalQuestions > 0
        ? Math.round((item.matchedAnswers / item.totalQuestions) * 100)
        : 0
    item.scorePercent = percent

    if (percent > highestPercent) {
      secondHighestPercent = highestPercent
      secondaryTypeId = dominantTypeId
      highestPercent = percent
      dominantTypeId = typeId
    } else if (percent > secondHighestPercent) {
      secondHighestPercent = percent
      secondaryTypeId = typeId
    }
  })

  const contextBreakdown: SubtypeCalcResult["contextBreakdown"] = {}

  Object.keys(contextMatrix).forEach((ctxIdKey) => {
    const ctxId = ctxIdKey as RelationalContext
    const typeScores = contextMatrix[ctxId]

    let bestCtxType = ""
    let bestCtxPercent = -1
    let bestCtxTotal = 0
    let bestCtxMatched = 0

    Object.keys(typeScores).forEach((typeId) => {
      const { total, matched } = typeScores[typeId]
      const pct = total > 0 ? Math.round((matched / total) * 100) : 0

      if (pct > bestCtxPercent) {
        bestCtxPercent = pct
        bestCtxType = typeId
        bestCtxTotal = total
        bestCtxMatched = matched
      }
    })

    if (bestCtxType) {
      contextBreakdown[ctxId] = {
        contextId: ctxId,
        contextLabel: RELATIONAL_CONTEXTS[ctxId]?.label || ctxId,
        dominantTypeId: bestCtxType,
        dominantTypeName: SUBTYPES[bestCtxType]?.name || bestCtxType,
        scorePercent: bestCtxPercent,
        totalQuestionsInContext: bestCtxTotal,
        matchedAnswersInContext: bestCtxMatched,
      }
    }
  })

  return {
    scores,
    dominantTypeId,
    dominantTypeName: SUBTYPES[dominantTypeId]?.name || dominantTypeId,
    secondaryTypeId,
    secondaryTypeName: SUBTYPES[secondaryTypeId]?.name || secondaryTypeId,
    contextBreakdown,
    triggeredStatements,
    rawAnswers: allAnswers,
  }
}


