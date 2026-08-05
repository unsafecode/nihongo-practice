import { describe, expect, it } from "vitest";
import { emptyProgress, recordExerciseMistake } from "../progress/progress";
import type { CourseProgressV3, ExerciseEvidence, ReviewQueueEntry } from "../progress/progress";
import { reviewKeyFor } from "../progress/reviewQueue";
import { getLessonExercises } from "./lessonExerciseModel";
import { buildReviewQueueView } from "./reviewQueueModel";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";
import { a1LessonContentById } from "../a1/curriculum/catalog";
import { courseModulesByLevel } from "../data/course";
import { validateReviewRetrievalPair } from "../a1/curriculum/validateA1Curriculum";

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

const a1ChoiceExercise = (() => {
  for (const lesson of a1FoundationCatalogs.lessons) {
    const exercise = getLessonExercises(lesson.id)?.exercises.find(
      (candidate) => candidate.prompt.kind === "choice",
    );
    if (exercise !== undefined) {
      return {
        lessonId: lesson.id,
        moduleId: lesson.moduleId,
        definitionId: exercise.definitionId,
      };
    }
  }
  throw new Error("no A1 choice exercise");
})();
/** A real exercise definition id from past-negative-1's own A1 practice set. */
const pastNegativeExerciseId = getLessonExercises("past-negative-1")!.exercises[0]!.definitionId;

