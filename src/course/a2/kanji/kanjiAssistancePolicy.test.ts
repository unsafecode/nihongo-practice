import { describe, expect, it } from "vitest";
import { a2KanjiAssistancePolicy } from "./kanjiAssistancePolicy";
import type { KanjiActivityMode, KanjiExposure, KanjiExposureStage } from "./kanjiTypes";

/**
 * The A2 contextual kanji assistance policy (Phase 3 Task 3, locked decision
 * L3): first-supported and supported-retrieval show furigana with romaji
 * allowed; revealable hides furigana behind a learner toggle and withholds
 * romaji so that retrieval is effortful in every script mode; assessed hides
 * furigana AND withholds romaji, in every recognition mode, with no way to
 * bypass it back to visible/allowed.
 */

const ALL_MODES: readonly KanjiActivityMode[] = ["read", "choose", "match"];

function exposureAt(stage: KanjiExposureStage): KanjiExposure {
  return {
    id: `test-exposure-${stage}`,
    kanjiId: "a2-kanji-hana-話",
    lexemeSenseId: "a2-sense-hanasu",
    lessonId: "connected-conversation-1",
    stage,
    readingId: "a2-kanji-hana-話-reading",
    contextId: "a2-context-conversation",
  };
}

function isDeepFrozen(value: unknown, seen: Set<unknown> = new Set()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => isDeepFrozen(v, seen));
}

describe("a2KanjiAssistancePolicy", () => {
  it("shows visible furigana with romaji allowed at first-supported, in every mode", () => {
    for (const mode of ALL_MODES) {
      const support = a2KanjiAssistancePolicy.supportFor(exposureAt("first-supported"), mode);
      expect(support).toEqual({ furigana: "visible", romaji: "allowed" });
    }
  });

  it("shows visible furigana with romaji allowed at supported-retrieval, in every mode", () => {
    for (const mode of ALL_MODES) {
      const support = a2KanjiAssistancePolicy.supportFor(exposureAt("supported-retrieval"), mode);
      expect(support).toEqual({ furigana: "visible", romaji: "allowed" });
    }
  });

  it("makes furigana revealable and withholds romaji at revealable, in every mode", () => {
    for (const mode of ALL_MODES) {
      const support = a2KanjiAssistancePolicy.supportFor(exposureAt("revealable"), mode);
      expect(support).toEqual({ furigana: "revealable", romaji: "not-shown" });
    }
  });

  it("hides furigana and withholds romaji at assessed, in every recognition mode with no bypass", () => {
    for (const mode of ALL_MODES) {
      const support = a2KanjiAssistancePolicy.supportFor(exposureAt("assessed"), mode);
      expect(support).toEqual({ furigana: "hidden", romaji: "not-shown" });
    }
  });

  it("is deep-frozen", () => {
    expect(isDeepFrozen(a2KanjiAssistancePolicy)).toBe(true);
  });
});
