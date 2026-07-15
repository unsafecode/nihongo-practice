import { describe, expect, it } from "vitest";
import { validateComparison } from "./validate";
import type {
  ExampleSegment,
  StaticExample,
  TransformComparisonData,
} from "./types";

function seg(jp: string, kind: ExampleSegment["kind"], id: string): ExampleSegment {
  return { id, jp, romaji: jp, kind };
}

function example(id: string, segments: ExampleSegment[]): StaticExample {
  return {
    id,
    jp: segments.map((segment) => segment.jp).join(""),
    romaji: segments.map((segment) => segment.romaji).join(""),
    segments,
  };
}

/** A genuine, valid before/after: ねこ -> ねこだ, introducing the ending だ. */
function fixture(): {
  comparison: TransformComparisonData;
  examples: Record<string, StaticExample>;
} {
  const examples: Record<string, StaticExample> = {
    "t-base": example("t-base", [seg("ねこ", "word", "0")]),
    "t-changed": example("t-changed", [
      seg("ねこ", "word", "0"),
      seg("だ", "ending", "1"),
    ]),
  };
  const comparison: TransformComparisonData = {
    id: "cmp",
    baseExampleId: "t-base",
    changedExampleId: "t-changed",
    contrastDimension: "ending",
    changedGearIds: ["だ"],
    changedSegmentIds: ["1"],
  };
  return { comparison, examples };
}

