/**
 * A1 bilingual copy + gloss composition (quality-review M5 extraction from
 * the former `shared.ts` monolith).
 *
 * Owns everything that assembles *natural* English/Italian text: the
 * role/context/referent label + Can-do descriptor copy shared across every
 * module, the small gloss tables (subject/complement/object noun phrases,
 * verb-clause templates, context scenario notes), and the composition
 * helpers (`a1Copular`, `a1VerbObject`, `a1Scenario`) module files call to
 * stay DRY. Emits only English/Italian — never Japanese. Re-exported through
 * the `shared.ts` barrel so existing `from "./shared"` imports keep working
 * unchanged.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import { a1PersonRoles } from "./a1SemanticCatalog";

/** A bilingual (EN/IT) copy pair. Never carries Japanese. */
export interface Bilingual {
  readonly en: string;
  readonly it: string;
}

// ---------------------------------------------------------------------------
// Shared copy (role/context/referent labels + Can-do descriptors)
// ---------------------------------------------------------------------------

/**
 * Copy shared across all four modules: person-role labels, context labels,
 * referent labels, and Can-do descriptors. Flat, identical key sets per locale,
 * never Japanese. Module files contribute their own translation/scenario keys.
 */
export const a1SharedCopy: { readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> } = deepFreeze({
  en: {
    "a1-role-learner-label": "Me (the learner)",
    "a1-role-yuki-label": "Yuki",
    "a1-role-ken-label": "Ken",
    "a1-role-mina-label": "Mina",
    "a1-role-teacher-label": "The teacher",
    "a1-role-classmate-label": "A classmate",
    "a1-role-friend-label": "A friend",
    "a1-role-clerk-label": "The shop clerk",
    "a1-role-person-label": "A person",
    "a1-role-thing-label": "A thing",
    "a1-referent-self-label": "I",
    "a1-referent-yuki-label": "Yuki",
    "a1-referent-ken-label": "Ken",
    "a1-referent-mina-label": "Mina",
    "a1-referent-teacher-label": "The teacher",
    "a1-referent-classmate-label": "The classmate",
    "a1-referent-friend-label": "The friend",
    "a1-referent-clerk-label": "The clerk",
    "a1-referent-person-label": "The person",
    "a1-referent-thing-label": "The thing",
    "a1-context-first-meeting-label": "Meeting someone for the first time",
    "a1-context-classroom-label": "In the language classroom",
    "a1-context-workplace-label": "At work",
    "a1-context-shop-label": "In a shop",
    "a1-context-station-label": "At the station",
    "a1-context-cafe-label": "In a cafe",
    "a1-context-home-label": "At home",
    "a1-context-town-label": "Around town",
    "a1-context-family-label": "With family",
    "a1-context-weather-label": "Talking about the weather",
    "a1-context-weekday-study-label": "Weekday study routine",
    "a1-context-mealtime-routine-label": "Daily mealtime routine",
    "a1-context-evening-reading-label": "Evening reading routine",
    "a1-context-social-outing-label": "A social outing",
    "a1-role-creature-label": "An animal",
    "a1-referent-creature-label": "The animal",
    "a1-can-do-sounds-descriptor": "I can hear and read the basic sounds of Japanese.",
    "a1-can-do-identity-descriptor": "I can say who I am and give a few personal details.",
    "a1-can-do-origins-descriptor": "I can say where I am from and what languages I use.",
    "a1-can-do-questions-descriptor": "I can ask simple questions about people and things.",
    "a1-can-do-actions-descriptor": "I can say what I do with everyday objects and places.",
    "a1-can-do-daily-life-descriptor": "I can describe simple everyday activities.",
    "a1-can-do-places-descriptor": "I can say where I am going and how I get there.",
    "a1-can-do-people-descriptor": "I can talk about my family and the people around me.",
    "a1-can-do-descriptions-descriptor": "I can describe things and say what I like using simple adjectives.",
    "a1-can-do-shopping-descriptor": "I can ask prices, say how many I want, and make a simple purchase.",
    "a1-can-do-existence-descriptor": "I can say what there is, where it is, and what I need.",
    "a1-can-do-scenario-1-descriptor": "I can introduce myself and both ask and answer simple personal questions.",
    "a1-can-do-scenario-2-descriptor": "I can talk through a typical day — my routine, a place, what I like, and what I want to buy.",
    "a1-can-do-scenario-3-descriptor": "I can get around, asking where a place is and saying how I'll get there and what I need.",
    "a1-can-do-scenario-4-descriptor": "I can say who I am and what I do, describe things around me, and ask for clarification when I change topic.",
    "a1-module-outcome-introductions": "You can introduce yourself and other people with a few key facts.",
    "a1-module-outcome-essential-questions": "You can ask and recognize the everyday questions that keep a conversation going.",
    "a1-module-outcome-actions": "You can say what you and others do with everyday things, places, and people.",
    "a1-module-outcome-routines": "You can describe your daily routine using times, days, and how often you do things.",
    "a1-module-outcome-past-negative": "You can say what did and did not happen, in the past as well as the present.",
    "a1-module-outcome-places": "You can say where you go, where you come from, and how you travel there.",
    "a1-module-outcome-people": "You can talk about your family and the people you do things with.",
    "a1-module-outcome-descriptions": "You can describe things, weather, and preferences with simple i- and na-adjectives.",
    "a1-module-outcome-shopping": "You can handle prices, quantities, and polite requests to make a simple purchase.",
    "a1-module-outcome-existence-needs": "You can say what exists, where it is, and what you need or want.",
    "a1-module-outcome-capstones": "You can combine everything from this level to get through everyday scenarios.",
    "a1-level-a1-alignment": "A first foundation in everyday Japanese, aligned with the JF Standard and CEFR A1 descriptors.",
  },
  it: {
    "a1-role-learner-label": "Io (chi impara)",
    "a1-role-yuki-label": "Yuki",
    "a1-role-ken-label": "Ken",
    "a1-role-mina-label": "Mina",
    "a1-role-teacher-label": "L'insegnante",
    "a1-role-classmate-label": "Un compagno di classe",
    "a1-role-friend-label": "Un amico",
    "a1-role-clerk-label": "Il commesso",
    "a1-role-person-label": "Una persona",
    "a1-role-thing-label": "Una cosa",
    "a1-referent-self-label": "Io",
    "a1-referent-yuki-label": "Yuki",
    "a1-referent-ken-label": "Ken",
    "a1-referent-mina-label": "Mina",
    "a1-referent-teacher-label": "L'insegnante",
    "a1-referent-classmate-label": "Il compagno di classe",
    "a1-referent-friend-label": "L'amico",
    "a1-referent-clerk-label": "Il commesso",
    "a1-referent-person-label": "La persona",
    "a1-referent-thing-label": "La cosa",
    "a1-context-first-meeting-label": "Conoscere qualcuno per la prima volta",
    "a1-context-classroom-label": "Nell'aula di lingua",
    "a1-context-workplace-label": "Al lavoro",
    "a1-context-shop-label": "In un negozio",
    "a1-context-station-label": "Alla stazione",
    "a1-context-cafe-label": "In un bar",
    "a1-context-home-label": "A casa",
    "a1-context-town-label": "In città",
    "a1-context-family-label": "In famiglia",
    "a1-context-weather-label": "Parlare del tempo",
    "a1-context-weekday-study-label": "Routine di studio infrasettimanale",
    "a1-context-mealtime-routine-label": "Routine dei pasti quotidiani",
    "a1-context-evening-reading-label": "Routine di lettura serale",
    "a1-context-social-outing-label": "Un'uscita sociale",
    "a1-role-creature-label": "Un animale",
    "a1-referent-creature-label": "L'animale",
    "a1-can-do-sounds-descriptor": "So sentire e leggere i suoni di base del giapponese.",
    "a1-can-do-identity-descriptor": "So dire chi sono e dare alcuni dati personali.",
    "a1-can-do-origins-descriptor": "So dire da dove vengo e quali lingue uso.",
    "a1-can-do-questions-descriptor": "So fare domande semplici su persone e cose.",
    "a1-can-do-actions-descriptor": "So dire cosa faccio con oggetti e luoghi di tutti i giorni.",
    "a1-can-do-daily-life-descriptor": "So descrivere semplici attività quotidiane.",
    "a1-can-do-places-descriptor": "So dire dove vado e come ci arrivo.",
    "a1-can-do-people-descriptor": "So parlare della mia famiglia e delle persone intorno a me.",
    "a1-can-do-descriptions-descriptor": "So descrivere le cose e dire cosa mi piace con aggettivi semplici.",
    "a1-can-do-shopping-descriptor": "So chiedere i prezzi, dire quanti ne voglio e fare un semplice acquisto.",
    "a1-can-do-existence-descriptor": "So dire cosa c'è, dove si trova e di cosa ho bisogno.",
    "a1-can-do-scenario-1-descriptor": "So presentarmi e sia fare sia rispondere a semplici domande personali.",
    "a1-can-do-scenario-2-descriptor": "So raccontare una giornata tipica: la mia routine, un luogo, cosa mi piace e cosa voglio comprare.",
    "a1-can-do-scenario-3-descriptor": "So muovermi, chiedendo dove si trova un luogo e dicendo come ci arrivo e di cosa ho bisogno.",
    "a1-can-do-scenario-4-descriptor": "So dire chi sono e cosa faccio, descrivere le cose intorno a me e chiedere chiarimenti quando cambio argomento.",
    "a1-module-outcome-introductions": "Sai presentare te stesso e altre persone con alcuni dati chiave.",
    "a1-module-outcome-essential-questions": "Sai fare e riconoscere le domande quotidiane che tengono viva una conversazione.",
    "a1-module-outcome-actions": "Sai dire cosa fai tu e gli altri con le cose, i luoghi e le persone di ogni giorno.",
    "a1-module-outcome-routines": "Sai descrivere la tua giornata usando orari, giorni e con quale frequenza fai le cose.",
    "a1-module-outcome-past-negative": "Sai dire cosa è successo e cosa non è successo, al passato come al presente.",
    "a1-module-outcome-places": "Sai dire dove vai, da dove vieni e come ci viaggi.",
    "a1-module-outcome-people": "Sai parlare della tua famiglia e delle persone con cui fai le cose.",
    "a1-module-outcome-descriptions": "Sai descrivere cose, tempo e preferenze con semplici aggettivi in i e in na.",
    "a1-module-outcome-shopping": "Sai gestire prezzi, quantità e richieste cortesi per fare un semplice acquisto.",
    "a1-module-outcome-existence-needs": "Sai dire cosa esiste, dove si trova e cosa ti serve o desideri.",
    "a1-module-outcome-capstones": "Sai combinare tutto questo livello per gestire scenari di tutti i giorni.",
    "a1-level-a1-alignment": "Una prima base di giapponese quotidiano, allineata agli standard JF e ai descrittori CEFR A1.",
  },
});

