import { curriculumExamples } from "./examples";
import type { SpeechPromptCatalogEntry, SpeechPromptId } from "./types";

/**
 * The curriculum speech-prompt catalog (design spec §5.3 spoken-attempt step,
 * §12.3 and Slice B plan Task 3 step 4). Exactly one prompt per lesson, each
 * targeting that lesson's spoken example (the `-say` example) and naming the
 * critical segments a learner's attempt is judged on.
 *
 * This file owns references only: target example ID and critical segment IDs.
 * It carries no recognition implementation and stores no transcripts — Slice D
 * owns the recognizer. The prompt set is derived from the shared example
 * catalog so it can never drift from the sentences a lesson actually shows.
 */

const SPOKEN_SUFFIX = "-say";

/**
 * The grammar-bearing segments of a spoken target: its particles and predicate
 * endings. These are the parts a beginner most easily drops or mispronounces,
 * so they are the sensible focus for a scored attempt. Single-word greetings
 * and loanwords (no particle/ending) fall back to the whole utterance.
 */
function criticalSegmentIdsFor(
  segments: { readonly id: string; readonly kind: string }[],
): readonly string[] {
  const grammar = segments
    .filter((segment) => segment.kind === "particle" || segment.kind === "ending")
    .map((segment) => segment.id);
  return grammar.length > 0 ? grammar : segments.map((segment) => segment.id);
}

/** The lesson ID a `-say` example belongs to (its ID without the suffix). */
export function lessonIdForSpokenExample(exampleId: string): string {
  return exampleId.slice(0, -SPOKEN_SUFFIX.length);
}

/** The stable speech-prompt ID for a lesson. */
export function speechPromptIdForLesson(lessonId: string): SpeechPromptId {
  return `speech-${lessonId}`;
}

const spokenTargets = curriculumExamples.filter((example) =>
  example.id.endsWith(SPOKEN_SUFFIX),
);

/** One immutable prompt per lesson, in lesson order. */
export const speechPrompts: readonly SpeechPromptCatalogEntry[] = Object.freeze(
  spokenTargets.map((example) =>
    Object.freeze({
      id: speechPromptIdForLesson(lessonIdForSpokenExample(example.id)),
      targetExampleId: example.id,
      criticalSegmentIds: Object.freeze(
        criticalSegmentIdsFor([...example.segments]),
      ),
    }),
  ),
);

/** Stable index from lesson ID to its speech prompt. */
export const speechPromptByLessonId: ReadonlyMap<
  string,
  SpeechPromptCatalogEntry
> = new Map(
  spokenTargets.map((example) => [
    lessonIdForSpokenExample(example.id),
    speechPrompts.find(
      (prompt) =>
        prompt.id ===
        speechPromptIdForLesson(lessonIdForSpokenExample(example.id)),
    ) as SpeechPromptCatalogEntry,
  ]),
);
