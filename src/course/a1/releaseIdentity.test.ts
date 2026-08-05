import { describe, expect, it } from "vitest";
import { validateA1 } from "./catalog/validateA1";
import { a1FoundationCatalogs } from "./catalog/catalog";
import {
  A1_RELEASE_CATALOG_VERSION as VALIDATOR_CATALOG_VERSION,
  A1_RELEASE_SEED as VALIDATOR_SEED,
} from "./catalog/validateA1";
import {
  A1_RELEASE_CATALOG_VERSION as RUNTIME_CATALOG_VERSION,
  A1_RELEASE_SEED as RUNTIME_SEED,
  buildA1LessonViewModel,
} from "./a1LessonViewModel";
import {
  A1_RELEASE_CATALOG_VERSION as SHARED_CATALOG_VERSION,
  A1_RELEASE_SEED as SHARED_SEED,
} from "./releaseIdentity";

/**
 * Release/runtime selection-identity parity gate (Phase 2 §M1).
 *
 * `selectVariants` ranks every practice candidate by
 * `fnv1a32(catalogVersion|lessonId|roundId|seed|variantId)` (see
 * `../foundations/selectVariants.ts`), so the release validator
 * (`catalog/validateA1.ts`, which wraps `validateFoundations` with its own
 * fixed `catalogVersion`/`seed`) and the runtime lesson-view builder
 * (`a1LessonViewModel.ts`, which feeds the very same `selectVariants` through
 * `buildLessonViewModel`) can only be guaranteed to select the same target
 * ids for a given lesson if they are handed *exactly* the same
 * `catalogVersion` and `seed`. Before Phase 2 §M1, they were not: the
 * validator used `"a1-release"` / `"seed-a1-release"` while the runtime
 * builder used `"a1-release-v1"` / `"a1-release-seed-v1"` — two same-named,
 * differently valued constant pairs. This suite proves the two call sites now
 * share one identity (`./releaseIdentity`), and that this parity actually
 * produces identical selected target ids end to end, not just identical
 * literals.
 */

/** The 60 semantic (non-phonetic) lesson ids both builders resolve. */
const SEMANTIC_LESSON_IDS = a1FoundationCatalogs.lessons.map(
  (lesson) => lesson.id,
);

describe("A1 release/runtime selection identity", () => {
  it("pins the rebuilt exercise catalog to release v2 while keeping its fixed seed explicit", () => {
    expect(SHARED_CATALOG_VERSION).toBe("a1-release-v2");
    expect(SHARED_SEED).toBe("a1-release-seed-v1");
  });

  it("shares the exact same catalogVersion string between the validator and the runtime builder", () => {
    expect(VALIDATOR_CATALOG_VERSION).toBe(RUNTIME_CATALOG_VERSION);
  });

  it("shares the exact same seed string between the validator and the runtime builder", () => {
    expect(VALIDATOR_SEED).toBe(RUNTIME_SEED);
  });

  it("re-exports the one shared `./releaseIdentity` module from both call sites, never a redeclared literal", () => {
    expect(VALIDATOR_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(RUNTIME_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(VALIDATOR_SEED).toBe(SHARED_SEED);
    expect(RUNTIME_SEED).toBe(SHARED_SEED);
  });

  it("selects the exact same transfer-round target ids for every one of the 60 semantic lessons", () => {
    const releaseResult = validateA1();
    expect(releaseResult.foundationReport.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of SEMANTIC_LESSON_IDS) {
      const runtime = buildA1LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeTransferIds = [
        ...new Set(
          runtime.model.rounds
            .filter((round) => round.purpose === "transfer")
            .flatMap((round) =>
              round.targets.map(
                (target) => target.sourceVariantId ?? target.variantId,
              ),
            ),
        ),
      ].sort();

      const validatedTransferIds = [
        ...(releaseResult.foundationReport.reports.byLesson[lessonId]
          ?.transferTargetIds ?? []),
      ].sort();

      if (
        runtimeTransferIds.length !== validatedTransferIds.length ||
        runtimeTransferIds.some((id, index) => id !== validatedTransferIds[index])
      ) {
        mismatches.push(
          `${lessonId}: runtime=[${runtimeTransferIds.join(",")}] validated=[${validatedTransferIds.join(",")}]`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("selects the exact same combined round-one + round-two visible-target distribution for every one of the 60 semantic lessons", () => {
    // Round one (guided-controlled) has more eligible candidates than it
    // selects, so — unlike the always-fully-selected transfer round — its
    // chosen subset genuinely depends on the `fnv1a32` ranking, which is a
    // function of `catalogVersion`/`seed`. `visibleTargetKey` (exposed by
    // both `FoundationRoundTarget` and the foundation report row) is the
    // catalog-neutral fingerprint `checkSelectionAndExercises` already uses
    // to police reuse, so comparing its per-lesson distribution here proves
    // the validator's internal selection and the runtime's shipped selection
    // are the same selection, not merely built from equal-looking constants.
    const releaseResult = validateA1();
    expect(releaseResult.foundationReport.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of SEMANTIC_LESSON_IDS) {
      const runtime = buildA1LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeVisibleCounts: Record<string, number> = {};
      for (const round of runtime.model.rounds) {
        for (const target of round.targets) {
          runtimeVisibleCounts[target.visibleTargetKey] =
            (runtimeVisibleCounts[target.visibleTargetKey] ?? 0) + 1;
        }
      }

      const validatedVisibleCounts =
        releaseResult.foundationReport.reports.byLesson[lessonId]
          ?.visibleTargetCounts ?? {};

      const runtimeKeys = Object.keys(runtimeVisibleCounts).sort();
      const validatedKeys = Object.keys(validatedVisibleCounts).sort();
      const sameKeys =
        runtimeKeys.length === validatedKeys.length &&
        runtimeKeys.every((key, index) => key === validatedKeys[index]);
      const sameCounts = runtimeKeys.every(
        (key) => runtimeVisibleCounts[key] === validatedVisibleCounts[key],
      );

      if (!sameKeys || !sameCounts) {
        mismatches.push(
          `${lessonId}: runtime=${JSON.stringify(runtimeVisibleCounts)} validated=${JSON.stringify(validatedVisibleCounts)}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});
