/**
 * A1 Module 11 — Existence & needs.
 *
 * Four instructional lessons that let a learner say what there is and what they
 * need: presentational existence with the animacy split (`ほん が あります` vs.
 * `ねこ が います`), position phrases (`つくえ の うえ に あります`), desire
 * (`… が ほしい です`), and a locate/resolve recap. あります vs. います is chosen
 * generically from each sense's `requiredSubjectAnimacy`, never from an authored
 * Japanese-string switch; the position noun is a に-marked adjunct.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_EXISTENCE,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "existence-needs";
const L = (en: string, it: string): Bilingual => ({ en, it });

const EXIST = "a1-family-existence";
const DESC = "a1-family-description";
const PREF = "a1-family-preference";

const THING = "a1-referent-thing";
const CREATURE = "a1-referent-creature";
const SELF = "a1-referent-self";

// Existence `<entity>が (<place>に) あります/います`.
const exist = (subject: string, predicate: string, location?: string): Record<string, string> =>
  location === undefined ? { subject, predicate } : { subject, predicate, location };
// Adjectival description `<subject>は <adj>です`.
const desc = (subject: string, predicate: string) => ({ subject, predicate });
// Desire/preference `<subject>は <object>が <adj>です`.
const pref = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });

const ARU = "a1-value-exist-inanimate";
const IRU = "a1-value-exist-animate";

// ---------------------------------------------------------------------------
// Lesson existence-needs-1 — animacy: "… が あります" vs. "… が います"
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "existence-needs-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-existence",
  supportingCanDoIds: ["a1-can-do-descriptions"],
  introducedConceptIds: [A1_CONCEPT_EXISTENCE],
  introducedSenseIds: ["a1-sense-exist-inanimate", "a1-sense-exist-animate"],
  models: [
    { id: "existence-needs-1-m1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU), translation: L("There is a book.", "C'è un libro.") },
    { id: "existence-needs-1-m2", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-on-desk"), translation: L("There is a book on the desk.", "C'è un libro sulla scrivania.") },
    { id: "existence-needs-1-m3", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU), translation: L("There is a cat.", "C'è un gatto.") },
    { id: "existence-needs-1-m4", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-under-chair"), translation: L("There is a cat under the chair.", "C'è un gatto sotto la sedia.") },
    { id: "existence-needs-1-m5", family: EXIST, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: exist("a1-value-ex-key", ARU), translation: L("There is a key.", "C'è una chiave.") },
    { id: "existence-needs-1-m6", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: exist("a1-value-ex-dog", IRU), translation: L("There is a dog.", "C'è un cane.") },
    { id: "existence-needs-1-m7", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-machi", "a1-value-big"), translation: L("The town is big.", "La città è grande.") },
    { id: "existence-needs-1-m8", family: EXIST, context: "a1-context-classroom", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-child", IRU), translation: L("There is a child.", "C'è un bambino.") },
  ],
  transfers: [
    { id: "existence-needs-1-t1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-under-chair"), translation: L("There is a book under the chair.", "C'è un libro sotto la sedia.") },
    { id: "existence-needs-1-t2", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-on-desk"), translation: L("There is a cat on the desk.", "C'è un gatto sulla scrivania.") },
    { id: "existence-needs-1-t3", family: EXIST, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-on-desk"), translation: L("There is a key on the desk.", "C'è una chiave sulla scrivania.") },
    { id: "existence-needs-1-t4", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-under-chair"), translation: L("There is a dog under the chair.", "C'è un cane sotto la sedia.") },
    { id: "existence-needs-1-t5", family: EXIST, context: "a1-context-classroom", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: exist("a1-value-ex-child", IRU, "a1-value-loc-under-chair"), translation: L("There is a child under the chair.", "C'è un bambino sotto la sedia.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson existence-needs-2 — positions: "… が <place> に あります/います"
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "existence-needs-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-existence",
  supportingCanDoIds: [],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "existence-needs-2-m1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-on-desk"), translation: L("The book is on the desk.", "Il libro è sulla scrivania.") },
    { id: "existence-needs-2-m2", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-pen", ARU, "a1-value-loc-in-bag"), translation: L("The pen is in the bag.", "La penna è nella borsa.") },
    { id: "existence-needs-2-m3", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-under-chair"), translation: L("The cat is under the chair.", "Il gatto è sotto la sedia.") },
    { id: "existence-needs-2-m4", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-near-station"), translation: L("The dog is near the station.", "Il cane è vicino alla stazione.") },
    { id: "existence-needs-2-m5", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-in-bag"), translation: L("The key is in the bag.", "La chiave è nella borsa.") },
    { id: "existence-needs-2-m6", family: EXIST, context: "a1-context-station", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-child", IRU, "a1-value-loc-near-station"), translation: L("The child is near the station.", "Il bambino è vicino alla stazione.") },
    { id: "existence-needs-2-m7", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-heya", "a1-value-big"), translation: L("The room is big.", "La stanza è grande.") },
    { id: "existence-needs-2-m8", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
  ],
  transfers: [
    { id: "existence-needs-2-t1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-pen", ARU, "a1-value-loc-on-desk"), translation: L("The pen is on the desk.", "La penna è sulla scrivania.") },
    { id: "existence-needs-2-t2", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-in-bag"), translation: L("The book is in the bag.", "Il libro è nella borsa.") },
    { id: "existence-needs-2-t3", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-near-station"), translation: L("The cat is near the station.", "Il gatto è vicino alla stazione.") },
    { id: "existence-needs-2-t4", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-under-chair"), translation: L("The dog is under the chair.", "Il cane è sotto la sedia.") },
    { id: "existence-needs-2-t5", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-on-desk"), translation: L("The key is on the desk.", "La chiave è sulla scrivania.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson existence-needs-3 — needs & wants: "… が ほしい です"
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "existence-needs-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-existence",
  supportingCanDoIds: ["a1-can-do-descriptions"],
  introducedConceptIds: [],
  introducedSenseIds: ["a1-sense-want"],
  models: [
    { id: "existence-needs-3-m1", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-money"), translation: L("I want money.", "Voglio dei soldi.") },
    { id: "existence-needs-3-m2", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-water"), translation: L("I want water.", "Voglio dell'acqua.") },
    { id: "existence-needs-3-m3", family: PREF, context: "a1-context-station", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: pref("a1-value-yuki", "a1-value-want", "a1-value-obj-ticket"), translation: L("Yuki wants a ticket.", "Yuki vuole un biglietto.") },
    { id: "existence-needs-3-m4", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-apple"), translation: L("I want an apple.", "Voglio una mela.") },
    { id: "existence-needs-3-m5", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "existence-needs-3-m6", family: PREF, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: pref("a1-value-ken", "a1-value-like", "a1-value-obj-sushi"), translation: L("Ken likes sushi.", "A Ken piace il sushi.") },
    { id: "existence-needs-3-m7", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-water"), translation: L("I dislike water.", "Non mi piace l'acqua.") },
    { id: "existence-needs-3-m8", family: EXIST, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: exist("a1-value-ex-book", ARU), translation: L("There is a book.", "C'è un libro.") },
  ],
  transfers: [
    { id: "existence-needs-3-t1", family: PREF, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-ticket"), translation: L("I want a ticket.", "Voglio un biglietto.") },
    { id: "existence-needs-3-t2", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-coffee"), translation: L("I want coffee.", "Voglio del caffè.") },
    { id: "existence-needs-3-t3", family: PREF, context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: pref("a1-value-yuki", "a1-value-like", "a1-value-obj-apple"), translation: L("Yuki likes apples.", "A Yuki piacciono le mele.") },
    { id: "existence-needs-3-t4", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-sushi"), translation: L("I dislike sushi.", "Non mi piace il sushi.") },
    { id: "existence-needs-3-t5", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-money"), translation: L("I like money.", "Mi piacciono i soldi.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson existence-needs-4 — locate & resolve recap (reuse only)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "existence-needs-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-existence",
  supportingCanDoIds: [],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "existence-needs-4-m1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-on-desk"), translation: L("The book is on the desk.", "Il libro è sulla scrivania.") },
    { id: "existence-needs-4-m2", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-under-chair"), translation: L("The cat is under the chair.", "Il gatto è sotto la sedia.") },
    { id: "existence-needs-4-m3", family: PREF, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-ticket"), translation: L("I want a ticket.", "Voglio un biglietto.") },
    { id: "existence-needs-4-m4", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-in-bag"), translation: L("The key is in the bag.", "La chiave è nella borsa.") },
    { id: "existence-needs-4-m5", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-near-station"), translation: L("The dog is near the station.", "Il cane è vicino alla stazione.") },
    { id: "existence-needs-4-m6", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-money"), translation: L("I want money.", "Voglio dei soldi.") },
    { id: "existence-needs-4-m7", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-heya", "a1-value-big"), translation: L("The room is big.", "La stanza è grande.") },
    { id: "existence-needs-4-m8", family: EXIST, context: "a1-context-classroom", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-child", IRU), translation: L("There is a child.", "C'è un bambino.") },
  ],
  transfers: [
    { id: "existence-needs-4-t1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-in-bag"), translation: L("The book is in the bag.", "Il libro è nella borsa.") },
    { id: "existence-needs-4-t2", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-near-station"), translation: L("The cat is near the station.", "Il gatto è vicino alla stazione.") },
    { id: "existence-needs-4-t3", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-on-desk"), translation: L("The key is on the desk.", "La chiave è sulla scrivania.") },
    { id: "existence-needs-4-t4", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-under-chair"), translation: L("The dog is under the chair.", "Il cane è sotto la sedia.") },
    { id: "existence-needs-4-t5", family: EXIST, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-child", IRU, "a1-value-loc-near-station"), translation: L("The child is near the station.", "Il bambino è vicino alla stazione.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe, aggregates, and productive-sense introduction records
// ---------------------------------------------------------------------------

export const module11Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module11Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

/** Productive senses first introduced in Module 11 (the two existence verbs and
 *  the desire adjective), each with two structurally-distinct intro variants
 *  (bare vs. positioned for existence; explicit vs. pro-dropped for want) and a
 *  correctness-bearing intro exercise. `laterUses` stays empty; the spaced reuse
 *  timeline is authored immutably in `recurrence.ts`. */
export const module11VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-exist-inanimate", introductionLessonId: "existence-needs-1", introductionVariantIds: ["existence-needs-1-m1", "existence-needs-1-m2"], exerciseRoundId: "existence-needs-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "existence-needs-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-exist-animate", introductionLessonId: "existence-needs-1", introductionVariantIds: ["existence-needs-1-m3", "existence-needs-1-m4"], exerciseRoundId: "existence-needs-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "existence-needs-1-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-want", introductionLessonId: "existence-needs-3", introductionVariantIds: ["existence-needs-3-m1", "existence-needs-3-m2"], exerciseRoundId: "existence-needs-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "existence-needs-3-m1" }),
];
