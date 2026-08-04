/**
 * A1 Module 9 — Descriptions.
 *
 * Four instructional lessons that make everyday states describable: i-/na-adjective
 * predication (`あつい です` / `しずか です`), preference and dislike
 * (`… が すき です`), bounded comparison (`… より おおきい です`), and a weather
 * recap. Adjective morphology (present/past × affirmative/negative) is chosen
 * generically from each sense's `adjectiveClass` in the realizer — never from an
 * authored Japanese-string switch. Description subjects are inanimate topics; the
 * describer (speaker) is varied purely as discourse metadata so role diversity is
 * real without touching a single realized surface.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_ADJECTIVE,
  A1_CONCEPT_COMPARISON,
  A1_CONCEPT_PREFERENCE,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "descriptions";
const L = (en: string, it: string): Bilingual => ({ en, it });

const DESC = "a1-family-description";
const PREF = "a1-family-preference";
const COMP = "a1-family-comparison";
const COP = "a1-family-topic-copular";

const THING = "a1-referent-thing";
const CREATURE = "a1-referent-creature";
const SELF = "a1-referent-self";

// Adjectival predicate `<subject>は <adj>です`.
const desc = (subject: string, predicate: string) => ({ subject, predicate });
// Preference `<subject>は <object>が <adj>です`.
const pref = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });
// Comparison `<subject>は <standard>より <adj>です`.
const comp = (subject: string, predicate: string, standard: string) => ({ subject, predicate, standard });
// Nominal weather forecast `<day>は <condition>です`.
const forecast = (subject: string, condition: string) => ({
  subject,
  predicate: "a1-value-be",
  object: condition,
});

// ---------------------------------------------------------------------------
// Lesson descriptions-1 — i/na adjective predication: hot / cold / quiet
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "descriptions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-descriptions",
  supportingCanDoIds: [],
  introducedConceptIds: [A1_CONCEPT_ADJECTIVE],
  introducedSenseIds: ["a1-sense-hot", "a1-sense-cold", "a1-sense-quiet"],
  models: [
    { id: "descriptions-1-m1", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
    { id: "descriptions-1-m3", family: DESC, context: "a1-context-classroom", subjectReferent: "a1-referent-person", subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: desc("a1-value-kono-hito", "a1-value-quiet"), translation: L("This person is quiet.", "Questa persona è tranquilla.") },
    { id: "descriptions-1-m2", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-hot"), translation: L("It's hot.", "Fa caldo.") },
    { id: "descriptions-1-m4", family: DESC, context: "a1-context-classroom", subjectReferent: "a1-referent-person", subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: desc("a1-value-kono-hito", "a1-value-quiet"), translation: L("They are quiet.", "È tranquillo.") },
    { id: "descriptions-1-m5", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
    { id: "descriptions-1-m6", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("It's quiet.", "È tranquilla.") },
    { id: "descriptions-1-m7", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-today", "a1-value-cold"), translation: L("Today is cold.", "Oggi fa freddo.") },
    { id: "descriptions-1-m8", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
  ],
  transfers: [
    { id: "descriptions-1-t1", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-hot"), translation: L("The town is hot.", "La città è calda.") },
    { id: "descriptions-1-t2", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: desc("a1-value-machi", "a1-value-cold"), translation: L("The town is cold.", "La città è fredda.") },
    { id: "descriptions-1-t3", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-quiet"), translation: L("Today is calm.", "Oggi è tranquillo.") },
    { id: "descriptions-1-t4", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-friend", slots: desc("a1-value-today", "a1-value-hot"), translation: L("It's hot.", "Fa caldo.") },
    { id: "descriptions-1-t5", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson descriptions-2 — preference: like / dislike (… が すき/きらい です)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "descriptions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-descriptions",
  supportingCanDoIds: [],
  introducedConceptIds: [A1_CONCEPT_PREFERENCE],
  introducedSenseIds: ["a1-sense-like", "a1-sense-dislike"],
  models: [
    { id: "descriptions-2-m1", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-coffee"), translation: L("I like coffee.", "Mi piace il caffè.") },
    { id: "descriptions-2-m2", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-sushi"), translation: L("I like sushi.", "Mi piace il sushi.") },
    { id: "descriptions-2-m3", family: PREF, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: pref("a1-value-yuki", "a1-value-like", "a1-value-obj-cat"), translation: L("Yuki likes cats.", "A Yuki piacciono i gatti.") },
    { id: "descriptions-2-m4", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-apple"), translation: L("I like apples.", "Mi piacciono le mele.") },
    { id: "descriptions-2-m5", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-water"), translation: L("I dislike water.", "Non mi piace l'acqua.") },
    { id: "descriptions-2-m6", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-dog"), translation: L("I dislike dogs.", "Non mi piacciono i cani.") },
    { id: "descriptions-2-m7", family: PREF, context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: pref("a1-value-ken", "a1-value-like", "a1-value-obj-evening"), translation: L("Ken likes evenings.", "A Ken piacciono le sere.") },
    { id: "descriptions-2-m8", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-today", "a1-value-hot"), translation: L("Today is hot.", "Oggi fa caldo.") },
  ],
  transfers: [
    { id: "descriptions-2-t1", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-cat"), translation: L("I like cats.", "Mi piacciono i gatti.") },
    { id: "descriptions-2-t2", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-sushi"), translation: L("I dislike sushi.", "Non mi piace il sushi.") },
    { id: "descriptions-2-t3", family: PREF, context: "a1-context-home", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: pref("a1-value-ken", "a1-value-like", "a1-value-obj-coffee"), translation: L("Ken likes coffee.", "A Ken piace il caffè.") },
    { id: "descriptions-2-t4", family: PREF, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: pref("a1-value-watashi", "a1-value-like", "a1-value-obj-evening"), translation: L("I like evenings.", "Mi piacciono le sere.") },
    { id: "descriptions-2-t5", family: PREF, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "explicit", slots: pref("a1-value-watashi", "a1-value-dislike", "a1-value-obj-cat"), translation: L("I dislike cats.", "Non mi piacciono i gatti.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson descriptions-3 — bounded comparison: big / small (… より …です)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "descriptions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-descriptions",
  supportingCanDoIds: [],
  introducedConceptIds: [A1_CONCEPT_COMPARISON],
  introducedSenseIds: ["a1-sense-big", "a1-sense-small"],
  models: [
    { id: "descriptions-3-m1", family: COMP, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: comp("a1-value-ex-cat", "a1-value-big", "a1-value-obj-apple"), translation: L("The cat is bigger than an apple.", "Il gatto è più grande di una mela.") },
    { id: "descriptions-3-m3", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: comp("a1-value-ex-book", "a1-value-small", "a1-value-obj-bag"), translation: L("The book is smaller than the bag.", "Il libro è più piccolo della borsa.") },
    { id: "descriptions-3-m2", family: COMP, context: "a1-context-home", subjectReferent: CREATURE, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: comp("a1-value-ex-cat", "a1-value-big", "a1-value-obj-sore"), translation: L("It's bigger than that one.", "È più grande di quella.") },
    { id: "descriptions-3-m4", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: comp("a1-value-ex-book", "a1-value-small", "a1-value-obj-bag"), translation: L("It's smaller than the bag.", "È più piccolo della borsa.") },
    { id: "descriptions-3-m5", family: COMP, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: comp("a1-value-machi", "a1-value-cold", "a1-value-obj-are"), translation: L("The town is colder than that one.", "La città è più fredda di quella.") },
    { id: "descriptions-3-m6", family: COMP, context: "a1-context-town", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: comp("a1-value-machi", "a1-value-cold", "a1-value-obj-are"), translation: L("It's colder than that one.", "È più fredda di quella.") },
    { id: "descriptions-3-m7", family: COMP, context: "a1-context-town", subjectReferent: CREATURE, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: comp("a1-value-ex-dog", "a1-value-big", "a1-value-obj-bag"), translation: L("The dog is bigger than the bag.", "Il cane è più grande della borsa.") },
    { id: "descriptions-3-m8", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: comp("a1-value-ex-pen", "a1-value-small", "a1-value-obj-cup"), translation: L("The pen is smaller than the cup.", "La penna è più piccola della tazza.") },
  ],
  transfers: [
    { id: "descriptions-3-t1", family: COMP, context: "a1-context-home", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: comp("a1-value-ex-book", "a1-value-big", "a1-value-obj-apple"), translation: L("The book is bigger than an apple.", "Il libro è più grande di una mela.") },
    { id: "descriptions-3-t2", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: comp("a1-value-ex-pen", "a1-value-small", "a1-value-obj-bag"), translation: L("The pen is smaller than the bag.", "La penna è più piccola della borsa.") },
    { id: "descriptions-3-t3", family: COMP, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: comp("a1-value-machi", "a1-value-cold", "a1-value-obj-sore"), translation: L("The town is colder than that one.", "La città è più fredda di quella.") },
    { id: "descriptions-3-t4", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: comp("a1-value-ex-pen", "a1-value-small", "a1-value-obj-cup"), translation: L("It's smaller than the cup.", "È più piccolo della tazza.") },
    { id: "descriptions-3-t5", family: COMP, context: "a1-context-classroom", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: comp("a1-value-ex-pen", "a1-value-small", "a1-value-obj-cup"), translation: L("The pen is smaller than the cup.", "La penna è più piccola della tazza.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson descriptions-4 — weather forecast vocabulary in a familiar frame
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "descriptions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-descriptions",
  supportingCanDoIds: [],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "descriptions-4-m1", family: COP, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: forecast("a1-value-today", "a1-value-weather-sunny"), translation: L("Today will be sunny.", "Oggi sarà sereno.") },
    { id: "descriptions-4-m2", family: COP, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: forecast("a1-value-today", "a1-value-weather-cloudy"), translation: L("Today will be cloudy.", "Oggi sarà nuvoloso.") },
    { id: "descriptions-4-m3", family: COP, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-ken", slots: forecast("a1-value-today", "a1-value-weather-rain"), translation: L("It will be rainy today.", "Oggi pioverà.") },
    { id: "descriptions-4-m4", family: COP, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: forecast("a1-value-today", "a1-value-weather-snow"), translation: L("It will snow today.", "Oggi nevicherà.") },
    { id: "descriptions-4-m5", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-teacher", slots: desc("a1-value-today", "a1-value-cold"), translation: L("It's cold.", "Fa freddo.") },
    { id: "descriptions-4-m6", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-big"), translation: L("The town is big.", "La città è grande.") },
    { id: "descriptions-4-m7", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: desc("a1-value-machi", "a1-value-small"), translation: L("The town is small.", "La città è piccola.") },
    { id: "descriptions-4-m8", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: desc("a1-value-machi", "a1-value-quiet"), translation: L("The town is quiet.", "La città è tranquilla.") },
  ],
  transfers: [
    { id: "descriptions-4-t1", family: DESC, context: "a1-context-weather", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-today", "a1-value-cold"), translation: L("Today is cold.", "Oggi fa freddo.") },
    { id: "descriptions-4-t2", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: desc("a1-value-machi", "a1-value-big"), translation: L("The town is big.", "La città è grande.") },
    { id: "descriptions-4-t3", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-small"), translation: L("The town is small.", "La città è piccola.") },
    { id: "descriptions-4-t4", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: desc("a1-value-machi", "a1-value-small"), translation: L("It's small.", "È piccola.") },
    { id: "descriptions-4-t5", family: DESC, context: "a1-context-town", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: desc("a1-value-machi", "a1-value-cold"), translation: L("The town is cold.", "La città è fredda.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe, aggregates, and productive-adjective introduction records
// ---------------------------------------------------------------------------

export const module9Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module9Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

/** Productive adjective senses first introduced in Module 9, each with two
 *  structurally-distinct intro variants (explicit vs. pro-dropped subject) and a
 *  correctness-bearing intro exercise. `laterUses` stays empty here; the spaced
 *  reuse timeline is authored immutably in `recurrence.ts`. */