function evidence(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ExerciseEvidence {
  const exercise = getLessonExercises(lessonId)?.exercises.find(
    (candidate) => candidate.definitionId === exerciseDefinitionId,
  );
  if (!exercise) throw new Error(`fixture assumption failed: ${lessonId}:${exerciseDefinitionId}`);
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds: requiredExerciseIds(lessonId),
    targetConceptIds: [...exercise.prompt.assessedConceptIds],
    targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
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
      withMistakes([
        a1ChoiceExercise.lessonId,
        a1ChoiceExercise.definitionId,
        "2026-01-01T00:00:00.000Z",
      ]),
    );
    expect(view.items).toHaveLength(1);
    const [item] = view.items;
    expect(item.lessonId).toBe(a1ChoiceExercise.lessonId);
    expect(item.moduleId).toBe(a1ChoiceExercise.moduleId);
    expect(item.sourceExerciseDefinitionId).toBe(a1ChoiceExercise.definitionId);
    expect(item.exerciseDefinitionId).not.toBe(a1ChoiceExercise.definitionId);
    expect(item.practiceFunction).not.toBeNull();
    expect(item.mistakeCount).toBe(1);
  });

  it("orders items most-recent-first with stable review-key tie-breaking", () => {
    const view = buildReviewQueueView(
      withMistakes(
        [
          a1ChoiceExercise.lessonId,
          a1ChoiceExercise.definitionId,
          "2026-01-01T00:00:00.000Z",
        ],
        ["past-negative-1", pastNegativeExerciseId, "2026-01-02T00:00:00.000Z"],
      ),
    );
    expect(view.items.map((i) => i.sourceExerciseDefinitionId)).toEqual([
      pastNegativeExerciseId,
      a1ChoiceExercise.definitionId,
    ]);
  });

  function reviewEntryFor(
    lessonId: string,
    exerciseDefinitionId: string,
    at = "2026-01-01T00:00:00.000Z",
  ): ReviewQueueEntry {
    const exercise = getLessonExercises(lessonId)?.exercises.find(
      (candidate) => candidate.definitionId === exerciseDefinitionId,
    );
    if (!exercise) throw new Error(`fixture assumption failed: ${lessonId}:${exerciseDefinitionId}`);
    return {
      reviewKey: reviewKeyFor(lessonId, exerciseDefinitionId),
      lessonId,
      exerciseDefinitionId,
      targetConceptIds: [...exercise.prompt.assessedConceptIds],
      targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
      mistakeCount: 1,
      lastMistakeAt: at,
    };
  }

  function assessedIds(entry: ReviewQueueEntry): readonly string[] {
    return [...entry.targetConceptIds, ...entry.targetLexemeIds];
  }

  function legacyReviewEntryFor(
    lessonId: string,
    exerciseDefinitionId: string,
  ): ReviewQueueEntry {
    const source = getLessonExercises(lessonId)?.exercises.find(
      (exercise) => exercise.definitionId === exerciseDefinitionId,
    );
    const content = a1LessonContentById[lessonId];
    if (!source || !content) {
      throw new Error(`fixture assumption failed: ${lessonId}:${exerciseDefinitionId}`);
    }
    const legacyPhonetic = lessonId.startsWith("sounds-");
    return {
      ...reviewEntryFor(lessonId, exerciseDefinitionId),
      targetConceptIds: legacyPhonetic
        ? []
        : source.prompt.assessedConceptIds.filter(
            (id) => id !== content.learningNoteId,
          ),
      targetLexemeIds: legacyPhonetic
        ? []
        : [...source.prompt.assessedLexemeIds],
    };
  }

  describe("buildReviewQueueView — varied A1 retrieval", () => {
    it("replaces a failed A1 meaning choice with a different, overlapping retrieval task", () => {
      const source = getLessonExercises("sounds-1")!.exercises.find(
        (exercise) =>
          exercise.practiceFunction === "meaning-comprehension" &&
          exercise.prompt.kind === "choice",
      )!;
      const entry = reviewEntryFor("sounds-1", source.definitionId);

      const view = buildReviewQueueView({ reviewQueue: [entry], orphanedReviewKeys: [] }, "a1");
      expect(view.unresolvableKeys).toEqual([]);
      expect(view.items).toHaveLength(1);
      const [item] = view.items;
      expect(item.sourceExerciseDefinitionId).toBe(source.definitionId);
      expect(item.exerciseDefinitionId).not.toBe(source.definitionId);
      expect(item.practiceFunction).not.toBeNull();
      expect(item.practiceFunction).not.toBe(source.practiceFunction);
      expect(item.visibleTargetKey).not.toBe(source.visibleTargetKey);
      expect(
        validateReviewRetrievalPair(
          {
            id: source.definitionId,
            function: source.practiceFunction!,
            visibleTargetKey: source.visibleTargetKey,
            assessedIds: assessedIds(entry),
          },
          {
            id: item.exerciseDefinitionId,
            function: item.practiceFunction!,
            visibleTargetKey: item.visibleTargetKey,
            assessedIds: [
              ...item.prompt.assessedConceptIds,
              ...item.prompt.assessedLexemeIds,
            ],
          },
        ),
      ).toBeUndefined();
    });

    it("finds a safe generated alternate for every semantic and phonetic A1 source", () => {
      const lessonIds = courseModulesByLevel.a1.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id),
      );
      expect(lessonIds).toHaveLength(64);
      expect(lessonIds.filter((lessonId) => lessonId.startsWith("sounds-"))).toHaveLength(4);
      expect(lessonIds.filter((lessonId) => !lessonId.startsWith("sounds-"))).toHaveLength(60);

      for (const lessonId of lessonIds) {
        const exercises = getLessonExercises(lessonId)!.exercises;
        expect(exercises, lessonId).toHaveLength(4);
        for (const source of exercises) {
          const entry = reviewEntryFor(lessonId, source.definitionId);
          const view = buildReviewQueueView(
            { reviewQueue: [entry], orphanedReviewKeys: [] },
            "a1",
          );
          expect(view.unresolvableKeys, `${lessonId}:${source.definitionId}`).toEqual([]);
          expect(view.items, `${lessonId}:${source.definitionId}`).toHaveLength(1);
          const [alternate] = view.items;
          expect(alternate.sourceExerciseDefinitionId).toBe(source.definitionId);
          expect(alternate.exerciseDefinitionId).not.toBe(source.definitionId);
          expect(alternate.practiceFunction).not.toBeNull();
          expect(alternate.practiceFunction).not.toBe(source.practiceFunction);
          expect(alternate.visibleTargetKey).not.toBe(source.visibleTargetKey);
          expect(
            [...alternate.prompt.assessedConceptIds, ...alternate.prompt.assessedLexemeIds].some(
              (id) => assessedIds(entry).includes(id),
            ),
          ).toBe(true);
        }
      }
    });

    it("finds safe alternates for all 256 legacy-shaped A1 entries without rewriting stored evidence", () => {
      const lessonIds = courseModulesByLevel.a1.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id),
      );
      const sources = lessonIds.flatMap((lessonId) =>
        getLessonExercises(lessonId)!.exercises.map((exercise) => ({
          lessonId,
          exercise,
        })),
      );
      expect(sources).toHaveLength(256);

      for (const { lessonId, exercise: source } of sources) {
        const content = a1LessonContentById[lessonId]!;
        const entry = legacyReviewEntryFor(lessonId, source.definitionId);
        const view = buildReviewQueueView(
          { reviewQueue: [entry], orphanedReviewKeys: [] },
          "a1",
        );

        expect(view.unresolvableKeys, `${lessonId}:${source.definitionId}`).toEqual([]);
        expect(view.items, `${lessonId}:${source.definitionId}`).toHaveLength(1);
        const [alternate] = view.items;
        expect(alternate.sourceExerciseDefinitionId).toBe(source.definitionId);
        expect(alternate.exerciseDefinitionId).not.toBe(source.definitionId);
        expect(alternate.practiceFunction).not.toBe(source.practiceFunction);
        expect(alternate.visibleTargetKey).not.toBe(source.visibleTargetKey);
        // Retrieval normalization is transient; the review item keeps exactly
        // what the learner's stored attempt originally recorded.
        expect(alternate.targetConceptIds).toEqual(entry.targetConceptIds);
        expect(alternate.targetLexemeIds).toEqual(entry.targetLexemeIds);

        const normalizedSourceIds = new Set([
          ...assessedIds(entry),
          ...source.prompt.assessedConceptIds,
          ...source.prompt.assessedLexemeIds,
          content.learningNoteId,
        ]);
        const alternateIds = [
          ...alternate.prompt.assessedConceptIds,
          ...alternate.prompt.assessedLexemeIds,
        ];
        const normalizedSource = {
          id: source.definitionId,
          function: source.practiceFunction!,
          visibleTargetKey: source.visibleTargetKey,
          assessedIds: [...normalizedSourceIds],
        };
        expect(
          validateReviewRetrievalPair(
            normalizedSource,
            {
              id: alternate.exerciseDefinitionId,
              function: alternate.practiceFunction!,
              visibleTargetKey: alternate.visibleTargetKey,
              assessedIds: alternateIds,
            },
          ),
          `${lessonId}:${source.definitionId}`,
        ).toBeUndefined();

        if (lessonId.startsWith("sounds-")) {
          expect(entry.targetConceptIds, `${lessonId}:${source.definitionId}`).toEqual([]);
          expect(entry.targetLexemeIds, `${lessonId}:${source.definitionId}`).toEqual([]);
          expect(alternate.prompt.assessedConceptIds).toContain(content.learningNoteId);
          continue;
        }

        const genuineSourceIds = [
          ...source.prompt.assessedConceptIds.filter(
            (id) => id !== content.learningNoteId,
          ),
          ...source.prompt.assessedLexemeIds,
        ];
        const exercises = getLessonExercises(lessonId)!.exercises;
        const genuineSafeAlternateExists = exercises.some((candidate) => {
          if (
            candidate.definitionId === source.definitionId ||
            candidate.practiceFunction === source.practiceFunction
          ) {
            return false;
          }
          const candidateIds = [
            ...candidate.prompt.assessedConceptIds,
            ...candidate.prompt.assessedLexemeIds,
          ];
          return (
            candidate.visibleTargetKey !== source.visibleTargetKey &&
            candidateIds.some((id) => genuineSourceIds.includes(id)) &&
            validateReviewRetrievalPair(
              normalizedSource,
              {
                id: candidate.definitionId,
                function: candidate.practiceFunction!,
                visibleTargetKey: candidate.visibleTargetKey,
                assessedIds: candidateIds,
              },
            ) === undefined
          );
        });
        if (genuineSafeAlternateExists) {
          expect(
            alternateIds.some((id) => genuineSourceIds.includes(id)),
            `${lessonId}:${source.definitionId}`,
          ).toBe(true);
        }
      }
    });

    it("keeps a legacy-shaped entry unresolvable when its original no longer exists", () => {
      const entry: ReviewQueueEntry = {
        reviewKey: "sounds-1:retired-exercise",
        lessonId: "sounds-1",
        exerciseDefinitionId: "retired-exercise",
        targetConceptIds: [],
        targetLexemeIds: [],
        mistakeCount: 1,
        lastMistakeAt: "2026-01-01T00:00:00.000Z",
      };

      const view = buildReviewQueueView(
        { reviewQueue: [entry], orphanedReviewKeys: [] },
        "a1",
      );

      expect(view.items).toEqual([]);
      expect(view.unresolvableKeys).toEqual([entry.reviewKey]);
    });

    it("chooses the same alternates for repeated calls and reordered stored entries", () => {
      const entries = [
        reviewEntryFor("sounds-1", getLessonExercises("sounds-1")!.exercises[0]!.definitionId),
        reviewEntryFor("introductions-1", getLessonExercises("introductions-1")!.exercises[0]!.definitionId),
      ];
      const source = { reviewQueue: entries, orphanedReviewKeys: [] };
      const reordered = { reviewQueue: [...entries].reverse(), orphanedReviewKeys: [] };

      expect(buildReviewQueueView(source, "a1")).toEqual(buildReviewQueueView(source, "a1"));
      expect(buildReviewQueueView(source, "a1")).toEqual(buildReviewQueueView(reordered, "a1"));
    });

    it("re-derives current source metadata when a known A1 entry has stale stored assessments", () => {
      const source = getLessonExercises("sounds-1")!.exercises[0]!;
      const entry: ReviewQueueEntry = {
        ...reviewEntryFor("sounds-1", source.definitionId),
        targetConceptIds: ["not-a-stored-assessment"],
        targetLexemeIds: [],
      };

      const view = buildReviewQueueView({ reviewQueue: [entry], orphanedReviewKeys: [] }, "a1");

      expect(view.unresolvableKeys).toEqual([]);
      expect(view.items).toHaveLength(1);
      const [alternate] = view.items;
      expect(alternate.exerciseDefinitionId).not.toBe(source.definitionId);
      expect(alternate.practiceFunction).not.toBe(source.practiceFunction);
      expect(alternate.visibleTargetKey).not.toBe(source.visibleTargetKey);
      expect(alternate.targetConceptIds).toEqual(entry.targetConceptIds);
      expect(alternate.targetLexemeIds).toEqual(entry.targetLexemeIds);
    });
  });

  it("de-duplicates repeated mistakes on the same exercise into one item with an incremented count", () => {
    const view = buildReviewQueueView(
      withMistakes(
        [
          a1ChoiceExercise.lessonId,
          a1ChoiceExercise.definitionId,
          "2026-01-01T00:00:00.000Z",
        ],
        [
          a1ChoiceExercise.lessonId,
          a1ChoiceExercise.definitionId,
          "2026-01-03T00:00:00.000Z",
        ],
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
      [
        a1ChoiceExercise.lessonId,
        a1ChoiceExercise.definitionId,
        "2026-01-01T00:00:00.000Z",
      ],
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
    expect(item.sourceExerciseDefinitionId).toBe(a2ExerciseId);
    expect(item.practiceFunction).toBeNull();
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
      [
        a1ChoiceExercise.lessonId,
        a1ChoiceExercise.definitionId,
        "2026-01-01T00:00:00.000Z",
      ],
    );
    expect(JSON.stringify(buildReviewQueueView(progress))).toEqual(
      JSON.stringify(buildReviewQueueView(progress, "a1")),
    );
  });
});
