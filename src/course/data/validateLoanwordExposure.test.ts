import { describe, expect, it } from "vitest";
import { legacyA1CourseModules as courseModules } from "./course";
import { examples } from "./examples";
import { loanwords } from "./loanwords";
import type { Loanword } from "./loanwords";
import { legacySegmentKindToTokenKind } from "./romajiTokens";
import type { ExampleSegment } from "./types";
import type { StaticExample } from "./types";
import { referencedExampleOrder, validateLoanwordExposure, validateLoanwordUsage } from "./validate";

/**
 * Synthetic first-exposure fixtures for the katakana-first loanword contract
 * (design spec §8.3, Task C). `validateLoanwordExposure` walks the referenced
 * examples in course order and, for each registered loanword the course uses,
 * proves its *first* visible appearance shows the standard katakana spelling
 * with a hiragana reading — never hiragana pretending to be the standard form,
 * never a katakana form missing its reading support. It never throws.
 */
const TEST_LOANWORDS: Record<string, Loanword> = {
  ramen: { id: "ramen", katakana: "ラーメン", hiragana: "らーめん", romaji: "rāmen" },
};

type RawSegment = Omit<ExampleSegment, "tokenKind" | "boundaryBefore" | "source">;

function ex(
  id: string,
  segments: readonly RawSegment[],
): StaticExample {
  const withIds = segments.map((segment, index) => ({
    ...segment,
    id: segment.id ?? String(index),
    tokenKind: legacySegmentKindToTokenKind(segment.kind),
    boundaryBefore: "attach" as const,
    source: { domain: "test" as const, referenceId: `segment:${id}:${segment.id ?? index}` },
  }));
  return {
    id,
    jp: withIds.map((s) => s.jp).join(""),
    romaji: withIds.map((s) => s.romaji).join(""),
    segments: withIds,
  };
}

describe("validateLoanwordExposure — first exposure must be standard katakana + reading", () => {
  it("rejects a hiragana-only first exposure of a loanword", () => {
    const examples = {
      "hira-ramen": ex("hira-ramen", [
        { jp: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "たべ", romaji: "tabe", kind: "word" },
        { jp: "ます", romaji: "masu", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordExposure(["hira-ramen"], examples, TEST_LOANWORDS),
    ).toContain("loanword-hiragana-first:ramen:hira-ramen");
  });

  it("accepts a katakana first exposure carrying its hiragana reading", () => {
    const examples = {
      "order-ramen": ex("order-ramen", [
        { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "ください", romaji: "kudasai", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordExposure(["order-ramen"], examples, TEST_LOANWORDS),
    ).toEqual([]);
  });

  it("rejects a katakana first exposure with no hiragana reading support", () => {
    const examples = {
      "bare-katakana": ex("bare-katakana", [
        { jp: "ラーメン", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "ください", romaji: "kudasai", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordExposure(["bare-katakana"], examples, TEST_LOANWORDS),
    ).toContain("loanword-missing-reading:ramen:bare-katakana");
  });

  it("treats the first referenced example as the exposure, allowing later hiragana reuse", () => {
    const examples = {
      "order-ramen": ex("order-ramen", [
        { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "ください", romaji: "kudasai", kind: "ending" },
      ]),
      "today-ate": ex("today-ate", [
        { jp: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "たべました", romaji: "tabemashita", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordExposure(
        ["order-ramen", "today-ate"],
        examples,
        TEST_LOANWORDS,
      ),
    ).toEqual([]);
  });

  it("ignores loanwords the course never references", () => {
    const examples = {
      water: ex("water", [{ jp: "みず", romaji: "mizu", kind: "word" }]),
    };
    expect(
      validateLoanwordExposure(["water"], examples, TEST_LOANWORDS),
    ).toEqual([]);
  });
});

describe("validateLoanwordExposure — real shipped course data", () => {
  it("shows every referenced loanword's standard katakana + reading at first exposure", () => {
    expect(
      validateLoanwordExposure(
        referencedExampleOrder(courseModules),
        examples,
        loanwords,
      ),
    ).toEqual([]);
  });
});

describe("validateLoanwordUsage — no post-exposure hiragana-primary loanword", () => {
  it("accepts katakana-with-reading occurrences and ignores unregistered words", () => {
    const examples = {
      "order-ramen": ex("order-ramen", [
        { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "ください", romaji: "kudasai", kind: "ending" },
      ]),
      water: ex("water", [{ jp: "みず", romaji: "mizu", kind: "word" }]),
    };
    expect(
      validateLoanwordUsage(
        ["order-ramen", "water"],
        examples,
        TEST_LOANWORDS,
      ),
    ).toEqual([]);
  });

  it("rejects a later hiragana-primary reuse of a registered loanword", () => {
    const examples = {
      "order-ramen": ex("order-ramen", [
        { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "ください", romaji: "kudasai", kind: "ending" },
      ]),
      "today-ate": ex("today-ate", [
        { jp: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "たべました", romaji: "tabemashita", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordUsage(
        ["order-ramen", "today-ate"],
        examples,
        TEST_LOANWORDS,
      ),
    ).toContain("loanword-hiragana-primary:ramen:today-ate");
  });

  it("rejects a katakana occurrence missing its hiragana reading support", () => {
    const examples = {
      "bare-katakana": ex("bare-katakana", [
        { jp: "ラーメン", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "たべ", romaji: "tabe", kind: "word" },
        { jp: "ます", romaji: "masu", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordUsage(["bare-katakana"], examples, TEST_LOANWORDS),
    ).toContain("loanword-missing-reading:ramen:bare-katakana");
  });

  it("allows a registered loanword's hiragana that appears only as reading support", () => {
    const examples = {
      "order-ramen": ex("order-ramen", [
        { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
        { jp: "を", romaji: "o ", kind: "particle" },
        { jp: "たべ", romaji: "tabe", kind: "word" },
        { jp: "ます", romaji: "masu", kind: "ending" },
      ]),
    };
    expect(
      validateLoanwordUsage(["order-ramen"], examples, TEST_LOANWORDS),
    ).toEqual([]);
  });
});
