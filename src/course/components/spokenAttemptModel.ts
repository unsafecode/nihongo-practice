import type { AssembledToken } from "../../romaji/types";
import type { ResolvedSpeechPrompt } from "../speech/types";

/**
 * The shared spoken-attempt view model shapes (Slice D plan Task 3; design
 * spec §5.3, §12.3), consumed by the A1-native model builder in
 * `./a1SpokenAttemptModel.ts` and rendered by {@link SpokenAttemptView} in
 * `./SpokenAttempt.tsx`. The legacy catalog-bound builder that used to live
 * here (`buildSpokenAttemptModel`/`getSpokenAttemptModel`) was removed once
 * the A1 release fully replaced it (Phase 2 Task 6); only the shapes both
 * the A1 builder and the shared view rely on remain.
 *
 * The Japanese target lives once in the shared example catalog: this model
 * derives `targetJp`/`targetRomaji` and the per-segment views from it and never
 * copies a Japanese literal into localized copy. The resolved prompt it carries
 * is exactly what the recognizer's evaluator judges against, so the UI and the
 * evaluation can never drift apart.
 */

/** One ordered comparison segment, resolved for display. */
export interface SpokenSegmentView {
  readonly id: string;
  readonly jp: string;
  readonly romaji: string;
  /** Hiragana reading for an assisted katakana loanword (ruby), when present. */
  readonly reading?: string;
  readonly kind: "word" | "particle" | "ending" | "punctuation";
  /** Whether this comparison segment is one of the prompt's critical segments. */
  readonly critical: boolean;
  /**
   * The complete assembled token (boundaryBefore, source) this segment was
   * resolved from — the metadata the shared {@link RomajiSequence} renderer
   * needs to compose the visible target as one real semantic sequence
   * (romaji boundaries plan Task 4, master spec §13.2-13.3), rather than a
   * flat pre-joined string or a local per-segment concatenation.
   */
  readonly token: AssembledToken;
}

/** An accepted orthographic transcript variant, resolved for display. */
export interface SpokenVariantView {
  readonly exampleId: string;
  readonly jp: string;
  readonly romaji: string;
}

export interface SpokenAttemptModel {
  readonly lessonId: string;
  readonly speechPromptId: string;
  readonly targetExampleId: string;
  /** The resolved prompt the recognizer's evaluator compares against. */
  readonly prompt: ResolvedSpeechPrompt;
  /** The ordered comparison segments, each flagged critical or not. */
  readonly segments: readonly SpokenSegmentView[];
  /** The whole-sentence Japanese, derived from the segments (never authored). */
  readonly targetJp: string;
  /** The whole-sentence romaji, derived from the shared kana reading (spec §7). */
  readonly targetRomaji: string;
  /** The localized lesson title. */
  readonly lessonTitle: string;
  /** The localized meaning of the target sentence (no Japanese). */
  readonly meaning: string;
  /** An optional localized note on the target. */
  readonly note?: string;
  /** Any accepted transcript variants (empty when the target admits none). */
  readonly variants: readonly SpokenVariantView[];
}
