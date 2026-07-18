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
  it("passes a fixture with >=5 unique keys each reused at most twice (the authoring contract's own floor)", () => {
    // 5 unique keys, the first two reused once each (reuse count 2) — the
    // exact shape a real 10-exercise semantic lesson or 8-12-item phonetic
    // lesson authors to.
    const keys = ["a", "a", "b", "b", "c", "d", "e"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBeGreaterThanOrEqual(A1_PHONETIC_PRACTICE_MIN_UNIQUE);
    expect(result.overusedKeys).toEqual([]);
  });

  it("fails when a real visible target is reused a 3rd time, even though ids stay unique", () => {
    // This is the exact regression the old id-based proxy could never
    // catch: every entry below still has its own unique exercise id in a
    // real DOM (`ex-1`..`ex-7`), but three of them quiz the *same* real
    // Japanese target ("a"). A genuine diversity check must fail here.
    const keys = ["a", "a", "a", "b", "c", "d", "e"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.overusedKeys).toEqual(["a"]);
  });

  it("fails the unique-target floor when fewer than 5 distinct targets appear, even with 10 cards", () => {
    // 10 cards, but only drawn from 4 distinct targets (reuse within the
    // allowed max of 2 each) — still not diverse enough content.
    const keys = ["a", "a", "b", "b", "c", "c", "d", "d", "a", "b"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBeLessThan(A1_PHONETIC_PRACTICE_MIN_UNIQUE);
  });

  it("reports every overused key, not just the first, in first-seen order", () => {
    const keys = ["x", "x", "x", "y", "y", "y", "z"];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.overusedKeys).toEqual(["x", "y"]);
  });

  it("integrates with the real opaque hash: two distinct visible targets never collide, so hashing alone cannot mask a real duplicate", () => {
    // A genuine duplicate (the same visible target realized twice) still
    // hashes to the same opaque key, so the diversity check still catches
    // it even after hashing removes the raw Japanese.
    const distinctTargets = ["せんせいです", "がくせいです", "ともだちです", "いしゃです", "こうこうせいです"];
    const keys = [
      ...distinctTargets.map(opaqueTargetKey),
      opaqueTargetKey(distinctTargets[0]!),
      opaqueTargetKey(distinctTargets[0]!),
    ];
    const result = checkVisibleTargetDiversity(keys, A1_PHONETIC_PRACTICE_MAX_REUSE);
    expect(result.uniqueCount).toBe(distinctTargets.length);
    expect(result.overusedKeys).toEqual([opaqueTargetKey(distinctTargets[0]!)]);
  });
});
