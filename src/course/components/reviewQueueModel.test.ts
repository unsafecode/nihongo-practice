import { describe, expect, it } from "vitest";
import { emptyProgress, recordExerciseMistake } from "../progress/progress";
import type { CourseProgressV3, ExerciseEvidence, ReviewQueueEntry } from "../progress/progress";
import { reviewKeyFor } from "../progress/reviewQueue";
import { getLessonExercises } from "./lessonExerciseModel";
import { buildReviewQueueView } from "./reviewQueueModel";

/**
 * The pure `Da ripassare` review-queue view-model (Slice C plan Task 4 step 4;
 * design spec §10.4). It resolves the stored, ordered, de-duplicated review
 * queue into renderable items — each with its lesson, module (for a deep link),
 * and the regenerated engine prompt — plus explicit orphan/unresolvable buckets,
 * without ever reconstructing an answer in the component layer.
 */

function requiredExerciseIds(lessonId: string): readonly string[] {
  return getLessonExercises(lessonId)?.exercises.map((e) => e.definitionId) ?? [];
}

/** A real choice-kind exercise definition id from introductions-1's own A1 practice set. */
const introductionsChoiceId = getLessonExercises("introductions-1")!.exercises.find(
  (e) => e.prompt.kind === "choice",
)!.definitionId;
/** A real exercise definition id from past-negative-1's own A1 practice set. */
const pastNegativeExerciseId = getLessonExercises("past-negative-1")!.exercises[0]!.definitionId;

function evidence(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ExerciseEvidence {
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds: requiredExerciseIds(lessonId),
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
      withMistakes(["introductions-1", introductionsChoiceId, "2026-01-01T00:00:00.000Z"]),
    );
    expect(view.items).toHaveLength(1);
    const [item] = view.items;
    expect(item.lessonId).toBe("introductions-1");
    expect(item.moduleId).toBe("introductions");
    expect(item.exerciseDefinitionId).toBe(introductionsChoiceId);
    expect(item.prompt.kind).toBe("choice");
    expect(item.mistakeCount).toBe(1);
  });

  it("orders items most-recent-first with stable review-key tie-breaking", () => {
    const view = buildReviewQueueView(
      withMistakes(
        ["introductions-1", introductionsChoiceId, "2026-01-01T00:00:00.000Z"],
        ["past-negative-1", pastNegativeExerciseId, "2026-01-02T00:00:00.000Z"],
      ),
    );
    expect(view.items.map((i) => i.exerciseDefinitionId)).toEqual([
      pastNegativeExerciseId,
      introductionsChoiceId,
    ]);
  });

  it("de-duplicates repeated mistakes on the same exercise into one item with an incremented count", () => {
    const view = buildReviewQueueView(
      withMistakes(
        ["introductions-1", introductionsChoiceId, "2026-01-01T00:00:00.000Z"],
        ["introductions-1", introductionsChoiceId, "2026-01-03T00:00:00.000Z"],
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
      ["introductions-1", introductionsChoiceId, "2026-01-01T00:00:00.000Z"],
      ["past-negative-1", pastNegativeExerciseId, "2026-01-02T00:00:00.000Z"],
    );
    expect(JSON.stringify(buildReviewQueueView(progress))).toEqual(
      JSON.stringify(buildReviewQueueView(progress)),
    );
  });
});

/** A real A2 exercise definition id from an A2 lesson's own practice set. */
const a2ExerciseId = getLessonExercises("connected-conversation-1")!.exercises[0]!.definitionId;

function a2ReviewEntry(): ReviewQueueEntry {
  return {
    reviewKey: reviewKeyFor("connected-conversation-1", a2ExerciseId),
    lessonId: "connected-conversation-1",
    exerciseDefinitionId: a2ExerciseId,
    targetConceptIds: [],
    targetLexemeIds: [],
    mistakeCount: 1,
    lastMistakeAt: "2026-02-01T00:00:00.000Z",
  };
}

describe("buildReviewQueueView — level-aware A2 resolution (Phase 3 Task 8 spec-fix, BLOCKER 1)", () => {
  it("resolves an A2 review entry against the A2 catalog (module + exercise), given the a2 level", () => {
    const view = buildReviewQueueView(
      { reviewQueue: [a2ReviewEntry()], orphanedReviewKeys: [] },
      "a2",
    );
    expect(view.items).toHaveLength(1);
    const [item] = view.items;
    expect(item.lessonId).toBe("connected-conversation-1");
    // The A2 module id, resolved from the A2 course modules — never A1's.
    expect(item.moduleId).toBe("connected-conversation");
    expect(item.exerciseDefinitionId).toBe(a2ExerciseId);
    expect(item.prompt).toBeTruthy();
    expect(view.unresolvableKeys).toEqual([]);
  });

  it("does NOT resolve an A2 entry when asked for the a1 level — never reads the other level's catalog", () => {
    const view = buildReviewQueueView(
      { reviewQueue: [a2ReviewEntry()], orphanedReviewKeys: [] },
      "a1",
    );
    // The A2 lesson id is unknown to the A1 module map, so it lands in the
    // explicit unresolvable bucket rather than being cross-resolved.
    expect(view.items).toEqual([]);
    expect(view.unresolvableKeys).toEqual([
      reviewKeyFor("connected-conversation-1", a2ExerciseId),
    ]);
  });

  it("defaults to the a1 level (byte-compatible with the existing single-arg call)", () => {
    const progress = withMistakes(
      ["introductions-1", introductionsChoiceId, "2026-01-01T00:00:00.000Z"],
    );
    expect(JSON.stringify(buildReviewQueueView(progress))).toEqual(
      JSON.stringify(buildReviewQueueView(progress, "a1")),
    );
  });
});
