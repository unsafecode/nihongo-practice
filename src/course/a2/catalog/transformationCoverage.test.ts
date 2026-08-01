/**
 * `transformation` shipped as dead code for all of Phases 0-3: implemented,
 * localized (buildLessonViewModel.ts:207-210), and generated zero times,
 * because no lesson contained an eligible source/target pair. This test
 * keeps at least one in the catalogue.
 */
import { describe, expect, it } from "vitest";

import { a2FoundationCatalogs } from "./catalog";
import { buildA2FoundationViewModel } from "../view/buildA2LessonViewModel";

describe("transformation coverage", () => {
  it("generates at least one transformation exercise somewhere at A2", () => {
    const kinds = a2FoundationCatalogs.lessons.flatMap((lesson) => {
      const result = buildA2FoundationViewModel(lesson.id, "en");
      if (!result.ok) throw new Error(`A2 lesson ${lesson.id} failed: ${result.error.code}`);
      return [...result.model.rounds].flatMap((round) => round.targets.map((target) => target.exerciseKind));
    });
    expect(kinds.filter((kind) => kind === "transformation").length).toBeGreaterThanOrEqual(1);
  });

  it("gives every transformation exercise a real source variant", () => {
    const orphans = a2FoundationCatalogs.lessons.flatMap((lesson) => {
      const result = buildA2FoundationViewModel(lesson.id, "en");
      if (!result.ok) throw new Error(`A2 lesson ${lesson.id} failed: ${result.error.code}`);
      return [...result.model.rounds].flatMap((round) =>
        round.targets
          .filter((target) => target.exerciseKind === "transformation" && !target.sourceVariantId)
          .map((target) => `${lesson.id}::${target.variantId}`),
      );
    });
    expect(orphans).toEqual([]);
  });
});
