import { describe, expect, it } from "vitest";
import { A1_PHONETIC_PRACTICE_MAX_REUSE, A1_PHONETIC_PRACTICE_MIN_UNIQUE } from "../a1/authoring";
import { opaqueTargetKey } from "./opaqueTargetKey";
import { checkVisibleTargetDiversity } from "./visibleTargetDiversity";

/**
 * Phase 2 Task 7, finding M3: the previous e2e "semantic diversity" proxy
 * counted unique exercise/variant *ids*, which are unique by construction —
 * a tautology that would pass even if every exercise secretly quizzed the
 * exact same visible Japanese target. This suite proves the real,
 * DOM-metadata-based replacement actually rejects that failure mode: a
 * fixture with a genuinely duplicated visible target must fail the helper,
 * not just a fixture with duplicated ids (which this helper never even
 * looks at).
 */
describe("checkVisibleTargetDiversity", () => {
  it("passes four unique selected A1 phonetic targets", () => {
    const keys = ["a", "b", "c", "d"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBeGreaterThanOrEqual(A1_PHONETIC_PRACTICE_MIN_UNIQUE);
    expect(result.overusedKeys).toEqual([]);
  });

  it("fails when a real selected target is repeated, even though ids stay unique", () => {
    // This is the exact regression the old id-based proxy could never
    // catch: every entry below still has its own unique exercise id in a
    // real DOM, but two of them quiz the same visible target ("a").
    const keys = ["a", "a", "b", "c", "d"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.overusedKeys).toEqual(["a"]);
  });

  it("fails the unique-target floor when fewer than four targets appear", () => {
    const keys = ["a", "b", "c"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBeLessThan(A1_PHONETIC_PRACTICE_MIN_UNIQUE);
  });

  it("reports every overused key, not just the first, in first-seen order", () => {
    const keys = ["x", "x", "y", "y", "z"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.overusedKeys).toEqual(["x", "y"]);
  });

  it("integrates with the real opaque hash: two distinct visible targets never collide, so hashing alone cannot mask a real duplicate", () => {
    // A genuine duplicate (the same visible target realized twice) still
    // hashes to the same opaque key, so the diversity check still catches
    // it even after hashing removes the raw Japanese.
    const distinctTargets = ["せんせいです", "がくせいです", "ともだちです", "いしゃです"];
    const keys = [
      ...distinctTargets.map(opaqueTargetKey),
      opaqueTargetKey(distinctTargets[0]!),
    ];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBe(distinctTargets.length);
    expect(result.overusedKeys).toEqual([opaqueTargetKey(distinctTargets[0]!)]);
  });
});