// ---------------------------------------------------------------------------
// Bilingual copy composition helpers
// ---------------------------------------------------------------------------
//
// These helpers assemble *natural* English/Italian translations and scenario
// notes from small gloss tables so the module files stay DRY and consistent.
// They emit only English/Italian text — never Japanese — so they are safe to
// call outside the `defineA1SemanticValue` path.

export const A1_SUBJECT_GLOSS: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-value-watashi": { en: "I", it: "Io" },
  "a1-value-yuki": { en: "Yuki", it: "Yuki" },
  "a1-value-ken": { en: "Ken", it: "Ken" },
  "a1-value-mina": { en: "Mina", it: "Mina" },
  "a1-value-teacher-subject": { en: "The teacher", it: "L'insegnante" },
  "a1-value-classmate-subject": { en: "The classmate", it: "Il compagno di classe" },
  "a1-value-friend-subject": { en: "The friend", it: "L'amico" },
  "a1-value-clerk-subject": { en: "The clerk", it: "Il commesso" },
  "a1-value-kore": { en: "This one", it: "Questo" },
  "a1-value-sore": { en: "That one", it: "Quello" },
  "a1-value-are": { en: "That one over there", it: "Quello là" },
  "a1-value-kono-hito": { en: "This person", it: "Questa persona" },
  "a1-value-sono-hito": { en: "That person", it: "Quella persona" },
  "a1-value-ano-hito": { en: "That person over there", it: "Quella persona là" },
  "a1-value-toire-subject": { en: "The toilet", it: "Il bagno" },
  "a1-value-paatii-subject": { en: "The party", it: "La festa" },
  "a1-value-mikan-subject": { en: "The tangerines", it: "I mandarini" },
  "a1-value-eki-subject": { en: "The station", it: "La stazione" },
  // Module 8 own-family kin subjects (plain — never honorific for one's own).
  "a1-value-kin-mother": { en: "My mother", it: "Mia madre" },
  "a1-value-kin-father": { en: "My father", it: "Mio padre" },
  "a1-value-kin-older-brother": { en: "My older brother", it: "Mio fratello maggiore" },
  "a1-value-kin-older-sister": { en: "My older sister", it: "Mia sorella maggiore" },
  "a1-value-kin-younger-brother": { en: "My younger brother", it: "Mio fratello minore" },
  "a1-value-kin-younger-sister": { en: "My younger sister", it: "Mia sorella minore" },
  // Module 8 other-family honorific kin subjects.
  "a1-value-kin-mother-hon": { en: "Your mother", it: "Tua madre" },
  "a1-value-kin-father-hon": { en: "Your father", it: "Tuo padre" },
});

