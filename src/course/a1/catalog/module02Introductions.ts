/**
 * A1 Module 2 — Introductions (identity).
 *
 * The four lessons establish a predicate-final copular foundation, reinforce
 * origin and role statements, introduce dictionary-form lookup alongside polite
 * agent-only actions, then combine the known shapes in reciprocal details.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_TOPIC_WA,
  a1Copular,
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

const cop = (subject: string, object: string) => ({
  subject,
  predicate: "a1-value-be",
  object,
});
const bare = (subject: string, predicate: string) => ({
  subject,
  predicate,
});

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-origins"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COPULA_DESU],
  introducedSenseIds: ["a1-sense-be"],
  models: [
    { id: "introductions-1-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-artist"), translation: L("Yuki is an artist.", "Yuki è un'artista.") },
    { id: "introductions-1-m2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-nurse"), translation: L("Ken is a nurse.", "Ken è un infermiere.") },
    { id: "introductions-1-m3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "explicit", slots: cop("a1-value-watashi", "a1-value-obj-chef"), translation: L("I am a chef.", "Sono uno chef.") },
    { id: "introductions-1-m4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-designer"), translation: L("I am a designer.", "Sono un designer.") },
    { id: "introductions-1-m5", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-teacher", subjectRealization: "explicit", slots: cop("a1-value-teacher-subject", "a1-value-obj-researcher"), translation: L("The teacher is a researcher.", "L'insegnante è un ricercatore.") },
    { id: "introductions-1-m6", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-self", subjectRealization: "explicit", slots: cop("a1-value-watashi", "a1-value-obj-doctor"), translation: a1Copular("a1-value-watashi", "a1-value-obj-doctor") },
    { id: "introductions-1-m7", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-doctor"), translation: a1Copular("a1-value-yuki", "a1-value-obj-doctor") },
    { id: "introductions-1-m8", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-student"), translation: a1Copular("a1-value-watashi", "a1-value-obj-student") },
  ],
  transfers: [
    { id: "introductions-1-t1", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-student"), translation: a1Copular("a1-value-ken", "a1-value-obj-student") },
    { id: "introductions-1-t2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-doctor"), translation: a1Copular("a1-value-watashi", "a1-value-obj-doctor") },
    { id: "introductions-1-t3", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-artist"), translation: L("Yuki is an artist.", "Yuki è un'artista.") },
    { id: "introductions-1-t4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-student"), translation: a1Copular("a1-value-yuki", "a1-value-obj-student") },
    { id: "introductions-1-t5", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-self", subjectRealization: "explicit", slots: cop("a1-value-watashi", "a1-value-obj-nurse"), translation: L("I am a nurse.", "Sono un infermiere; un'infermiera.") },
  ],
});

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-origins"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "introductions-2-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-brazilian-person"), translation: L("Mina is Brazilian.", "Mina è brasiliana.") },
    { id: "introductions-2-m2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-canadian-person"), translation: L("Ken is Canadian.", "Ken è canadese.") },
    { id: "introductions-2-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-korean-person"), translation: L("Yuki is Korean.", "Yuki è coreana.") },
    { id: "introductions-2-m4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "explicit", slots: cop("a1-value-watashi", "a1-value-obj-spanish-person"), translation: L("I am Spanish.", "Sono spagnolo; spagnola.") },
    { id: "introductions-2-m5", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-italian-person"), translation: a1Copular("a1-value-watashi", "a1-value-obj-italian-person") },
    { id: "introductions-2-m6", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-american-person"), translation: a1Copular("a1-value-mina", "a1-value-obj-american-person") },
    { id: "introductions-2-m7", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-teacher"), translation: a1Copular("a1-value-ken", "a1-value-obj-teacher") },
    { id: "introductions-2-m8", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-student"), translation: a1Copular("a1-value-yuki", "a1-value-obj-student") },
  ],
  transfers: [
    { id: "introductions-2-t1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-italian-person"), translation: a1Copular("a1-value-mina", "a1-value-obj-italian-person") },
    { id: "introductions-2-t2", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-american-person"), translation: a1Copular("a1-value-ken", "a1-value-obj-american-person") },
    { id: "introductions-2-t3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: cop("a1-value-watashi", "a1-value-obj-japanese-person"), translation: a1Copular("a1-value-watashi", "a1-value-obj-japanese-person") },
    { id: "introductions-2-t4", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-japanese-person"), translation: a1Copular("a1-value-yuki", "a1-value-obj-japanese-person") },
    { id: "introductions-2-t5", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-student"), translation: a1Copular("a1-value-mina", "a1-value-obj-student") },
  ],
});

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-actions",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [],
  introducedSenseIds: [
    "a1-sense-work-bare",
    "a1-sense-study-bare",
    "a1-sense-do-bare",
  ],
  models: [
    { id: "introductions-3-m1", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-rina", "a1-value-work-bare"), translation: L("Rina works.", "Rina lavora.") },
    { id: "introductions-3-m2", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-taichi", "a1-value-study-bare"), translation: L("Taichi studies.", "Taichi studia.") },
    { id: "introductions-3-m3", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-mei", "a1-value-do-bare"), translation: L("Mei does it.", "Mei lo fa.") },
    { id: "introductions-3-m4", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-haru", "a1-value-work-bare"), translation: L("Haru works.", "Haru lavora.") },
    { id: "introductions-3-m5", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-ano-hito", "a1-value-study-bare"), translation: L("That person over there studies.", "Quella persona laggiù studia.") },
    { id: "introductions-3-m6", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-do-bare"), translation: L("I'll do it.", "Lo farò.") },
    { id: "introductions-3-m7", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: bare("a1-value-mina", "a1-value-work-bare"), translation: L("Mina works.", "Mina lavora.") },
    { id: "introductions-3-m8", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: bare("a1-value-yuki", "a1-value-study-bare"), translation: L("Yuki studies.", "Yuki studia.") },
  ],
  transfers: [
    { id: "introductions-3-t1", family: "a1-family-bare-action", context: "a1-context-home", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: bare("a1-value-mina", "a1-value-study-bare"), translation: L("Mina studies.", "Mina studia.") },
    { id: "introductions-3-t2", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: bare("a1-value-ken", "a1-value-work-bare"), translation: L("Ken works.", "Ken lavora.") },
    { id: "introductions-3-t3", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-do-bare"), translation: L("I'll do it.", "Lo farò.") },
    { id: "introductions-3-t4", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-ano-hito", "a1-value-work-bare"), translation: L("That person over there works.", "Quella persona laggiù lavora.") },
    { id: "introductions-3-t5", family: "a1-family-bare-action", context: "a1-context-home", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-study-bare"), translation: L("I study.", "Studio.") },
  ],
});

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "introductions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-identity",
  supportingCanDoIds: ["a1-can-do-origins", "a1-can-do-actions"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    { id: "introductions-4-m1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-student"), translation: a1Copular("a1-value-yuki", "a1-value-obj-student") },
    { id: "introductions-4-m2", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: cop("a1-value-ken", "a1-value-obj-librarian"), translation: L("Ken is a librarian.", "Ken è un bibliotecario.") },
    { id: "introductions-4-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: cop("a1-value-yuki", "a1-value-obj-musician"), translation: L("Yuki is a musician.", "Yuki è una musicista.") },
    { id: "introductions-4-m4", family: "a1-family-topic-copular", context: "a1-context-workplace", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: cop("a1-value-sono-hito", "a1-value-obj-writer"), translation: L("That person is a writer.", "Quella persona è una scrittrice; uno scrittore.") },
    { id: "introductions-4-m5", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: bare("a1-value-classmate-subject", "a1-value-study-bare"), translation: L("The classmate studies.", "Il compagno di classe studia.") },
    { id: "introductions-4-m6", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-work-bare"), translation: L("I work.", "Lavoro.") },
    { id: "introductions-4-m7", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: bare("a1-value-ken", "a1-value-do-bare"), translation: L("Ken will do it.", "Ken lo farà.") },
    { id: "introductions-4-m8", family: "a1-family-bare-action", context: "a1-context-home", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-study-bare"), translation: L("I study.", "Studio.") },
  ],
  transfers: [
    { id: "introductions-4-t1", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: cop("a1-value-mina", "a1-value-obj-office-worker"), translation: a1Copular("a1-value-mina", "a1-value-obj-office-worker") },
    { id: "introductions-4-t2", family: "a1-family-bare-action", context: "a1-context-workplace", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: bare("a1-value-sono-hito", "a1-value-work-bare"), translation: L("That person works.", "Quella persona lavora.") },
    { id: "introductions-4-t3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: cop("a1-value-classmate-subject", "a1-value-obj-student"), translation: a1Copular("a1-value-classmate-subject", "a1-value-obj-student") },
    { id: "introductions-4-t4", family: "a1-family-bare-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: bare("a1-value-watashi", "a1-value-do-bare"), translation: L("I'll do it.", "Lo farò.") },
    { id: "introductions-4-t5", family: "a1-family-bare-action", context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: bare("a1-value-yuki", "a1-value-study-bare"), translation: L("Yuki studies.", "Yuki studia.") },
  ],
});

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

export const module2VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-be", introductionLessonId: "introductions-1", introductionVariantIds: ["introductions-1-m1", "introductions-1-m4"], exerciseRoundId: "introductions-1-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-1-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-work-bare", introductionLessonId: "introductions-3", introductionVariantIds: ["introductions-3-m1", "introductions-3-m4"], exerciseRoundId: "introductions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-3-m1" }),
  a1VerbUseRecord({ senseId: "a1-sense-study-bare", introductionLessonId: "introductions-3", introductionVariantIds: ["introductions-3-m5", "introductions-3-m2"], exerciseRoundId: "introductions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-3-m5" }),
  a1VerbUseRecord({ senseId: "a1-sense-do-bare", introductionLessonId: "introductions-3", introductionVariantIds: ["introductions-3-m3", "introductions-3-m6"], exerciseRoundId: "introductions-3-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "introductions-3-m3" }),
];
