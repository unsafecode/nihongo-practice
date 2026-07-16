import { describe, expect, it } from "vitest";
import { emptyProgress, recordExerciseMistake } from "../progress/progress";
import type { CourseProgressV3, ExerciseEvidence } from "../progress/progress";
import { exerciseIdsByLesson } from "../catalog/exercises";
import { buildReviewQueueView } from "./reviewQueueModel";

/**
 * The pure `Da ripassare` review-queue view-model (Slice C plan Task 4 step 4;
 * design spec §10.4). It resolves the stored, ordered, de-duplicated review
 * queue into renderable items — each with its lesson, module (for a deep link),
 * and the regenerated engine prompt — plus explicit orphan/unresolvable buckets,
 * without ever reconstructing an answer in the component layer.
 */

function evidence(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ExerciseEvidence {
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds: exerciseIdsByLesson.get(lessonId) ?? [exerciseDefinitionId],
    targetConceptIds: ["topic-wa"],
    targetLexemeIds: [],
    at,
  };
}

function withMistakes(
  ...mistakes: readonly (readonly [string, string, string])[]
): CourseProgressV3 {
  let progress = emptyProgress();
  for (const [lessonId, exerciseId, at] of mistakes) {
    progress = recordExerciseMistake(progress, evidence(lessonId, exerciseId, at));
  }
  return progress;
}

describe("buildReviewQueueView — empty and populated", () => {
  it("is empty for fresh progress", () => {
    const view = buildReviewQueueView(emptyProgress());
    expect(view.items).toEqual([]);
    expect(view.orphanedKeys).toEqual([]);
    expect(view.unresolvableKeys).toEqual([]);
  });

  it("resolves each stored mistake to a lesson, module, and engine prompt", () => {
    const view = buildReviewQueueView(
      withMistakes(["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"]),
    );
    expect(view.items).toHaveLength(1);
    const [item] = view.items;
    expect(item.lessonId).toBe("introductions-1");
    expect(item.moduleId).toBe("introductions");
    expect(item.exerciseDefinitionId).toBe("introductions-1-particle-base");
    expect(item.prompt.kind).toBe("choice");
    expect(item.mistakeCount).toBe(1);
  });

  it("orders items most-recent-first with stable review-key tie-breaking", () => {
    const view = buildReviewQueueView(
      withMistakes(
        ["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"],
        ["past-negative-1", "past-negative-1-transform-base", "2026-01-02T00:00:00.000Z"],
      ),
    );
    expect(view.items.map((i) => i.exerciseDefinitionId)).toEqual([
      "past-negative-1-transform-base",
      "introductions-1-particle-base",
    ]);
  });

  it("de-duplicates repeated mistakes on the same exercise into one item with an incremented count", () => {
    const view = buildReviewQueueView(
      withMistakes(
        ["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"],
        ["introductions-1", "introductions-1-particle-base", "2026-01-03T00:00:00.000Z"],
      ),
    );
    expect(view.items).toHaveLength(1);
    expect(view.items[0].mistakeCount).toBe(2);
  });
});

describe("buildReviewQueueView — orphan and unresolvable buckets", () => {
  it("surfaces preserved orphaned review keys without dropping them", () => {
    const base = emptyProgress();
    const progress: CourseProgressV3 = {
      ...base,
      orphanedReviewKeys: ["retired-lesson:retired-exercise"],
    };
    const view = buildReviewQueueView(progress);
    expect(view.items).toEqual([]);
    expect(view.orphanedKeys).toEqual(["retired-lesson:retired-exercise"]);
  });

  it("moves an active entry whose exercise no longer generates into unresolvableKeys, not items", () => {
    const base = emptyProgress();
    const progress: CourseProgressV3 = {
      ...base,
      reviewQueue: [
        {
          reviewKey: "introductions-1:introductions-1-ghost",
          lessonId: "introductions-1",
          exerciseDefinitionId: "introductions-1-ghost",
          targetConceptIds: [],
          targetLexemeIds: [],
          mistakeCount: 1,
          lastMistakeAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const view = buildReviewQueueView(progress);
    expect(view.items).toEqual([]);
    expect(view.unresolvableKeys).toEqual(["introductions-1:introductions-1-ghost"]);
  });
});

describe("buildReviewQueueView — determinism", () => {
  it("produces structurally identical output for identical input", () => {
    const progress = withMistakes(
      ["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"],
      ["past-negative-1", "past-negative-1-transform-base", "2026-01-02T00:00:00.000Z"],
    );
    expect(JSON.stringify(buildReviewQueueView(progress))).toEqual(
      JSON.stringify(buildReviewQueueView(progress)),
    );
  });
});
