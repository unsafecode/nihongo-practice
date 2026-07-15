import { curriculumFoundation } from "../curriculum/foundation";
import { genericPersonas } from "../data/personas";
import type { LessonId, ModuleId } from "../data/types";
import { concepts } from "./concepts";
import {
  curriculumExamples,
  curriculumExamplesById,
} from "./examples";
import { lexiconById, verbLexemes } from "./lexicon";
import {
  speechPromptIdForLesson,
  speechPrompts,
} from "./speechPrompts";
import { en as enCopy } from "./copy/en";
import { it as itCopy } from "./copy/it";
import type {
  AssembledCurriculumCatalogs,
  ConceptId,
  CurriculumCopyCatalog,
  CurriculumLessonEntry,
  CurriculumModuleEntry,
  LexemeId,
  ModuleCoverage,
} from "./types";

/**
 * The assembled A0→A1 curriculum (design spec §5, §6, §9 and Slice B plan
 * Task 3). This file authors the 40 lesson plans — which concepts and lexemes
 * each lesson introduces, practices, and assesses, which shared examples it
 * shows, and its spoken target — then derives locale-independent lesson and
 * module coverage from those plans.
 *
 * Coverage is never hand-counted: `moduleCoverage` is computed from the lessons
 * with the same rules `validateCurriculum` re-derives, so the authored and
 * computed matrices are provably identical. Japanese lives only in the example
 * catalog; localized prose lives only in the copy catalogs.
 */

interface LessonPlan {
  readonly id: LessonId;
  readonly moduleId: ModuleId;
  readonly order: number;
  readonly estimatedMinutes: number;
  readonly capstone: boolean;
  readonly introducedConceptIds: readonly ConceptId[];
  readonly introducedLexemeIds: readonly LexemeId[];
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  readonly assistedKatakanaLexemeIds: readonly LexemeId[];
  readonly baseExampleId: string;
  readonly changedExampleId: string;
  readonly guidedExampleId: string;
  readonly extraExampleIds: readonly string[];
  /** Extra concepts a synthesis/orientation lesson reviews beyond its examples. */
  readonly reviewConceptIds?: readonly ConceptId[];
  /** Extra lexemes a synthesis/orientation lesson reviews beyond its examples. */
  readonly reviewLexemeIds?: readonly LexemeId[];
}

const ALL_VERB_IDS: readonly LexemeId[] = verbLexemes.map((verb) => verb.id);

/** Convenience: a lesson whose `guided` example is also its `-say` target. */
function lesson(plan: Omit<LessonPlan, "guidedExampleId"> & {
  readonly guidedExampleId?: string;
}): LessonPlan {
  return {
    ...plan,
    guidedExampleId: plan.guidedExampleId ?? `${plan.id}-say`,
  };
}

