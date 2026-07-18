import { describe, expect, it } from "vitest";
import {
  A2_KANJI_DISTRIBUTION,
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
  a2KanjiCountByModule,
} from "./a2KanjiCatalog";
import { a2KanjiAssistancePolicy } from "./kanjiAssistancePolicy";
import type {
  KanjiActivityMode,
  KanjiAssistancePolicy,
  KanjiEntry,
  KanjiExposure,
  KanjiSupport,
} from "./kanjiTypes";
import {
  KANJI_VALIDATION_ERROR_CODES,
  validateA2Kanji,
  type ValidateA2KanjiInput,
} from "./validateA2Kanji";
import { A2_CANONICAL_POSITIONS, A2_SYNTHESIS_LESSON_IDS } from "../manifest";
import { A2_RELEASE_ERROR_CODES } from "../types";

/**
 * Validator for the A2 contextual kanji contract (Phase 3 Task 3, locked
 * decision L3). The canonical catalog must validate clean; every mutation of
 * a distinct failure class below must be caught under its documented code.
 */

function baseInput(overrides: Partial<ValidateA2KanjiInput> = {}): ValidateA2KanjiInput {
  return {
    entries: A2_KANJI_ENTRIES,
    exposures: A2_KANJI_EXPOSURES,
    readings: A2_KANJI_READINGS,
    positions: A2_CANONICAL_POSITIONS,
    synthesisLessonIds: A2_SYNTHESIS_LESSON_IDS,
    countByModule: a2KanjiCountByModule(),
    expectedCount: 120,
    expectedByModule: A2_KANJI_DISTRIBUTION,
    ...overrides,
  };
}

function codesOf(result: ReturnType<typeof validateA2Kanji>): string[] {
  return result.errors.map((e) => e.code);
}

describe("validateA2Kanji", () => {
  it("returns zero errors for the canonical catalog", () => {
    const result = validateA2Kanji(baseInput());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("exposes exactly the 9 kanji error codes, matching the frozen A2 release vocabulary", () => {
    const kanjiCodesInReleaseVocabulary = A2_RELEASE_ERROR_CODES.filter((c) => c.startsWith("kanji-"));
    expect(new Set(KANJI_VALIDATION_ERROR_CODES)).toEqual(new Set(kanjiCodesInReleaseVocabulary));
    expect(KANJI_VALIDATION_ERROR_CODES).toHaveLength(9);
  });

  it("flags kanji-exposure-order when an entry's exposures are entirely missing", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.filter((e) => e.kanjiId !== hanashi.id);
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-exposure-order");
  });

  it("flags kanji-assessed-without-support when only the revealable exposure is missing", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.filter(
      (e) => !(e.kanjiId === hanashi.id && e.stage === "revealable"),
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-assessed-without-support");
  });

  it("flags kanji-assessed-without-support when a stage is duplicated for one entry", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const firstSupported = A2_KANJI_EXPOSURES.find(
      (e) => e.kanjiId === hanashi.id && e.stage === "first-supported",
    )!;
    const duplicate: KanjiExposure = { ...firstSupported, id: `${firstSupported.id}-dup` };
    const exposures = [...A2_KANJI_EXPOSURES, duplicate];
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-assessed-without-support");
  });

  it("flags kanji-assessed-without-support when a non-assessed stage's lesson id is unresolvable", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "supported-retrieval"
        ? { ...e, lessonId: "not-a-real-lesson" }
        : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-assessed-without-support");
  });

  it("flags kanji-furigana-premature-hide when revealable and assessed land on the same lesson", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const assessed = A2_KANJI_EXPOSURES.find((e) => e.kanjiId === hanashi.id && e.stage === "assessed")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "revealable" ? { ...e, lessonId: assessed.lessonId } : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-furigana-premature-hide");
  });

  it("flags kanji-unknown-reading for an exposure whose kanjiId matches no known entry", () => {
    const bogus: KanjiExposure = {
      id: "bogus-exposure",
      kanjiId: "a2-kanji-nope-X",
      lexemeSenseId: "a2-sense-nope",
      lessonId: "connected-conversation-1",
      stage: "first-supported",
      readingId: "a2-kanji-nope-X-reading",
      contextId: "a2-context-conversation",
    };
    const exposures = [...A2_KANJI_EXPOSURES, bogus];
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-unknown-reading");
  });

  it("flags kanji-unknown-reading for an exposure whose readingId does not resolve", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "first-supported" ? { ...e, readingId: "no-such-reading" } : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-unknown-reading");
  });

  it("flags kanji-unknown-reading when the resolved reading is not declared in the entry's readingIds", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const kiku = A2_KANJI_ENTRIES.find((e) => e.glyph === "聞")!;
    const entries: KanjiEntry[] = A2_KANJI_ENTRIES.map((e) =>
      e.id === hanashi.id ? { ...e, readingIds: kiku.readingIds } : e,
    );
    const result = validateA2Kanji(baseInput({ entries }));
    expect(codesOf(result)).toContain("kanji-unknown-reading");
  });

  it("flags kanji-distribution-sum when countByModule disagrees with expectedByModule", () => {
    const countByModule = { ...a2KanjiCountByModule(), "connected-conversation": 999 };
    const result = validateA2Kanji(baseInput({ countByModule }));
    expect(codesOf(result)).toContain("kanji-distribution-sum");
  });

  it("flags kanji-distribution-sum when the module totals no longer sum to expectedCount", () => {
    const result = validateA2Kanji(baseInput({ expectedCount: 121 }));
    expect(codesOf(result)).toContain("kanji-distribution-sum");
  });

  it("flags kanji-count when the entries array does not match expectedCount", () => {
    const entries = A2_KANJI_ENTRIES.slice(0, 119);
    const result = validateA2Kanji(baseInput({ entries }));
    expect(codesOf(result)).toContain("kanji-count");
  });

  it("flags kanji-standalone-dump for an exposure with an empty contextId", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "first-supported" ? { ...e, contextId: "" } : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-standalone-dump");
  });

  it("flags kanji-standalone-dump for an exposure with an empty lexemeSenseId", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "first-supported" ? { ...e, lexemeSenseId: "" } : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-standalone-dump");
  });

  it("flags kanji-synthesis-first-exposure when a glyph is first introduced inside a synthesis lesson", () => {
    const hanashi = A2_KANJI_ENTRIES.find((e) => e.glyph === "話")!;
    const exposures = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === hanashi.id && e.stage === "first-supported" ? { ...e, lessonId: "a2-synthesis-1" } : e,
    );
    const result = validateA2Kanji(baseInput({ exposures }));
    expect(codesOf(result)).toContain("kanji-synthesis-first-exposure");
  });

  it("flags kanji-romaji-bypass via an injected policy that leaks support at the assessed stage (proves the check is reachable, not dead)", () => {
    const leakyPolicy: KanjiAssistancePolicy = {
      supportFor(exposure, mode: KanjiActivityMode): KanjiSupport {
        if (exposure.stage === "assessed") {
          return { furigana: "visible", romaji: "allowed" };
        }
        return a2KanjiAssistancePolicy.supportFor(exposure, mode);
      },
    };
    const result = validateA2Kanji(baseInput({ policy: leakyPolicy }));
    expect(codesOf(result)).toContain("kanji-romaji-bypass");
  });

  it("does not flag kanji-romaji-bypass for the real, unmodified policy (default path)", () => {
    const result = validateA2Kanji(baseInput());
    expect(codesOf(result)).not.toContain("kanji-romaji-bypass");
  });
});
