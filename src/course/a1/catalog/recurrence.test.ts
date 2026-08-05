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
import {
  a1CanonicalContexts,
  a1CanonicalLearningTargetSenses,
  a1CanonicalPersonRoles,
  a1CanonicalReferents,
  a1CanonicalSemanticValues,
  a1CanonicalSentenceFamilies,
} from "./a1SemanticCatalog";
import {
  assertNoStaleLaterUseKeys,
  a1ReleaseVerbUseRecords,
  a1StagedFoundationsArea01to02VerbUseRecords,
} from "./recurrence";
import { a1StagedFoundationsArea03to04VerbUseRecords } from "./foundationsRecurrence03to04";
import {
  a1SemanticBuiltLessons,
  a1SemanticFoundationCatalogs,
} from "./catalog";
import { realizeVariant, type RealizeVariantCatalogs } from "../../foundations/realizeFamily";
import { a1AllStagedFoundationsBuiltLessons } from "../curriculum/foundationsArea03to04";
import { A1_EXPANDED_CANONICAL_POSITIONS } from "../manifest";

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

  describe("staged Foundations recurrence", () => {
    it("keeps the new copula timeline separate from the published recurrence view", () => {
      expect(a1StagedFoundationsArea01to02VerbUseRecords).toEqual([
        expect.objectContaining({
          senseId: "a1-sense-be",
          introductionLessonId: "sentence-foundations-1",
          laterUses: [
            {
              lessonId: "sentence-foundations-3",
              variantId: "sentence-foundations-3-m2",
            },
            {
              lessonId: "topic-questions-1",
              variantId: "topic-questions-1-m1",
            },
          ],
        }),
      ]);
      expect(
        a1ReleaseVerbUseRecords.some((record) =>
          record.introductionLessonId.startsWith("sentence-foundations-"),
        ),
      ).toBe(false);
    });

    it("keeps final-module records staged, spaced, and tied to variants that realize the cited sense", () => {
      const allBuilt = [
        ...a1AllStagedFoundationsBuiltLessons,
        ...a1SemanticBuiltLessons,
      ];
      const variantById = new Map(
        allBuilt.flatMap(({ variants }) => variants).map((variant) => [variant.id, variant]),
      );
      const familyById = new Map(
        a1CanonicalSentenceFamilies.map((family) => [family.id, family]),
      );
      const catalogs: RealizeVariantCatalogs = {
        contexts: a1CanonicalContexts,
        personRoles: a1CanonicalPersonRoles,
        referents: a1CanonicalReferents,
        semanticValues: a1CanonicalSemanticValues,
        learningTargetSenses: a1CanonicalLearningTargetSenses,
      };

      expect(
        a1ReleaseVerbUseRecords.some((record) =>
          record.introductionLessonId.startsWith("polite-verbs-") ||
          record.introductionLessonId.startsWith("time-movement-"),
        ),
      ).toBe(false);

      for (const record of a1StagedFoundationsArea03to04VerbUseRecords) {
        const introductionPosition =
          A1_EXPANDED_CANONICAL_POSITIONS[record.introductionLessonId];
        expect(introductionPosition, record.senseId).toBeDefined();
        expect(record.laterUses.length, record.senseId).toBeGreaterThanOrEqual(2);
        let hasLaterModuleUse = false;

        for (const use of record.laterUses) {
          const variant = variantById.get(use.variantId);
          const family = variant
            ? familyById.get(variant.sentenceFamilyId)
            : undefined;
          expect(variant, `${record.senseId}:${use.variantId}`).toBeDefined();
          expect(family, `${record.senseId}:${use.variantId}`).toBeDefined();
          const laterPosition = A1_EXPANDED_CANONICAL_POSITIONS[use.lessonId];
          expect(laterPosition, `${record.senseId}:${use.lessonId}`).toBeDefined();
          expect(laterPosition - introductionPosition).toBeGreaterThanOrEqual(2);
          if (
            use.lessonId.split("-").slice(0, -1).join("-") !==
            record.introductionLessonId.split("-").slice(0, -1).join("-")
          ) {
            hasLaterModuleUse = true;
          }

          if (!variant || !family) continue;
          const realized = realizeVariant(family, variant, catalogs, {
            availableConceptIds: family.requiredConceptIds,
          });
          expect(realized.ok, `${record.senseId}:${use.variantId}`).toBe(true);
          if (realized.ok) {
            expect(realized.sentence.usedLexemeSenseIds).toContain(record.senseId);
          }
        }
        expect(hasLaterModuleUse, record.senseId).toBe(true);
      }
    });
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
