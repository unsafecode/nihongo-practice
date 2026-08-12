/**
 * The vocabulary retained A1 inherits from Base.
 *
 * Task 16 rehomed five modules — `sounds`, `sentence-foundations`,
 * `topic-questions`, `polite-verbs` and `time-movement` — to the Base level.
 * Their twenty lessons left `a1LessonContents`, but the retained forty-four A1
 * lessons legitimately keep *using* the words those lessons taught: a learner
 * reaching `routines-1` has already met `a1-lexeme-goji` in the rehomed
 * `sounds-2`, and Base teaches the same word (`noun-goji`, first taught in
 * `time-movement-2`) before A1 begins.
 *
 * Every cumulative-lexical-closure gate therefore has to start from a non-empty
 * inherited set. This module is the single, *derived* source for that set: it
 * reads the rehomed lessons' own authored `newLexemeIds` — the exact content
 * that used to seed the closure walk while those lessons were still part of the
 * A1 catalog — so the set can never drift from what Base actually teaches and
 * can never be widened by hand to paper over a real ordering defect.
 */

import {
  BASE_REFERENCE_IDS,
  type BaseReferenceId,
} from "../../base/references/catalog";
import { deepFreeze } from "../../foundations/deepFreeze";
import { A1_RETAINED_LESSON_IDS, A1_LESSON_IDS } from "../manifest";
import { a1FoundationsArea01to02LessonContent } from "./foundationsArea01to02";
import { a1FoundationsArea03to04LessonContent } from "./foundationsArea03to04";
import {
  a1ConceptFirstTeachingNoteId,
  a1LearningNoteById,
  type A1LearningNote,
} from "./grammar";
import { a1SoundsLessonContent } from "./modules01to04";
import type { A1LessonContent } from "./types";

/**
 * The twenty rehomed lessons' authored content, in canonical manifest order.
 * Nothing here is part of the retained A1 catalog any more; it survives only as
 * the provenance record for what Base now owns.
 */
export const A1_REHOMED_LESSON_CONTENT: readonly A1LessonContent[] = deepFreeze([
  ...a1SoundsLessonContent,
  ...a1FoundationsArea01to02LessonContent,
  ...a1FoundationsArea03to04LessonContent,
]);

/** The twenty rehomed lesson ids, derived from that authored content. */
export const A1_REHOMED_LESSON_IDS: readonly string[] = deepFreeze(
  A1_REHOMED_LESSON_CONTENT.map(({ lessonId }) => lessonId),
);

/**
 * Every lexeme id the rehomed (now Base-owned) lessons introduce, in first-teach
 * order. This is the canonical seed for A1's cumulative lexical closure: within
 * retained A1 these words are *reviewed*, never reintroduced.
 */
export const A1_INHERITED_BASE_LEXEME_IDS: readonly string[] = deepFreeze([
  ...new Set(A1_REHOMED_LESSON_CONTENT.flatMap(({ newLexemeIds }) => newLexemeIds)),
]);

/** Mutable-safe closure seed for a cumulative walk over retained A1 content. */
export function inheritedBaseLexemeIds(): Set<string> {
  return new Set(A1_INHERITED_BASE_LEXEME_IDS);
}

/** The learning-note ids the rehomed lessons carry, in first-teach order. */
export const A1_REHOMED_LEARNING_NOTE_IDS: readonly string[] = deepFreeze([
  ...new Set(A1_REHOMED_LESSON_CONTENT.map(({ learningNoteId }) => learningNoteId)),
]);

/**
 * Resolve the rehomed lessons' notes against an arbitrary note catalog. The
 * validator passes the catalog *under test* rather than the production one, so a
 * fixture that strips an explanation from a rehomed note genuinely removes the
 * inherited claim instead of silently keeping it.
 */
function rehomedNotesFrom(
  noteById: (noteId: string) => A1LearningNote | undefined,
): readonly A1LearningNote[] {
  return A1_REHOMED_LEARNING_NOTE_IDS.map(noteById).filter(
    (note): note is A1LearningNote => note !== undefined,
  );
}

/**
 * Every grammar concept whose *first* canonical teaching note belongs to a
 * rehomed lesson. Base explains these before A1 begins, so retained A1 content
 * may require them without re-explaining: inside retained A1 scenario lessons
 * they are reviewed/applied, never introduced.
 */
