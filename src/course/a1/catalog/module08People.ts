/**
 * A1 Module 8 — Family and people.
 *
 * Four instructional lessons that let the learner talk about the people around
 * them: kin copula (own-family plain 母/父 vs other-family honorific お母さん/
 * お父さん — never the reverse), roles and personal info with shared family
 * routines, shared actions and invitations (companion と, person-target に), and
 * reciprocal social details. No new verb senses are introduced — every line
 * reuses an already-productive sense (be / live / drink / study / do / write /
 * the routine framings / accompany / ask / buy / see / listen), so the module
 * closes the A1 recurrence timeline. The own/other honorific split lives in the
 * kin subject value (plain vs -hon), never in a misapplied honorific verb.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COMPANION_TO,
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_FREQUENCY,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_RECIPIENT_NI,
  A1_CONCEPT_TIME_SCHEDULE,
  A1_CONCEPT_TOPIC_WA,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "people";
const L = (en: string, it: string): Bilingual => ({ en, it });

const COP = "a1-family-topic-copular";
const OBJ = "a1-family-object-action";
const LOCF = "a1-family-location-action";
const SCHED = "a1-family-schedule-action";
const ADV = "a1-family-adverbial-time-action";
const COMPF = "a1-family-companion-action";
const RECF = "a1-family-recipient-action";

const WATASHI = "a1-value-watashi";
const SELF = "a1-referent-self";
const PERSON = "a1-referent-person";
const R_YUKI = "a1-role-yuki";
const R_KEN = "a1-role-ken";
const R_MINA = "a1-role-mina";

const cop = (subject: string, object: string) => ({ subject, predicate: "a1-value-be", object });
const obj = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });
const loc = (subject: string, predicate: string, location: string) => ({ subject, predicate, location });
const timed = (subject: string, predicate: string, time: string) => ({ subject, predicate, time });
const comp = (subject: string, companion: string) => ({ subject, predicate: "a1-value-accompany", companion });
const ask = (subject: string, recipient: string) => ({ subject, predicate: "a1-value-ask", object: recipient });

// ---------------------------------------------------------------------------
// Lesson people-1 — kin copula: own-family plain vs other-family honorific
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "people-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-people",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COPULA_DESU, A1_CONCEPT_OBJECT_WO, A1_CONCEPT_LOCATION_PARTICLE],
  introducedSenseIds: ["a1-sense-be", "a1-sense-drink", "a1-sense-live"],
  models: [
    { id: "people-1-m1", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", slots: cop("a1-value-kin-mother", "a1-value-obj-teacher"), translation: L("My mother is a teacher.", "Mia madre è insegnante.") },
    { id: "people-1-m2", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", slots: cop("a1-value-kin-father", "a1-value-obj-doctor"), translation: L("My father is a doctor.", "Mio padre è medico.") },
    { id: "people-1-m3", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_YUKI, slots: cop("a1-value-kin-mother-hon", "a1-value-obj-teacher"), translation: L("Your mother is a teacher.", "Tua madre è insegnante.") },
    { id: "people-1-m4", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_KEN, slots: cop("a1-value-kin-father-hon", "a1-value-obj-office-worker"), translation: L("Your father is an office worker.", "Tuo padre è un impiegato.") },
    { id: "people-1-m5", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-mother", "a1-value-drink", "a1-value-obj-coffee"), translation: L("My mother drinks coffee.", "Mia madre beve il caffè.") },
    { id: "people-1-m6", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_MINA, slots: obj("a1-value-kin-older-brother", "a1-value-drink", "a1-value-obj-tea"), translation: L("My older brother drinks tea.", "Mio fratello maggiore beve il tè.") },
    { id: "people-1-m7", family: LOCF, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: loc("a1-value-kin-father", "a1-value-live", "a1-value-loc-tokyo"), translation: L("My father lives in Tokyo.", "Mio padre vive a Tokyo.") },
    { id: "people-1-m8", family: LOCF, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: loc("a1-value-kin-older-sister", "a1-value-live", "a1-value-loc-osaka"), translation: L("My older sister lives in Osaka.", "Mia sorella maggiore vive a Osaka.") },
  ],
  transfers: [
    { id: "people-1-t1", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", slots: cop("a1-value-kin-father", "a1-value-obj-teacher"), translation: L("My father is a teacher.", "Mio padre è insegnante.") },
    { id: "people-1-t2", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_YUKI, slots: cop("a1-value-kin-mother-hon", "a1-value-obj-doctor"), translation: L("Your mother is a doctor.", "Tua madre è medico.") },
    { id: "people-1-t3", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-older-brother", "a1-value-drink", "a1-value-obj-coffee"), translation: L("My older brother drinks coffee.", "Mio fratello maggiore beve il caffè.") },
    { id: "people-1-t4", family: LOCF, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: loc("a1-value-kin-mother", "a1-value-live", "a1-value-loc-tokyo"), translation: L("My mother lives in Tokyo.", "Mia madre vive a Tokyo.") },
    { id: "people-1-t5", family: COP, context: "a1-context-family", subjectReferent: PERSON, subjectRealization: "explicit", slots: cop("a1-value-kin-older-sister", "a1-value-obj-office-worker"), translation: L("My older sister is an office worker.", "Mia sorella maggiore è un'impiegata.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson people-2 — roles / personal info and shared family routines
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "people-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-people",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_LOCATION_PARTICLE, A1_CONCEPT_OBJECT_WO, A1_CONCEPT_TIME_SCHEDULE, A1_CONCEPT_FREQUENCY],
  introducedSenseIds: ["a1-sense-live", "a1-sense-study", "a1-sense-do", "a1-sense-write", "a1-sense-study-routine", "a1-sense-eat-routine", "a1-sense-read-routine"],
  models: [
    { id: "people-2-m1", family: LOCF, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: loc("a1-value-kin-father", "a1-value-live", "a1-value-loc-tokyo"), translation: L("My father lives in Tokyo.", "Mio padre vive a Tokyo.") },
    { id: "people-2-m2", family: OBJ, context: "a1-context-classroom", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-mother", "a1-value-study", "a1-value-obj-japanese"), translation: L("My mother studies Japanese.", "Mia madre studia il giapponese.") },
    { id: "people-2-m3", family: OBJ, context: "a1-context-classroom", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_YUKI, slots: obj("a1-value-kin-older-brother", "a1-value-do", "a1-value-obj-homework"), translation: L("My older brother does the homework.", "Mio fratello maggiore fa i compiti.") },
    { id: "people-2-m4", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-older-sister", "a1-value-write", "a1-value-obj-letter"), translation: L("My older sister writes a letter.", "Mia sorella maggiore scrive una lettera.") },
    { id: "people-2-m5", family: SCHED, context: "a1-context-weekday-study", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_KEN, slots: timed("a1-value-kin-younger-brother", "a1-value-study-routine", "a1-value-day-monday"), translation: L("My younger brother studies on Monday.", "Mio fratello minore studia il lunedì.") },
    { id: "people-2-m6", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_MINA, slots: timed("a1-value-kin-younger-sister", "a1-value-eat-routine", "a1-value-seq-morning"), translation: L("My younger sister eats in the morning.", "Mia sorella minore mangia la mattina.") },
    { id: "people-2-m7", family: ADV, context: "a1-context-evening-reading", subjectReferent: PERSON, subjectRealization: "explicit", slots: timed("a1-value-kin-father", "a1-value-read-routine", "a1-value-seq-night"), translation: L("My father reads at night.", "Mio padre legge la sera.") },
    { id: "people-2-m8", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-mother", "a1-value-write", "a1-value-obj-letter"), translation: L("My mother writes a letter.", "Mia madre scrive una lettera.") },
  ],
  transfers: [
    { id: "people-2-t1", family: LOCF, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: loc("a1-value-kin-mother", "a1-value-live", "a1-value-loc-tokyo"), translation: L("My mother lives in Tokyo.", "Mia madre vive a Tokyo.") },
    { id: "people-2-t2", family: OBJ, context: "a1-context-classroom", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-father", "a1-value-study", "a1-value-obj-japanese"), translation: L("My father studies Japanese.", "Mio padre studia il giapponese.") },
    { id: "people-2-t3", family: OBJ, context: "a1-context-home", subjectReferent: PERSON, subjectRealization: "explicit", slots: obj("a1-value-kin-older-sister", "a1-value-do", "a1-value-obj-homework"), translation: L("My older sister does the homework.", "Mia sorella maggiore fa i compiti.") },
    { id: "people-2-t4", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: PERSON, subjectRealization: "explicit", speakerRole: R_KEN, slots: timed("a1-value-kin-younger-brother", "a1-value-eat-routine", "a1-value-seq-morning"), translation: L("My younger brother eats in the morning.", "Mio fratello minore mangia la mattina.") },
    { id: "people-2-t5", family: ADV, context: "a1-context-evening-reading", subjectReferent: PERSON, subjectRealization: "explicit", slots: timed("a1-value-kin-older-brother", "a1-value-read-routine", "a1-value-seq-night"), translation: L("My older brother reads at night.", "Mio fratello maggiore legge la sera.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson people-3 — shared actions and invitations (companion と, target に)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "people-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-people",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COMPANION_TO, A1_CONCEPT_RECIPIENT_NI, A1_CONCEPT_OBJECT_WO],
  introducedSenseIds: ["a1-sense-accompany", "a1-sense-ask", "a1-sense-see"],
  models: [
    { id: "people-3-m1", family: COMPF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: comp(WATASHI, "a1-value-companion-friend"), translation: L("I go with a friend.", "Vado con un amico.") },
    { id: "people-3-m2", family: COMPF, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: comp("a1-value-yuki", "a1-value-companion-child"), translation: L("Yuki goes with a child.", "Yuki va con un bambino.") },
    { id: "people-3-m3", family: RECF, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-person"), translation: L("I ask someone.", "Chiedo a qualcuno.") },
    { id: "people-3-m4", family: RECF, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: ask("a1-value-ken", "a1-value-recipient-friend"), translation: L("Ken asks a friend.", "Ken chiede a un amico.") },
    { id: "people-3-m5", family: COMPF, context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: comp("a1-value-mina", "a1-value-companion-family"), translation: L("Mina goes with her family.", "Mina va con la sua famiglia.") },
    { id: "people-3-m6", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-see", "a1-value-obj-movie"), translation: L("I watch a movie.", "Guardo un film.") },
    { id: "people-3-m7", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-see", "a1-value-obj-movie"), translation: L("Yuki watches a movie.", "Yuki guarda un film.") },
    { id: "people-3-m8", family: RECF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-clerk"), translation: L("I ask the clerk.", "Chiedo al commesso.") },
  ],
  transfers: [
    { id: "people-3-t1", family: COMPF, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: comp("a1-value-ken", "a1-value-companion-friend"), translation: L("Ken goes with a friend.", "Ken va con un amico.") },
    { id: "people-3-t2", family: COMPF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: comp(WATASHI, "a1-value-companion-child"), translation: L("I go with a child.", "Vado con un bambino.") },
    { id: "people-3-t3", family: RECF, context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: ask("a1-value-mina", "a1-value-recipient-person"), translation: L("Mina asks someone.", "Mina chiede a qualcuno.") },
    { id: "people-3-t4", family: RECF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-friend"), translation: L("I ask a friend.", "Chiedo a un amico.") },
    { id: "people-3-t5", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-see", "a1-value-obj-movie"), translation: L("Ken watches a movie.", "Ken guarda un film.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson people-4 — reciprocal social details (buy / see / listen together)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "people-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-people",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO],
  introducedSenseIds: ["a1-sense-buy", "a1-sense-see", "a1-sense-listen"],
  models: [
    { id: "people-4-m1", family: OBJ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-buy", "a1-value-obj-ramen"), translation: L("I buy ramen.", "Compro il ramen.") },
    { id: "people-4-m2", family: OBJ, context: "a1-context-shop", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-buy", "a1-value-obj-ticket"), translation: L("Yuki buys a ticket.", "Yuki compra un biglietto.") },
    { id: "people-4-m3", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-see", "a1-value-obj-movie"), translation: L("I watch a movie.", "Guardo un film.") },
    { id: "people-4-m4", family: OBJ, context: "a1-context-home", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-see", "a1-value-obj-tv"), translation: L("Ken watches TV.", "Ken guarda la TV.") },
    { id: "people-4-m5", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-listen", "a1-value-obj-music"), translation: L("Mina listens to music.", "Mina ascolta la musica.") },
    { id: "people-4-m6", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-listen", "a1-value-obj-music"), translation: L("I listen to music.", "Ascolto la musica.") },
    { id: "people-4-m7", family: OBJ, context: "a1-context-shop", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-buy", "a1-value-obj-bag"), translation: L("Yuki buys a bag.", "Yuki compra una borsa.") },
    { id: "people-4-m8", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-see", "a1-value-obj-money"), translation: L("Mina looks at the money.", "Mina guarda il denaro.") },
  ],
  transfers: [
    { id: "people-4-t1", family: OBJ, context: "a1-context-shop", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-buy", "a1-value-obj-ramen"), translation: L("Ken buys ramen.", "Ken compra il ramen.") },
    { id: "people-4-t2", family: OBJ, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-see", "a1-value-obj-tv"), translation: L("I watch TV.", "Guardo la TV.") },
    { id: "people-4-t3", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-listen", "a1-value-obj-music"), translation: L("Yuki listens to music.", "Yuki ascolta la musica.") },
    { id: "people-4-t4", family: OBJ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-buy", "a1-value-obj-bag"), translation: L("I buy a bag.", "Compro una borsa.") },
    { id: "people-4-t5", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-listen", "a1-value-obj-music"), translation: L("Ken listens to music.", "Ken ascolta la musica.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe and aggregates. Module 8 introduces no new senses; the closing
// reuse timeline is authored in `recurrence.ts`.
// ---------------------------------------------------------------------------

export const module8Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module8Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

export const module8VerbUseRecords: readonly VerbUseRecord[] = [];
