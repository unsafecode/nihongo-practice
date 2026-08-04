/**
 * A1 Module 12 — Capstone synthesis scenarios.
 *
 * Four whole-level synthesis lessons that recombine *already-taught* A1
 * content into the four required end-to-end scenarios:
 *   • capstones-1 — a self-introduction that includes a genuine reciprocal
 *     question (someone else asks the learner about themselves, and the
 *     learner asks back): identity (be), self-predicates (study / work /
 *     live / understand) and their interrogative counterparts.
 *   • capstones-2 — a daily-routine synthesis: scheduled/adverbial time,
 *     a named person's routine, a stated place, a preference, and a
 *     purchase/request — the six required strands of an ordinary day.
 *   • capstones-3 — getting around: movement (destination/direction),
 *     transport, a route, a genuine route question ("Where is the
 *     station?"), and an immediate need (wanting a ticket).
 *   • capstones-4 — a short exchange that states identity, an action, two
 *     descriptions, then asks a clarification question ("What is this?"),
 *     changing its subject-referent topic **exactly once** (from talking
 *     about oneself to commenting on one's surroundings).
 *
 * These lessons introduce **no** new concept, sense, semantic value, form,
 * role, or context — every model and transfer is assembled from senses first
 * taught in Modules 2-11 (the `"synthesis"` contract enforces empty
 * `introducedConceptIds` / `introducedSenseIds`). Many lines are verbatim
 * reuses of an earlier module's exact row (a different lesson, identical
 * content); others are new recombinations of independently pre-existing
 * atomic values — both are legitimate synthesis, never new productive
 * content. They also serve as the authored later, spaced reuse home for every
 * productive sense introduced in Modules 9-11.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  a1Copular,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";

const MODULE_ID = "capstones";
const L = (en: string, it: string): Bilingual => ({ en, it });

// Families reused from Modules 2, 3, 5, 7, 9, 10 and 11 — no new family.
const COP = "a1-family-topic-copular";
const OBJ = "a1-family-object-action";
const NOM = "a1-family-nominative-action";
const LOCF = "a1-family-location-action";
const TRANS = "a1-family-transport-action";
const ROUTE = "a1-family-route-action";
const SCHED = "a1-family-schedule-action";
const PREF = "a1-family-preference";
const QUANT = "a1-family-quantified-action";
const REQ = "a1-family-request";
const DESC = "a1-family-description";
const EXIST = "a1-family-existence";

// Referents reused from Modules 2, 7, 9 and 11.
const SELF = "a1-referent-self";
const THING = "a1-referent-thing";
const CREATURE = "a1-referent-creature";
const YUKI_REF = "a1-referent-yuki";
const KEN_REF = "a1-referent-ken";
const CLASSMATE_REF = "a1-referent-classmate";

// Discourse roles reused from Module 3 (reciprocal question askers).
const LEARNER = "a1-role-learner";
const TEACHER = "a1-role-teacher";
const CLASSMATE = "a1-role-classmate";
const CLERK = "a1-role-clerk";
const PERSON = "a1-role-person";
const YUKI_ROLE = "a1-role-yuki";
const KEN_ROLE = "a1-role-ken";

const WATASHI = "a1-value-watashi";
const CLASSMATE_SUBJECT = "a1-value-classmate-subject";

// Slot builders — identical shapes to the modules that introduced each
// family; only the predicate/value ids passed in ever change.
const cop = (subject: string, object: string) => ({ subject, predicate: "a1-value-be", object });
const copQ = (subject: string, qword: string) => ({ subject, predicate: "a1-value-be", object: qword });
const ynQ = (subject: string, complement: string) => ({ subject, predicate: "a1-value-be", object: complement });
const actQ = (subject: string, predicate: string, qword: string) => ({ subject, predicate, object: qword });
const study = (subject: string, object: string) => ({ subject, predicate: "a1-value-study", object });
const understand = (subject: string, object: string) => ({ subject, predicate: "a1-value-understand", object });
const loc = (subject: string, predicate: string, location: string) => ({ subject, predicate, location });
const via = (subject: string, predicate: string, transport: string, location: string) => ({ subject, predicate, transport, location });
const route = (subject: string, predicate: string, source: string, goal: string) => ({ subject, predicate, source, goal });
const timed = (subject: string, predicate: string, time: string) => ({ subject, predicate, time });
const desc = (subject: string, predicate: string) => ({ subject, predicate });
const pref = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });
const qa = (subject: string, predicate: string, object: string, quantity: string) => ({ subject, predicate, object, quantity });
const req = (object: string, quantity?: string): Record<string, string> =>
  quantity === undefined
    ? { subject: WATASHI, predicate: "a1-value-request", object }
    : { subject: WATASHI, predicate: "a1-value-request", object, quantity };
const exist = (subject: string, predicate: string, location?: string): Record<string, string> =>
  location === undefined ? { subject, predicate } : { subject, predicate, location };

// ---------------------------------------------------------------------------
// Lesson capstones-1 — self-introduction + reciprocal question (scenario-1)
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-1",
  moduleId: MODULE_ID,
  order: 1,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-1",
  supportingCanDoIds: ["a1-can-do-identity", "a1-can-do-questions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-1-m1", family: COP, context: "a1-context-first-meeting", subjectReferent: CLASSMATE_REF, subjectRealization: "omitted", slots: cop(CLASSMATE_SUBJECT, "a1-value-obj-student"), translation: a1Copular(CLASSMATE_SUBJECT, "a1-value-obj-student") },
    { id: "capstones-1-m2", family: COP, context: "a1-context-first-meeting", subjectReferent: SELF, subjectRealization: "omitted", slots: cop(WATASHI, "a1-value-obj-italian-person"), translation: a1Copular(WATASHI, "a1-value-obj-italian-person") },
    { id: "capstones-1-m3", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: study(WATASHI, "a1-value-obj-japanese"), translation: L("I study Japanese.", "Studio il giapponese.") },
    { id: "capstones-1-m4", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: YUKI_ROLE, slots: desc("a1-value-heya", "a1-value-big"), translation: L("The room is big.", "La stanza è grande.") },
    { id: "capstones-1-m5", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: KEN_ROLE, slots: desc("a1-value-machi", "a1-value-small"), translation: L("The town is small.", "La città è piccola.") },
    { id: "capstones-1-m6", family: NOM, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: understand(WATASHI, "a1-value-obj-japanese"), translation: L("I understand Japanese.", "Capisco il giapponese.") },
    { id: "capstones-1-m7", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: CLASSMATE, addresseeRole: LEARNER, interrogative: true, slots: actQ(WATASHI, "a1-value-do", "a1-value-q-nani"), translation: L("What do you do?", "Cosa fai?") },
    { id: "capstones-1-m8", family: NOM, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: TEACHER, addresseeRole: LEARNER, interrogative: true, slots: actQ(WATASHI, "a1-value-understand", "a1-value-q-nani"), translation: L("What do you understand?", "Cosa capisci?") },
  ],
  transfers: [
    { id: "capstones-1-t1", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "omitted", slots: desc("a1-value-heya", "a1-value-big"), translation: L("It's big.", "È grande.") },
    { id: "capstones-1-t2", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: CLASSMATE, addresseeRole: LEARNER, interrogative: true, slots: actQ(WATASHI, "a1-value-study", "a1-value-q-nani"), translation: L("What do you study?", "Cosa studi?") },
    { id: "capstones-1-t3", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "omitted", slots: desc("a1-value-heya", "a1-value-small"), translation: L("It's small.", "È piccola.") },
    { id: "capstones-1-t4", family: COP, context: "a1-context-first-meeting", subjectReferent: CLASSMATE_REF, subjectRealization: "omitted", speakerRole: LEARNER, addresseeRole: CLASSMATE, interrogative: true, slots: ynQ(CLASSMATE_SUBJECT, "a1-value-obj-italian-person"), translation: L("Are you Italian?", "Sei italiano?") },
    { id: "capstones-1-t5", family: NOM, context: "a1-context-classroom", subjectReferent: CLASSMATE_REF, subjectRealization: "omitted", speakerRole: LEARNER, addresseeRole: CLASSMATE, interrogative: true, slots: understand(CLASSMATE_SUBJECT, "a1-value-obj-japanese"), translation: L("Do you understand Japanese?", "Capisci il giapponese?") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-2 — a day's routine, place, preference & purchase (scenario-2)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-2",
  moduleId: MODULE_ID,
  order: 2,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-2",
  supportingCanDoIds: ["a1-can-do-daily-life", "a1-can-do-shopping"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-2-m1", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-time-7"), translation: L("I wake up at seven.", "Mi sveglio alle sette.") },
    { id: "capstones-2-m2", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: YUKI_ROLE, slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "capstones-2-m3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: CLERK, slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
    { id: "capstones-2-m4", family: SCHED, context: "a1-context-home", subjectReferent: KEN_REF, subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-wake", "a1-value-time-9"), translation: L("Ken wakes up at nine.", "Ken si sveglia alle nove.") },
    { id: "capstones-2-m5", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: LEARNER, slots: req("a1-value-obj-ticket", "a1-value-qty-2"), translation: L("Two tickets, please.", "Due biglietti, per favore.") },
    { id: "capstones-2-m6", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref(WATASHI, "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "capstones-2-m7", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa(WATASHI, "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-3"), translation: L("I buy three apples.", "Compro tre mele.") },
    { id: "capstones-2-m8", family: LOCF, context: "a1-context-workplace", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-work", "a1-value-loc-restaurant"), translation: L("I work at the restaurant.", "Lavoro al ristorante.") },
  ],
  transfers: [
    { id: "capstones-2-t1", family: SCHED, context: "a1-context-home", subjectReferent: KEN_REF, subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-wake", "a1-value-time-7"), translation: L("Ken wakes up at seven.", "Ken si sveglia alle sette.") },
    { id: "capstones-2-t2", family: DESC, context: "a1-context-cafe", subjectReferent: THING, subjectRealization: "omitted", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("It's cheap.", "È economica.") },
    { id: "capstones-2-t3", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: LEARNER, slots: req("a1-value-obj-coffee"), translation: L("Coffee, please.", "Un caffè, per favore.") },
    { id: "capstones-2-t4", family: PREF, context: "a1-context-cafe", subjectReferent: KEN_REF, subjectRealization: "explicit", slots: pref("a1-value-ken", "a1-value-like", "a1-value-obj-coffee"), translation: L("Ken likes coffee.", "A Ken piace il caffè.") },
    { id: "capstones-2-t5", family: QUANT, context: "a1-context-shop", subjectReferent: KEN_REF, subjectRealization: "explicit", slots: qa("a1-value-ken", "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-3"), translation: L("Ken buys three apples.", "Ken compra tre mele.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-3 — movement, transport, a route question & a need (scenario-3)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-3",
  moduleId: MODULE_ID,
  order: 3,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-3",
  supportingCanDoIds: ["a1-can-do-places", "a1-can-do-existence"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-3-m1", family: LOCF, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-go", "a1-value-loc-station"), translation: L("I go to the station.", "Vado alla stazione.") },
    { id: "capstones-3-m2", family: PREF, context: "a1-context-cafe", subjectReferent: YUKI_REF, subjectRealization: "explicit", slots: pref("a1-value-yuki", "a1-value-dislike", "a1-value-obj-water"), translation: L("Yuki dislikes water.", "A Yuki non piace l'acqua.") },
    { id: "capstones-3-m3", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-train", "a1-value-loc-station"), translation: L("I go to the station by train.", "Vado alla stazione in treno.") },
    { id: "capstones-3-m4", family: EXIST, context: "a1-context-station", subjectReferent: THING, subjectRealization: "explicit", speakerRole: KEN_ROLE, slots: exist("a1-value-ex-key", "a1-value-exist-inanimate", "a1-value-loc-near-station"), translation: L("There is a key near the station.", "C'è una chiave vicino alla stazione.") },
    { id: "capstones-3-m5", family: ROUTE, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-go", "a1-value-loc-tokyo", "a1-value-loc-osaka"), translation: L("I go from Tokyo to Osaka.", "Vado da Tokyo a Osaka.") },
    { id: "capstones-3-m6", family: EXIST, context: "a1-context-station", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: CLERK, slots: exist("a1-value-ex-dog", "a1-value-exist-animate", "a1-value-loc-near-station"), translation: L("There is a dog near the station.", "C'è un cane vicino alla stazione.") },
    { id: "capstones-3-m7", family: COP, context: "a1-context-station", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, addresseeRole: PERSON, interrogative: true, slots: copQ("a1-value-eki-subject", "a1-value-q-doko"), translation: L("Where is the station?", "Dov'è la stazione?") },
    { id: "capstones-3-m8", family: PREF, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "explicit", slots: pref(WATASHI, "a1-value-want", "a1-value-obj-ticket"), translation: L("I want a ticket.", "Voglio un biglietto.") },
  ],
  transfers: [
    { id: "capstones-3-t1", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref(WATASHI, "a1-value-dislike", "a1-value-obj-water"), translation: L("I dislike water.", "Non mi piace l'acqua.") },
    { id: "capstones-3-t2", family: EXIST, context: "a1-context-station", subjectReferent: THING, subjectRealization: "explicit", slots: exist("a1-value-ex-key", "a1-value-exist-inanimate"), translation: L("There is a key.", "C'è una chiave.") },
    { id: "capstones-3-t3", family: EXIST, context: "a1-context-station", subjectReferent: CREATURE, subjectRealization: "explicit", slots: exist("a1-value-ex-dog", "a1-value-exist-animate"), translation: L("There is a dog.", "C'è un cane.") },
    { id: "capstones-3-t4", family: PREF, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: pref(WATASHI, "a1-value-want", "a1-value-obj-ticket"), translation: L("I want a ticket.", "Voglio un biglietto.") },
    { id: "capstones-3-t5", family: ROUTE, context: "a1-context-station", subjectReferent: YUKI_REF, subjectRealization: "explicit", slots: route("a1-value-yuki", "a1-value-go", "a1-value-loc-tokyo", "a1-value-loc-osaka"), translation: L("Yuki goes from Tokyo to Osaka.", "Yuki va da Tokyo a Osaka.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson capstones-4 — identity, action, description & one topic change (scenario-4)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "capstones-4",
  moduleId: MODULE_ID,
  order: 4,
  contract: "synthesis",
  primaryCanDoId: "a1-can-do-scenario-4",
  supportingCanDoIds: ["a1-can-do-actions", "a1-can-do-descriptions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "capstones-4-m1", family: COP, context: "a1-context-first-meeting", subjectReferent: SELF, subjectRealization: "omitted", slots: cop(WATASHI, "a1-value-obj-student"), translation: a1Copular(WATASHI, "a1-value-obj-student") },
    { id: "capstones-4-m2", family: COP, context: "a1-context-first-meeting", subjectReferent: SELF, subjectRealization: "omitted", slots: cop(WATASHI, "a1-value-obj-italian-person"), translation: a1Copular(WATASHI, "a1-value-obj-italian-person") },
    { id: "capstones-4-m3", family: COP, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: cop(WATASHI, "a1-value-obj-teacher"), translation: a1Copular(WATASHI, "a1-value-obj-teacher") },
    { id: "capstones-4-m4", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", slots: study(WATASHI, "a1-value-obj-japanese"), translation: L("I study Japanese.", "Studio il giapponese.") },
    { id: "capstones-4-m5", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
    { id: "capstones-4-m6", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: YUKI_ROLE, slots: desc("a1-value-heya", "a1-value-cold"), translation: L("The room is cold.", "La stanza è fredda.") },
    { id: "capstones-4-m7", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: KEN_ROLE, slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
    { id: "capstones-4-m8", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, addresseeRole: CLERK, interrogative: true, slots: copQ("a1-value-kore", "a1-value-q-nan"), translation: L("What is this?", "Che cos'è questo?") },
  ],
  transfers: [
    { id: "capstones-4-t1", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-today", "a1-value-cold"), translation: L("Today is cold.", "Oggi fa freddo.") },
    { id: "capstones-4-t2", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-heya", "a1-value-hot"), translation: L("The room is hot.", "La stanza è calda.") },
    { id: "capstones-4-t3", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-machi", "a1-value-cold"), translation: L("The town is cold.", "La città è fredda.") },
    { id: "capstones-4-t4", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-today", "a1-value-quiet"), translation: L("Today is calm.", "Oggi è tranquillo.") },
    { id: "capstones-4-t5", family: DESC, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: LEARNER, slots: desc("a1-value-heya", "a1-value-quiet"), translation: L("The room is quiet.", "La stanza è tranquilla.") },
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