export function inheritedBaseConceptIdsFrom(
  noteById: (noteId: string) => A1LearningNote | undefined,
): Set<string> {
  return new Set(
    rehomedNotesFrom(noteById).flatMap((note) =>
      Object.entries(a1ConceptFirstTeachingNoteId)
        .filter(
          ([conceptId, firstTeachingNoteId]) =>
            firstTeachingNoteId === note.id && note.explainedConceptIds.includes(conceptId),
        )
        .map(([conceptId]) => conceptId),
    ),
  );
}

/** Every verb form the rehomed lessons' notes in `noteById` explicitly explain. */
export function inheritedBaseVerbFormsFrom(
  noteById: (noteId: string) => A1LearningNote | undefined,
): readonly NonNullable<A1LearningNote["explainedVerbForms"]>[number][] {
  return rehomedNotesFrom(noteById).flatMap((note) => note.explainedVerbForms ?? []);
}

const productionNoteById = (noteId: string): A1LearningNote | undefined =>
  a1LearningNoteById[noteId];

/** The production inherited-concept set, in canonical first-teach order. */
export const A1_INHERITED_BASE_CONCEPT_IDS: readonly string[] = deepFreeze([
  ...inheritedBaseConceptIdsFrom(productionNoteById),
]);

/** The production inherited verb forms, in canonical first-teach order. */
export const A1_INHERITED_BASE_VERB_FORMS: readonly NonNullable<
  A1LearningNote["explainedVerbForms"]
>[number][] = deepFreeze(inheritedBaseVerbFormsFrom(productionNoteById));

/** Mutable-safe seed of the concepts Base explains before retained A1 starts. */
export function inheritedBaseConceptIds(): Set<string> {
  return new Set(A1_INHERITED_BASE_CONCEPT_IDS);
}

/**
 * The canonical 64 published A1 route ids split exactly once: the twenty Base
 * now owns and the forty-four A1 retains. Exported so both levels' baselines can
 * assert the partition rather than restate it.
 */
export const A1_PUBLISHED_ROUTE_PARTITION = deepFreeze({
  rehomed: A1_REHOMED_LESSON_IDS,
  retained: A1_RETAINED_LESSON_IDS,
  published: A1_LESSON_IDS,
});

/**
 * Which Base progressive reference actually teaches each inherited concept.
 *
 * A retained A1 scenario lesson *applies* these concepts; the reference is
 * where the learner can see the system itself, laid out progressively. The map
 * is checked against `A1_INHERITED_BASE_CONCEPT_IDS` (and against Base's own
 * `BASE_REFERENCE_IDS`) at module load, so it can neither miss an inherited
 * concept nor invent a reference that does not exist.
 */
const REFERENCE_ID_BY_CONCEPT: Readonly<Record<string, BaseReferenceId>> = {
  "a1-concept-topic-wa": "sentence-anatomy",
  "a1-concept-copula-desu": "adjective-copula",
  "a1-concept-interrogative-ka": "sentence-anatomy",
  "a1-concept-nominative-ga": "particle-atlas",
  "a1-concept-object-wo": "particle-atlas",
  "a1-concept-location-particle": "particle-atlas",
  "a1-concept-time-schedule": "particle-atlas",
  "a1-concept-direction-he": "particle-atlas",
  "a1-concept-transport-de": "particle-atlas",
};

function assertReferenceMapIsExact(): Readonly<Record<string, BaseReferenceId>> {
  const mapped = Object.keys(REFERENCE_ID_BY_CONCEPT).sort();
  const inherited = [...A1_INHERITED_BASE_CONCEPT_IDS].sort();
  if (mapped.join(",") !== inherited.join(",")) {
    throw new Error(
      `inheritedBase: Base reference map must cover exactly the inherited concepts (mapped: ${mapped.join(", ")}; inherited: ${inherited.join(", ")})`,
    );
  }
  for (const [conceptId, referenceId] of Object.entries(REFERENCE_ID_BY_CONCEPT)) {
    if (!BASE_REFERENCE_IDS.includes(referenceId)) {
      throw new Error(
        `inheritedBase: concept "${conceptId}" maps to unknown Base reference "${referenceId}"`,
      );
    }
  }
  return REFERENCE_ID_BY_CONCEPT;
}

export const BASE_REFERENCE_ID_BY_INHERITED_CONCEPT: Readonly<
  Record<string, BaseReferenceId>
> = deepFreeze(assertReferenceMapIsExact());