const PLANS: readonly LessonPlan[] = [
  // ── Module 1 · Sounds, hiragana, and the katakana bridge ───────────────────
  lesson({
    id: "sounds-1",
    moduleId: "sounds",
    order: 1,
    estimatedMinutes: 6,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["good-morning", "good-evening", "hello", "goodbye"],
    assessedConceptIds: [],
    assessedLexemeIds: ["good-morning", "good-evening", "hello", "goodbye"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "sounds-1-base",
    changedExampleId: "sounds-1-changed",
    extraExampleIds: ["sounds-1-r1"],
  }),
  lesson({
    id: "sounds-2",
    moduleId: "sounds",
    order: 2,
    estimatedMinutes: 6,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["thank-you", "excuse-me", "yes", "no"],
    assessedConceptIds: [],
    assessedLexemeIds: ["thank-you", "excuse-me", "yes", "no"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "sounds-2-base",
    changedExampleId: "sounds-2-changed",
    extraExampleIds: ["sounds-2-r1"],
  }),
  lesson({
    id: "sounds-3",
    moduleId: "sounds",
    order: 3,
    estimatedMinutes: 6,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["nice-to-meet-you", "best-regards"],
    assessedConceptIds: [],
    assessedLexemeIds: ["nice-to-meet-you", "best-regards"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "sounds-3-base",
    changedExampleId: "sounds-3-changed",
    extraExampleIds: [],
  }),
  lesson({
    id: "sounds-4",
    moduleId: "sounds",
    order: 4,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["coffee", "juice", "milk", "bread", "television"],
    assessedConceptIds: [],
    assessedLexemeIds: ["coffee", "juice", "milk", "bread", "television"],
    assistedKatakanaLexemeIds: ["coffee", "juice", "milk", "bread", "television"],
    baseExampleId: "sounds-4-base",
    changedExampleId: "sounds-4-changed",
    extraExampleIds: ["sounds-4-r1", "sounds-4-r2"],
  }),
  lesson({
    id: "sounds-5",
    moduleId: "sounds",
    order: 5,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["radio", "camera", "bus", "taxi", "restaurant"],
    assessedConceptIds: [],
    assessedLexemeIds: ["radio", "camera", "bus", "taxi", "restaurant"],
    assistedKatakanaLexemeIds: ["radio", "camera", "bus", "taxi", "restaurant"],
    baseExampleId: "sounds-5-base",
    changedExampleId: "sounds-5-changed",
    extraExampleIds: ["sounds-5-r1", "sounds-5-r2"],
  }),

  // ── Module 2 · Introducing oneself ─────────────────────────────────────────
  lesson({
    id: "introductions-1",
    moduleId: "introductions",
    order: 1,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: ["sentence-order", "topic-wa", "copula-desu"],
    introducedLexemeIds: [
      "i",
      "you",
      "name",
      "student",
      "teacher",
      "japan",
      "japanese-language",
      "origin",
    ],
    assessedConceptIds: ["topic-wa", "copula-desu"],
    assessedLexemeIds: ["i", "you", "student", "teacher", "name"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "introductions-1-base",
    changedExampleId: "introductions-1-changed",
    extraExampleIds: ["introductions-1-r1", "introductions-1-r2"],
  }),
  lesson({
    id: "introductions-2",
    moduleId: "introductions",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["topic-omission", "polite-masu", "destination-ni"],
    introducedLexemeIds: [
      "doctor",
      "office-worker",
      "job",
      "company",
      "country",
      "italy",
      "america",
      "age",
      "years-old",
      "live",
    ],
    assessedConceptIds: ["topic-omission", "polite-masu", "destination-ni"],
    assessedLexemeIds: ["doctor", "office-worker", "italy", "america", "live"],
    assistedKatakanaLexemeIds: ["italy", "america"],
    baseExampleId: "introductions-2-base",
    changedExampleId: "introductions-2-changed",
    extraExampleIds: [
      "introductions-2-r1",
      "introductions-2-r2",
      "introductions-2-r3",
      "introductions-2-r4",
    ],
  }),
  lesson({
    id: "introductions-3",
    moduleId: "introductions",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["object-o"],
    introducedLexemeIds: [
      "english-language",
      "word",
      "friend",
      "phone-number",
      "do",
      "study",
      "understand",
    ],
    assessedConceptIds: ["object-o"],
    assessedLexemeIds: ["english-language", "friend", "do", "study", "understand"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "introductions-3-base",
    changedExampleId: "introductions-3-changed",
    extraExampleIds: [
      "introductions-3-r1",
      "introductions-3-r2",
      "introductions-3-r3",
    ],
  }),

  // ── Module 3 · Essential questions ─────────────────────────────────────────
  lesson({
    id: "essential-questions-1",
    moduleId: "essential-questions",
    order: 1,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: ["demonstratives", "question-ka"],
    introducedLexemeIds: [
      "this",
      "that",
      "that-yonder",
      "which",
      "this-n",
      "that-n",
      "that-yonder-n",
    ],
    assessedConceptIds: ["demonstratives", "question-ka"],
    assessedLexemeIds: ["this", "that", "that-yonder", "which"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "essential-questions-1-base",
    changedExampleId: "essential-questions-1-changed",
    extraExampleIds: ["essential-questions-1-r1", "essential-questions-1-r2"],
  }),
  lesson({
    id: "essential-questions-2",
    moduleId: "essential-questions",
    order: 2,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: ["question-words"],
    introducedLexemeIds: [
      "here",
      "there",
      "over-there",
      "where",
      "what",
      "who",
      "go",
    ],
    assessedConceptIds: ["question-words"],
    assessedLexemeIds: ["where", "what", "who", "go"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "essential-questions-2-base",
    changedExampleId: "essential-questions-2-changed",
    extraExampleIds: [
      "essential-questions-2-r1",
      "essential-questions-2-r2",
      "essential-questions-2-r3",
    ],
  }),
  lesson({
    id: "essential-questions-3",
    moduleId: "essential-questions",
    order: 3,
    estimatedMinutes: 7,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [
      "when",
      "how",
      "how-much",
      "how-many",
      "why",
      "come",
    ],
    assessedConceptIds: [],
    assessedLexemeIds: ["when", "how-much", "come"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "essential-questions-3-base",
    changedExampleId: "essential-questions-3-changed",
    extraExampleIds: ["essential-questions-3-r1", "essential-questions-3-r2"],
  }),

  // ── Module 4 · Actions and objects ─────────────────────────────────────────
  lesson({
    id: "actions-1",
    moduleId: "actions",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["location-de"],
    introducedLexemeIds: ["water", "rice-meal", "tea", "eat", "drink"],
    assessedConceptIds: ["location-de", "object-o"],
    assessedLexemeIds: ["rice-meal", "water", "eat", "drink"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "actions-1-base",
    changedExampleId: "actions-1-changed",
    extraExampleIds: ["actions-1-r1"],
  }),
  lesson({
    id: "actions-2",
    moduleId: "actions",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["companion-to"],
    introducedLexemeIds: [
      "book",
      "newspaper",
      "letter",
      "movie",
      "music",
      "watch",
      "read",
      "write",
    ],
    assessedConceptIds: ["companion-to", "object-o"],
    assessedLexemeIds: ["book", "movie", "watch", "read", "write"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "actions-2-base",
    changedExampleId: "actions-2-changed",
    extraExampleIds: ["actions-2-r1", "actions-2-r2"],
  }),
  lesson({
    id: "actions-3",
    moduleId: "actions",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [
      "pen",
      "pencil",
      "notebook",
      "bag",
      "photo",
      "food",
      "beverage",
      "thing-object",
      "email",
      "buy",
      "use",
      "take",
    ],
    assessedConceptIds: ["object-o"],
    assessedLexemeIds: ["bag", "pen", "photo", "buy", "use", "take"],
    assistedKatakanaLexemeIds: ["pen", "notebook", "email"],
    baseExampleId: "actions-3-base",
    changedExampleId: "actions-3-changed",
    extraExampleIds: ["actions-3-r1", "actions-3-r2", "actions-3-r3", "actions-3-r4"],
  }),

  // ── Module 5 · Routines, clock time, and frequency ─────────────────────────
  lesson({
    id: "routines-1",
    moduleId: "routines",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["time-expressions"],
    introducedLexemeIds: ["morning", "daytime", "night", "wake", "sleep"],
    assessedConceptIds: ["time-expressions"],
    assessedLexemeIds: ["morning", "night", "wake", "sleep"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "routines-1-base",
    changedExampleId: "routines-1-changed",
    extraExampleIds: ["routines-1-r1"],
  }),
  lesson({
    id: "routines-2",
    moduleId: "routines",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["frequency-adverbs"],
    introducedLexemeIds: [
      "every-day",
      "always",
      "often",
      "sometimes",
      "weekend",
      "work",
      "speak",
    ],
    assessedConceptIds: ["frequency-adverbs"],
    assessedLexemeIds: ["every-day", "sometimes", "work", "speak"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "routines-2-base",
    changedExampleId: "routines-2-changed",
    extraExampleIds: ["routines-2-r1"],
  }),
  lesson({
    id: "routines-3",
    moduleId: "routines",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [
      "today",
      "tomorrow",
      "yesterday",
      "duration",
      "clock",
      "morning-am",
      "afternoon-pm",
      "half-past",
      "minute",
      "monday",
      "sunday",
      "listen",
      "call",
    ],
    assessedConceptIds: ["time-expressions"],
    assessedLexemeIds: ["monday", "sunday", "listen", "call"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "routines-3-base",
    changedExampleId: "routines-3-changed",
    extraExampleIds: [
      "routines-3-r1",
      "routines-3-r2",
      "routines-3-r3",
      "routines-3-r4",
      "routines-3-r5",
      "routines-3-r6",
    ],
  }),

  // ── Module 6 · Past and negative ───────────────────────────────────────────
  lesson({
    id: "past-negative-1",
    moduleId: "past-negative",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["past-mashita"],
    introducedLexemeIds: ["last-week", "last-year", "this-morning", "test"],
    assessedConceptIds: ["past-mashita"],
    assessedLexemeIds: ["last-week", "this-morning", "test"],
    assistedKatakanaLexemeIds: ["test"],
    baseExampleId: "past-negative-1-base",
    changedExampleId: "past-negative-1-changed",
    extraExampleIds: ["past-negative-1-r1", "past-negative-1-r2", "past-negative-1-r3"],
  }),
  lesson({
    id: "past-negative-2",
    moduleId: "past-negative",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["negative-masen"],
    introducedLexemeIds: [
      "next-week",
      "this-week",
      "this-month",
      "this-year",
      "tonight",
      "homework",
      "meeting",
      "wait",
    ],
    assessedConceptIds: ["negative-masen"],
    assessedLexemeIds: ["tonight", "homework", "meeting", "wait"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "past-negative-2-base",
    changedExampleId: "past-negative-2-changed",
    extraExampleIds: ["past-negative-2-r1", "past-negative-2-r2"],
  }),
  lesson({
    id: "past-negative-3",
    moduleId: "past-negative",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["past-negative-masendeshita"],
    introducedLexemeIds: [
      "last-month",
      "next-month",
      "next-year",
      "party",
      "day-off",
      "birthday",
      "ask",
      "meet",
    ],
    assessedConceptIds: ["past-negative-masendeshita"],
    assessedLexemeIds: ["last-month", "party", "birthday", "ask", "meet"],
    assistedKatakanaLexemeIds: ["party"],
    baseExampleId: "past-negative-3-base",
    changedExampleId: "past-negative-3-changed",
    extraExampleIds: ["past-negative-3-r1", "past-negative-3-r2", "past-negative-3-r3", "past-negative-3-r5"],
  }),

  // ── Module 7 · Places, movement, and transport ─────────────────────────────
  lesson({
    id: "places-1",
    moduleId: "places",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["direction-e"],
    introducedLexemeIds: ["house", "station", "town", "park", "school", "return", "walk"],
    assessedConceptIds: ["direction-e"],
    assessedLexemeIds: ["house", "station", "return", "walk"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "places-1-base",
    changedExampleId: "places-1-changed",
    extraExampleIds: ["places-1-r1", "places-1-r2"],
  }),
  lesson({
    id: "places-2",
    moduleId: "places",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["source-kara"],
    introducedLexemeIds: ["shop", "bank", "post-office", "hospital", "library", "enter", "leave"],
    assessedConceptIds: ["source-kara"],
    assessedLexemeIds: ["shop", "hospital", "enter", "leave"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "places-2-base",
    changedExampleId: "places-2-changed",
    extraExampleIds: ["places-2-r1", "places-2-r2"],
  }),
  lesson({
    id: "places-3",
    moduleId: "places",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["train", "car", "bicycle", "airplane", "subway", "board", "alight"],
    assessedConceptIds: ["destination-ni"],
    assessedLexemeIds: ["train", "subway", "board", "alight"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "places-3-base",
    changedExampleId: "places-3-changed",
    extraExampleIds: ["places-3-r1", "places-3-r2"],
  }),
  lesson({
    id: "places-4",
    moduleId: "places",
    order: 4,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: ["room", "road", "airport", "carry"],
    assessedConceptIds: ["object-o", "question-words"],
    assessedLexemeIds: ["room", "road", "carry"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "places-4-base",
    changedExampleId: "places-4-changed",
    extraExampleIds: ["places-4-r1", "places-4-r2"],
  }),

  // ── Module 8 · People, family, and relationships ───────────────────────────
  lesson({
    id: "people-1",
    moduleId: "people",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["person-ni"],
    introducedLexemeIds: [
      "family",
      "father",
      "mother",
      "older-brother",
      "older-sister",
      "younger-brother",
      "younger-sister",
      "parents",
      "person",
      "teach-tell",
    ],
    assessedConceptIds: ["person-ni"],
    assessedLexemeIds: ["family", "father", "mother", "person", "teach-tell"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "people-1-base",
    changedExampleId: "people-1-changed",
    extraExampleIds: ["people-1-r1", "people-1-r2", "people-1-r3", "people-1-r4", "people-1-r5"],
  }),
  lesson({
    id: "people-2",
    moduleId: "people",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [
      "child",
      "son",
      "daughter",
      "husband",
      "wife",
      "grandfather",
      "grandmother",
      "give",
      "receive",
    ],
    assessedConceptIds: ["person-ni", "object-o"],
    assessedLexemeIds: ["child", "son", "daughter", "give", "receive"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "people-2-base",
    changedExampleId: "people-2-changed",
    extraExampleIds: ["people-2-r1", "people-2-r2", "people-2-r3", "people-2-r4", "people-2-r5"],
  }),
  lesson({
    id: "people-3",
    moduleId: "people",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["volitional-mashou", "offer-mashouka"],
    introducedLexemeIds: ["man", "woman", "boy", "girl", "he", "she"],
    assessedConceptIds: ["volitional-mashou", "offer-mashouka"],
    assessedLexemeIds: ["man", "woman", "he", "she"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "people-3-base",
    changedExampleId: "people-3-changed",
    extraExampleIds: ["people-3-r1", "people-3-r2", "people-3-r3", "people-3-r4", "people-3-r5"],
  }),

  // ── Module 9 · Descriptions, preferences, and weather ──────────────────────
  lesson({
    id: "descriptions-1",
    moduleId: "descriptions",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["i-adjective", "na-adjective"],
    introducedLexemeIds: [
      "big",
      "small",
      "new",
      "old",
      "interesting",
      "difficult",
      "fun",
      "pretty",
      "sit",
    ],
    assessedConceptIds: ["i-adjective", "na-adjective"],
    assessedLexemeIds: ["big", "small", "pretty", "sit"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "descriptions-1-base",
    changedExampleId: "descriptions-1-changed",
    extraExampleIds: ["descriptions-1-r1", "descriptions-1-r2", "descriptions-1-r3", "descriptions-1-r4"],
  }),
  lesson({
    id: "descriptions-2",
    moduleId: "descriptions",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["subject-ga"],
    introducedLexemeIds: [
      "delicious",
      "good",
      "like",
      "dislike",
      "good-at",
      "busy",
      "weather",
    ],
    assessedConceptIds: ["subject-ga"],
    assessedLexemeIds: ["like", "dislike", "good-at"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "descriptions-2-base",
    changedExampleId: "descriptions-2-changed",
    extraExampleIds: ["descriptions-2-r1", "descriptions-2-r2", "descriptions-2-r3", "descriptions-2-r4"],
  }),
  lesson({
    id: "descriptions-3",
    moduleId: "descriptions",
    order: 3,
    estimatedMinutes: 9,
    capstone: false,
    introducedConceptIds: ["comparison", "adjective-past"],
    introducedLexemeIds: [
      "hot",
      "cold",
      "expensive",
      "cheap",
      "easy",
      "rain",
      "cloudy",
      "stand",
      "learn",
    ],
    assessedConceptIds: ["comparison", "adjective-past"],
    assessedLexemeIds: ["cheap", "cold", "stand", "learn"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "descriptions-3-base",
    changedExampleId: "descriptions-3-changed",
    extraExampleIds: ["descriptions-3-r1", "descriptions-3-r2", "descriptions-3-r3", "descriptions-3-r4", "descriptions-3-r5", "descriptions-3-r6", "descriptions-3-r7"],
  }),

  // ── Module 10 · Shopping, quantities, and requests ─────────────────────────
  lesson({
    id: "shopping-1",
    moduleId: "shopping",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["counters"],
    introducedLexemeIds: [
      "apple",
      "egg",
      "meat",
      "vegetable",
      "fish",
      "shirt",
      "one-thing",
      "two-things",
      "three-things",
      "a-little",
      "all",
    ],
    assessedConceptIds: ["counters"],
    assessedLexemeIds: ["apple", "one-thing", "three-things"],
    assistedKatakanaLexemeIds: ["shirt"],
    baseExampleId: "shopping-1-base",
    changedExampleId: "shopping-1-changed",
    extraExampleIds: ["shopping-1-r1", "shopping-1-r2", "shopping-1-r3"],
  }),
  lesson({
    id: "shopping-2",
    moduleId: "shopping",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["request-kudasai", "desire-tai"],
    introducedLexemeIds: [
      "fruit",
      "many",
      "money",
      "supermarket",
      "convenience-store",
      "size",
      "hundred",
      "thousand",
      "half-portion",
    ],
    assessedConceptIds: ["request-kudasai", "desire-tai"],
    assessedLexemeIds: ["fruit", "money", "half-portion"],
    assistedKatakanaLexemeIds: ["supermarket", "convenience-store", "size"],
    baseExampleId: "shopping-2-base",
    changedExampleId: "shopping-2-changed",
    extraExampleIds: ["shopping-2-r1", "shopping-2-r2", "shopping-2-r3", "shopping-2-r4"],
  }),
  lesson({
    id: "shopping-3",
    moduleId: "shopping",
    order: 3,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [
      "yen",
      "price",
      "change-money",
      "wallet",
      "clothes",
      "shoes",
      "hat",
      "borrow",
      "open",
      "close",
    ],
    assessedConceptIds: ["object-o"],
    assessedLexemeIds: ["wallet", "shoes", "borrow", "open", "close"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "shopping-3-base",
    changedExampleId: "shopping-3-changed",
    extraExampleIds: ["shopping-3-r1", "shopping-3-r2", "shopping-3-r3", "shopping-3-r4", "shopping-3-r5", "shopping-3-r6", "shopping-3-r7", "shopping-3-r8"],
  }),

  // ── Module 11 · Existence, position, and needs ─────────────────────────────
  lesson({
    id: "existence-needs-1",
    moduleId: "existence-needs",
    order: 1,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["existence-arimasu", "position-words"],
    introducedLexemeIds: [
      "on-top",
      "under",
      "outside",
      "beside",
      "desk",
      "chair",
      "key",
      "glasses",
      "exist-inanimate",
    ],
    assessedConceptIds: ["existence-arimasu", "position-words"],
    assessedLexemeIds: ["on-top", "under", "desk", "exist-inanimate"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "existence-needs-1-base",
    changedExampleId: "existence-needs-1-changed",
    extraExampleIds: ["existence-needs-1-r1", "existence-needs-1-r2", "existence-needs-1-r3", "existence-needs-1-r4"],
  }),
  lesson({
    id: "existence-needs-2",
    moduleId: "existence-needs",
    order: 2,
    estimatedMinutes: 8,
    capstone: false,
    introducedConceptIds: ["existence-imasu"],
    introducedLexemeIds: [
      "inside",
      "front",
      "behind",
      "right-side",
      "left-side",
      "between",
      "next-to",
      "near",
      "exist-animate",
    ],
    assessedConceptIds: ["existence-imasu", "position-words"],
    assessedLexemeIds: ["inside", "front", "next-to", "exist-animate"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "existence-needs-2-base",
    changedExampleId: "existence-needs-2-changed",
    extraExampleIds: ["existence-needs-2-r1", "existence-needs-2-r2", "existence-needs-2-r3", "existence-needs-2-r4", "existence-needs-2-r5"],
  }),
  lesson({
    id: "existence-needs-3",
    moduleId: "existence-needs",
    order: 3,
    estimatedMinutes: 9,
    capstone: false,
    introducedConceptIds: ["needs"],
    introducedLexemeIds: [
      "medicine",
      "umbrella",
      "ticket",
      "passport",
      "telephone",
      "computer",
      "toilet",
      "hotel",
      "map",
      "window",
      "door",
      "need",
    ],
    assessedConceptIds: ["needs"],
    assessedLexemeIds: ["medicine", "ticket", "passport", "need"],
    assistedKatakanaLexemeIds: ["passport", "computer", "toilet", "hotel", "door"],
    baseExampleId: "existence-needs-3-base",
    changedExampleId: "existence-needs-3-changed",
    extraExampleIds: ["existence-needs-3-r1", "existence-needs-3-r2", "existence-needs-3-r3", "existence-needs-3-r4", "existence-needs-3-r5", "existence-needs-3-r6", "existence-needs-3-r7"],
  }),

  // ── Module 12 · Practical synthesis ────────────────────────────────────────
  // Orientation retrieves prior gears through its examples; only the two purely
  // structural gears (sentence order, topic omission) — which carry no surface
  // glyph and so appear in no example's conceptIds — are named explicitly. Every
  // other concept, including the seven practical gears, earns its later reuse
  // from real capstone examples (spec §6.4), not a blanket review claim.
  lesson({
    id: "capstones-orientation",
    moduleId: "capstones",
    order: 1,
    estimatedMinutes: 9,
    capstone: false,
    introducedConceptIds: [],
    introducedLexemeIds: [],
    assessedConceptIds: ["topic-wa", "copula-desu", "object-o", "polite-masu"],
    assessedLexemeIds: ["i", "student", "japanese-language", "study"],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "capstones-orientation-base",
    changedExampleId: "capstones-orientation-changed",
    extraExampleIds: [],
    reviewConceptIds: ["sentence-order", "topic-omission"],
  }),
  lesson({
    id: "capstones-self-introduction",
    moduleId: "capstones",
    order: 2,
    estimatedMinutes: 10,
    capstone: true,
    introducedConceptIds: [],
    introducedLexemeIds: [],
    assessedConceptIds: [
      "topic-wa",
      "copula-desu",
      "object-o",
      "subject-ga",
      "polite-masu",
      "destination-ni",
    ],
    assessedLexemeIds: [
      "i",
      "name",
      "origin",
      "student",
      "do",
      "study",
      "understand",
      "live",
      "speak",
      "meet",
    ],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "capstones-self-introduction-base",
    changedExampleId: "capstones-self-introduction-changed",
    extraExampleIds: [
      "capstones-self-introduction-r1",
      "capstones-self-introduction-r2",
      "capstones-self-introduction-r3",
    ],
  }),
  lesson({
    id: "capstones-everyday-outing",
    moduleId: "capstones",
    order: 3,
    estimatedMinutes: 10,
    capstone: true,
    introducedConceptIds: [],
    introducedLexemeIds: [],
    assessedConceptIds: [
      "location-de",
      "companion-to",
      "object-o",
      "direction-e",
      "destination-ni",
      "volitional-mashou",
    ],
    assessedLexemeIds: [
      "eat",
      "drink",
      "buy",
      "watch",
      "board",
      "return",
      "walk",
      "wait",
      "listen",
      "call",
      "take",
    ],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "capstones-everyday-outing-base",
    changedExampleId: "capstones-everyday-outing-changed",
    extraExampleIds: [
      "capstones-everyday-outing-r1",
      "capstones-everyday-outing-r2",
      "capstones-everyday-outing-r3",
      "capstones-everyday-outing-r4",
      "capstones-everyday-outing-r5",
    ],
  }),
  lesson({
    id: "capstones-travel-day",
    moduleId: "capstones",
    order: 4,
    estimatedMinutes: 10,
    capstone: true,
    introducedConceptIds: [],
    introducedLexemeIds: [],
    assessedConceptIds: [
      "destination-ni",
      "object-o",
      "existence-arimasu",
      "needs",
      "location-de",
      "direction-e",
    ],
    assessedLexemeIds: [
      "board",
      "alight",
      "ask",
      "need",
      "use",
      "open",
      "close",
      "borrow",
      "carry",
      "enter",
      "return",
      "write",
    ],
    assistedKatakanaLexemeIds: [],
    baseExampleId: "capstones-travel-day-base",
    changedExampleId: "capstones-travel-day-changed",
    extraExampleIds: [
      "capstones-travel-day-r1",
      "capstones-travel-day-r2",
      "capstones-travel-day-r3",
      "capstones-travel-day-r4",
    ],
  }),
];

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

const verbIdSet = new Set(ALL_VERB_IDS);

// Global introduction index for every concept and lexeme, in lesson order.
const conceptIntroIndex = new Map<ConceptId, number>();
const lexemeIntroIndex = new Map<LexemeId, number>();
PLANS.forEach((plan, index) => {
  for (const conceptId of plan.introducedConceptIds) {
    if (!conceptIntroIndex.has(conceptId)) conceptIntroIndex.set(conceptId, index);
  }
  for (const lexemeId of plan.introducedLexemeIds) {
    if (!lexemeIntroIndex.has(lexemeId)) lexemeIntroIndex.set(lexemeId, index);
  }
});

function exampleIdsFor(plan: LessonPlan): string[] {
  return uniqueStrings([
    plan.baseExampleId,
    plan.changedExampleId,
    plan.guidedExampleId,
    ...plan.extraExampleIds,
  ]);
}

/**
 * A lesson practices exactly the earlier-introduced concepts and lexemes its
 * examples reuse, plus any explicit review set. Same-lesson introductions and
 * not-yet-introduced references never count, so practice is always genuine
 * retrieval of prior material (spec §5.1, §6.4).
 */
function practicedFor(plan: LessonPlan, index: number): {
  concepts: string[];
  lexemes: string[];
} {
  const exampleIds = exampleIdsFor(plan);
  const exampleConcepts: string[] = [];
  const exampleLexemes: string[] = [];
  for (const exampleId of exampleIds) {
    const example = curriculumExamplesById.get(exampleId);
    if (!example) continue;
    exampleConcepts.push(...example.conceptIds);
    exampleLexemes.push(...example.lexemeIds);
  }
  const concepts = uniqueStrings([
    ...exampleConcepts.filter((id) => {
      const introducedAt = conceptIntroIndex.get(id);
      return introducedAt !== undefined && introducedAt < index;
    }),
    ...(plan.reviewConceptIds ?? []),
  ]);
  const lexemes = uniqueStrings([
    ...exampleLexemes.filter((id) => {
      const introducedAt = lexemeIntroIndex.get(id);
      return introducedAt !== undefined && introducedAt < index;
    }),
    ...(plan.reviewLexemeIds ?? []),
  ]);
  return { concepts, lexemes };
}

/** The assembled, order-stable lesson boundaries. */
export const curriculumLessons: readonly CurriculumLessonEntry[] = Object.freeze(
  PLANS.map((plan, index) => {
    const practiced = practicedFor(plan, index);
    const exampleIds = exampleIdsFor(plan);
    return Object.freeze({
      id: plan.id,
      moduleId: plan.moduleId,
      order: plan.order,
      estimatedMinutes: plan.estimatedMinutes,
      introducedConceptIds: Object.freeze([...plan.introducedConceptIds]),
      practicedConceptIds: Object.freeze(practiced.concepts),
      assessedConceptIds: Object.freeze([...plan.assessedConceptIds]),
      introducedLexemeIds: Object.freeze([...plan.introducedLexemeIds]),
      practicedLexemeIds: Object.freeze(practiced.lexemes),
      assessedLexemeIds: Object.freeze([...plan.assessedLexemeIds]),
      exampleIds: Object.freeze(exampleIds),
      speechPromptId: speechPromptIdForLesson(plan.id),
      capstone: plan.capstone,
      assistedKatakanaLexemeIds: Object.freeze([
        ...plan.assistedKatakanaLexemeIds,
      ]),
    });
  }),
);

/** The lesson-authoring plans (comparison/guided references) for verification. */
export const lessonPlans: readonly LessonPlan[] = Object.freeze(PLANS);

/** Lessons sorted the way the validator walks them (module order, then order). */
export const orderedCurriculumLessons: readonly CurriculumLessonEntry[] =
  Object.freeze(
    [...curriculumLessons].sort((left, right) => {
      const leftModule = curriculumFoundation.modules.find(
        (module) => module.id === left.moduleId,
      );
      const rightModule = curriculumFoundation.modules.find(
        (module) => module.id === right.moduleId,
      );
      return (
        (leftModule?.order ?? 0) - (rightModule?.order ?? 0) ||
        left.order - right.order
      );
    }),
  );

/** Recompute one module's coverage from the lessons (mirrors the validator). */
function computeModuleCoverage(moduleId: ModuleId): ModuleCoverage {
  const moduleLessons = orderedCurriculumLessons.filter(
    (lesson) => lesson.moduleId === moduleId,
  );
  const introducedConceptIds: string[] = [];
  const introducedLexemeIds: string[] = [];
  const introducedVerbIds: string[] = [];
  const practicedVerbIds: string[] = [];
  const assessedConceptIds: string[] = [];
  const assessedLexemeIds: string[] = [];
  const firstKatakanaExposureIds: string[] = [];
  for (const lesson of moduleLessons) {
    introducedConceptIds.push(...lesson.introducedConceptIds);
    introducedLexemeIds.push(...lesson.introducedLexemeIds);
    assessedConceptIds.push(...lesson.assessedConceptIds);
    assessedLexemeIds.push(...lesson.assessedLexemeIds);
    introducedVerbIds.push(
      ...lesson.introducedLexemeIds.filter((id) => verbIdSet.has(id)),
    );
    practicedVerbIds.push(
      ...lesson.practicedLexemeIds.filter((id) => verbIdSet.has(id)),
    );
    firstKatakanaExposureIds.push(...(lesson.assistedKatakanaLexemeIds ?? []));
  }
  return {
    moduleId,
    lessonIds: moduleLessons.map((lesson) => lesson.id),
    introducedConceptIds: uniqueStrings(introducedConceptIds),
    introducedLexemeIds: uniqueStrings(introducedLexemeIds),
    introducedVerbIds: uniqueStrings(introducedVerbIds),
    practicedVerbIds: uniqueStrings(practicedVerbIds),
    assessedConceptIds: uniqueStrings(assessedConceptIds),
    assessedLexemeIds: uniqueStrings(assessedLexemeIds),
    firstKatakanaExposureIds: uniqueStrings(firstKatakanaExposureIds),
  };
}

/** The 12 modules with foundation identity and derived coverage. */
export const curriculumModules: readonly CurriculumModuleEntry[] = Object.freeze(
  curriculumFoundation.modules.map((module) =>
    Object.freeze({
      id: module.id,
      phase: module.phase,
      order: module.order,
      prerequisiteIds: Object.freeze([...module.prerequisiteIds]),
      coverage: Object.freeze(computeModuleCoverage(module.id)),
    }),
  ),
);

/** Both locale copy catalogs, keyed identically (spec §9.1). */
export const curriculumCopy: CurriculumCopyCatalog = Object.freeze({
  it: itCopy,
  en: enCopy,
});

/** The fully assembled, release-validatable curriculum catalogs. */
export const assembledCurriculum: AssembledCurriculumCatalogs = Object.freeze({
  concepts,
  lexemes: [...lexiconById.values()],
  examples: curriculumExamples,
  exercises: [],
  speechPrompts,
  personas: genericPersonas.map((persona) => ({
    id: persona.id,
    japaneseName: persona.japaneseName,
    latinName: persona.latinName,
  })),
  modules: curriculumModules,
  lessons: curriculumLessons,
  copy: curriculumCopy,
});
