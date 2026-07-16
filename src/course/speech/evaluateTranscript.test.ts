import { describe, expect, it } from "vitest";
import {
  evaluateTranscript,
  resolveSpeechPrompt,
  type SpeechExampleInput,
  type SpeechPromptResolutionInput,
} from "./evaluateTranscript";
import { normalizeTranscript } from "./normalizeTranscript";
import type { NormalizedTranscript } from "./types";
import { speechPrompts } from "../catalog/speechPrompts";
import { curriculumExamplesById } from "../catalog/examples";

/**
 * Deterministic transcript evaluation contract (design spec §12.3, §17.2, Slice
 * D plan Task 1). The evaluator resolves a prompt from shared example segments
 * and returns a matched/close/retry state with ordered per-segment records —
 * never a percentage, score, or pronunciation claim. `matched` requires exact
 * canonical/variant equality; `close` requires every critical segment to match
 * and a code-point edit distance within `max(1, floor(targetLength * 0.15))`.
 */

/** A pre-normalized transcript for tests that pin an exact comparable form. */
const t = (comparable: string): NormalizedTranscript => ({
  original: comparable,
  comparable,
});

/** Replace the last `count` code points with a filler kana absent elsewhere. */
function mutateTail(comparable: string, count: number): string {
  const points = Array.from(comparable);
  for (let index = points.length - count; index < points.length; index += 1) {
    points[index] = "ん";
  }
  return points.join("");
}

// A crafted target whose canonical comparable is exactly 20 code points, so the
// close threshold is max(1, floor(20 * 0.15)) = 3. Critical segments are the
// leading particle and ending; the long trailing word is non-critical, so tail
// edits exercise the distance threshold without disturbing a critical segment.
const THRESHOLD_WORD = "あいうえおかきくけこさしすせそたち"; // 17 code points
const thresholdExamples = new Map<string, SpeechExampleInput>([
  [
    "threshold-say",
    {
      id: "threshold-say",
      jp: `はです${THRESHOLD_WORD}`,
      segments: [
        { id: "p1", jp: "は" },
        { id: "e1", jp: "です" },
        { id: "w1", jp: THRESHOLD_WORD },
      ],
    },
  ],
  [
    "threshold-variant",
    {
      id: "threshold-variant",
      // One code point different from the canonical target (ち → か).
      jp: `はです${THRESHOLD_WORD.slice(0, -1)}か`,
      segments: [
        { id: "p1", jp: "は" },
        { id: "e1", jp: "です" },
        { id: "w1", jp: `${THRESHOLD_WORD.slice(0, -1)}か` },
      ],
    },
  ],
]);

const thresholdPrompt: SpeechPromptResolutionInput = {
  id: "speech-threshold",
  targetExampleId: "threshold-say",
  acceptedTranscriptVariantExampleIds: [],
  comparisonSegmentIds: ["p1", "e1", "w1"],
  criticalSegmentIds: ["p1", "e1"],
};

describe("resolveSpeechPrompt", () => {
  it("resolves canonical text and ordered comparison segments", () => {
    const resolved = resolveSpeechPrompt(thresholdPrompt, thresholdExamples);
    expect(resolved.canonical.comparable).toBe(`はです${THRESHOLD_WORD}`);
    expect(Array.from(resolved.canonical.comparable)).toHaveLength(20);
    expect(resolved.segments.map((segment) => segment.id)).toEqual([
      "p1",
      "e1",
      "w1",
    ]);
    expect(resolved.acceptedComparables).toEqual([`はです${THRESHOLD_WORD}`]);
  });

  it("throws on an unresolvable target example", () => {
    expect(() =>
      resolveSpeechPrompt(
        { ...thresholdPrompt, targetExampleId: "missing" },
        thresholdExamples,
      ),
    ).toThrow();
  });
});

