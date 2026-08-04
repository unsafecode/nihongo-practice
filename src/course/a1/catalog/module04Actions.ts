/**
 * A1 Module 4 — Everyday actions.
 *
 * Four instructional lessons that make the productive action verbs speakable:
 * present-tense object actions (を), action place (で) and destination (に),
 * companions (と) and recipients (に), and the object-transfer verbs. Subjects
 * are dropped whenever Japanese would drop them (pro-drop first person) and
 * named only when a third party is introduced — never pronoun-stuffed.
 *
 * The two き-spelled verbs are deliberately split across families: 聞く「listen」
 * governs an を object (おんがくをききます) while 聞く「ask」 governs a に recipient
 * (せんせいにききます). They share orthography but are distinct senses with
 * distinct governing rules, so recurrence is tracked per sense, never per
 * spelling.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COMPANION_TO,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_RECIPIENT_NI,
  A1_CONCEPT_TOPIC_WA,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "actions";
const L = (en: string, it: string): Bilingual => ({ en, it });

// `<subject> を <object> <verb>ます` (verb + を object).
const obj = (subject: string, predicate: string, object: string) => ({
  subject,
  predicate,
  object,
});
// `<subject> <place> に/で <verb>ます` (particle read from the sense).
const loc = (subject: string, predicate: string, location: string) => ({
  subject,
  predicate,
  location,
});
// `<subject> <companion> と いきます` (accompany).
const comp = (subject: string, companion: string) => ({
  subject,
  predicate: "a1-value-accompany",
  companion,
});
// `<subject> <recipient> に ききます` (ask).
const ask = (subject: string, recipient: string) => ({
  subject,
  predicate: "a1-value-ask",
  object: recipient,
});

const WATASHI = "a1-value-watashi";
const SELF = "a1-referent-self";

// ---------------------------------------------------------------------------
// Lesson actions-1 — eat / drink / read (を objects)
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "actions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-actions",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO],
  introducedSenseIds: ["a1-sense-eat", "a1-sense-drink", "a1-sense-read"],
  models: [
    { id: "actions-1-m1", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-eat", "a1-value-obj-sushi"), translation: L("Yuki eats sushi.", "Yuki mangia il sushi.") },
    { id: "actions-1-m2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-eat", "a1-value-obj-mikan"), translation: L("I eat a mandarin orange.", "Mangio un mandarino.") },
    { id: "actions-1-m3", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-drink", "a1-value-obj-coffee"), translation: L("I drink coffee.", "Bevo il caffè.") },
    { id: "actions-1-m4", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-drink", "a1-value-obj-coffee"), translation: L("Mina drinks coffee.", "Mina beve il caffè.") },
    { id: "actions-1-m5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-read", "a1-value-obj-book"), translation: L("Yuki reads a book.", "Yuki legge un libro.") },
    { id: "actions-1-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-read", "a1-value-obj-book"), translation: L("I read a book.", "Leggo un libro.") },
    { id: "actions-1-m7", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-eat", "a1-value-obj-bread"), translation: L("Ken eats bread.", "Ken mangia il pane.") },
    { id: "actions-1-m8", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-eat", "a1-value-obj-bread"), translation: L("I eat bread.", "Mangio il pane.") },
  ],
  transfers: [
    { id: "actions-1-t1", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-read", "a1-value-obj-book"), translation: L("Mina reads a book.", "Mina legge un libro.") },
    { id: "actions-1-t2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-eat", "a1-value-obj-sushi"), translation: L("I eat sushi.", "Mangio il sushi.") },
    { id: "actions-1-t3", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-drink", "a1-value-obj-coffee"), translation: L("Ken drinks coffee.", "Ken beve il caffè.") },
    { id: "actions-1-t4", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-read", "a1-value-obj-book"), translation: L("I read a book at the café.", "Leggo un libro al bar.") },
    { id: "actions-1-t5", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-eat", "a1-value-obj-mikan"), translation: L("Mina eats a mandarin orange.", "Mina mangia un mandarino.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson actions-2 — go / come (に destination) + work (で place, reused)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "actions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-actions",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_LOCATION_PARTICLE],
  introducedSenseIds: ["a1-sense-go", "a1-sense-come"],
  models: [
    { id: "actions-2-m1", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: loc("a1-value-yuki", "a1-value-go", "a1-value-loc-station"), translation: L("Yuki goes to the station.", "Yuki va alla stazione.") },
    { id: "actions-2-m2", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-go", "a1-value-loc-school"), translation: L("I go to school.", "Vado a scuola.") },
    { id: "actions-2-m3", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: loc("a1-value-mina", "a1-value-come", "a1-value-loc-library"), translation: L("Mina comes to the library.", "Mina viene in biblioteca.") },
    { id: "actions-2-m4", family: "a1-family-location-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-come", "a1-value-loc-cafe"), translation: L("I come to the café.", "Vengo al caffè.") },
    { id: "actions-2-m5", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: loc("a1-value-ken", "a1-value-go", "a1-value-loc-school"), translation: L("Ken goes to school.", "Ken va a scuola.") },
    { id: "actions-2-m6", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-come", "a1-value-loc-park"), translation: L("I come to the park.", "Vengo al parco.") },
    { id: "actions-2-m7", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: loc("a1-value-ken", "a1-value-work", "a1-value-loc-company"), translation: L("Ken works at the company.", "Ken lavora in azienda.") },
    { id: "actions-2-m8", family: "a1-family-location-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-work", "a1-value-loc-cafe"), translation: L("I work at a café.", "Lavoro in un caffè.") },
  ],
  transfers: [
    { id: "actions-2-t1", family: "a1-family-location-action", context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-go", "a1-value-loc-school"), translation: L("I go to school.", "Vado a scuola.") },
    { id: "actions-2-t2", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: loc("a1-value-yuki", "a1-value-come", "a1-value-loc-library"), translation: L("Yuki comes to the library.", "Yuki viene in biblioteca.") },
    { id: "actions-2-t3", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: loc("a1-value-mina", "a1-value-go", "a1-value-loc-station"), translation: L("Mina goes to the station.", "Mina va alla stazione.") },
    { id: "actions-2-t4", family: "a1-family-location-action", context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-go", "a1-value-loc-restaurant"), translation: L("I go to a restaurant.", "Vado al ristorante.") },
    { id: "actions-2-t5", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: loc("a1-value-mina", "a1-value-work", "a1-value-loc-company"), translation: L("Mina works at the company.", "Mina lavora in azienda.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson actions-3 — accompany (と) / ask (に) / buy (を)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "actions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-actions",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COMPANION_TO,
    A1_CONCEPT_RECIPIENT_NI,
    A1_CONCEPT_OBJECT_WO,
  ],
  introducedSenseIds: ["a1-sense-accompany", "a1-sense-ask", "a1-sense-buy"],
  models: [
    { id: "actions-3-m1", family: "a1-family-companion-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: comp("a1-value-yuki", "a1-value-companion-teacher"), translation: L("Yuki goes with the teacher.", "Yuki va con l'insegnante.") },
    { id: "actions-3-m2", family: "a1-family-recipient-action", context: "a1-context-first-meeting", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-teacher"), translation: L("I ask the teacher.", "Chiedo all'insegnante.") },
    { id: "actions-3-m3", family: "a1-family-recipient-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: ask("a1-value-mina", "a1-value-recipient-teacher"), translation: L("Mina asks the teacher.", "Mina chiede all'insegnante.") },
    { id: "actions-3-m4", family: "a1-family-recipient-action", context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-clerk"), translation: L("I ask the clerk.", "Chiedo al commesso.") },
    { id: "actions-3-m5", family: "a1-family-object-action", context: "a1-context-shop", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-buy", "a1-value-obj-book"), translation: L("Ken buys a book.", "Ken compra un libro.") },
    { id: "actions-3-m6", family: "a1-family-object-action", context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-buy", "a1-value-obj-bread"), translation: L("I buy bread.", "Compro il pane.") },
    { id: "actions-3-m7", family: "a1-family-companion-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "omitted", slots: comp("a1-value-ken", "a1-value-companion-classmate"), translation: L("Ken goes with a classmate.", "Ken va con un compagno di classe.") },
    { id: "actions-3-m8", family: "a1-family-object-action", context: "a1-context-shop", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: obj("a1-value-classmate-subject", "a1-value-buy", "a1-value-obj-coffee"), translation: L("The classmate buys coffee.", "Il compagno di classe compra il caffè.") },
  ],
  transfers: [
    { id: "actions-3-t1", family: "a1-family-companion-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: comp("a1-value-mina", "a1-value-companion-classmate"), translation: L("Mina goes with a classmate.", "Mina va con un compagno di classe.") },
    { id: "actions-3-t2", family: "a1-family-recipient-action", context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-teacher"), translation: L("I ask the teacher.", "Chiedo all'insegnante.") },
    { id: "actions-3-t3", family: "a1-family-object-action", context: "a1-context-shop", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-buy", "a1-value-obj-book"), translation: L("Mina buys a book.", "Mina compra un libro.") },
    { id: "actions-3-t4", family: "a1-family-recipient-action", context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: ask(WATASHI, "a1-value-recipient-clerk"), translation: L("I ask the clerk.", "Chiedo al commesso.") },
    { id: "actions-3-t5", family: "a1-family-object-action", context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-buy", "a1-value-obj-book"), translation: L("I buy a book.", "Compro un libro.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson actions-4 — see / listen / write (を) + read (reused)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "actions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-actions",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO],
  introducedSenseIds: ["a1-sense-see", "a1-sense-listen", "a1-sense-write"],
  models: [
    { id: "actions-4-m1", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-see", "a1-value-obj-movie"), translation: L("Yuki watches a movie.", "Yuki guarda un film.") },
    { id: "actions-4-m2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-see", "a1-value-obj-tv"), translation: L("I watch TV.", "Guardo la TV.") },
    { id: "actions-4-m3", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-listen", "a1-value-obj-music"), translation: L("Mina listens to music.", "Mina ascolta la musica.") },
    { id: "actions-4-m4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-listen", "a1-value-obj-music"), translation: L("I listen to music.", "Ascolto la musica.") },
    { id: "actions-4-m5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-write", "a1-value-obj-letter"), translation: L("Ken writes a letter.", "Ken scrive una lettera.") },
    { id: "actions-4-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-write", "a1-value-obj-letter"), translation: L("I write a letter.", "Scrivo una lettera.") },
    { id: "actions-4-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-read", "a1-value-obj-book"), translation: L("Yuki reads a book.", "Yuki legge un libro.") },
    { id: "actions-4-m8", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-see", "a1-value-obj-movie"), translation: L("I watch a movie.", "Guardo un film.") },
  ],
  transfers: [
    { id: "actions-4-t1", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-listen", "a1-value-obj-music"), translation: L("Ken listens to music.", "Ken ascolta la musica.") },
    { id: "actions-4-t2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-see", "a1-value-obj-tv"), translation: L("Mina watches TV.", "Mina guarda la TV.") },
    { id: "actions-4-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-write", "a1-value-obj-letter"), translation: L("Yuki writes a letter.", "Yuki scrive una lettera.") },
    { id: "actions-4-t4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-read", "a1-value-obj-book"), translation: L("I read a book.", "Leggo un libro.") },
    { id: "actions-4-t5", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-see", "a1-value-obj-movie"), translation: L("Mina watches a movie.", "Mina guarda un film.") },
  ],
});

// ---------------------------------------------------------------------------
// Verb-use records — every verb introduced in this module gets >=2 structural
// intro variants (an explicit-subject and an omitted-subject realization) plus
// a correctness-bearing round-one exercise target. `laterUses` is intentionally
// omitted: later cross-lesson reuse is authored in subsequent tasks, so this
// module makes no false claim of reuse yet.
// ---------------------------------------------------------------------------

export const module4VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-eat", introductionLessonId: "actions-1", introductionVariantIds: ["actions-1-m1", "actions-1-m2"], exerciseRoundId: "actions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-drink", introductionLessonId: "actions-1", introductionVariantIds: ["actions-1-m4", "actions-1-m3"], exerciseRoundId: "actions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-1-m4" }),
  a1VerbUseRecord({ senseId: "a1-sense-read", introductionLessonId: "actions-1", introductionVariantIds: ["actions-1-m5", "actions-1-m6"], exerciseRoundId: "actions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-1-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-go", introductionLessonId: "actions-2", introductionVariantIds: ["actions-2-m1", "actions-2-m2"], exerciseRoundId: "actions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-2-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-come", introductionLessonId: "actions-2", introductionVariantIds: ["actions-2-m3", "actions-2-m4"], exerciseRoundId: "actions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-2-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-accompany", introductionLessonId: "actions-3", introductionVariantIds: ["actions-3-m1", "actions-3-m7"], exerciseRoundId: "actions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-3-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-ask", introductionLessonId: "actions-3", introductionVariantIds: ["actions-3-m3", "actions-3-m4"], exerciseRoundId: "actions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-3-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-buy", introductionLessonId: "actions-3", introductionVariantIds: ["actions-3-m5", "actions-3-m6"], exerciseRoundId: "actions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-3-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-see", introductionLessonId: "actions-4", introductionVariantIds: ["actions-4-m1", "actions-4-m2"], exerciseRoundId: "actions-4-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-4-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-listen", introductionLessonId: "actions-4", introductionVariantIds: ["actions-4-m3", "actions-4-m4"], exerciseRoundId: "actions-4-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-4-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-write", introductionLessonId: "actions-4", introductionVariantIds: ["actions-4-m5", "actions-4-m6"], exerciseRoundId: "actions-4-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "actions-4-m5" }),
];

// ---------------------------------------------------------------------------
// Module recipe and aggregates
// ---------------------------------------------------------------------------

export const module4Lessons: readonly A1BuiltLesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
];

export const module4Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});
