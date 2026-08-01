import { describe, expect, it } from "vitest";
import { validateFoundations } from "../foundations/validateFoundations";
import {
  a2FoundationCatalogs,
  a2FoundationCopy,
  A2_AVAILABLE_CONTENT_BY_LESSON,
} from "./catalog/catalog";
import {
  A2_RELEASE_CATALOG_VERSION as VALIDATOR_CATALOG_VERSION,
  A2_RELEASE_SEED as VALIDATOR_SEED,
} from "./catalog/validateA2";
import {
  A2_RELEASE_CATALOG_VERSION as REPORTS_CATALOG_VERSION,
  A2_RELEASE_SEED as REPORTS_SEED,
} from "./catalog/reports";
import {
  A2_RELEASE_CATALOG_VERSION as SHARED_CATALOG_VERSION,
  A2_RELEASE_SEED as SHARED_SEED,
} from "./releaseIdentity";
import { buildA2LessonViewModel } from "./view/buildA2LessonViewModel";

/**
 * Release/report/runtime selection-identity parity gate (Phase 4 Task 2).
 *
 * `selectVariants` ranks every practice candidate by
 * `fnv1a32(catalogVersion|lessonId|roundId|seed|variantId)`, so the release
 * validator, the published coverage reports and the runtime lesson-view
 * builder select the same exercises only if all three are handed the exact
 * same `catalogVersion`/`seed`. Before this task they were handed three
 * different pairs: `"a2-validate-release"`, `"a2-release"` and
 * `"a2-release-v1"`. This suite fails if they ever diverge again, and proves
 * the parity end to end rather than only at the literal level.
 */

const LESSON_IDS = a2FoundationCatalogs.lessons.map((lesson) => lesson.id);

describe("A2 release identity", () => {
  it("exports the exact stable catalog version literal", () => {
    expect(SHARED_CATALOG_VERSION).toBe("a2-release-v1");
  });

  it("exports the exact stable seed literal", () => {
    expect(SHARED_SEED).toBe("a2-release-seed-v1");
  });

  it("keeps both identifiers distinct from each other", () => {
    expect(SHARED_CATALOG_VERSION).not.toBe(SHARED_SEED);
  });

  it("re-exports the one shared module from the validator, never a redeclared literal", () => {
    expect(VALIDATOR_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(VALIDATOR_SEED).toBe(SHARED_SEED);
  });

  it("re-exports the one shared module from the reports builder, never a redeclared literal", () => {
    expect(REPORTS_CATALOG_VERSION).toBe(SHARED_CATALOG_VERSION);
    expect(REPORTS_SEED).toBe(SHARED_SEED);
  });

  it("selects the exact same transfer-round target ids for every one of the 60 lessons", () => {
    const report = validateFoundations({
      catalogs: a2FoundationCatalogs,
      foundationCopy: a2FoundationCopy,
      catalogVersion: SHARED_CATALOG_VERSION,
      seed: SHARED_SEED,
      availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
    });
    expect(report.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of LESSON_IDS) {
      const runtime = buildA2LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeIds = [
        ...new Set(
          runtime.model.foundation.rounds
            .filter((round) => round.purpose === "transfer")
            .flatMap((round) =>
              round.targets.map((target) => target.sourceVariantId ?? target.variantId),
            ),
        ),
      ].sort();
      const validatedIds = [
        ...(report.reports.byLesson[lessonId]?.transferTargetIds ?? []),
      ].sort();

      if (
        runtimeIds.length !== validatedIds.length ||
        runtimeIds.some((id, index) => id !== validatedIds[index])
      ) {
        mismatches.push(
          `${lessonId}: runtime=[${runtimeIds.join(",")}] validated=[${validatedIds.join(",")}]`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("selects the exact same visible-target distribution for every one of the 60 lessons", () => {
    const report = validateFoundations({
      catalogs: a2FoundationCatalogs,
      foundationCopy: a2FoundationCopy,
      catalogVersion: SHARED_CATALOG_VERSION,
      seed: SHARED_SEED,
      availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
    });
    expect(report.valid).toBe(true);

    const mismatches: string[] = [];
    for (const lessonId of LESSON_IDS) {
      const runtime = buildA2LessonViewModel(lessonId, "en");
      expect(runtime.ok, lessonId).toBe(true);
      if (!runtime.ok) continue;

      const runtimeCounts: Record<string, number> = {};
      for (const round of runtime.model.foundation.rounds) {
        for (const target of round.targets) {
          runtimeCounts[target.visibleTargetKey] =
            (runtimeCounts[target.visibleTargetKey] ?? 0) + 1;
        }
      }
      const validatedCounts =
        report.reports.byLesson[lessonId]?.visibleTargetCounts ?? {};

      const runtimeKeys = Object.keys(runtimeCounts).sort();
      const validatedKeys = Object.keys(validatedCounts).sort();
      const sameKeys =
        runtimeKeys.length === validatedKeys.length &&
        runtimeKeys.every((key, index) => key === validatedKeys[index]);
      const sameCounts = runtimeKeys.every(
        (key) => runtimeCounts[key] === validatedCounts[key],
      );

      if (!sameKeys || !sameCounts) {
        mismatches.push(
          `${lessonId}: runtime=${JSON.stringify(runtimeCounts)} validated=${JSON.stringify(validatedCounts)}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});
