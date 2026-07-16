import { normalizeTranscript } from "./normalizeTranscript";
import type {
  NormalizedTranscript,
  ResolvedSpeechPrompt,
  ResolvedSpeechSegment,
  SegmentMatch,
  TranscriptEvaluation,
} from "./types";

/**
 * Deterministic transcript evaluation (design spec §12.3, §17.2, Slice D plan
 * Task 1). This module is pure: it resolves a speech prompt against the shared
 * example catalog into folded comparable text, then classifies a normalized
 * transcript as `matched`, `close`, or `retry`. It computes no percentage,
 * score, or pronunciation claim.
 */

/**
 * The structural speech-prompt reference shape the resolver reads. The catalog
 * `SpeechPromptCatalogEntry` satisfies it without the evaluator depending on the
 * catalog layer, keeping this engine browser- and catalog-independent.
 */
export interface SpeechPromptResolutionInput {
  readonly id: string;
  readonly targetExampleId: string;
  readonly acceptedTranscriptVariantExampleIds: readonly string[];
  readonly comparisonSegmentIds: readonly string[];
  readonly criticalSegmentIds: readonly string[];
}

/** A shared example, structurally compatible with `CurriculumExampleEntry`. */
export interface SpeechExampleInput {
  readonly id: string;
  readonly jp: string;
  readonly segments: readonly { readonly id: string; readonly jp: string }[];
}

/** The `close` distance budget: at least one edit, scaling with target length. */
function closeThreshold(targetCodePointLength: number): number {
  return Math.max(1, Math.floor(targetCodePointLength * 0.15));
}

/** Deterministic code-point Levenshtein distance (spec §12.3). */
function levenshtein(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  const rows = a.length;
  const cols = b.length;
  if (rows === 0) return cols;
  if (cols === 0) return rows;

  let previous = Array.from({ length: cols + 1 }, (_, index) => index);
  for (let row = 1; row <= rows; row += 1) {
    const current = [row, ...new Array<number>(cols).fill(0)];
    for (let col = 1; col <= cols; col += 1) {
      const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1;
      current[col] = Math.min(
        previous[col] + 1, // deletion
        current[col - 1] + 1, // insertion
        previous[col - 1] + substitutionCost, // substitution
      );
    }
    previous = current;
  }
  return previous[cols];
}

/**
 * Align the transcript to the ordered comparison segments greedily, left to
 * right. A segment matches when the remaining transcript begins with its
 * comparable text; the cursor then advances past it. A non-matching segment does
 * not advance the cursor, so a dropped particle marks exactly its own slot
 * unmatched and a later identical string cannot falsely satisfy an earlier one.
 */
function matchSegments(
  transcriptComparable: string,
  segments: readonly ResolvedSpeechSegment[],
): SegmentMatch[] {
  let cursor = 0;
  const matches: SegmentMatch[] = [];
  for (const segment of segments) {
    if (segment.comparable.length === 0) {
      // Punctuation-only segments fold to empty and are trivially present.
      matches.push({ segmentId: segment.id, matched: true });
      continue;
    }
    const remaining = transcriptComparable.slice(cursor);
    if (remaining.startsWith(segment.comparable)) {
      matches.push({ segmentId: segment.id, matched: true });
      cursor += segment.comparable.length;
    } else {
      matches.push({ segmentId: segment.id, matched: false });
    }
  }
  return matches;
}

/**
 * Resolve a catalog speech prompt into folded comparable text and ordered
 * comparison segments. Throws on any unresolvable reference so malformed data
 * fails loudly rather than silently accepting; the curriculum validator proves
 * the release catalog never reaches this state.
 */
export function resolveSpeechPrompt(
  prompt: SpeechPromptResolutionInput,
  examplesById: ReadonlyMap<string, SpeechExampleInput>,
): ResolvedSpeechPrompt {
  const target = examplesById.get(prompt.targetExampleId);
  if (!target) {
    throw new Error(
      `Unresolvable speech target example: ${prompt.targetExampleId}`,
    );
  }
  const segmentById = new Map(
    target.segments.map((segment) => [segment.id, segment]),
  );

  const segments: ResolvedSpeechSegment[] = prompt.comparisonSegmentIds.map(
    (segmentId) => {
      const segment = segmentById.get(segmentId);
      if (!segment) {
        throw new Error(
          `Unresolvable comparison segment: ${prompt.targetExampleId}#${segmentId}`,
        );
      }
      return {
        id: segmentId,
        comparable: normalizeTranscript(segment.jp).comparable,
      };
    },
  );

  const canonicalComparable = segments
    .map((segment) => segment.comparable)
    .join("");
  const canonicalOriginal = prompt.comparisonSegmentIds
    .map((segmentId) => segmentById.get(segmentId)?.jp ?? "")
    .join("");

  const variantComparables = prompt.acceptedTranscriptVariantExampleIds.map(
    (exampleId) => {
      const variant = examplesById.get(exampleId);
      if (!variant) {
        throw new Error(`Unresolvable transcript variant example: ${exampleId}`);
      }
      return normalizeTranscript(variant.jp).comparable;
    },
  );

  return {
    id: prompt.id,
    targetExampleId: prompt.targetExampleId,
    canonical: { original: canonicalOriginal, comparable: canonicalComparable },
    acceptedComparables: [canonicalComparable, ...variantComparables],
    segments,
    criticalSegmentIds: [...prompt.criticalSegmentIds],
  };
}

/**
 * Classify a normalized transcript against a resolved prompt. `matched` requires
 * exact equality with the canonical target or one declared variant; `close`
 * requires every critical segment to match and the minimum edit distance to an
 * accepted target within `max(1, floor(targetLength * 0.15))`; otherwise
 * `retry`. Segment records stay in canonical target order.
 */
export function evaluateTranscript(
  transcript: NormalizedTranscript,
  prompt: ResolvedSpeechPrompt,
): TranscriptEvaluation {
  const segmentMatches = matchSegments(transcript.comparable, prompt.segments);

  if (prompt.acceptedComparables.includes(transcript.comparable)) {
    return { state: "matched", transcript, segmentMatches };
  }

  const matchedById = new Map(
    segmentMatches.map((match) => [match.segmentId, match.matched]),
  );
  const allCriticalMatched = prompt.criticalSegmentIds.every(
    (segmentId) => matchedById.get(segmentId) === true,
  );

  const targetLength = Array.from(prompt.canonical.comparable).length;
  const threshold = closeThreshold(targetLength);
  const minimumDistance = prompt.acceptedComparables.reduce(
    (best, accepted) =>
      Math.min(best, levenshtein(transcript.comparable, accepted)),
    Number.POSITIVE_INFINITY,
  );

  if (allCriticalMatched && minimumDistance <= threshold) {
    return { state: "close", transcript, segmentMatches };
  }
  return { state: "retry", transcript, segmentMatches };
}
