/**
 * A1 Module 3 — Essential questions.
 *
 * The first three lessons keep question words and sentence-final か inside the
 * familiar copular shape. The final lesson then introduces substantive
 * nominative が through language-understanding questions and answers.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_INTERROGATIVE_KA,
  A1_CONCEPT_NOMINATIVE_GA,
  A1_CONCEPT_TOPIC_WA,
  a1VerbUseRecord,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type A1LineSpec,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "essential-questions";
const L = (en: string, it: string): Bilingual => ({ en, it });

const copQ = (subject: string, qword: string) => ({
  subject,
  predicate: "a1-value-be",
  object: qword,
});
const ynQ = (subject: string, complement: string) => ({
  subject,
  predicate: "a1-value-be",
  object: complement,
});
const actQ = (subject: string, qword: string) => ({
  subject,
  predicate: "a1-value-understand",
  object: qword,
});
const actA = (subject: string, language: string) => ({
  subject,
  predicate: "a1-value-understand",
  object: language,
});
const q = (spec: Omit<A1LineSpec, "interrogative">): A1LineSpec => ({
  ...spec,
  interrogative: true,
});

type SpeakerRow = readonly [string, string];
const withSpeakers = (
  models: readonly A1LineSpec[],
  table: readonly SpeakerRow[],
): readonly A1LineSpec[] =>
  models.map((model, index) => ({
    ...model,
    speakerRole: table[index][0],
    addresseeRole: table[index][1],
  }));

const LEARNER = "a1-role-learner";
const TEACHER = "a1-role-teacher";
const CLASSMATE = "a1-role-classmate";
const CLERK = "a1-role-clerk";
const PERSON = "a1-role-person";
const YUKI = "a1-role-yuki";
const KEN = "a1-role-ken";
const MINA = "a1-role-mina";

const L1_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, CLERK], [LEARNER, CLERK], [CLASSMATE, LEARNER], [TEACHER, LEARNER],
  [LEARNER, TEACHER], [YUKI, LEARNER], [KEN, LEARNER], [LEARNER, TEACHER],
];
const L2_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, PERSON], [LEARNER, PERSON], [LEARNER, TEACHER], [YUKI, LEARNER],
  [LEARNER, PERSON], [TEACHER, LEARNER], [CLASSMATE, LEARNER], [LEARNER, TEACHER],
];
const L3_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, CLASSMATE], [LEARNER, CLERK], [LEARNER, CLERK], [LEARNER, CLERK],
  [MINA, CLERK], [TEACHER, LEARNER], [KEN, LEARNER], [YUKI, LEARNER],
];
const L4_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, TEACHER], [LEARNER, TEACHER], [LEARNER, KEN], [LEARNER, MINA],
  [LEARNER, TEACHER], [YUKI, LEARNER], [KEN, LEARNER], [MINA, LEARNER],
];

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_INTERROGATIVE_KA,
  ],
  introducedSenseIds: ["a1-sense-be"],
  models: withSpeakers([
    q({ id: "essential-questions-1-m1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-pass", "a1-value-q-nan"), translation: L("What is this pass?", "Che cos'è questo pass?") }),
    q({ id: "essential-questions-1-m2", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-menu", "a1-value-q-nan"), translation: L("What is that menu?", "Che cos'è quel menu?") }),
    q({ id: "essential-questions-1-m3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-poster", "a1-value-q-nani"), translation: L("What is this poster, exactly?", "Che cos'è esattamente questo poster?") }),
    q({ id: "essential-questions-1-m4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-label", "a1-value-q-nani"), translation: L("What is that label, exactly?", "Che cos'è esattamente quell'etichetta?") }),
    q({ id: "essential-questions-1-m5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-dono-hon"), translation: L("Which book is this?", "Quale libro è questo?") }),
    q({ id: "essential-questions-1-m6", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-kore", "a1-value-obj-teacher"), translation: L("Is this a teacher?", "Questo è un insegnante?") }),
    q({ id: "essential-questions-1-m7", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-sore", "a1-value-obj-student"), translation: L("Is that a student?", "Quello è uno studente?") }),
    q({ id: "essential-questions-1-m8", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-kore", "a1-value-obj-doctor"), translation: L("Is this a doctor?", "Questo è un medico?") }),
  ], L1_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-1-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-dono-hon"), translation: L("Which book is that?", "Quale libro è quello?") }),
    q({ id: "essential-questions-1-t2", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-kore", "a1-value-obj-student"), translation: L("Is this a student?", "Questo è uno studente?") }),
    q({ id: "essential-questions-1-t3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-sore", "a1-value-obj-teacher"), translation: L("Is that a teacher?", "Quello è un insegnante?") }),
    q({ id: "essential-questions-1-t4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: ynQ("a1-value-sore", "a1-value-obj-doctor"), translation: L("Is that a doctor?", "Quello è un medico?") }),
    q({ id: "essential-questions-1-t5", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-nan"), translation: L("What is this?", "Che cos'è questo?") }),
  ],
});

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: withSpeakers([
    q({ id: "essential-questions-2-m1", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-counter", "a1-value-q-doko"), translation: L("Where is the counter?", "Dov'è il bancone?") }),
    q({ id: "essential-questions-2-m2", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-exit", "a1-value-q-doko"), translation: L("Where is the exit?", "Dov'è l'uscita?") }),
    q({ id: "essential-questions-2-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-q-locker", "a1-value-q-doko"), translation: L("Where is the locker?", "Dov'è l'armadietto?") }),
    q({ id: "essential-questions-2-m4", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-toire-subject", "a1-value-q-doko"), translation: L("Where is the toilet?", "Dov'è il bagno?") }),
    q({ id: "essential-questions-2-m5", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-ano-hito", "a1-value-companion-child"), translation: L("Is that person over there a child?", "Quella persona laggiù è un bambino?") }),
    q({ id: "essential-questions-2-m6", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: ynQ("a1-value-classmate-subject", "a1-value-obj-student"), translation: L("Is the classmate a student?", "Il compagno di classe è uno studente?") }),
    q({ id: "essential-questions-2-m7", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-sono-hito", "a1-value-q-dare"), translation: L("Who is that person?", "Chi è quella persona?") }),
    q({ id: "essential-questions-2-m8", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-sono-hito", "a1-value-obj-teacher"), translation: L("Is that person a teacher?", "Quella persona è un insegnante?") }),
  ], L2_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-2-t1", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-sono-hito", "a1-value-obj-student"), translation: L("Is that person a student?", "Quella persona è uno studente?") }),
    q({ id: "essential-questions-2-t2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-ano-hito", "a1-value-obj-student"), translation: L("Is that person over there a student?", "Quella persona laggiù è uno studente?") }),
    q({ id: "essential-questions-2-t3", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-classmate", subjectRealization: "explicit", slots: copQ("a1-value-classmate-subject", "a1-value-q-dare"), translation: L("Who is the classmate?", "Chi è il compagno di classe?") }),
    q({ id: "essential-questions-2-t4", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-sono-hito", "a1-value-companion-child"), translation: L("Is that person a child?", "Quella persona è un bambino?") }),
    q({ id: "essential-questions-2-t5", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: ynQ("a1-value-ano-hito", "a1-value-companion-child"), translation: L("Is that person over there a child?", "Quella persona laggiù è un bambino?") }),
  ],
});

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: withSpeakers([
    q({ id: "essential-questions-3-m1", family: "a1-family-topic-copular", context: "a1-context-cafe", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-paatii-subject", "a1-value-q-itsu"), translation: L("When is the party?", "Quand'è la festa?") }),
    q({ id: "essential-questions-3-m2", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-ikura"), translation: L("How much is this?", "Quanto costa questo?") }),
    q({ id: "essential-questions-3-m3", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-ikura"), translation: L("How much is that?", "Quanto costa quello?") }),
    q({ id: "essential-questions-3-m4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikutsu"), translation: L("How many tangerines are there?", "Quanti mandarini ci sono?") }),
    q({ id: "essential-questions-3-m5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-ikutsu"), translation: L("How many are these?", "Quanti sono questi?") }),
    q({ id: "essential-questions-3-m6", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-dore"), translation: L("Which one is that?", "Quale è quello?") }),
    q({ id: "essential-questions-3-m7", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikura"), translation: L("How much are the tangerines?", "Quanto costano i mandarini?") }),
    q({ id: "essential-questions-3-m8", family: "a1-family-topic-copular", context: "a1-context-cafe", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-itsu"), translation: L("When is that?", "Quand'è quello?") }),
  ], L3_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-3-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-dore"), translation: L("Which one is this?", "Quale è questo?") }),
    q({ id: "essential-questions-3-t2", family: "a1-family-topic-copular", context: "a1-context-cafe", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-paatii-subject", "a1-value-q-itsu"), translation: L("When is the party?", "Quand'è la festa?") }),
    q({ id: "essential-questions-3-t3", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-ikutsu"), translation: L("How many are those?", "Quanti sono quelli?") }),
    q({ id: "essential-questions-3-t4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikura"), translation: L("How much are the tangerines?", "Quanto costano i mandarini?") }),
    q({ id: "essential-questions-3-t5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-ikura"), translation: L("How much is this?", "Quanto costa questo?") }),
  ],
});

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-actions"],
  diversityOverride: { minPredicates: 1 },
  introducedConceptIds: [A1_CONCEPT_NOMINATIVE_GA],
  introducedSenseIds: ["a1-sense-understand"],
  models: withSpeakers([
    q({ id: "essential-questions-4-m1", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-obj-korean-language"), translation: L("Do you understand Korean?", "Capisci il coreano?") }),
    q({ id: "essential-questions-4-m2", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-obj-spanish-language"), translation: L("Does Yuki understand Spanish?", "Yuki capisce lo spagnolo?") }),
    q({ id: "essential-questions-4-m3", family: "a1-family-nominative-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: actQ("a1-value-ken", "a1-value-obj-german-language"), translation: L("Does Ken understand German?", "Ken capisce il tedesco?") }),
    q({ id: "essential-questions-4-m4", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actQ("a1-value-mina", "a1-value-obj-chinese-language"), translation: L("Does Mina understand Chinese?", "Mina capisce il cinese?") }),
    { id: "essential-questions-4-m5", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actA("a1-value-watashi", "a1-value-obj-japanese"), translation: L("I understand Japanese.", "Capisco il giapponese.") },
    { id: "essential-questions-4-m6", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actA("a1-value-yuki", "a1-value-obj-english"), translation: L("Yuki understands English.", "Yuki capisce l'inglese.") },
    { id: "essential-questions-4-m7", family: "a1-family-nominative-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: actA("a1-value-ken", "a1-value-obj-italian"), translation: L("Ken understands Italian.", "Ken capisce l'italiano.") },
    { id: "essential-questions-4-m8", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actA("a1-value-mina", "a1-value-obj-japanese"), translation: L("Mina understands Japanese.", "Mina capisce il giapponese.") },
  ], L4_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-4-t1", family: "a1-family-nominative-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actQ("a1-value-mina", "a1-value-obj-italian"), translation: L("Does Mina understand Italian?", "Mina capisce l'italiano?") }),
    { id: "essential-questions-4-t2", family: "a1-family-nominative-action", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actA("a1-value-mina", "a1-value-obj-italian"), translation: L("Mina understands Italian.", "Mina capisce l'italiano.") },
    q({ id: "essential-questions-4-t3", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-obj-japanese"), translation: L("Does Yuki understand Japanese?", "Yuki capisce il giapponese?") }),
    { id: "essential-questions-4-t4", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: actA("a1-value-ken", "a1-value-obj-english"), translation: L("Ken understands English.", "Ken capisce l'inglese.") },
    { id: "essential-questions-4-t5", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actA("a1-value-watashi", "a1-value-obj-english"), translation: L("I understand English.", "Capisco l'inglese.") },
  ],
});

export const module3Lessons: readonly A1BuiltLesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
];

export const module3Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

export const module3VerbUseRecords: readonly VerbUseRecord[] = [
  a1VerbUseRecord({ senseId: "a1-sense-understand", introductionLessonId: "essential-questions-4", introductionVariantIds: ["essential-questions-4-m1", "essential-questions-4-m2"], exerciseRoundId: "essential-questions-4-round-1", exerciseKind: "tile-ordering", exerciseTargetVariantId: "essential-questions-4-m1" }),
];
