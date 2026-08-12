import { describe, expect, it } from "vitest";
import {
  buildBaseReleaseInput,
  validateBaseRelease,
  type BaseReleaseInput,
} from "./validateBase";
import {
  baseReleaseInput,
  changeReviewedAudioHash,
  changeReviewedJapanese,
  cloneBaseReleaseInput,
  duplicateVisibleTarget,
  leakAnswerDataAttribute,
  mutateDynamicNonpastGloss,
  mutateIAdjectiveDa,
  mutateParticleFrame,
  removePatternCell,
} from "./validation/mutationFixtures";
import { BASE_LESSON_IDS, BASE_MODULE_IDS } from "./manifest";
import { BASE_REFERENCE_IDS } from "./references/catalog";
import { A1_RETAINED_LESSON_IDS, A1_RETAINED_MODULE_IDS } from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";

/**
 * Task 17 — the full Base release gate.
 *
 * `validateBaseRelease()` is *additive*: it collects every structured finding
 * over the whole release (production catalogs **and** the realized learner
 * views) and never stops at the first error. These tests exercise both
 * directions: the real, unmodified release input must be valid, and each of
 * the eight single-field mutation fixtures must be caught by its own code.
 */

const MUTATIONS = [
  ["dynamic ongoing nonpast", mutateDynamicNonpastGloss, "dynamic-nonpast-ongoing"],
  ["i adjective copula da", mutateIAdjectiveDa, "i-adjective-copula-da"],
  ["particle without license", mutateParticleFrame, "unlicensed-particle"],
  ["system pattern gap", removePatternCell, "pattern-cell-missing"],
  ["duplicate visible target", duplicateVisibleTarget, "duplicate-visible-fingerprint"],
  ["answer metadata leak", leakAnswerDataAttribute, "pre-attempt-answer-leak"],
  ["stale audio review", changeReviewedAudioHash, "audio-review-stale"],
  ["unreviewed naturalness", changeReviewedJapanese, "naturalness-review-stale"],
] as const;

describe("validateBaseRelease — mutation gate", () => {
  it.each(MUTATIONS)("%s fails with %s", (_label, mutate, code) => {
    const result = validateBaseRelease(mutate(baseReleaseInput));
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ code }));
  });

  /**
   * Each fixture is only meaningful if the *unmodified* release passes first,
   * and if the single mutated field is the only thing the gate reacts to.
   * Both assertions are set-based, so neither depends on error ordering.
   */
  it.each(MUTATIONS)(
    "%s: the unmodified release is valid and the mutation adds exactly %s",
    (_label, mutate, code) => {
      const baseline = validateBaseRelease(baseReleaseInput);
      expect(baseline.errors).toEqual([]);
      expect(baseline.valid).toBe(true);

      const mutated = validateBaseRelease(mutate(baseReleaseInput));
      expect(new Set(mutated.errors.map((error) => error.code))).toEqual(
        new Set([code]),
      );
    },
  );

  it("never mutates the frozen release input a fixture was cloned from", () => {
    const before = JSON.stringify(baseReleaseInput.naturalness.reviews[0]);
    changeReviewedJapanese(baseReleaseInput);
    duplicateVisibleTarget(baseReleaseInput);
    expect(JSON.stringify(baseReleaseInput.naturalness.reviews[0])).toBe(before);
    expect(validateBaseRelease(baseReleaseInput).valid).toBe(true);
  });
});

describe("validateBaseRelease — the real release", () => {
  const result = validateBaseRelease(buildBaseReleaseInput());

  it("is valid with zero errors", () => {
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("measures the exact Base shape: 10 modules and 40 lessons", () => {
    expect(result.report.modules).toBe(10);
    expect(result.report.lessons).toBe(40);
    expect(BASE_MODULE_IDS).toHaveLength(10);
    expect(BASE_LESSON_IDS).toHaveLength(40);
  });

  it("keeps the A1 and A2 identities unchanged (11/44 and 60)", () => {
    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
    expect(A2_LESSON_IDS).toHaveLength(60);
    expect(result.report.a1Modules).toBe(11);
    expect(result.report.a1Lessons).toBe(44);
    expect(result.report.a2Lessons).toBe(60);
  });

  it("keeps the meaningful lexicon within the authored 250 ceiling", () => {
    expect(result.report.lexemes).toBeGreaterThan(0);
    expect(result.report.lexemes).toBeLessThanOrEqual(250);
  });

  it("publishes exactly five progressive references", () => {
    expect(result.report.references).toBe(5);
    expect(BASE_REFERENCE_IDS).toHaveLength(5);
    expect(result.report.referenceEntries).toBeGreaterThan(0);
  });

  it("reports unresolved external-review findings without fabricating acceptance", () => {
    // The naturalness ledger and the human-ear audio sign-off are genuinely
    // still `pending` while external review runs in parallel. That is an
    // *unresolved finding count*, never a fabricated pass and never a hard
    // error — only a stale (content-changed-after-review) entry is an error.
    expect(result.report.unresolvedFindings).toBeGreaterThan(0);
    expect(result.report.reviewedAudio).toBe(
      result.report.audioReviews - result.report.pendingAudioReviews,
    );
    expect(result.valid).toBe(true);
  });

  it("collects every error additively rather than stopping at the first", () => {
    const doubly = changeReviewedJapanese(changeReviewedAudioHash(baseReleaseInput));
    const codes = new Set(validateBaseRelease(doubly).errors.map(({ code }) => code));
    expect(codes).toEqual(new Set(["audio-review-stale", "naturalness-review-stale"]));
  });
});

describe("buildBaseReleaseInput", () => {
  it("produces a deep-cloneable snapshot equal to the published fixture", () => {
    const built: BaseReleaseInput = buildBaseReleaseInput();
    expect(built.manifest.lessonIds).toEqual([...BASE_LESSON_IDS]);
    expect(cloneBaseReleaseInput(built).manifest.lessonIds).toEqual([
      ...BASE_LESSON_IDS,
    ]);
    expect(built.lessons).toHaveLength(40);
  });
});