describe("validateComparison", () => {
  it("accepts a genuine declared-delta comparison", () => {
    const { comparison, examples } = fixture();
    expect(validateComparison(comparison, examples)).toEqual([]);
  });

  it("rejects identical base/changed endpoints (same example id)", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedExampleId: "t-base" },
      examples,
    );
    expect(errors).toContain("comparison-same-endpoints:cmp");
  });

  it("rejects a missing base example", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, baseExampleId: "ghost" },
      examples,
    );
    expect(errors).toContain("comparison-unknown-example:cmp:ghost");
  });

  it("rejects a missing changed example", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedExampleId: "ghost" },
      examples,
    );
    expect(errors).toContain("comparison-unknown-example:cmp:ghost");
  });

  it("rejects an empty changed-gear declaration", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedGearIds: [] },
      examples,
    );
    expect(errors).toContain("comparison-empty-gears:cmp");
  });

  it("rejects an empty changed-segment declaration", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedSegmentIds: [] },
      examples,
    );
    expect(errors).toContain("comparison-empty-segments:cmp");
  });

  it("rejects endpoints whose Japanese text is identical", () => {
    const examples: Record<string, StaticExample> = {
      "same-a": example("same-a", [seg("ねこ", "word", "0")]),
      "same-b": example("same-b", [seg("ねこ", "word", "0")]),
    };
    const comparison: TransformComparisonData = {
      id: "cmp",
      baseExampleId: "same-a",
      changedExampleId: "same-b",
      contrastDimension: "ending",
      changedGearIds: ["ねこ"],
      changedSegmentIds: ["0"],
    };
    expect(validateComparison(comparison, examples)).toContain(
      "comparison-identical-text:cmp",
    );
  });

  it("rejects a changed-segment id absent from the changed example", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedSegmentIds: ["9"] },
      examples,
    );
    expect(errors).toContain("comparison-unknown-segment:cmp:9");
  });

  it("rejects a duplicated changed-segment id", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedSegmentIds: ["1", "1"] },
      examples,
    );
    expect(errors).toContain("comparison-duplicate-segment:cmp:1");
  });

  it("rejects marking a segment that did not actually change (present in both endpoints)", () => {
    const { comparison, examples } = fixture();
    // Segment "0" (ねこ) exists identically in base and changed: marking it is dishonest.
    const errors = validateComparison(
      { ...comparison, changedSegmentIds: ["0"], changedGearIds: ["ねこ"] },
      examples,
    );
    expect(errors).toContain("comparison-segment-not-changed:cmp:0");
  });

  it("rejects changed gears that do not correspond to the declared changed segments", () => {
    const { comparison, examples } = fixture();
    const errors = validateComparison(
      { ...comparison, changedGearIds: ["を"] },
      examples,
    );
    expect(errors).toContain("comparison-gear-segment-mismatch:cmp");
  });

  it("rejects a comparison that omits an introduced segment from changedSegmentIds (incomplete delta)", () => {
    // "changed" introduces two genuinely new segments (だ, ね) vs base, but
    // only "だ" is declared. The delta is honest-but-incomplete: it must be
    // rejected even though every declared segment id is individually valid
    // and changedGearIds stays internally consistent with that subset.
    const examples: Record<string, StaticExample> = {
      "t-base": example("t-base", [seg("ねこ", "word", "0")]),
      "t-changed": example("t-changed", [
        seg("ねこ", "word", "0"),
        seg("だ", "ending", "1"),
        seg("ね", "particle", "2"),
      ]),
    };
    const comparison: TransformComparisonData = {
      id: "cmp",
      baseExampleId: "t-base",
      changedExampleId: "t-changed",
      contrastDimension: "ending",
      changedGearIds: ["だ"],
      changedSegmentIds: ["1"],
    };
    expect(validateComparison(comparison, examples)).toContain(
      "comparison-incomplete-delta:cmp",
    );
  });

  it("rejects a comparison that under-declares a repeated introduced segment (two distinct new ids sharing the same text, only one declared)", () => {
    // "changed" introduces the same new text (だ) twice under two distinct
    // segment ids (1 and 2). A distinct-text Set collapses both occurrences
    // into a single member "だ", so declaring only id "1" would appear
    // complete once its text matches. Each introduced *occurrence* must be
    // accounted for by its own id — declaring only one of the two leaves a
    // genuinely new segment (id "2") unaccounted for.
    const examples: Record<string, StaticExample> = {
      "t-base": example("t-base", [seg("ねこ", "word", "0")]),
      "t-changed": example("t-changed", [
        seg("ねこ", "word", "0"),
        seg("だ", "ending", "1"),
        seg("だ", "ending", "2"),
      ]),
    };
    const comparison: TransformComparisonData = {
      id: "cmp",
      baseExampleId: "t-base",
      changedExampleId: "t-changed",
      contrastDimension: "ending",
      changedGearIds: ["だ"],
      changedSegmentIds: ["1"],
    };
    expect(validateComparison(comparison, examples)).toContain(
      "comparison-incomplete-delta:cmp",
    );
  });

  it("accepts declaring only the added occurrence when base already had one instance of that text", () => {
    // base has a single ねこ; changed repeats it (ねこねこ). The first
    // occurrence (id "0") still matches the base occurrence one-for-one and
    // is not introduced; only the second occurrence (id "1") is genuinely
    // new. Declaring exactly that added occurrence is a complete, honest
    // delta and must not be flagged incomplete.
    const examples: Record<string, StaticExample> = {
      "t-base": example("t-base", [seg("ねこ", "word", "0")]),
      "t-changed": example("t-changed", [
        seg("ねこ", "word", "0"),
        seg("ねこ", "word", "1"),
      ]),
    };
    const comparison: TransformComparisonData = {
      id: "cmp",
      baseExampleId: "t-base",
      changedExampleId: "t-changed",
      contrastDimension: "word-order",
      changedGearIds: ["ねこ"],
      changedSegmentIds: ["1"],
    };
    expect(validateComparison(comparison, examples)).toEqual([]);
  });

  it("rejects an unsegmented endpoint (delta cannot be located)", () => {
    const examples: Record<string, StaticExample> = {
      "plain-a": { id: "plain-a", jp: "あ", romaji: "a" },
      "plain-b": { id: "plain-b", jp: "か", romaji: "ka" },
    };
    const comparison: TransformComparisonData = {
      id: "cmp",
      baseExampleId: "plain-a",
      changedExampleId: "plain-b",
      contrastDimension: "sound",
      changedGearIds: ["か"],
      changedSegmentIds: ["0"],
    };
    expect(validateComparison(comparison, examples)).toContain(
      "comparison-unsegmented:cmp",
    );
  });
});