/**
 * A copular-complement gloss. `itFeminine` is only present for complements
 * whose Italian surface form actually changes with the subject's gender
 * (occupation nouns, nationality adjectives); complements that are
 * grammatically invariant (giapponese, un medico, un ingegnere, un
 * insegnante, un commesso) simply omit it and always render `it`.
 */
export interface ComplementGloss extends Bilingual {
  readonly itFeminine?: string;
}

/** Copular-complement glosses (occupations, nationalities). */
export const A1_COMPLEMENT_GLOSS: Readonly<Record<string, ComplementGloss>> = deepFreeze({
  "a1-value-obj-student": { en: "a student", it: "uno studente", itFeminine: "una studentessa" },
  "a1-value-obj-teacher": { en: "a teacher", it: "un insegnante" },
  "a1-value-obj-doctor": { en: "a doctor", it: "un medico" },
  "a1-value-obj-office-worker": { en: "an office worker", it: "un impiegato", itFeminine: "un'impiegata" },
  "a1-value-obj-engineer": { en: "an engineer", it: "un ingegnere" },
  "a1-value-obj-clerk": { en: "a shop clerk", it: "un commesso" },
  "a1-value-obj-japanese-person": { en: "Japanese", it: "giapponese" },
  "a1-value-obj-italian-person": { en: "Italian", it: "italiano", itFeminine: "italiana" },
  "a1-value-obj-american-person": { en: "American", it: "americano", itFeminine: "americana" },
});

