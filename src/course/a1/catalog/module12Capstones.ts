/**
 * A1 Module 12 — Capstone synthesis scenarios.
 *
 * Four synthesis lessons that recombine *already-taught* A1 content into short,
 * realistic exchanges: a shopping trip, home & weather small-talk, finding
 * things around the house, and a topic-changing café chat. These lessons
 * introduce **no** new concept, sense, semantic value, form, role, or context —
 * every model and transfer is assembled from senses first taught in Modules
 * 2-11 — so their `introducedConceptIds` / `introducedSenseIds` are empty (the
 * `"synthesis"` contract enforces this). They also serve as the authored later,
 * spaced reuse home for every productive sense introduced in Modules 9-11: each
 * such sense appears in ≥2 capstone models, wired into `recurrence.ts`.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";

const MODULE_ID = "capstones";
const L = (en: string, it: string): Bilingual => ({ en, it });

const DESC = "a1-family-description";
const PREF = "a1-family-preference";
const REQ = "a1-family-request";
const QUANT = "a1-family-quantified-action";
const EXIST = "a1-family-existence";

const THING = "a1-referent-thing";
const CREATURE = "a1-referent-creature";
const SELF = "a1-referent-self";

const ARU = "a1-value-exist-inanimate";
const IRU = "a1-value-exist-animate";

const desc = (subject: string, predicate: string) => ({ subject, predicate });
const pref = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });
const req = (object: string, quantity?: string): Record<string, string> =>
  quantity === undefined
    ? { subject: "a1-value-watashi", predicate: "a1-value-request", object }
    : { subject: "a1-value-watashi", predicate: "a1-value-request", object, quantity };
const qa = (subject: string, predicate: string, object: string, quantity: string) => ({ subject, predicate, object, quantity });
const exist = (subject: string, predicate: string, location?: string): Record<string, string> =>
  location === undefined ? { subject, predicate } : { subject, predicate, location };

// ---------------------------------------------------------------------------
// Lesson capstones-1 — a shopping trip (scenario-1)
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-1",
  moduleId: MODULE_ID,
  order: 1,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-1",
  supportingCanDoIds: ["a1-can-do-shopping", "a1-can-do-existence"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-1-m1", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-water"), translation: L("Water, please.", "Dell'acqua, per favore.") },
    { id: "capstones-1-m2", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-apple", "a1-value-qty-3"), translation: L("Three apples, please.", "Tre mele, per favore.") },
    { id: "capstones-1-m3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "capstones-1-m4", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
    { id: "capstones-1-m5", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "capstones-1-m6", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-money"), translation: L("I want money.", "Voglio dei soldi.") },
    { id: "capstones-1-m7", family: EXIST, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: exist("a1-value-ex-book", ARU), translation: L("There is a book.", "C'è un libro.") },
    { id: "capstones-1-m8", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-mikan", "a1-value-qty-2"), translation: L("I buy two tangerines.", "Compro due mandarini.") },
  ],
  transfers: [
    { id: "capstones-1-t1", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-coffee"), translation: L("Coffee, please.", "Un caffè, per favore.") },
    { id: "capstones-1-t2", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-cheap"), translation: L("The book is cheap.", "Il libro è economico.") },
    { id: "capstones-1-t3", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-mikan"), translation: L("I like tangerines.", "Mi piacciono i mandarini.") },
    { id: "capstones-1-t4", family: EXIST, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: exist("a1-value-ex-pen", ARU), translation: L("There is a pen.", "C'è una penna.") },
    { id: "capstones-1-t5", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-2"), translation: L("I buy two apples.", "Compro due mele.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-2 — home & weather small-talk (scenario-2)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-2",
  moduleId: MODULE_ID,
  order: 2,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-2",
  supportingCanDoIds: ["a1-can-do-descriptions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-2-m1", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
    { id: "capstones-2-m2", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-cold"), translation: L("Today is cold.", "Oggi fa freddo.") },
    { id: "capstones-2-m3", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
    { id: "capstones-2-m4", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-heya", "a1-value-big"), translation: L("The room is big.", "La stanza è grande.") },
    { id: "capstones-2-m5", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: desc("a1-value-heya", "a1-value-small"), translation: L("The room is small.", "La stanza è piccola.") },
    { id: "capstones-2-m6", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "capstones-2-m7", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-water"), translation: L("I dislike water.", "Non mi piace l'acqua.") },
    { id: "capstones-2-m8", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-water"), translation: L("I want water.", "Voglio dell'acqua.") },
  ],
  transfers: [
    { id: "capstones-2-t1", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-machi", "a1-value-big"), translation: L("The town is big.", "La città è grande.") },
    { id: "capstones-2-t2", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-heya", "a1-value-quiet"), translation: L("The room is quiet.", "La stanza è tranquilla.") },
    { id: "capstones-2-t3", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-water"), translation: L("I like water.", "Mi piace l'acqua.") },
    { id: "capstones-2-t4", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-coffee"), translation: L("I dislike coffee.", "Non mi piace il caffè.") },
    { id: "capstones-2-t5", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-coffee"), translation: L("I want coffee.", "Voglio del caffè.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-3 — finding things at home (scenario-3)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-3",
  moduleId: MODULE_ID,
  order: 3,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-3",
  supportingCanDoIds: ["a1-can-do-existence", "a1-can-do-descriptions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-3-m1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-on-desk"), translation: L("The book is on the desk.", "Il libro è sulla scrivania.") },
    { id: "capstones-3-m2", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU), translation: L("There is a cat.", "C'è un gatto.") },
    { id: "capstones-3-m3", family: EXIST, context: "a1-context-station", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: exist("a1-value-ex-dog", IRU, "a1-value-loc-near-station"), translation: L("The dog is near the station.", "Il cane è vicino alla stazione.") },
    { id: "capstones-3-m4", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-money"), translation: L("I want money.", "Voglio dei soldi.") },
    { id: "capstones-3-m5", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-heya", "a1-value-big"), translation: L("The room is big.", "La stanza è grande.") },
    { id: "capstones-3-m6", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-heya", "a1-value-small"), translation: L("The room is small.", "La stanza è piccola.") },
    { id: "capstones-3-m7", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-water"), translation: L("I dislike water.", "Non mi piace l'acqua.") },
    { id: "capstones-3-m8", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-in-bag"), translation: L("The key is in the bag.", "La chiave è nella borsa.") },
  ],
  transfers: [
    { id: "capstones-3-t1", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-book", ARU, "a1-value-loc-in-bag"), translation: L("The book is in the bag.", "Il libro è nella borsa.") },
    { id: "capstones-3-t2", family: EXIST, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: exist("a1-value-ex-cat", IRU, "a1-value-loc-on-desk"), translation: L("The cat is on the desk.", "Il gatto è sulla scrivania.") },
    { id: "capstones-3-t3", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-water"), translation: L("I want water.", "Voglio dell'acqua.") },
    { id: "capstones-3-t4", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-money"), translation: L("I dislike money.", "Non mi piacciono i soldi.") },
    { id: "capstones-3-t5", family: EXIST, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: exist("a1-value-ex-key", ARU, "a1-value-loc-on-desk"), translation: L("The key is on the desk.", "La chiave è sulla scrivania.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-4 — changing the topic at a café (scenario-4)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-4",
  moduleId: MODULE_ID,
  order: 4,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-4",
  supportingCanDoIds: ["a1-can-do-shopping", "a1-can-do-descriptions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-4-m1", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-sushi"), translation: L("I like sushi.", "Mi piace il sushi.") },
    { id: "capstones-4-m2", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-coffee"), translation: L("Coffee, please.", "Un caffè, per favore.") },
    { id: "capstones-4-m3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "capstones-4-m4", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
    { id: "capstones-4-m5", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
    { id: "capstones-4-m6", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-cold"), translation: L("Today is cold.", "Oggi fa freddo.") },
    { id: "capstones-4-m7", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
    { id: "capstones-4-m8", family: PREF, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-ticket"), translation: L("I want a ticket.", "Voglio un biglietto.") },
  ],
  transfers: [
    { id: "capstones-4-t1", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "capstones-4-t2", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-sushi"), translation: L("Sushi, please.", "Del sushi, per favore.") },
    { id: "capstones-4-t3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-pen", "a1-value-expensive"), translation: L("The pen is expensive.", "La penna è cara.") },
    { id: "capstones-4-t4", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-cheap"), translation: L("The book is cheap.", "Il libro è economico.") },
    { id: "capstones-4-t5", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-want", "a1-value-obj-sushi"), translation: L("I want sushi.", "Voglio del sushi.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe and aggregate
// ---------------------------------------------------------------------------

export const module12Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module12Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});
