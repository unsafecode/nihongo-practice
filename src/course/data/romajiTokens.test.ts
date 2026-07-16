import { describe, expect, it } from "vitest";
import type { ExampleSegment } from "./types";
import {
  exampleSegmentToAssembledToken,
  legacySegmentKindToTokenKind,
} from "./romajiTokens";

function testSegment(
  kind: ExampleSegment["kind"],
  overrides?: Partial<ExampleSegment>,
): ExampleSegment {
  return {
    id: "s1",
    jp: "ねこ",
    romaji: "neko",
    kind,
    tokenKind: legacySegmentKindToTokenKind(kind),
    boundaryBefore: "attach",
    source: { domain: "test", referenceId: "segment:s1" },
    ...overrides,
  };
}

describe("legacySegmentKindToTokenKind", () => {
  it("maps every authored legacy segment kind to the matching romaji token kind", () => {
    expect({
      word: legacySegmentKindToTokenKind("word"),
      particle: legacySegmentKindToTokenKind("particle"),
      ending: legacySegmentKindToTokenKind("ending"),
      punctuation: legacySegmentKindToTokenKind("punctuation"),
    }).toEqual({
      word: "lexical",
      particle: "particle",
      ending: "morpheme",
      punctuation: "punctuation",
    });
  });
});

describe("exampleSegmentToAssembledToken", () => {
  it("returns the exact assembled token metadata when the segment is complete", () => {
    expect(exampleSegmentToAssembledToken(testSegment("ending"))).toEqual({
      id: "s1",
      jp: "ねこ",
      romaji: "neko",
      kind: "morpheme",
      boundaryBefore: "attach",
      source: { domain: "test", referenceId: "segment:s1" },
    });
  });

  it("rejects missing stable ids instead of synthesizing fallback token metadata", () => {
    expect(
      exampleSegmentToAssembledToken(
        testSegment("word", { id: undefined }) as ExampleSegment,
      ),
    ).toBeNull();
  });
});