// ---------------------------------------------------------------------------
// Persona gender lookup (drives gender-aware complement selection below)
// ---------------------------------------------------------------------------

/**
 * Bridges a copular subject's semantic-value id to its person-role id, so
 * gender-aware complement selection can read the persona's grammatical
 * gender from the single source of truth in `a1PersonRoles` (§ persona
 * gender agreement) instead of duplicating a gender decision per variant
 * here. Only subjects that can plausibly fill a copular subject slot need an
 * entry — every other subject id simply has no known gender and keeps the
 * existing invariant/default complement form (never guessed).
 */
const A1_SUBJECT_PERSON_ROLE_ID: Readonly<Record<string, string>> = deepFreeze({
  "a1-value-watashi": "a1-role-learner",
  "a1-value-yuki": "a1-role-yuki",
  "a1-value-ken": "a1-role-ken",
  "a1-value-mina": "a1-role-mina",
  "a1-value-teacher-subject": "a1-role-teacher",
  "a1-value-classmate-subject": "a1-role-classmate",
  "a1-value-friend-subject": "a1-role-friend",
  "a1-value-clerk-subject": "a1-role-clerk",
});

const A1_ROLE_GENDER: Readonly<Record<string, "masculine" | "feminine" | undefined>> = deepFreeze(
  Object.fromEntries(a1PersonRoles.map((role) => [role.id, role.gender])),
);

