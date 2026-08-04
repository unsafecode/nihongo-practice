/**
 * A1 Module 3 — Essential questions.
 *
 * Four instructional lessons covering demonstratives (これ/それ/あれ/どれ,
 * この/その/あの/どの), the core interrogatives (だれ/なに/どこ/いつ/いくら/いくつ)
 * and yes/no questions with the sentence-final か. Every question is realized
 * through the topic-copular or an action family with `interrogative: true`, so
 * the realizer owns the か particle and question word order stays natural —
 * これはなんですか, あのひとはだれですか, なにをしますか — never an invented
 * copula/particle order. The module reuses only verbs already introduced in
 * module 2 (be / do / study / understand); it introduces no new predicate.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_INTERROGATIVE_KA,
  A1_CONCEPT_NOMINATIVE_GA,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_TOPIC_WA,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type A1LineSpec,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";

const MODULE_ID = "essential-questions";
const L = (en: string, it: string): Bilingual => ({ en, it });

// Copular content question: `<subject> は <qword> ですか`.
const copQ = (subject: string, qword: string) => ({
  subject,
  predicate: "a1-value-be",
  object: qword,
});
// Yes/no copular question: `<subject> は <complement> ですか`.
const ynQ = (subject: string, complement: string) => ({
  subject,
  predicate: "a1-value-be",
  object: complement,
});
// Action question with a question word in the object slot.
const actQ = (subject: string, predicate: string, qword: string) => ({
  subject,
  predicate,
  object: qword,
});

const q = (
  spec: Omit<A1LineSpec, "interrogative">,
): A1LineSpec => ({ ...spec, interrogative: true });

// Reciprocal question practice: a lesson's eight model questions are voiced by
// a natural mix of askers (the learner asking staff/teacher, and classmates or
// the teacher asking the learner in paired drills), so each lesson exercises at
// least three distinct discourse roles. Speaker identity is discourse-only
// metadata and never alters the realized Japanese. Transfers keep their own
// default speaker. Each row is [speakerRole, addresseeRole].
type SpeakerRow = readonly [string, string];
const withSpeakers = (
  models: readonly A1LineSpec[],
  table: readonly SpeakerRow[],
): readonly A1LineSpec[] =>
  models.map((m, i) => ({
    ...m,
    speakerRole: table[i][0],
    addresseeRole: table[i][1],
  }));

const LEARNER = "a1-role-learner";
const TEACHER = "a1-role-teacher";
const CLASSMATE = "a1-role-classmate";
const CLERK = "a1-role-clerk";
const PERSON = "a1-role-person";
const FRIEND = "a1-role-friend";
const YUKI = "a1-role-yuki";
const KEN = "a1-role-ken";
const MINA = "a1-role-mina";

const L1_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, CLERK], [LEARNER, CLERK], [LEARNER, TEACHER], [TEACHER, LEARNER],
  [CLASSMATE, LEARNER], [YUKI, LEARNER], [KEN, LEARNER], [LEARNER, TEACHER],
];
const L2_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, PERSON], [LEARNER, PERSON], [LEARNER, TEACHER], [YUKI, LEARNER],
  [LEARNER, CLERK], [TEACHER, LEARNER], [CLASSMATE, LEARNER], [LEARNER, TEACHER],
];
const L3_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, FRIEND], [LEARNER, CLERK], [LEARNER, CLERK], [LEARNER, CLERK],
  [MINA, CLERK], [TEACHER, LEARNER], [KEN, LEARNER], [YUKI, LEARNER],
];
const L4_SPEAKERS: readonly SpeakerRow[] = [
  [LEARNER, CLERK], [LEARNER, TEACHER], [LEARNER, PERSON], [LEARNER, CLERK],
  [MINA, FRIEND], [TEACHER, LEARNER], [KEN, LEARNER], [LEARNER, TEACHER],
];

// ---------------------------------------------------------------------------
// Lesson essential-questions-1 — What is this? / What do you do?
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_INTERROGATIVE_KA,
    A1_CONCEPT_OBJECT_WO,
    A1_CONCEPT_NOMINATIVE_GA,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-do", "a1-sense-study"],
  models: withSpeakers([
    q({ id: "essential-questions-1-m1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-nan"), translation: L("What is this?", "Che cos'è questo?") }),
    q({ id: "essential-questions-1-m2", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-nan"), translation: L("What is that?", "Che cos'è quello?") }),
    q({ id: "essential-questions-1-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-ano-hito", "a1-value-q-dare"), translation: L("Who is that person over there?", "Chi è quella persona là?") }),
    q({ id: "essential-questions-1-m4", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "omitted", slots: copQ("a1-value-kore", "a1-value-q-dono-hon"), translation: L("Which book?", "Quale libro?") }),
    q({ id: "essential-questions-1-m5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-do", "a1-value-q-nani"), translation: L("What do you do?", "Cosa fai?") }),
    q({ id: "essential-questions-1-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-study", "a1-value-q-nani"), translation: L("What do you study?", "Cosa studi?") }),
    q({ id: "essential-questions-1-m7", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-understand", "a1-value-q-nani"), translation: L("What do you understand?", "Cosa capisci?") }),
    q({ id: "essential-questions-1-m8", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: ynQ("a1-value-yuki", "a1-value-obj-student"), translation: L("Is Yuki a student?", "Yuki è una studentessa?") }),
  ], L1_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-1-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-dono-hon"), translation: L("Which book is that?", "Quale libro è quello?") }),
    q({ id: "essential-questions-1-t2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "omitted", slots: copQ("a1-value-ano-hito", "a1-value-q-dare"), translation: L("Who is that?", "Chi è?") }),
    q({ id: "essential-questions-1-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-do", "a1-value-q-nani"), translation: L("What does Yuki do?", "Cosa fa Yuki?") }),
    q({ id: "essential-questions-1-t4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: actQ("a1-value-ken", "a1-value-study", "a1-value-q-nani"), translation: L("What does Ken study?", "Cosa studia Ken?") }),
    q({ id: "essential-questions-1-t5", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actQ("a1-value-mina", "a1-value-understand", "a1-value-q-nani"), translation: L("What does Mina understand?", "Cosa capisce Mina?") }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson essential-questions-2 — Who and where
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_INTERROGATIVE_KA,
    A1_CONCEPT_OBJECT_WO,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-do", "a1-sense-study"],
  models: withSpeakers([
    q({ id: "essential-questions-2-m1", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-toire-subject", "a1-value-q-doko"), translation: L("Where is the toilet?", "Dov'è il bagno?") }),
    q({ id: "essential-questions-2-m2", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-eki-subject", "a1-value-q-doko"), translation: L("Where is the station?", "Dov'è la stazione?") }),
    q({ id: "essential-questions-2-m3", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-ano-hito", "a1-value-q-dare"), translation: L("Who is that person over there?", "Chi è quella persona là?") }),
    q({ id: "essential-questions-2-m4", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-sono-hito", "a1-value-q-dare"), translation: L("Who is that person?", "Chi è quella persona?") }),
    q({ id: "essential-questions-2-m5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-nan"), translation: L("What is this?", "Che cos'è questo?") }),
    q({ id: "essential-questions-2-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-do", "a1-value-q-nani"), translation: L("What do you do?", "Cosa fai?") }),
    q({ id: "essential-questions-2-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-study", "a1-value-q-nani"), translation: L("What do you study?", "Cosa studi?") }),
    q({ id: "essential-questions-2-m8", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: ynQ("a1-value-ken", "a1-value-obj-student"), translation: L("Is Ken a student?", "Ken è uno studente?") }),
  ], L2_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-2-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-nan"), translation: L("What is that?", "Che cos'è quello?") }),
    q({ id: "essential-questions-2-t2", family: "a1-family-topic-copular", context: "a1-context-classroom", subjectReferent: "a1-referent-thing", subjectRealization: "omitted", slots: copQ("a1-value-kore", "a1-value-q-dono-hon"), translation: L("Which book?", "Quale libro?") }),
    q({ id: "essential-questions-2-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-do", "a1-value-q-nani"), translation: L("What does Yuki do?", "Cosa fa Yuki?") }),
    q({ id: "essential-questions-2-t4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actQ("a1-value-mina", "a1-value-study", "a1-value-q-nani"), translation: L("What does Mina study?", "Cosa studia Mina?") }),
    q({ id: "essential-questions-2-t5", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: ynQ("a1-value-mina", "a1-value-obj-student"), translation: L("Is Mina a student?", "Mina è una studentessa?") }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson essential-questions-3 — When, how much, how many
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_INTERROGATIVE_KA,
    A1_CONCEPT_OBJECT_WO,
    A1_CONCEPT_NOMINATIVE_GA,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-do", "a1-sense-understand"],
  models: withSpeakers([
    q({ id: "essential-questions-3-m1", family: "a1-family-topic-copular", context: "a1-context-cafe", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-paatii-subject", "a1-value-q-itsu"), translation: L("When is the party?", "Quand'è la festa?") }),
    q({ id: "essential-questions-3-m2", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-ikura"), translation: L("How much is this?", "Quanto costa questo?") }),
    q({ id: "essential-questions-3-m3", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-ikura"), translation: L("How much is that?", "Quanto costa quello?") }),
    q({ id: "essential-questions-3-m4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikutsu"), translation: L("How many tangerines are there?", "Quanti mandarini ci sono?") }),
    q({ id: "essential-questions-3-m5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-are", "a1-value-q-ikura"), translation: L("How much is that over there?", "Quanto costa quello là?") }),
    q({ id: "essential-questions-3-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-do", "a1-value-q-nani"), translation: L("What do you do?", "Cosa fai?") }),
    q({ id: "essential-questions-3-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-study", "a1-value-q-nani"), translation: L("What do you study?", "Cosa studi?") }),
    q({ id: "essential-questions-3-m8", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-understand", "a1-value-q-nani"), translation: L("What do you understand?", "Cosa capisci?") }),
  ], L3_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-3-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-ikutsu"), translation: L("How many are these?", "Quanti sono questi?") }),
    q({ id: "essential-questions-3-t2", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-do", "a1-value-q-nani"), translation: L("What does Yuki do?", "Cosa fa Yuki?") }),
    q({ id: "essential-questions-3-t3", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: actQ("a1-value-ken", "a1-value-study", "a1-value-q-nani"), translation: L("What does Ken study?", "Cosa studia Ken?") }),
    q({ id: "essential-questions-3-t4", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: actQ("a1-value-mina", "a1-value-understand", "a1-value-q-nani"), translation: L("What does Mina understand?", "Cosa capisce Mina?") }),
    q({ id: "essential-questions-3-t5", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikura"), translation: L("How much are the tangerines?", "Quanto costano i mandarini?") }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson essential-questions-4 — Mixed clarification & reciprocal questions
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "essential-questions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-questions",
  supportingCanDoIds: ["a1-can-do-identity", "a1-can-do-actions"],
  introducedConceptIds: [
    A1_CONCEPT_TOPIC_WA,
    A1_CONCEPT_COPULA_DESU,
    A1_CONCEPT_INTERROGATIVE_KA,
    A1_CONCEPT_OBJECT_WO,
    A1_CONCEPT_NOMINATIVE_GA,
  ],
  introducedSenseIds: ["a1-sense-be", "a1-sense-do", "a1-sense-study"],
  models: withSpeakers([
    q({ id: "essential-questions-4-m1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-are", "a1-value-q-dono-hon"), translation: L("Which book is that over there?", "Quale libro è quello laggiù?") }),
    q({ id: "essential-questions-4-m2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-sono-hito", "a1-value-q-dare"), translation: L("Who is that person?", "Chi è quella persona?") }),
    q({ id: "essential-questions-4-m3", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-toire-subject", "a1-value-q-doko"), translation: L("Where is the toilet?", "Dov'è il bagno?") }),
    q({ id: "essential-questions-4-m4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-kore", "a1-value-q-dore"), translation: L("Which one is this?", "Quale di questi è?") }),
    q({ id: "essential-questions-4-m5", family: "a1-family-nominative-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-understand", "a1-value-q-nani"), translation: L("What do you understand?", "Che cosa capisci?") }),
    q({ id: "essential-questions-4-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-do", "a1-value-q-nani"), translation: L("What do you do?", "Cosa fai?") }),
    q({ id: "essential-questions-4-m7", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted", slots: actQ("a1-value-watashi", "a1-value-study", "a1-value-q-nani"), translation: L("What do you study?", "Cosa studi?") }),
    q({ id: "essential-questions-4-m8", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: ynQ("a1-value-yuki", "a1-value-obj-student"), translation: L("Is Yuki a student?", "Yuki è una studentessa?") }),
  ], L4_SPEAKERS),
  transfers: [
    q({ id: "essential-questions-4-t1", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-sore", "a1-value-q-nan"), translation: L("What is that?", "Che cos'è quello?") }),
    q({ id: "essential-questions-4-t2", family: "a1-family-topic-copular", context: "a1-context-first-meeting", subjectReferent: "a1-referent-person", subjectRealization: "explicit", slots: copQ("a1-value-ano-hito", "a1-value-q-dare"), translation: L("Who is that person over there?", "Chi è quella persona là?") }),
    q({ id: "essential-questions-4-t3", family: "a1-family-topic-copular", context: "a1-context-station", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-eki-subject", "a1-value-q-doko"), translation: L("Where is the station?", "Dov'è la stazione?") }),
    q({ id: "essential-questions-4-t4", family: "a1-family-topic-copular", context: "a1-context-shop", subjectReferent: "a1-referent-thing", subjectRealization: "explicit", slots: copQ("a1-value-mikan-subject", "a1-value-q-ikutsu"), translation: L("How many tangerines are there?", "Quanti mandarini ci sono?") }),
    q({ id: "essential-questions-4-t5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: actQ("a1-value-yuki", "a1-value-do", "a1-value-q-nani"), translation: L("What does Yuki do?", "Cosa fa Yuki?") }),
  ],
});

// ---------------------------------------------------------------------------
// Module recipe and aggregates
// ---------------------------------------------------------------------------

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
