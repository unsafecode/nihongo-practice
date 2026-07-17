/**
 * A1 Module 2 — Introductions (identity).
 *
 * Four instructional lessons covering who you are and your basic personal
 * details: name/role, origin/country/language, occupation/study/work, and
 * reciprocal details. Predicates: be / live / study / work / understand / do.
 * Every sentence carries a semantic-ID-only variant; all Japanese/romaji lives
 * in the shared semantic-value catalog. Translations are composed from the
 * shared bilingual gloss tables (copular and object clauses) or authored inline
 * for the location predicates, and every scenario note is context-derived.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_NOMINATIVE_GA,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_TOPIC_WA,
  a1Copular,
  a1VerbObject,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "introductions";
const L = (en: string, it: string): Bilingual => ({ en, it });

// Slot builders (predicate value is fixed per family use).
const cop = (subject: string, object: string) => ({
  subject,
  predicate: "a1-value-be",
  object,
});
const live = (subject: string, location: string) => ({
  subject,
  predicate: "a1-value-live",
  location,
});
const work = (subject: string, location: string) => ({
  subject,
  predicate: "a1-value-work",
  location,
});
const study = (subject: string, object: string) => ({
  subject,
  predicate: "a1-value-study",
  object,
});
const understand = (subject: string, object: string) => ({
  subject,
  predicate: "a1-value-understand",
  object,
});
const doAct = (subject: string, object: string) => ({
  subject,
  predicate: "a1-value-do",
  object,
});

// ---------------------------------------------------------------------------
// Lesson introductions-1 — Name & basic identity (be / live / study)
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-origins"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_LOCATION_PARTICLE,
    A1_CONCEPT_OBJECT_WO,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-live", "a1-sense-study"],
  models: [
    { id: "introductions-1-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-student"), translation: a1Copular("a1-value-yuki", "a1-value-obj-student") },
    { id: "introductions-1-m2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-doctor"), translation: a1Copular("a1-value-ken", "a1-value-obj-doctor") },
    { id: "introductions-1-m3", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-office-worker"), translation: a1Copular("a1-value-mina", "a1-value-obj-office-worker") },
    { id: "introductions-1-m4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-student"), translation: a1Copular("a1-value-watashi", "a1-value-obj-student") },
    { id: "introductions-1-m5", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: live("a1-value-yuki", "a1-value-loc-tokyo"), translation: L("Yuki lives in Tokyo.", "Yuki vive a Tokyo.") },
    { id: "introductions-1-m6", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: live("a1-value-mina", "a1-value-loc-osaka"), translation: L("Mina lives in Osaka.", "Mina vive a Osaka.") },
    { id: "introductions-1-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: study("a1-value-yuki", "a1-value-obj-japanese"), translation: a1VerbObject("a1-value-yuki", "a1-sense-study", "a1-value-obj-japanese") },
    { id: "introductions-1-m8", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-classmate", subjectRealization: "omitted", slots: study("a1-value-classmate-subject", "a1-value-obj-english"), translation: a1VerbObject("a1-value-classmate-subject", "a1-sense-study", "a1-value-obj-english") },
  ],
  transfers: [
    { id: "introductions-1-t1", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-student"), translation: a1Copular("a1-value-ken", "a1-value-obj-student") },
    { id: "introductions-1-t2", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "omitted", slots: live("a1-value-ken", "a1-value-loc-tokyo"), translation: L("Ken lives in Tokyo.", "Ken vive a Tokyo.") },
    { id: "introductions-1-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: study("a1-value-mina", "a1-value-obj-japanese"), translation: a1VerbObject("a1-value-mina", "a1-sense-study", "a1-value-obj-japanese") },
    { id: "introductions-1-t4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-doctor"), translation: a1Copular("a1-value-mina", "a1-value-obj-doctor") },
    { id: "introductions-1-t5", family: "a1-family-location-action", context: "a1-context-classroom", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: live("a1-value-classmate-subject", "a1-value-loc-tokyo"), translation: L("The classmate lives in Tokyo.", "Il compagno di classe vive a Tokyo.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson introductions-2 — Work, study & understanding (work / understand / do)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [
    A1_CONCEPT_LOCATION_PARTICLE,
    A1_CONCEPT_NOMINATIVE_GA,
    A1_CONCEPT_OBJECT_WO,
  ],
  introducedSenseIds: ["a1-sense-work", "a1-sense-understand", "a1-sense-do"],
  models: [
    { id: "introductions-2-m1", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: work("a1-value-ken", "a1-value-loc-company"), translation: L("Ken works at the office.", "Ken lavora in ufficio.") },
    { id: "introductions-2-m2", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: work("a1-value-mina", "a1-value-loc-company"), translation: L("Mina works at the office.", "Mina lavora in ufficio.") },
    { id: "introductions-2-m3", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "omitted", slots: work("a1-value-yuki", "a1-value-loc-restaurant"), translation: L("Yuki works at the restaurant.", "Yuki lavora al ristorante.") },
    { id: "introductions-2-m4", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: understand("a1-value-yuki", "a1-value-obj-japanese"), translation: L("Yuki understands Japanese.", "Yuki capisce il giapponese.") },
    { id: "introductions-2-m5", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "omitted", slots: understand("a1-value-ken", "a1-value-obj-english"), translation: L("Ken understands English.", "Ken capisce l'inglese.") },
    { id: "introductions-2-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: doAct("a1-value-yuki", "a1-value-obj-homework"), translation: a1VerbObject("a1-value-yuki", "a1-sense-do", "a1-value-obj-homework") },
    { id: "introductions-2-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: doAct("a1-value-mina", "a1-value-obj-homework"), translation: a1VerbObject("a1-value-mina", "a1-sense-do", "a1-value-obj-homework") },
    { id: "introductions-2-m8", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: study("a1-value-ken", "a1-value-obj-japanese"), translation: a1VerbObject("a1-value-ken", "a1-sense-study", "a1-value-obj-japanese") },
  ],
  transfers: [
    { id: "introductions-2-t1", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: work("a1-value-mina", "a1-value-loc-restaurant"), translation: L("Mina works at the restaurant.", "Mina lavora al ristorante.") },
    { id: "introductions-2-t2", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: understand("a1-value-ken", "a1-value-obj-english"), translation: L("Ken understands English.", "Ken capisce l'inglese.") },
    { id: "introductions-2-t3", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: understand("a1-value-mina", "a1-value-obj-japanese"), translation: L("Mina understands Japanese.", "Mina capisce il giapponese.") },
    { id: "introductions-2-t4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: doAct("a1-value-mina", "a1-value-obj-homework"), translation: a1VerbObject("a1-value-mina", "a1-sense-do", "a1-value-obj-homework") },
    { id: "introductions-2-t5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: study("a1-value-yuki", "a1-value-obj-english"), translation: a1VerbObject("a1-value-yuki", "a1-sense-study", "a1-value-obj-english") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson introductions-3 — Origins: country & language (be / live / study)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-origins",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COPULA_DESU],
  introducedSenseIds: ["a1-sense-be", "a1-sense-live", "a1-sense-study"],
  models: [
    { id: "introductions-3-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-japanese-person"), translation: a1Copular("a1-value-yuki", "a1-value-obj-japanese-person") },
    { id: "introductions-3-m2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-italian-person"), translation: a1Copular("a1-value-ken", "a1-value-obj-italian-person") },
    { id: "introductions-3-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-american-person"), translation: a1Copular("a1-value-mina", "a1-value-obj-american-person") },
    { id: "introductions-3-m4", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: live("a1-value-yuki", "a1-value-loc-tokyo"), translation: L("Yuki lives in Tokyo.", "Yuki vive a Tokyo.") },
    { id: "introductions-3-m5", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "omitted", slots: live("a1-value-ken", "a1-value-loc-osaka"), translation: L("Ken lives in Osaka.", "Ken vive a Osaka.") },
    { id: "introductions-3-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: study("a1-value-yuki", "a1-value-obj-japanese"), translation: a1VerbObject("a1-value-yuki", "a1-sense-study", "a1-value-obj-japanese") },
    { id: "introductions-3-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: study("a1-value-mina", "a1-value-obj-italian"), translation: a1VerbObject("a1-value-mina", "a1-sense-study", "a1-value-obj-italian") },
    { id: "introductions-3-m8", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: live("a1-value-ken", "a1-value-loc-kyoto"), translation: L("Ken lives in Kyoto.", "Ken vive a Kyoto.") },
  ],
  transfers: [
    { id: "introductions-3-t1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-japanese-person"), translation: a1Copular("a1-value-mina", "a1-value-obj-japanese-person") },
    { id: "introductions-3-t2", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: live("a1-value-mina", "a1-value-loc-kyoto"), translation: L("Mina lives in Kyoto.", "Mina vive a Kyoto.") },
    { id: "introductions-3-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: study("a1-value-yuki", "a1-value-obj-italian"), translation: a1VerbObject("a1-value-yuki", "a1-sense-study", "a1-value-obj-italian") },
    { id: "introductions-3-t4", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-american-person"), translation: a1Copular("a1-value-ken", "a1-value-obj-american-person") },
    { id: "introductions-3-t5", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: live("a1-value-mina", "a1-value-loc-osaka"), translation: L("Mina lives in Osaka.", "Mina vive a Osaka.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson introductions-4 — Putting it together: reciprocal details
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-origins", "a1-can-do-actions"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_LOCATION_PARTICLE,
    A1_CONCEPT_OBJECT_WO,
    A1_CONCEPT_NOMINATIVE_GA,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-live", "a1-sense-work"],
  models: [
    { id: "introductions-4-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-student"), translation: a1Copular("a1-value-yuki", "a1-value-obj-student") },
    { id: "introductions-4-m2", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-engineer"), translation: a1Copular("a1-value-ken", "a1-value-obj-engineer") },
    { id: "introductions-4-m3", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: live("a1-value-yuki", "a1-value-loc-tokyo"), translation: L("Yuki lives in Tokyo.", "Yuki vive a Tokyo.") },
    { id: "introductions-4-m4", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: work("a1-value-ken", "a1-value-loc-company"), translation: L("Ken works at the office.", "Ken lavora in ufficio.") },
    { id: "introductions-4-m5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: study("a1-value-yuki", "a1-value-obj-japanese"), translation: a1VerbObject("a1-value-yuki", "a1-sense-study", "a1-value-obj-japanese") },
    { id: "introductions-4-m6", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "omitted", slots: understand("a1-value-mina", "a1-value-obj-japanese"), translation: L("Mina understands Japanese.", "Mina capisce il giapponese.") },
    { id: "introductions-4-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "omitted", slots: doAct("a1-value-yuki", "a1-value-obj-homework"), translation: a1VerbObject("a1-value-yuki", "a1-sense-do", "a1-value-obj-homework") },
    { id: "introductions-4-m8", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-office-worker"), translation: a1Copular("a1-value-mina", "a1-value-obj-office-worker") },
  ],
  transfers: [
    { id: "introductions-4-t1", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-engineer"), translation: a1Copular("a1-value-mina", "a1-value-obj-engineer") },
    { id: "introductions-4-t2", family: "a1-family-location-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: live("a1-value-ken", "a1-value-loc-osaka"), translation: L("Ken lives in Osaka.", "Ken vive a Osaka.") },
    { id: "introductions-4-t3", family: "a1-family-location-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: work("a1-value-mina", "a1-value-loc-company"), translation: L("Mina works at the office.", "Mina lavora in ufficio.") },
    { id: "introductions-4-t4", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "omitted", slots: understand("a1-value-ken", "a1-value-obj-english"), translation: L("Ken understands English.", "Ken capisce l'inglese.") },
    { id: "introductions-4-t5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: doAct("a1-value-mina", "a1-value-obj-homework"), translation: a1VerbObject("a1-value-mina", "a1-sense-do", "a1-value-obj-homework") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe, aggregates, and productive-verb introduction records
// ---------------------------------------------------------------------------

export const module2Lessons: readonly A1BuiltLesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
];

export const module2Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

/** Productive verbs first introduced in module 2, each with ≥2 structurally
 *  distinct intro variants. `laterUses` stays empty at this slice — later
 *  spaced reuse is authored by subsequent tasks, never pre-claimed here. */
export const module2VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-be", introductionLessonId: "introductions-1", introductionVariantIds: ["introductions-1-m1", "introductions-1-m4"], exerciseRoundId: "introductions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-live", introductionLessonId: "introductions-1", introductionVariantIds: ["introductions-1-m5", "introductions-1-m6"], exerciseRoundId: "introductions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-1-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-study", introductionLessonId: "introductions-1", introductionVariantIds: ["introductions-1-m7", "introductions-1-m8"], exerciseRoundId: "introductions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-1-m7" }),
  a1VerbUseRecord({ senseId: "a1-sense-work", introductionLessonId: "introductions-2", introductionVariantIds: ["introductions-2-m1", "introductions-2-m3"], exerciseRoundId: "introductions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-2-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-understand", introductionLessonId: "introductions-2", introductionVariantIds: ["introductions-2-m4", "introductions-2-m5"], exerciseRoundId: "introductions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-2-m4" }),
  a1VerbUseRecord({ senseId: "a1-sense-do", introductionLessonId: "introductions-2", introductionVariantIds: ["introductions-2-m6", "introductions-2-m7"], exerciseRoundId: "introductions-2-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-2-m6" }),
];
