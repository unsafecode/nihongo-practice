import type { Locale } from "../../i18n/LocaleContext";
import { formatRomaji } from "../../romaji/formatRomaji";
import type { AssembledToken, RomajiTokenKind } from "../../romaji/types";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import {
  module1ItemsByLesson,
  type A1PhoneticItem,
} from "../a1/catalog/module01Sounds";
import { courseModules } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { normalizeTranscript } from "../speech/normalizeTranscript";
import type { ResolvedSpeechPrompt } from "../speech/types";
import type {
  SpokenAttemptModel,
  SpokenSegmentView,
} from "./spokenAttemptModel";

/**
 * The A1-native spoken-attempt model (Phase 2 Task 6, master task point 4).
 *
 * Unlike the legacy `spokenAttemptModel.ts`, this never resolves a
 * `SpeechPromptCatalogEntry` against the legacy shared example catalog:
 * `ResolvedSpeechPrompt` is built by hand, directly from the realized
 * `AssembledToken`s the A1 release catalog already produced for the lesson
 * (its guided-construction target for the 60 semantic lessons; its single
 * phonetic item for the 4 `sounds-*` lessons) — exactly "shared realized
 * variant tokens", never a second authored copy of the Japanese. Both
 * branches converge on the same `SpokenAttemptModel`/`ResolvedSpeechPrompt`
 * shapes the existing `SpokenAttemptView`/`createSpokenAttemptHandlers`/
 * `evaluateTranscript` already consume unmodified, so a phonetic lesson's
 * listen/repeat attempt is a full, honest citizen of the same UI and
 * evaluator as every semantic lesson's spoken attempt — no pronunciation
 * grading, no transcript persistence, no required microphone, and no
 * network involved in producing or judging the prompt.
 */

export type A1SpokenAttemptModelErrorCode =
  | "unknown-lesson"
  | "guided-unavailable"
  | "missing-phonetic-item"
  | "missing-lesson-copy"
  | "missing-meaning-copy"
  | "missing-phonetic-copy"
  | "invalid-romaji-sequence";

export interface A1SpokenAttemptModelError {
  readonly code: A1SpokenAttemptModelErrorCode;
  readonly lessonId: string;
  readonly referenceId?: string;
}

export type A1SpokenAttemptModelResult =
  | { readonly ok: true; readonly model: SpokenAttemptModel }
  | { readonly ok: false; readonly error: A1SpokenAttemptModelError };

function fail(
  code: A1SpokenAttemptModelErrorCode,
  lessonId: string,
  referenceId?: string,
): A1SpokenAttemptModelResult {
  return { ok: false, error: { code, lessonId, referenceId } };
}

const knownLessonIds: ReadonlySet<string> = new Set(
  courseModules.flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id)),
);

/**
 * `RomajiTokenKind` (the assembled-token domain) has no 1:1 counterpart in
 * `SpokenSegmentView.kind` (the spoken-attempt display domain): both are
 * finished, independently-authored contracts from earlier tasks, so this
 * model reconciles them here rather than widening either. `lexical` content
 * words and `particle`s pass straight through; a bound `morpheme` (e.g. a
 * verb ending) displays as the closest existing display kind, `ending`;
 * `punctuation` passes straight through too.
 */
function segmentKindFor(kind: RomajiTokenKind): SpokenSegmentView["kind"] {
  switch (kind) {
    case "lexical":
      return "word";
    case "particle":
      return "particle";
    case "morpheme":
      return "ending";
    case "punctuation":
      return "punctuation";
  }
}

export function segmentsFromTokens(tokens: readonly AssembledToken[]): SpokenSegmentView[] {
  return tokens.map((token) => ({
    id: token.id,
    jp: token.jp,
    romaji: token.romaji,
    ...(token.reading ? { reading: token.reading } : {}),
    kind: segmentKindFor(token.kind),
    // A1 authors no per-segment "critical" concept yet (spec-honest choice,
    // not an omission): every close/retry distinction the evaluator makes is
    // still whole-sentence, driven by `acceptedComparables`/`segments` below.
    critical: false,
    token,
  }));
}

/** Builds a `ResolvedSpeechPrompt` by hand from realized tokens, bypassing
 * the legacy `resolveSpeechPrompt`/`SpeechExampleInput` catalog shape
 * entirely — there is no second, separately-authored example catalog for A1
 * lessons to resolve against. Exported so the A2 spoken-attempt model
 * (`a2SpokenAttemptModel.ts`) builds its prompt through the exact same
 * realized-token path, never a second copy of the Japanese. */
export function resolvePromptFromTokens(
  promptId: string,
  targetExampleId: string,
  tokens: readonly AssembledToken[],
): ResolvedSpeechPrompt {
  const jp = tokens.map((token) => token.jp).join("");
  const canonical = normalizeTranscript(jp);
  return {
    id: promptId,
    targetExampleId,
    canonical,
    acceptedComparables: [canonical.comparable],
    segments: tokens.map((token) => ({
      id: token.id,
      comparable: normalizeTranscript(token.jp).comparable,
    })),
    criticalSegmentIds: [],
  };
}