/** The subject's settled persona gender, or `undefined` when unknown/generic
 * (self, unnamed roles) — never guessed. */
function a1SubjectGender(subjectValueId: string): "masculine" | "feminine" | undefined {
  const roleId = A1_SUBJECT_PERSON_ROLE_ID[subjectValueId];
  return roleId === undefined ? undefined : A1_ROLE_GENDER[roleId];
}

/** Verb-object (theme) glosses, article baked in for natural target text. */
export const A1_OBJECT_GLOSS: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-value-obj-japanese": { en: "Japanese", it: "il giapponese" },
  "a1-value-obj-english": { en: "English", it: "l'inglese" },
  "a1-value-obj-italian": { en: "Italian", it: "l'italiano" },
  "a1-value-obj-coffee": { en: "coffee", it: "il caffè" },
  "a1-value-obj-water": { en: "water", it: "l'acqua" },
  "a1-value-obj-tea": { en: "tea", it: "il tè" },
  "a1-value-obj-sushi": { en: "sushi", it: "il sushi" },
  "a1-value-obj-bread": { en: "bread", it: "il pane" },
  "a1-value-obj-ramen": { en: "ramen", it: "il ramen" },
  "a1-value-obj-book": { en: "a book", it: "un libro" },
  "a1-value-obj-letter": { en: "a letter", it: "una lettera" },
  "a1-value-obj-newspaper": { en: "the newspaper", it: "il giornale" },
  "a1-value-obj-movie": { en: "a movie", it: "un film" },
  "a1-value-obj-music": { en: "music", it: "la musica" },
  "a1-value-obj-tv": { en: "TV", it: "la TV" },
  "a1-value-obj-homework": { en: "homework", it: "i compiti" },
});

/** Verb clause templates for object/nominative predicates (3rd-person). */
const A1_VERB_CLAUSE: Readonly<
  Record<string, { en: (o: string) => string; it: (o: string) => string }>
> = {
  "a1-sense-study": { en: (o) => `studies ${o}`, it: (o) => `studia ${o}` },
  "a1-sense-do": { en: (o) => `does ${o}`, it: (o) => `fa ${o}` },
  "a1-sense-understand": { en: (o) => `understands ${o}`, it: (o) => `capisce ${o}` },
  "a1-sense-eat": { en: (o) => `eats ${o}`, it: (o) => `mangia ${o}` },
  "a1-sense-drink": { en: (o) => `drinks ${o}`, it: (o) => `beve ${o}` },
  "a1-sense-read": { en: (o) => `reads ${o}`, it: (o) => `legge ${o}` },
  "a1-sense-write": { en: (o) => `writes ${o}`, it: (o) => `scrive ${o}` },
  "a1-sense-buy": { en: (o) => `buys ${o}`, it: (o) => `compra ${o}` },
  "a1-sense-see": { en: (o) => `watches ${o}`, it: (o) => `guarda ${o}` },
  "a1-sense-listen": { en: (o) => `listens to ${o}`, it: (o) => `ascolta ${o}` },
};

