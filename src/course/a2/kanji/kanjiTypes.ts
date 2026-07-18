/**
 * Contextual kanji data contracts (Phase 3 Task 3).
 *
 * Recognition-only: there is no handwriting, IME, or production mode here —
 * {@link KanjiActivityMode} is a closed `"read" | "choose" | "match"` union.
 * A kanji is always introduced already embedded in a contextual lexeme (the
 * `lexemeSenseId`/`contextId` on {@link KanjiExposure}); nothing here permits
 * a standalone glyph-meaning flashcard divorced from that context.
 *
 * A2 reuses the Phase 1 foundation *data* contracts (`../../foundations/types`)
 * directly and never redeclares them — `ContextId`, `CopyId`, `LessonId`, and
 * `LexemeSenseId` all come from there. Only kanji-specific identifiers and
 * shapes are declared fresh in this file.
 */

import type { ContextId, CopyId, LessonId, LexemeSenseId } from "../../foundations/types";

export type KanjiId = string;
export type KanjiReadingId = string;
export type KanjiExposureId = string;

/**
 * The four explicit exposure stages every kanji entry must pass through, in
 * strict canonical-position order: introduced with full furigana support,
 * retrieved with the same support, made revealable (furigana hidden behind a
 * learner-triggered toggle), then assessed (furigana and romaji withheld).
 */
export type KanjiExposureStage =
  | "first-supported"
  | "supported-retrieval"
  | "revealable"
  | "assessed";

/** Recognition-only activity modes. No handwriting/IME/production mode. */
export type KanjiActivityMode = "read" | "choose" | "match";

/** One glyph's reading as it is realized inside a specific contextual lexeme. */
export interface KanjiReading {
  readonly id: KanjiReadingId;
  readonly kanjiId: KanjiId;
  /** The target glyph's own kana reading inside that lexeme (not the full word). */
  readonly kana: string;
  /** The target glyph's own romaji reading inside that lexeme (not the full word). */
  readonly romaji: string;
}

/** One kanji glyph's catalog entry. */
export interface KanjiEntry {
  readonly id: KanjiId;
  readonly glyph: string;
  readonly meaningCopyId: CopyId;
  readonly readingIds: readonly KanjiReadingId[];
}

/** One scheduled exposure of a kanji, always inside a contextual lexeme/lesson. */
export interface KanjiExposure {
  readonly id: KanjiExposureId;
  readonly kanjiId: KanjiId;
  readonly lexemeSenseId: LexemeSenseId;
  readonly lessonId: LessonId;
  readonly stage: KanjiExposureStage;
  readonly readingId: KanjiReadingId;
  readonly contextId: ContextId;
}

/** Whether furigana is shown, learner-revealable, or withheld for an exposure. */
export type KanjiFuriganaSupport = "visible" | "revealable" | "hidden";

/** Whether a romaji fallback is permitted for an exposure, independent of script. */
export type KanjiRomajiSupport = "allowed" | "not-shown";

/** The resolved assistance level for one exposure rendered in one activity mode. */
export interface KanjiSupport {
  readonly furigana: KanjiFuriganaSupport;
  readonly romaji: KanjiRomajiSupport;
}

/** Resolves the assistance level for a kanji exposure, given the activity mode. */
export interface KanjiAssistancePolicy {
  supportFor(exposure: KanjiExposure, mode: KanjiActivityMode): KanjiSupport;
}
