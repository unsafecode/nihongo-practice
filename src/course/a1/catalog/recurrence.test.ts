/**
 * A1 recurrence wiring — stale later-use map key contract (quality-review M5).
 *
 * `augment()` (recurrence.ts) already fails loudly when an introduced record
 * has NO entry in `LATER_USES_BY_SENSE` (a missing key). The symmetric case —
 * a map key that no longer corresponds to any introduced record, e.g. a typo'd
 * sense id or a stale entry left behind after a sense was removed/renamed —
 * was silently ignored: `Object.keys(LATER_USES_BY_SENSE)` was never
 * cross-checked against the actual record set. `assertNoStaleLaterUseKeys` is
 * the exported, pure, dependency-injected assertion that closes this gap, so
 * both directions of the map/record correspondence fail closed with a
 * deterministic, explicit error.
 */

import { describe, expect, it } from "vitest";

import { a1VerbUseRecord } from "./shared";
import { assertNoStaleLaterUseKeys } from "./recurrence";

function fakeRecord(senseId: string) {
  return a1VerbUseRecord({
    senseId,
    introductionLessonId: "test-lesson",
    introductionVariantIds: ["test-lesson-m1"],
    exerciseRoundId: "test-lesson-round-1",
    exerciseKind: "completion",
    exerciseTargetVariantId: "test-lesson-m1",
  });
}

describe("assertNoStaleLaterUseKeys", () => {
  it("throws a deterministic error listing every map key with no introduced record", () => {
    const records = [fakeRecord("a1-sense-real")];
    const laterUsesBySense = {
      "a1-sense-real": [{ lessonId: "later-lesson", variantId: "later-lesson-m1" }],
      "a1-sense-stale-typo": [{ lessonId: "later-lesson", variantId: "later-lesson-m2" }],
    };

    expect(() => assertNoStaleLaterUseKeys(laterUsesBySense, records)).toThrowError(
      /a1-sense-stale-typo/,
    );
  });

  it("lists every stale key, sorted, when more than one is stale", () => {
    const records = [fakeRecord("a1-sense-real")];
    const laterUsesBySense = {
      "a1-sense-real": [{ lessonId: "later-lesson", variantId: "later-lesson-m1" }],
      "a1-sense-zzz-stale": [{ lessonId: "later-lesson", variantId: "later-lesson-m2" }],
      "a1-sense-aaa-stale": [{ lessonId: "later-lesson", variantId: "later-lesson-m3" }],
    };

    let thrown: unknown;
    try {
      assertNoStaleLaterUseKeys(laterUsesBySense, records);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain(
      "a1-sense-aaa-stale, a1-sense-zzz-stale",
    );
  });

  it("does not throw when every map key matches an introduced record's senseId", () => {
    const records = [fakeRecord("a1-sense-real"), fakeRecord("a1-sense-other")];
    const laterUsesBySense = {
      "a1-sense-real": [{ lessonId: "later-lesson", variantId: "later-lesson-m1" }],
      "a1-sense-other": [{ lessonId: "later-lesson", variantId: "later-lesson-m2" }],
    };

    expect(() => assertNoStaleLaterUseKeys(laterUsesBySense, records)).not.toThrow();
  });

  it("does not throw for an empty map (no keys to be stale)", () => {
    const records = [fakeRecord("a1-sense-real")];
    expect(() => assertNoStaleLaterUseKeys({}, records)).not.toThrow();
  });
});
