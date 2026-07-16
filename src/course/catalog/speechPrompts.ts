import { genericPersonas } from "../data/personas";
import { normalizeTranscript } from "../speech/normalizeTranscript";
import { curriculumExamples } from "./examples";
import type { CurriculumExampleSegment } from "./examples";
import type { SpeechPromptCatalogEntry, SpeechPromptId } from "./types";

/**
 * The curriculum speech-prompt catalog (design spec §5.3 spoken-attempt step,
 * §12.3 and Slice D plan Task 1). Exactly one prompt per lesson, each targeting
 * that lesson's spoken example (the `-say` example) and derived entirely from
 * the shared example catalog so it can never drift from the sentence a lesson
 * actually shows.
 *
 * This file owns references only: the target example ID, the ordered comparison
 * segment IDs (covering every target segment), the critical segment IDs, and any
 * accepted orthographic transcript-variant example IDs. It stores no transcript
 * and carries no recognition implementation — the pure evaluator lives in
 * `src/course/speech` and the browser recognizer is Slice D Task 2.
 */

const SPOKEN_SUFFIX = "-say";

/** Persona given names are example fillers, never a lesson's target vocabulary. */
const PERSONA_NAMES: ReadonlySet<string> = new Set(
  genericPersonas.map((persona) => persona.japaneseName),
);

/** A segment folds to empty comparable text iff it is punctuation only. */
function hasComparableText(segment: CurriculumExampleSegment): boolean {
  return normalizeTranscript(segment.jp).comparable.length > 0;
}

/**
 * The comparison segments cover the target in order so the canonical answer
 * reconstructs from shared data — never a copied literal (design spec §12.3).
 */
function comparisonSegmentIdsFor(
  segments: readonly CurriculumExampleSegment[],
): readonly string[] {
  return segments.map((segment) => segment.id);
}

/**
 * The critical segments a spoken attempt is judged most critically on. Every
 * grammar-bearing particle and predicate ending is critical (from kind), and
 * every content word that is not persona filler is critical too — that content
 * set carries the lesson's target vocabulary, quantities, and gear, which the
 * `word` kind alone cannot distinguish from a persona name. Punctuation-only
 * segments (sentence breaks) are never critical.
 */
function criticalSegmentIdsFor(
  segments: readonly CurriculumExampleSegment[],
): readonly string[] {
  return segments
    .filter((segment) => {
      if (!hasComparableText(segment)) return false;
      if (segment.kind === "particle" || segment.kind === "ending") return true;
      return !PERSONA_NAMES.has(segment.jp);
    })
    .map((segment) => segment.id);
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
      acceptedTranscriptVariantExampleIds: Object.freeze([]),
      comparisonSegmentIds: Object.freeze(
        comparisonSegmentIdsFor(example.segments),
      ),
      criticalSegmentIds: Object.freeze(
        criticalSegmentIdsFor(example.segments),
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