describe("evaluateTranscript state", () => {
  const resolved = resolveSpeechPrompt(thresholdPrompt, thresholdExamples);

  it("returns matched only on exact canonical equality", () => {
    const result = evaluateTranscript(t(resolved.canonical.comparable), resolved);
    expect(result.state).toBe("matched");
    expect(result.segmentMatches.every((match) => match.matched)).toBe(true);
  });

  it("returns matched for an explicit declared transcript variant", () => {
    const withVariant = resolveSpeechPrompt(
      {
        ...thresholdPrompt,
        acceptedTranscriptVariantExampleIds: ["threshold-variant"],
      },
      thresholdExamples,
    );
    const variantComparable = withVariant.acceptedComparables[1];
    expect(variantComparable).not.toBe(withVariant.canonical.comparable);
    expect(evaluateTranscript(t(variantComparable), withVariant).state).toBe(
      "matched",
    );
  });

  it("returns close below the distance threshold with all critical matched", () => {
    const below = t(mutateTail(resolved.canonical.comparable, 2));
    expect(evaluateTranscript(below, resolved).state).toBe("close");
  });

  it("returns close at the distance threshold with all critical matched", () => {
    const atThreshold = t(mutateTail(resolved.canonical.comparable, 3));
    expect(evaluateTranscript(atThreshold, resolved).state).toBe("close");
  });

  it("returns retry above the distance threshold", () => {
    const above = t(mutateTail(resolved.canonical.comparable, 4));
    expect(evaluateTranscript(above, resolved).state).toBe("retry");
  });

  it("cannot be close when a critical segment is missing, even within threshold", () => {
    // Dropping the leading critical particle は is a single deletion (distance 1,
    // within threshold 3), but the critical particle no longer matches.
    const droppedParticle = t(
      Array.from(resolved.canonical.comparable).slice(1).join(""),
    );
    const result = evaluateTranscript(droppedParticle, resolved);
    const particleMatch = result.segmentMatches.find(
      (match) => match.segmentId === "p1",
    );
    expect(particleMatch?.matched).toBe(false);
    expect(result.state).toBe("retry");
  });

  it("returns retry for an unrelated transcript", () => {
    expect(evaluateTranscript(t("こんにちは"), resolved).state).toBe("retry");
  });
});

describe("evaluateTranscript segment records", () => {
  it("keeps segment records in target order and folds katakana for comparison", () => {
    const examples = new Map<string, SpeechExampleInput>([
      [
        "kata-say",
        {
          id: "kata-say",
          jp: "コーヒーをのみます",
          segments: [
            { id: "w1", jp: "コーヒー" },
            { id: "p1", jp: "を" },
            { id: "w2", jp: "のみ" },
            { id: "e1", jp: "ます" },
          ],
        },
      ],
    ]);
    const resolved = resolveSpeechPrompt(
      {
        id: "speech-kata",
        targetExampleId: "kata-say",
        acceptedTranscriptVariantExampleIds: [],
        comparisonSegmentIds: ["w1", "p1", "w2", "e1"],
        criticalSegmentIds: ["p1", "e1"],
      },
      examples,
    );
    const result = evaluateTranscript(
      normalizeTranscript("コーヒーをのみます"),
      resolved,
    );
    expect(result.state).toBe("matched");
    expect(result.segmentMatches.map((match) => match.segmentId)).toEqual([
      "w1",
      "p1",
      "w2",
      "e1",
    ]);
  });

  it("aligns repeated segment strings greedily without false matching", () => {
    const examples = new Map<string, SpeechExampleInput>([
      [
        "repeat-say",
        {
          id: "repeat-say",
          jp: "をみずをのみ",
          segments: [
            { id: "p1", jp: "を" },
            { id: "w1", jp: "みず" },
            { id: "p2", jp: "を" },
            { id: "w2", jp: "のみ" },
          ],
        },
      ],
    ]);
    const resolved = resolveSpeechPrompt(
      {
        id: "speech-repeat",
        targetExampleId: "repeat-say",
        acceptedTranscriptVariantExampleIds: [],
        comparisonSegmentIds: ["p1", "w1", "p2", "w2"],
        criticalSegmentIds: ["p1", "p2"],
      },
      examples,
    );
    // Dropping the first を must mark the FIRST particle unmatched — the second
    // を must not falsely satisfy the first slot.
    const result = evaluateTranscript(t("みずをのみ"), resolved);
    expect(result.segmentMatches).toEqual([
      { segmentId: "p1", matched: false },
      { segmentId: "w1", matched: true },
      { segmentId: "p2", matched: true },
      { segmentId: "w2", matched: true },
    ]);
    expect(result.state).toBe("retry");
  });
});

describe("every authored catalog speech prompt", () => {
  it("resolves and matches its own canonical target", () => {
    expect(speechPrompts).toHaveLength(40);
    for (const prompt of speechPrompts) {
      const target = curriculumExamplesById.get(prompt.targetExampleId);
      expect(target).toBeDefined();
      if (!target) continue;
      const resolved = resolveSpeechPrompt(prompt, curriculumExamplesById);
      expect(resolved.segments).toHaveLength(target.segments.length);
      expect(resolved.canonical.comparable.length).toBeGreaterThan(0);
      expect(resolved.criticalSegmentIds.length).toBeGreaterThan(0);
      const result = evaluateTranscript(
        normalizeTranscript(target.jp),
        resolved,
      );
      expect(result.state).toBe("matched");
      expect(result.segmentMatches.every((match) => match.matched)).toBe(true);
    }
  });
});