function lessonTitleOrFail(
  lessonId: string,
  locale: Locale,
): { ok: true; title: string } | A1SpokenAttemptModelResult {
  const copy = getCourseCopy(locale);
  const title = copy.lessons[lessonId]?.title;
  if (!title) return fail("missing-lesson-copy", lessonId);
  return { ok: true, title };
}

function buildSemanticModel(
  lessonId: string,
  locale: Locale,
): A1SpokenAttemptModelResult {
  const built = buildA1LessonViewModel(lessonId, locale);
  if (!built.ok) {
    return fail("guided-unavailable", lessonId, built.error.code);
  }

  const target = built.model.guided.target;
  const titleResult = lessonTitleOrFail(lessonId, locale);
  if (!("title" in titleResult)) return titleResult;

  if (!target.translation) {
    return fail("missing-meaning-copy", lessonId, target.variantId);
  }

  const formattedTarget = formatRomaji(target.tokens);
  if (!formattedTarget.ok) {
    const firstOffendingTokenId = formattedTarget.errors.find(
      (error) => error.tokenId !== undefined,
    )?.tokenId;
    return fail(
      "invalid-romaji-sequence",
      lessonId,
      firstOffendingTokenId ?? target.variantId,
    );
  }

  const segments = segmentsFromTokens(target.tokens);
  const prompt = resolvePromptFromTokens(
    `a1-spoken-${lessonId}`,
    target.variantId,
    target.tokens,
  );

  return {
    ok: true,
    model: {
      lessonId,
      speechPromptId: prompt.id,
      targetExampleId: target.variantId,
      prompt,
      segments,
      targetJp: segments.map((segment) => segment.jp).join(""),
      targetRomaji: formattedTarget.text,
      lessonTitle: titleResult.title,
      meaning: target.translation,
      variants: [],
    },
  };
}

/** A single phonetic item, resolved into a minimal, honest single-token
 * `AssembledToken` — never a fabricated sentence. Katakana items whose
 * `kana` field is identical to `glyph` (no distinct hiragana reading exists
 * in the authored catalog) omit `reading` rather than duplicate the glyph.
 * Exported so `A1LessonPage.tsx`'s rule/comparison content and this model's
 * own spoken-attempt target share the exact same token construction. */
export function assembledTokenForPhoneticItem(item: A1PhoneticItem): AssembledToken {
  return {
    id: item.id,
    jp: item.glyph,
    romaji: item.roman,
    kind: "lexical",
    boundaryBefore: "attach",
    source: { domain: "catalog", referenceId: item.id },
    ...(item.kana !== item.glyph ? { reading: item.kana } : {}),
  };
}

function buildPhoneticModel(
  lessonId: string,
  locale: Locale,
): A1SpokenAttemptModelResult {
  const items = module1ItemsByLesson[lessonId];
  const first = items?.[0];
  if (!first) return fail("missing-phonetic-item", lessonId);

  const titleResult = lessonTitleOrFail(lessonId, locale);
  if (!("title" in titleResult)) return titleResult;

  const copy = getCourseCopy(locale);
  const meaning = copy.phonetics[first.hintCopyId];
  if (!meaning) {
    return fail("missing-phonetic-copy", lessonId, first.hintCopyId);
  }

  const token = assembledTokenForPhoneticItem(first);
  const formattedTarget = formatRomaji([token]);
  if (!formattedTarget.ok) {
    return fail("invalid-romaji-sequence", lessonId, first.id);
  }

  const segments = segmentsFromTokens([token]);
  const prompt = resolvePromptFromTokens(`a1-spoken-${lessonId}`, first.id, [token]);

  return {
    ok: true,
    model: {
      lessonId,
      speechPromptId: prompt.id,
      targetExampleId: first.id,
      prompt,
      segments,
      targetJp: segments.map((segment) => segment.jp).join(""),
      targetRomaji: formattedTarget.text,
      lessonTitle: titleResult.title,
      meaning,
      variants: [],
    },
  };
}

/**
 * The complete A1 spoken-attempt model for a lesson in a locale, or a
 * structured error — never a partial model. Every one of the release's 48
 * lessons resolves through this: the 60 semantic lessons via their guided
 * target's realized tokens, the 4 phonetic `sounds-*` lessons via their
 * first authored phonetic item, so every lesson has a target or an explicit
 * phonetic listen/repeat equivalent (master task point 4).
 */
export function getA1SpokenAttemptModel(
  lessonId: string,
  locale: Locale,
): A1SpokenAttemptModelResult {
  if (!knownLessonIds.has(lessonId)) {
    return fail("unknown-lesson", lessonId);
  }
  const phoneticItems = module1ItemsByLesson[lessonId];
  if (phoneticItems) {
    return buildPhoneticModel(lessonId, locale);
  }
  return buildSemanticModel(lessonId, locale);
}
