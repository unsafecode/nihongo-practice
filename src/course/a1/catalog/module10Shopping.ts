/**
 * A1 Module 10 — Shopping.
 *
 * Four instructional lessons that make a simple transaction survivable: prices
 * (`… えん です`) and the two price adjectives (`たかい` / `やすい`), counted
 * quantities with a floating counter (`りんごを みっつ かいます`), polite
 * requests (`… を ください`, optionally counted), and a transaction recap. The
 * counter is a bare floating quantifier (no particle); `ください` is a standalone
 * politeness word after the を-item — both handled generically by the realizer,
 * never by an authored Japanese-string switch.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_ADJECTIVE,
  A1_CONCEPT_QUANTITY,
  A1_CONCEPT_REQUEST,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "shopping";
const L = (en: string, it: string): Bilingual => ({ en, it });

const DESC = "a1-family-description";
const COP = "a1-family-topic-copular";
const QUANT = "a1-family-quantified-action";
const REQ = "a1-family-request";

const THING = "a1-referent-thing";
const SELF = "a1-referent-self";

// Adjectival predicate `<subject>は <adj>です`.
const desc = (subject: string, predicate: string) => ({ subject, predicate });
// Price copular `<subject>は <price>です`.
const price = (subject: string, complement: string) => ({ subject, predicate: "a1-value-be", object: complement });
// Quantified action `<subject>は <object>を <qty> <verb>ます`.
const qa = (subject: string, predicate: string, object: string, quantity: string) => ({ subject, predicate, object, quantity });
// Request `<object>を (<qty>) ください` — subject is grammatically absent.
const req = (object: string, quantity?: string): Record<string, string> =>
  quantity === undefined
    ? { subject: "a1-value-watashi", predicate: "a1-value-request", object }
    : { subject: "a1-value-watashi", predicate: "a1-value-request", object, quantity };

// ---------------------------------------------------------------------------
// Lesson shopping-1 — prices: expensive / cheap + "… えん です"
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "shopping-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-shopping",
  supportingCanDoIds: ["a1-can-do-descriptions"],
  introducedConceptIds: [A1_CONCEPT_ADJECTIVE],
  introducedSenseIds: ["a1-sense-expensive", "a1-sense-cheap"],
  models: [
    { id: "shopping-1-m1", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "shopping-1-m3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-yuki", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
    { id: "shopping-1-m2", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("It's expensive.", "È caro.") },
    { id: "shopping-1-m4", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("It's cheap.", "È economica.") },
    { id: "shopping-1-m5", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: price("a1-value-ex-book", "a1-value-price-100"), translation: L("The book is 100 yen.", "Il libro costa 100 yen.") },
    { id: "shopping-1-m6", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: price("a1-value-ex-key", "a1-value-price-500"), translation: L("The key is 500 yen.", "La chiave costa 500 yen.") },
    { id: "shopping-1-m7", family: DESC, context: "a1-context-cafe", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-ex-key", "a1-value-expensive"), translation: L("The key is expensive.", "La chiave è cara.") },
    { id: "shopping-1-m8", family: COP, context: "a1-context-cafe", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", slots: price("a1-value-ex-pen", "a1-value-price-100"), translation: L("The pen is 100 yen.", "La penna costa 100 yen.") },
  ],
  transfers: [
    { id: "shopping-1-t1", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-ex-pen", "a1-value-expensive"), translation: L("The pen is expensive.", "La penna è cara.") },
    { id: "shopping-1-t2", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-friend", slots: desc("a1-value-ex-book", "a1-value-cheap"), translation: L("The book is cheap.", "Il libro è economico.") },
    { id: "shopping-1-t3", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: price("a1-value-ex-key", "a1-value-price-100"), translation: L("The key is 100 yen.", "La chiave costa 100 yen.") },
    { id: "shopping-1-t4", family: COP, context: "a1-context-cafe", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: price("a1-value-ex-book", "a1-value-price-500"), translation: L("The book is 500 yen.", "Il libro costa 500 yen.") },
    { id: "shopping-1-t5", family: DESC, context: "a1-context-cafe", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-classmate", slots: desc("a1-value-ex-key", "a1-value-cheap"), translation: L("The key is cheap.", "La chiave è economica.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-2 — counted quantities: "…を <counter> かいます/たべます/のみます"
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "shopping-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-shopping",
  supportingCanDoIds: [],
  introducedConceptIds: [A1_CONCEPT_QUANTITY],
  introducedSenseIds: [],
  models: [
    { id: "shopping-2-m1", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-3"), translation: L("I buy three apples.", "Compro tre mele.") },
    { id: "shopping-2-m2", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-2"), translation: L("I buy two apples.", "Compro due mele.") },
    { id: "shopping-2-m3", family: QUANT, context: "a1-context-shop", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: qa("a1-value-yuki", "a1-value-buy", "a1-value-obj-mikan", "a1-value-qty-5"), translation: L("Yuki buys five tangerines.", "Yuki compra cinque mandarini.") },
    { id: "shopping-2-m4", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-ticket", "a1-value-qty-1"), translation: L("I buy one ticket.", "Compro un biglietto.") },
    { id: "shopping-2-m5", family: QUANT, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: qa("a1-value-ken", "a1-value-drink", "a1-value-obj-coffee", "a1-value-qty-1"), translation: L("Ken drinks one coffee.", "Ken beve un caffè.") },
    { id: "shopping-2-m6", family: QUANT, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-eat", "a1-value-obj-sushi", "a1-value-qty-4"), translation: L("I eat four pieces of sushi.", "Mangio quattro sushi.") },
    { id: "shopping-2-m7", family: QUANT, context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: qa("a1-value-mina", "a1-value-eat", "a1-value-obj-apple", "a1-value-qty-1"), translation: L("Mina eats one apple.", "Mina mangia una mela.") },
    { id: "shopping-2-m8", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-ticket", "a1-value-qty-2"), translation: L("I buy two tickets.", "Compro due biglietti.") },
  ],
  transfers: [
    { id: "shopping-2-t1", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-mikan", "a1-value-qty-2"), translation: L("I buy two tangerines.", "Compro due mandarini.") },
    { id: "shopping-2-t2", family: QUANT, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-eat", "a1-value-obj-apple", "a1-value-qty-5"), translation: L("I eat five apples.", "Mangio cinque mele.") },
    { id: "shopping-2-t3", family: QUANT, context: "a1-context-shop", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: qa("a1-value-yuki", "a1-value-buy", "a1-value-obj-ticket", "a1-value-qty-2"), translation: L("Yuki buys two tickets.", "Yuki compra due biglietti.") },
    { id: "shopping-2-t4", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-ticket", "a1-value-qty-3"), translation: L("I buy three tickets.", "Compro tre biglietti.") },
    { id: "shopping-2-t5", family: QUANT, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: qa("a1-value-ken", "a1-value-eat", "a1-value-obj-sushi", "a1-value-qty-1"), translation: L("Ken eats one piece of sushi.", "Ken mangia un sushi.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-3 — polite requests: "…を ください" (optionally counted)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "shopping-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-shopping",
  supportingCanDoIds: [],
  introducedConceptIds: [A1_CONCEPT_REQUEST],
  introducedSenseIds: ["a1-sense-request"],
  models: [
    { id: "shopping-3-m1", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-water"), translation: L("Water, please.", "Dell'acqua, per favore.") },
    { id: "shopping-3-m2", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-apple", "a1-value-qty-3"), translation: L("Three apples, please.", "Tre mele, per favore.") },
    { id: "shopping-3-m3", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-coffee"), translation: L("Coffee, please.", "Un caffè, per favore.") },
    { id: "shopping-3-m4", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-ticket", "a1-value-qty-2"), translation: L("Two tickets, please.", "Due biglietti, per favore.") },
    { id: "shopping-3-m5", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "shopping-3-m6", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-mikan", "a1-value-qty-5"), translation: L("Five tangerines, please.", "Cinque mandarini, per favore.") },
    { id: "shopping-3-m7", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: price("a1-value-ex-book", "a1-value-price-100"), translation: L("The book is 100 yen.", "Il libro costa 100 yen.") },
    { id: "shopping-3-m8", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
  ],
  transfers: [
    { id: "shopping-3-t1", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-mikan"), translation: L("Tangerines, please.", "Dei mandarini, per favore.") },
    { id: "shopping-3-t2", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-coffee", "a1-value-qty-2"), translation: L("Two coffees, please.", "Due caffè, per favore.") },
    { id: "shopping-3-t3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-ex-pen", "a1-value-expensive"), translation: L("The pen is expensive.", "La penna è cara.") },
    { id: "shopping-3-t4", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-apple"), translation: L("Apples, please.", "Delle mele, per favore.") },
    { id: "shopping-3-t5", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-cheap"), translation: L("The book is cheap.", "Il libro è economico.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-4 — transaction recap (reuse only; no new content)
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "shopping-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-shopping",
  supportingCanDoIds: [],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "shopping-4-m1", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-apple", "a1-value-qty-3"), translation: L("Three apples, please.", "Tre mele, per favore.") },
    { id: "shopping-4-m2", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-mikan", "a1-value-qty-2"), translation: L("I buy two tangerines.", "Compro due mandarini.") },
    { id: "shopping-4-m3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-expensive"), translation: L("The book is expensive.", "Il libro è caro.") },
    { id: "shopping-4-m4", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-water"), translation: L("Water, please.", "Dell'acqua, per favore.") },
    { id: "shopping-4-m5", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-ticket", "a1-value-qty-2"), translation: L("I buy two tickets.", "Compro due biglietti.") },
    { id: "shopping-4-m6", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: price("a1-value-ex-book", "a1-value-price-100"), translation: L("The book is 100 yen.", "Il libro costa 100 yen.") },
    { id: "shopping-4-m7", family: QUANT, context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: qa("a1-value-yuki", "a1-value-drink", "a1-value-obj-coffee", "a1-value-qty-1"), translation: L("Yuki drinks one coffee.", "Yuki beve un caffè.") },
    { id: "shopping-4-m8", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-mina", slots: desc("a1-value-ex-pen", "a1-value-cheap"), translation: L("The pen is cheap.", "La penna è economica.") },
  ],
  transfers: [
    { id: "shopping-4-t1", family: REQ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-mikan"), translation: L("Tangerines, please.", "Dei mandarini, per favore.") },
    { id: "shopping-4-t2", family: QUANT, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "explicit", slots: qa("a1-value-watashi", "a1-value-buy", "a1-value-obj-apple", "a1-value-qty-2"), translation: L("I buy two apples.", "Compro due mele.") },
    { id: "shopping-4-t3", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-learner", slots: desc("a1-value-ex-pen", "a1-value-expensive"), translation: L("The pen is expensive.", "La penna è cara.") },
    { id: "shopping-4-t4", family: REQ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", speakerRole: "a1-role-learner", slots: req("a1-value-obj-coffee"), translation: L("Coffee, please.", "Un caffè, per favore.") },
    { id: "shopping-4-t5", family: DESC, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", slots: desc("a1-value-ex-book", "a1-value-cheap"), translation: L("The book is cheap.", "Il libro è economico.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe, aggregates, and productive-sense introduction records
// ---------------------------------------------------------------------------

export const module10Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module10Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

/** Productive senses first introduced in Module 10 (price adjectives + the
 *  polite request predicate), each with two structurally-distinct intro
 *  variants and a correctness-bearing intro exercise. `laterUses` stays empty;
 *  the spaced reuse timeline is authored immutably in `recurrence.ts`. */
export const module10VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-expensive", introductionLessonId: "shopping-1", introductionVariantIds: ["shopping-1-m1", "shopping-1-m2"], exerciseRoundId: "shopping-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "shopping-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-cheap", introductionLessonId: "shopping-1", introductionVariantIds: ["shopping-1-m3", "shopping-1-m4"], exerciseRoundId: "shopping-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "shopping-1-m3" }),
  a1VerbUseRecord({ senseId: "a1-sense-request", introductionLessonId: "shopping-3", introductionVariantIds: ["shopping-3-m1", "shopping-3-m2"], exerciseRoundId: "shopping-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "shopping-3-m2" }),
];
