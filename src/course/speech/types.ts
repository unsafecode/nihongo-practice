import type { ExampleId, SpeechPromptId } from "../catalog/types";

/**
 * Browser-independent speech contracts (design spec §12.2-§12.3, Slice D plan
 * Task 1). These types carry no Web Speech event objects: pure transcript
 * normalization and evaluation depend only on them, and a future non-browser
 * recognizer can satisfy the recognition outcome shapes without leaking vendor
 * details to consumers. Every shape is immutable.
 */

/**
 * The mapped, browser-independent reasons a recognition attempt can fail. The
 * browser adapter (Slice D Task 2) maps vendor events onto these; consumers
 * never see a raw `SpeechRecognitionErrorEvent`.
 */
export type RecognitionFailure =
  | "unsupported"
  | "denied"
  | "no-speech"
  | "aborted"
  | "network-error"
  | "service-error";

/**
 * The settled result of one recognition attempt. Either a recognized transcript
 * string (still un-normalized, as the vendor produced it) or a mapped failure.
 * A failure MUST NOT fabricate a transcript.
 */
export type RecognitionOutcome =
  | { readonly kind: "transcript"; readonly transcript: string }
  | { readonly kind: "failure"; readonly failure: RecognitionFailure };

/**
 * A normalized transcript. `original` is preserved verbatim for learner display;
 * `comparable` is the derived form used for deterministic comparison only.
 */
export interface NormalizedTranscript {
  readonly original: string;
  readonly comparable: string;
}

/** One target comparison segment resolved to its folded comparable text. */
export interface ResolvedSpeechSegment {
  readonly id: string;
  readonly comparable: string;
}

/**
 * A speech prompt resolved against the shared example catalog into the exact
 * comparable strings the evaluator judges against. It stores no browser state
 * and no pronunciation data — only folded target text and segment references.
 */
export interface ResolvedSpeechPrompt {
  readonly id: SpeechPromptId;
  readonly targetExampleId: ExampleId;
  /** The canonical target, normalized. */
  readonly canonical: NormalizedTranscript;
  /**
   * Every accepted target comparable: the canonical form plus each catalog
   * declared orthographic transcript variant. A `matched` result requires exact
   * equality with one of these.
   */
  readonly acceptedComparables: readonly string[];
  /** The ordered comparison segments of the canonical target. */
  readonly segments: readonly ResolvedSpeechSegment[];
  /** The subset of comparison segment IDs a `close` result requires to match. */
  readonly criticalSegmentIds: readonly string[];
}

/** A per-segment match record, always in canonical target order. */
export interface SegmentMatch {
  readonly segmentId: string;
  readonly matched: boolean;
}

/**
 * The deterministic outcome of comparing a transcript to a resolved prompt.
 * There is no percentage, score, or pronunciation claim — only a matched/close/
 * retry state, the recognized transcript, and the ordered segment records.
 */
export interface TranscriptEvaluation {
  readonly state: "matched" | "close" | "retry";
  readonly transcript: NormalizedTranscript;
  readonly segmentMatches: readonly SegmentMatch[];
}

/**
 * The replaceable evaluation boundary (design spec §12.2). A browser has no part
 * in normalization or scoring; both are pure functions of their inputs.
 */
export interface TranscriptEvaluator {
  normalize(input: string): NormalizedTranscript;
  evaluate(
    transcript: NormalizedTranscript,
    prompt: ResolvedSpeechPrompt,
  ): TranscriptEvaluation;
}
