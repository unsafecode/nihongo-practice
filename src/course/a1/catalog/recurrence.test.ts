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
import { assertNoStaleLaterUseKeys, a1ReleaseVerbUseRecords } from "./recurrence";
import { a1SemanticFoundationCatalogs } from "./catalog";
import { realizeVariant, type RealizeVariantCatalogs } from "../../foundations/realizeFamily";

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

// ---------------------------------------------------------------------------
// Later-use sense truthfulness (quality-review C1 regression, Task 4)
//
// A `laterUse` entry is only a genuine spaced reuse if the cited variant, once
// REALIZED (not merely inspected as raw catalog metadata), actually produces
// the claimed sense among its `usedLexemeSenseIds`. This independently
// recomputes that fact for every record in the full release timeline —
// including the 13 Module 9-11 senses whose reuses live in the four capstone
// lessons — never trusting the authored citation at face value.
// ---------------------------------------------------------------------------

describe("a1ReleaseVerbUseRecords — later-use sense truthfulness (quality-review C1)", () => {
  const catalogs = a1SemanticFoundationCatalogs;
  const familyById = new Map(catalogs.sentenceFamilies.map((f) => [f.id, f]));
  const variantById = new Map(catalogs.sentenceVariants.map((v) => [v.id, v]));
  const concepts = new Set(catalogs.sentenceFamilies.flatMap((f) => f.requiredConceptIds));
  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: catalogs.contexts,
    personRoles: catalogs.personRoles,
    referents: catalogs.referents,
    semanticValues: catalogs.semanticValues,
    learningTargetSenses: catalogs.learningTargetSenses,
  };

  /** Independently realizes a cited variant by id and returns the senses it
   * actually produces — never the senses the citation merely claims. */
  function realizedSenseIdsFor(variantId: string): readonly string[] {
    const variant = variantById.get(variantId);
    if (!variant) throw new Error(`later-use cites unknown variant: ${variantId}`);
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) throw new Error(`later-use variant ${variantId} has unknown family: ${variant.sentenceFamilyId}`);
    const result = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...concepts],
    });
    if (!result.ok) {
      throw new Error(`later-use variant ${variantId} failed to realize: ${JSON.stringify(result.errors)}`);
    }
    return result.sentence.usedLexemeSenseIds;
  }

  it("every laterUse variant genuinely realizes its record's senseId (RED before the capstone re-authoring)", () => {
    const violations: string[] = [];
    for (const record of a1ReleaseVerbUseRecords) {
      if (record.learningUse === "receptive") continue;
      for (const use of record.laterUses) {
        const realizedSenseIds = realizedSenseIdsFor(use.variantId);
        if (!realizedSenseIds.includes(record.senseId)) {
          violations.push(
            `${record.senseId} <- ${use.variantId} (realized: ${realizedSenseIds.join(", ") || "none"})`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("every productive record has at least two genuinely-reusing laterUses (not merely two citations)", () => {
    // §9.3's "≥2 later uses" is a count over the AUTHORED array; that count is
    // meaningless if the cited variants don't actually carry the sense. This
    // recomputes the count from realized, sense-verified uses only, so an
    // author cannot satisfy the recurrence bar by citing two unrelated
    // variants that both happen to exist.
    const thin: string[] = [];
    for (const record of a1ReleaseVerbUseRecords) {
      if (record.learningUse === "receptive") continue;
      const genuineUses = record.laterUses.filter((use) =>
        realizedSenseIdsFor(use.variantId).includes(record.senseId),
      );
      if (genuineUses.length < 2) thin.push(record.senseId);
    }
    expect(thin).toEqual([]);
  });
});
