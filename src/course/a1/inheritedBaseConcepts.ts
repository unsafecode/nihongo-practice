/**
 * The grammar concepts retained A1 inherits from Base — computed from a
 * dependency-light leaf slice so it can be imported by A1's authoring layer.
 *
 * {@link ../curriculum/inheritedBase} is the richer view (it also derives the
 * inherited vocabulary and verb forms from the rehomed lessons' full authored
 * content), but reaching that content pulls in the built Foundations catalogs,
 * which in turn import the lesson builders and therefore `authoring.ts`. This
 * module deliberately depends only on the learning-note catalog and the
 * Foundations note allocation, so `authoring.ts` can partition an authored
 * concept list without closing an import cycle.
 *
 * Both modules must agree — `curriculum/inheritedBase.test.ts` asserts it —
 * because they are two derivations of the same fact: which concepts have their
 * canonical first teaching inside a lesson Base now owns.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import {
  a1ConceptFirstTeachingNoteId,
  a1LearningNoteById,
} from "./curriculum/grammar";
import {
  FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON,
  FOUNDATIONS_LESSON_IDS,
} from "./catalog/foundationsShared";
import { A1_LESSON_IDS_BY_MODULE } from "./manifest";

/**
 * The learning notes the rehomed lessons carry. The four phonetic `sounds-*`
 * notes are deliberately absent: they are `kind: "phonetic"` and explain no
 * grammar concept, so they can contribute nothing to this set.
 */
const REHOMED_NOTE_IDS: readonly string[] = [
  ...new Set(Object.values(FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON)),
];

/**
 * Every concept whose canonical first-teaching note belongs to a rehomed
 * lesson, in canonical first-teach order. Base explains these before retained
 * A1 opens, so an A1 lesson reviews and applies them — it never introduces one.
 */
export const A1_INHERITED_BASE_CONCEPT_IDS: readonly string[] = deepFreeze([
  ...new Set(
    REHOMED_NOTE_IDS.flatMap((noteId) => {
      const note = a1LearningNoteById[noteId];
      if (!note) return [];
      return Object.entries(a1ConceptFirstTeachingNoteId)
        .filter(
          ([conceptId, firstTeachingNoteId]) =>
            firstTeachingNoteId === noteId && note.explainedConceptIds.includes(conceptId),
        )
        .map(([conceptId]) => conceptId);
    }),
  ),
]);

/**
 * The twenty lesson ids Base rehomed. Their own recipes still *introduce* these
 * concepts — they are the canonical first teaching — so the partition below
 * must never be applied to them.
 */
export const A1_REHOMED_LESSON_IDS: ReadonlySet<string> = new Set([
  ...A1_LESSON_IDS_BY_MODULE["sounds"],
  ...FOUNDATIONS_LESSON_IDS,
]);

/**
 * Split an authored concept list into what an A1 lesson first teaches and what
 * it reviews from Base (Task 16).
 *
 * The A1 modules were authored before the split, so their recipes still list
 * every concept a lesson leans on under one name. Rather than hand-editing
 * forty-four recipes — which would drift the moment Base's first-teach map
 * changed — the partition is *derived* from
 * {@link A1_INHERITED_BASE_CONCEPT_IDS}. Order within each half is the authored
 * order, and the union is always exactly the authored set.
 */
export function partitionA1AuthoredConceptIds(
  conceptIds: readonly string[],
): { readonly introduced: readonly string[]; readonly reviewed: readonly string[] } {
  const inherited = new Set<string>(A1_INHERITED_BASE_CONCEPT_IDS);
  const introduced: string[] = [];
  const reviewed: string[] = [];
  for (const conceptId of conceptIds) {
    if (inherited.has(conceptId)) reviewed.push(conceptId);
    else introduced.push(conceptId);
  }
  return { introduced, reviewed };
}