/** Situational scenario notes, keyed by context (nonempty, natural, no JP). */
export const A1_CONTEXT_SCENARIO: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-context-first-meeting": {
    en: "You have just met someone and are introducing yourselves.",
    it: "Hai appena conosciuto qualcuno e vi state presentando.",
  },
  "a1-context-classroom": {
    en: "You are in the language class, talking about your studies.",
    it: "Sei nell'aula di lingua e parli dei tuoi studi.",
  },
  "a1-context-workplace": {
    en: "You are chatting with a colleague at work.",
    it: "Chiacchieri con un collega al lavoro.",
  },
  "a1-context-shop": {
    en: "You are at the shop counter.",
    it: "Sei al banco del negozio.",
  },
  "a1-context-station": {
    en: "You are asking for help at the station.",
    it: "Chiedi aiuto alla stazione.",
  },
  "a1-context-cafe": {
    en: "You are ordering and chatting at a cafe.",
    it: "Ordini e chiacchieri al bar.",
  },
  "a1-context-home": {
    en: "You are describing your daily routine at home.",
    it: "Descrivi la tua giornata a casa.",
  },
  "a1-context-town": {
    en: "You are finding your way around town.",
    it: "Ti muovi e ti orienti in città.",
  },
  "a1-context-family": {
    en: "You are talking about your family and the people around you.",
    it: "Parli della tua famiglia e delle persone intorno a te.",
  },
  "a1-context-weather": {
    en: "You are chatting about today's weather and how things feel.",
    it: "Chiacchieri del tempo di oggi e di come ci si sente.",
  },
  "a1-context-weekday-study": {
    en: "You are describing which weekdays you regularly study on.",
    it: "Descrivi in quali giorni della settimana studi di solito.",
  },
  "a1-context-mealtime-routine": {
    en: "You are describing when you habitually eat during the day.",
    it: "Descrivi quando mangi abitualmente durante la giornata.",
  },
  "a1-context-evening-reading": {
    en: "You are describing your habit of reading in the evening.",
    it: "Descrivi la tua abitudine di leggere la sera.",
  },
  "a1-context-social-outing": {
    en: "You are arranging a simple outing with someone you know.",
    it: "Stai organizzando una semplice uscita con una persona che conosci.",
  },
});

function glossOrThrow<T>(
  table: Readonly<Record<string, T>>,
  id: string,
  kind: string,
): T {
  const g = table[id];
  if (!g) throw new Error(`Missing ${kind} gloss for "${id}".`);
  return g;
}

/**
 * Natural "X is a Y" copular translation (handles first-person agreement).
 * Also gender-agrees the Italian complement with the subject's canonical
 * persona gender (§ persona gender agreement) when the complement carries a
 * feminine alternate: Mina and Yuki select `itFeminine`, Ken and every
 * unknown-gender subject (self, generic roles) keep the default `it` form.
 */
export function a1Copular(subjectValueId: string, complementValueId: string): Bilingual {
  const subj = glossOrThrow(A1_SUBJECT_GLOSS, subjectValueId, "subject");
  const comp = glossOrThrow(A1_COMPLEMENT_GLOSS, complementValueId, "complement");
  const first = subjectValueId === "a1-value-watashi";
  const gender = a1SubjectGender(subjectValueId);
  const complementIt = gender === "feminine" && comp.itFeminine !== undefined ? comp.itFeminine : comp.it;
  return {
    en: `${subj.en} ${first ? "am" : "is"} ${comp.en}.`,
    it: `${subj.it} ${first ? "sono" : "è"} ${complementIt}.`,
  };
}

/** Natural "X <verb>s <object>" translation for object/nominative predicates. */
export function a1VerbObject(
  subjectValueId: string,
  senseId: string,
  objectValueId: string,
): Bilingual {
  const subj = glossOrThrow(A1_SUBJECT_GLOSS, subjectValueId, "subject");
  const obj = glossOrThrow(A1_OBJECT_GLOSS, objectValueId, "object");
  const clause = A1_VERB_CLAUSE[senseId];
  if (!clause) throw new Error(`Missing verb clause for "${senseId}".`);
  return {
    en: `${subj.en} ${clause.en(obj.en)}.`,
    it: `${subj.it} ${clause.it(obj.it)}.`,
  };
}

/** The situational scenario note for a context. */
export function a1Scenario(contextId: string): Bilingual {
  return glossOrThrow(A1_CONTEXT_SCENARIO, contextId, "scenario");
}
