/**
 * `transformation` shipped as dead code for all of Phases 0-3: implemented,
 * localized (buildLessonViewModel.ts:207-210), and generated zero times,
 * because no lesson contained an eligible source/target pair. This test
 * keeps at least one in the catalogue.
 *
 * Margin warning: the catalogue currently yields exactly one transformation
 * (`health-advice-1-t4`, sourced from its tense twin `health-advice-1-m9`),
 * so the first assertion has no headroom. If a content or seed change drops
 * it to zero, the fix is to author another twin — never to weaken or delete
 * this test, which would restore the dead-code state the twins exist to end.
 *
 * When authoring that twin, pick a family whose realization rule actually
 * conjugates (`rule-preference`, `rule-description`, `rule-object-action`).
 * Families realized by `rule-invariant-utterance` or `rule-invariant-object`
 * emit their predicate value's baked fragments verbatim, so flipping tense or
 * polarity on one yields byte-identical Japanese under a form label that now
 * lies about it — a pair that satisfies `transformationAxis` while asking the
 * learner to transform a sentence into itself. `permittedAxes` does not
 * protect you here: `a2-family-experience-takoto` lists `polarity-tense-form`
 * yet is still invariant.
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
