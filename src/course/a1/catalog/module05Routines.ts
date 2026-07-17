/**
 * A1 Module 5 — Daily routines.
 *
 * Four instructional lessons that make time-framed daily actions speakable:
 * clock times (schedule に), named days and day-part sequence, frequency
 * adverbs, and a daily-life synthesis. The seven routine verbs (wake, sleep,
 * go out, return, and the routine framings of study / eat / read) are modelled
 * as distinct `[agent, time]` senses so the realizer can govern に-marked clock
 * and day times, while day-part and frequency adverbs stay bare — a case
 * particle there would be ungrammatical. Subjects are dropped whenever Japanese
 * drops them (pro-drop first person) and named only for a third party.
 *
 * The routine senses deliberately reuse the everyday-action orthography
 * (たべ・よみ・べんきょうし) under new frames: the object-action `eat` governs
 * を, whereas the routine `eat` is an intransitive day-part habit. Same spelling,
 * distinct governing frame — recurrence is tracked per sense, never per spelling.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_FREQUENCY,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_TIME_SCHEDULE,
  A1_CONCEPT_TOPIC_WA,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "routines";
const L = (en: string, it: string): Bilingual => ({ en, it });

const SCHED = "a1-family-schedule-action";
const ADV = "a1-family-adverbial-time-action";
const OBJ = "a1-family-object-action";
const LOC = "a1-family-location-action";

const WATASHI = "a1-value-watashi";
const SELF = "a1-referent-self";

// `<subject> <time>に <verb>ます` (schedule) OR bare `<subject> <time> <verb>ます`
// (adverbial). Slot shape is identical; the family fixes に vs. no particle.
const timed = (subject: string, predicate: string, time: string) => ({
  subject,
  predicate,
  time,
});
const obj = (subject: string, predicate: string, object: string) => ({
  subject,
  predicate,
  object,
});
const loc = (subject: string, predicate: string, location: string) => ({
  subject,
  predicate,
  location,
});

// ---------------------------------------------------------------------------
// Lesson routines-1 — clock times (schedule に): wake / sleep / go out / return
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "routines-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_TIME_SCHEDULE],
  introducedSenseIds: [
    "a1-sense-wake",
    "a1-sense-sleep",
    "a1-sense-go-out",
    "a1-sense-return",
  ],
  models: [
    { id: "routines-1-m1", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-wake", "a1-value-time-6"), translation: L("Yuki wakes up at six.", "Yuki si sveglia alle sei.") },
    { id: "routines-1-m2", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-time-7"), translation: L("I wake up at seven.", "Mi sveglio alle sette.") },
    { id: "routines-1-m3", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-go-out", "a1-value-time-8"), translation: L("Ken goes out at eight.", "Ken esce alle otto.") },
    { id: "routines-1-m4", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-go-out", "a1-value-time-9"), translation: L("I go out at nine.", "Esco alle nove.") },
    { id: "routines-1-m5", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-return", "a1-value-time-6"), translation: L("Mina comes home at six.", "Mina torna a casa alle sei.") },
    { id: "routines-1-m6", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-return", "a1-value-time-5"), translation: L("I come home at five.", "Torno a casa alle cinque.") },
    { id: "routines-1-m7", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-sleep", "a1-value-time-11"), translation: L("Yuki goes to bed at eleven.", "Yuki va a letto alle undici.") },
    { id: "routines-1-m8", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-sleep", "a1-value-time-10"), translation: L("I go to bed at ten.", "Vado a letto alle dieci.") },
  ],
  transfers: [
    { id: "routines-1-t1", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-time-5"), translation: L("I wake up at five.", "Mi sveglio alle cinque.") },
    { id: "routines-1-t2", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-go-out", "a1-value-time-7"), translation: L("Mina goes out at seven.", "Mina esce alle sette.") },
    { id: "routines-1-t3", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-sleep", "a1-value-time-11"), translation: L("I go to bed at eleven.", "Vado a letto alle undici.") },
    { id: "routines-1-t4", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-return", "a1-value-time-9"), translation: L("Ken comes home at nine.", "Ken torna a casa alle nove.") },
    { id: "routines-1-t5", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-time-8"), translation: L("I wake up at eight.", "Mi sveglio alle otto.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson routines-2 — days (schedule に) + day-part sequence (bare): study /
// eat / read routine framings, reusing go out / wake
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "routines-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_TIME_SCHEDULE, A1_CONCEPT_FREQUENCY],
  introducedSenseIds: [
    "a1-sense-study-routine",
    "a1-sense-eat-routine",
    "a1-sense-read-routine",
    "a1-sense-go-out",
    "a1-sense-wake",
  ],
  models: [
    { id: "routines-2-m1", family: SCHED, context: "a1-context-weekday-study", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-study-routine", "a1-value-day-monday"), translation: L("I study on Monday.", "Studio il lunedì.") },
    { id: "routines-2-m2", family: SCHED, context: "a1-context-weekday-study", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-study-routine", "a1-value-day-wednesday"), translation: L("Yuki studies on Wednesday.", "Yuki studia il mercoledì.") },
    { id: "routines-2-m3", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-eat-routine", "a1-value-seq-morning"), translation: L("I eat in the morning.", "Mangio la mattina.") },
    { id: "routines-2-m4", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-eat-routine", "a1-value-seq-night"), translation: L("Mina eats at night.", "Mina mangia la sera.") },
    { id: "routines-2-m5", family: ADV, context: "a1-context-evening-reading", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-read-routine", "a1-value-seq-night"), translation: L("I read at night.", "Leggo la sera.") },
    { id: "routines-2-m6", family: SCHED, context: "a1-context-evening-reading", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-read-routine", "a1-value-day-sunday"), translation: L("Ken reads on Sunday.", "Ken legge la domenica.") },
    { id: "routines-2-m7", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-go-out", "a1-value-day-saturday"), translation: L("I go out on Saturday.", "Esco il sabato.") },
    { id: "routines-2-m8", family: ADV, context: "a1-context-home", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-wake", "a1-value-seq-morning"), translation: L("Mina wakes up in the morning.", "Mina si sveglia la mattina.") },
  ],
  transfers: [
    { id: "routines-2-t1", family: SCHED, context: "a1-context-weekday-study", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-study-routine", "a1-value-day-monday"), translation: L("Mina studies on Monday.", "Mina studia il lunedì.") },
    { id: "routines-2-t2", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-eat-routine", "a1-value-seq-night"), translation: L("I eat at night.", "Mangio la sera.") },
    { id: "routines-2-t3", family: ADV, context: "a1-context-evening-reading", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-read-routine", "a1-value-seq-night"), translation: L("Ken reads at night.", "Ken legge la sera.") },
    { id: "routines-2-t4", family: SCHED, context: "a1-context-evening-reading", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-read-routine", "a1-value-day-sunday"), translation: L("I read on Sunday.", "Leggo la domenica.") },
    { id: "routines-2-t5", family: ADV, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-wake", "a1-value-seq-morning"), translation: L("Yuki wakes up in the morning.", "Yuki si sveglia la mattina.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson routines-3 — frequency adverbs (bare): every day / often / sometimes /
// always / every morning
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "routines-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_FREQUENCY],
  introducedSenseIds: [
    "a1-sense-study-routine",
    "a1-sense-read-routine",
    "a1-sense-eat-routine",
    "a1-sense-go-out",
    "a1-sense-wake",
  ],
  models: [
    { id: "routines-3-m1", family: ADV, context: "a1-context-weekday-study", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-study-routine", "a1-value-freq-everyday"), translation: L("I study every day.", "Studio ogni giorno.") },
    { id: "routines-3-m2", family: ADV, context: "a1-context-weekday-study", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-study-routine", "a1-value-freq-often"), translation: L("Yuki often studies.", "Yuki studia spesso.") },
    { id: "routines-3-m3", family: ADV, context: "a1-context-evening-reading", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-read-routine", "a1-value-freq-often"), translation: L("I often read.", "Leggo spesso.") },
    { id: "routines-3-m4", family: ADV, context: "a1-context-evening-reading", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-read-routine", "a1-value-freq-sometimes"), translation: L("Ken sometimes reads.", "Ken legge a volte.") },
    { id: "routines-3-m5", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-eat-routine", "a1-value-freq-everyday"), translation: L("I eat every day.", "Mangio ogni giorno.") },
    { id: "routines-3-m6", family: ADV, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-go-out", "a1-value-freq-sometimes"), translation: L("Mina sometimes goes out.", "Mina esce a volte.") },
    { id: "routines-3-m7", family: ADV, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-freq-every-morning"), translation: L("I wake up every morning.", "Mi sveglio ogni mattina.") },
    { id: "routines-3-m8", family: ADV, context: "a1-context-weekday-study", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-study-routine", "a1-value-freq-always"), translation: L("Yuki always studies.", "Yuki studia sempre.") },
  ],
  transfers: [
    { id: "routines-3-t1", family: ADV, context: "a1-context-weekday-study", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: timed("a1-value-mina", "a1-value-study-routine", "a1-value-freq-everyday"), translation: L("Mina studies every day.", "Mina studia ogni giorno.") },
    { id: "routines-3-t2", family: ADV, context: "a1-context-evening-reading", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-read-routine", "a1-value-freq-everyday"), translation: L("I read every day.", "Leggo ogni giorno.") },
    { id: "routines-3-t3", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: timed("a1-value-ken", "a1-value-eat-routine", "a1-value-freq-often"), translation: L("Ken often eats.", "Ken mangia spesso.") },
    { id: "routines-3-t4", family: ADV, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-go-out", "a1-value-freq-often"), translation: L("I often go out.", "Esco spesso.") },
    { id: "routines-3-t5", family: ADV, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-wake", "a1-value-freq-every-morning"), translation: L("Yuki wakes up every morning.", "Yuki si sveglia ogni mattina.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson routines-4 — daily synthesis: routine framings woven with the everyday
// actions (eat を / read を / go に / come に) introduced in Module 4, present
// tense. This is a genuine later reuse of the Module 4 senses in a later module.
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "routines-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_TIME_SCHEDULE,
    A1_CONCEPT_FREQUENCY,
    A1_CONCEPT_OBJECT_WO,
    A1_CONCEPT_LOCATION_PARTICLE,
  ],
  introducedSenseIds: [
    "a1-sense-wake",
    "a1-sense-sleep",
    "a1-sense-study-routine",
    "a1-sense-eat",
    "a1-sense-read",
    "a1-sense-go",
    "a1-sense-come",
  ],
  models: [
    { id: "routines-4-m1", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-wake", "a1-value-time-6"), translation: L("I wake up at six.", "Mi sveglio alle sei.") },
    { id: "routines-4-m2", family: OBJ, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-eat", "a1-value-obj-bread"), translation: L("I eat bread.", "Mangio il pane.") },
    { id: "routines-4-m3", family: LOC, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-go", "a1-value-loc-school"), translation: L("I go to school.", "Vado a scuola.") },
    { id: "routines-4-m4", family: ADV, context: "a1-context-weekday-study", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-study-routine", "a1-value-freq-everyday"), translation: L("I study every day.", "Studio ogni giorno.") },
    { id: "routines-4-m5", family: OBJ, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: obj("a1-value-yuki", "a1-value-read", "a1-value-obj-newspaper"), translation: L("Yuki reads the newspaper.", "Yuki legge il giornale.") },
    { id: "routines-4-m6", family: LOC, context: "a1-context-home", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: loc("a1-value-ken", "a1-value-come", "a1-value-loc-home"), translation: L("Ken comes home.", "Ken viene a casa.") },
    { id: "routines-4-m7", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: timed(WATASHI, "a1-value-sleep", "a1-value-time-11"), translation: L("I go to bed at eleven.", "Vado a letto alle undici.") },
    { id: "routines-4-m8", family: OBJ, context: "a1-context-home", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: obj("a1-value-mina", "a1-value-eat", "a1-value-obj-sushi"), translation: L("Mina eats sushi.", "Mina mangia il sushi.") },
  ],
  transfers: [
    { id: "routines-4-t1", family: OBJ, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: obj(WATASHI, "a1-value-read", "a1-value-obj-newspaper"), translation: L("I read the newspaper.", "Leggo il giornale.") },
    { id: "routines-4-t2", family: LOC, context: "a1-context-station", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: loc("a1-value-mina", "a1-value-go", "a1-value-loc-school"), translation: L("Mina goes to school.", "Mina va a scuola.") },
    { id: "routines-4-t3", family: OBJ, context: "a1-context-home", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: obj("a1-value-ken", "a1-value-eat", "a1-value-obj-bread"), translation: L("Ken eats bread.", "Ken mangia il pane.") },
    { id: "routines-4-t4", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: timed("a1-value-yuki", "a1-value-wake", "a1-value-time-6"), translation: L("Yuki wakes up at six.", "Yuki si sveglia alle sei.") },
    { id: "routines-4-t5", family: LOC, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: loc(WATASHI, "a1-value-come", "a1-value-loc-home"), translation: L("I come home.", "Vengo a casa.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe, aggregates, and productive-verb introduction records
// ---------------------------------------------------------------------------

export const module5Lessons: readonly A1BuiltLesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
];

export const module5Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

/** Productive routine verbs first introduced in module 5, each with ≥2
 *  structurally-distinct intro variants and a correctness-bearing intro
 *  exercise. `laterUses` stays empty here; the spaced-reuse timeline is authored
 *  immutably in `recurrence.ts` via {@link withA1LaterUses}. */
export const module5VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-wake", introductionLessonId: "routines-1", introductionVariantIds: ["routines-1-m1", "routines-1-m2"], exerciseRoundId: "routines-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-sleep", introductionLessonId: "routines-1", introductionVariantIds: ["routines-1-m7", "routines-1-m8"], exerciseRoundId: "routines-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-1-m7" }),
  a1VerbUseRecord({ senseId: "a1-sense-go-out", introductionLessonId: "routines-1", introductionVariantIds: ["routines-1-m3", "routines-1-m4"], exerciseRoundId: "routines-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-1-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-return", introductionLessonId: "routines-1", introductionVariantIds: ["routines-1-m5", "routines-1-m6"], exerciseRoundId: "routines-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-1-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-study-routine", introductionLessonId: "routines-2", introductionVariantIds: ["routines-2-m1", "routines-2-m2"], exerciseRoundId: "routines-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-2-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-eat-routine", introductionLessonId: "routines-2", introductionVariantIds: ["routines-2-m3", "routines-2-m4"], exerciseRoundId: "routines-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-2-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-read-routine", introductionLessonId: "routines-2", introductionVariantIds: ["routines-2-m5", "routines-2-m6"], exerciseRoundId: "routines-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "routines-2-m5" }),
];