export const module9VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-hot", introductionLessonId: "descriptions-1", introductionVariantIds: ["descriptions-1-m1", "descriptions-1-m2"], exerciseRoundId: "descriptions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-cold", introductionLessonId: "descriptions-1", introductionVariantIds: ["descriptions-1-m3", "descriptions-1-m4"], exerciseRoundId: "descriptions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-1-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-quiet", introductionLessonId: "descriptions-1", introductionVariantIds: ["descriptions-1-m5", "descriptions-1-m6"], exerciseRoundId: "descriptions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-1-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-like", introductionLessonId: "descriptions-2", introductionVariantIds: ["descriptions-2-m1", "descriptions-2-m2"], exerciseRoundId: "descriptions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-2-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-dislike", introductionLessonId: "descriptions-2", introductionVariantIds: ["descriptions-2-m5", "descriptions-2-m6"], exerciseRoundId: "descriptions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-2-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-big", introductionLessonId: "descriptions-3", introductionVariantIds: ["descriptions-3-m1", "descriptions-3-m2"], exerciseRoundId: "descriptions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-3-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-small", introductionLessonId: "descriptions-3", introductionVariantIds: ["descriptions-3-m3", "descriptions-3-m4"], exerciseRoundId: "descriptions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "descriptions-3-m3" }),
];
