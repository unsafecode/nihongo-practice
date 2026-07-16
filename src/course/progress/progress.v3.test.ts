import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  markLessonVisited,
  parseProgress,
  recordExerciseAcceptance,
  recordExerciseAttempt,
  recordExerciseMistake,
  visitedLessonIds,
  type ExerciseEvidence,
} from "./progress";
import { courseModules } from "../data/course";
import { LEGACY_LESSON_ALIASES } from "../routing/lessonRouteResolution";

const knownLessonIds = new Set(["sounds-core", "sounds-special"]);

const T0 = "2026-07-16T10:00:00.000Z";
const REQUIRED = ["l1-x1", "l1-x2", "l1-x3"] as const;

function evidence(overrides: Partial<ExerciseEvidence> = {}): ExerciseEvidence {
  return {
    lessonId: "l1",
    exerciseDefinitionId: "l1-x1",
    requiredExerciseIds: [...REQUIRED],
    targetConceptIds: ["c-topic"],
    targetLexemeIds: ["w-neko"],
    at: T0,
    ...overrides,
  };
}

/** Accept every required exercise in lesson order, leaving no open review. */
function fullyConsolidated(): ReturnType<typeof recordExerciseAcceptance> {
  let progress = emptyProgress();
  REQUIRED.forEach((id, index) => {
    progress = recordExerciseAcceptance(
      progress,
      evidence({ exerciseDefinitionId: id, at: `2026-07-16T10:0${index}:00.000Z` }),
    );
  });
  return progress;
}

describe("course progress v3 — evidence-based practiced/consolidated transitions", () => {
  it("never marks practiced or consolidated merely by visiting a lesson", () => {
    const visited = markLessonVisited(emptyProgress(), "l1");
    expect(visited.lessons.l1.visitedAt).not.toBeNull();
    expect(visited.lessons.l1.practicedAt).toBeNull();
    expect(visited.lessons.l1.consolidatedAt).toBeNull();
  });

  it("records a non-accepted attempt as review-bound evidence without inventing practiced/consolidated", () => {
    const progress = recordExerciseMistake(emptyProgress(), evidence());
    const lesson = progress.lessons.l1;
    expect(lesson.visitedAt).toBe(T0);
    expect(lesson.attemptedExerciseIds).toEqual(["l1-x1"]);
    expect(lesson.acceptedExerciseIds).toEqual([]);
    expect(lesson.practicedAt).toBeNull();
    expect(lesson.consolidatedAt).toBeNull();
    expect(progress.reviewQueue).toEqual([
      {
        reviewKey: "l1:l1-x1",
        lessonId: "l1",
        exerciseDefinitionId: "l1-x1",
        targetConceptIds: ["c-topic"],
        targetLexemeIds: ["w-neko"],
        mistakeCount: 1,
        lastMistakeAt: T0,
      },
    ]);
  });

  it("sets practicedAt only after every required exercise has a valid attempt", () => {
    let progress = recordExerciseAttempt(emptyProgress(), evidence({ exerciseDefinitionId: "l1-x1" }));
    expect(progress.lessons.l1.practicedAt).toBeNull();
    progress = recordExerciseAttempt(progress, evidence({ exerciseDefinitionId: "l1-x2" }));
    expect(progress.lessons.l1.practicedAt).toBeNull();
    progress = recordExerciseAttempt(
      progress,
      evidence({ exerciseDefinitionId: "l1-x3", at: "2026-07-16T11:00:00.000Z" }),
    );
    expect(progress.lessons.l1.practicedAt).toBe("2026-07-16T11:00:00.000Z");
    expect(progress.lessons.l1.consolidatedAt).toBeNull();
  });

  it("counts an accepted attempt toward practiced and records accepted evidence", () => {
    const progress = recordExerciseAcceptance(emptyProgress(), evidence());
    expect(progress.lessons.l1.attemptedExerciseIds).toEqual(["l1-x1"]);
    expect(progress.lessons.l1.acceptedExerciseIds).toEqual(["l1-x1"]);
  });

  it("consolidates only when practiced and every required exercise is accepted", () => {
    let progress = recordExerciseAcceptance(emptyProgress(), evidence({ exerciseDefinitionId: "l1-x1" }));
    progress = recordExerciseAcceptance(progress, evidence({ exerciseDefinitionId: "l1-x2" }));
    expect(progress.lessons.l1.practicedAt).toBeNull();
    expect(progress.lessons.l1.consolidatedAt).toBeNull();
    progress = recordExerciseAcceptance(
      progress,
      evidence({ exerciseDefinitionId: "l1-x3", at: "2026-07-16T12:00:00.000Z" }),
    );
    expect(progress.lessons.l1.practicedAt).toBe("2026-07-16T12:00:00.000Z");
    expect(progress.lessons.l1.consolidatedAt).toBe("2026-07-16T12:00:00.000Z");
  });

  it("keeps an open review entry blocking consolidation until it is resolved in review mode", () => {
    let progress = recordExerciseMistake(emptyProgress(), evidence({ exerciseDefinitionId: "l1-x1", at: "2026-07-16T10:00:00.000Z" }));
    progress = recordExerciseAcceptance(progress, evidence({ exerciseDefinitionId: "l1-x1", at: "2026-07-16T10:05:00.000Z" }), "lesson");
    progress = recordExerciseAcceptance(progress, evidence({ exerciseDefinitionId: "l1-x2", at: "2026-07-16T10:06:00.000Z" }), "lesson");
    progress = recordExerciseAcceptance(progress, evidence({ exerciseDefinitionId: "l1-x3", at: "2026-07-16T10:07:00.000Z" }), "lesson");
    // Practiced + every required accepted, but a lesson-mode correction never
    // silently clears the review item, so the lesson stays un-consolidated.
    expect(progress.lessons.l1.practicedAt).not.toBeNull();
    expect(progress.lessons.l1.consolidatedAt).toBeNull();
    expect(progress.reviewQueue).toHaveLength(1);

    const resolved = recordExerciseAcceptance(
      progress,
      evidence({ exerciseDefinitionId: "l1-x1", at: "2026-07-16T11:00:00.000Z" }),
      "review",
    );
    expect(resolved.reviewQueue).toEqual([]);
    expect(resolved.lessons.l1.consolidatedAt).toBe("2026-07-16T11:00:00.000Z");
  });

  it("clears consolidatedAt on a new relevant mistake while retaining visited and practiced", () => {
    const consolidated = fullyConsolidated();
    expect(consolidated.lessons.l1.consolidatedAt).not.toBeNull();
    const reopened = recordExerciseMistake(
      consolidated,
      evidence({ exerciseDefinitionId: "l1-x2", at: "2026-07-16T13:00:00.000Z" }),
    );
    expect(reopened.lessons.l1.consolidatedAt).toBeNull();
    expect(reopened.lessons.l1.practicedAt).toBe(consolidated.lessons.l1.practicedAt);
    expect(reopened.lessons.l1.visitedAt).toBe(consolidated.lessons.l1.visitedAt);
    expect(reopened.reviewQueue.map((entry) => entry.reviewKey)).toEqual(["l1:l1-x2"]);
  });

  it("is idempotent for a no-op attempt (same reference, no timestamp churn)", () => {
    const progress = recordExerciseAttempt(emptyProgress(), evidence());
    const again = recordExerciseAttempt(progress, evidence({ at: "2026-07-16T14:00:00.000Z" }));
    expect(again).toBe(progress);
  });

  it("is idempotent for a no-op acceptance on an already-consolidated lesson", () => {
    const consolidated = fullyConsolidated();
    const again = recordExerciseAcceptance(
      consolidated,
      evidence({ exerciseDefinitionId: "l1-x3", at: "2026-07-16T15:00:00.000Z" }),
    );
    expect(again).toBe(consolidated);
  });

  it("deduplicates duplicate retries into one review entry with an incremented count", () => {
    let progress = recordExerciseMistake(emptyProgress(), evidence({ at: "2026-07-16T10:00:00.000Z" }));
    progress = recordExerciseMistake(progress, evidence({ at: "2026-07-16T10:05:00.000Z" }));
    expect(progress.reviewQueue).toHaveLength(1);
    expect(progress.reviewQueue[0]).toMatchObject({ mistakeCount: 2, lastMistakeAt: "2026-07-16T10:05:00.000Z" });
    expect(progress.lessons.l1.attemptedExerciseIds).toEqual(["l1-x1"]);
  });

  it("persists only semantic IDs and evidence — never duplicated answer strings", () => {
    const progress = recordExerciseMistake(emptyProgress(), evidence());
    expect(Object.keys(progress.lessons.l1).sort()).toEqual([
      "acceptedExerciseIds",
      "attemptedExerciseIds",
      "consolidatedAt",
      "practicedAt",
      "visitedAt",
    ]);
    expect(Object.keys(progress.reviewQueue[0]).sort()).toEqual([
      "exerciseDefinitionId",
      "lastMistakeAt",
      "lessonId",
      "mistakeCount",
      "reviewKey",
      "targetConceptIds",
      "targetLexemeIds",
    ]);
  });

  it("is locale independent — identical evidence yields identical review entries", () => {
    const first = recordExerciseMistake(emptyProgress(), evidence());
    const second = recordExerciseMistake(emptyProgress(), evidence());
    expect(second.reviewQueue).toEqual(first.reviewQueue);
    expect(second.lessons.l1.attemptedExerciseIds).toEqual(first.lessons.l1.attemptedExerciseIds);
  });

  it("round trips accumulated evidence through storage without churn", () => {
    const progress = fullyConsolidated();
    expect(parseProgress(JSON.stringify(progress), new Set(["l1"]))).toEqual({
      progress,
      corrupted: false,
      migrated: false,
    });
  });

  it("rejects a v3 record with a malformed review entry as corrupt", () => {
    const bad = {
      ...emptyProgress(),
      reviewQueue: [{ reviewKey: "l1:l1-x1", lessonId: "l1" }],
    };
    expect(parseProgress(JSON.stringify(bad), knownLessonIds)).toEqual({
      progress: emptyProgress(),
      corrupted: true,
      migrated: false,
    });
  });
});

describe("course progress schema v3", () => {
  it("migrates v2 visits and preserves unknown ids as orphans", () => {
    expect(
      parseProgress(
        JSON.stringify({
          schemaVersion: 2,
          visitedLessonIds: ["sounds-core", "removed-id"],
          lastVisitedLessonId: "sounds-core",
          updatedAt: "2026-07-13T10:00:00.000Z",
        }),
        knownLessonIds,
      ),
    ).toEqual({
      progress: {
        schemaVersion: 3,
        catalogVersion: "a0-a1-v1",
        lessons: {
          "sounds-core": {
            visitedAt: "2026-07-13T10:00:00.000Z",
            practicedAt: null,
            consolidatedAt: null,
            attemptedExerciseIds: [],
            acceptedExerciseIds: [],
          },
        },
        lastVisitedLessonId: "sounds-core",
        reviewQueue: [],
        orphanedLessonIds: ["removed-id"],
        orphanedReviewKeys: [],
        updatedAt: "2026-07-13T10:00:00.000Z",
      },
      corrupted: false,
      migrated: true,
    });
  });

  it("migrates v1 directly without inventing practice evidence", () => {
    const result = parseProgress(
      JSON.stringify({
        schemaVersion: 1,
        completedLessonIds: ["sounds-core"],
        lastVisitedLessonId: "sounds-core",
        updatedAt: "2026-07-13T10:00:00.000Z",
      }),
      knownLessonIds,
    );
    expect(result.migrated).toBe(true);
    expect(result.progress.lessons["sounds-core"]).toMatchObject({
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
  });

  it("accepts valid v3 without timestamp churn", () => {
    const progress = markLessonVisited(emptyProgress(), "sounds-core");
    expect(
      parseProgress(JSON.stringify(progress), knownLessonIds),
    ).toEqual({ progress, corrupted: false, migrated: false });
  });

  it("marks visits idempotently and projects visited lesson ids", () => {
    const first = markLessonVisited(emptyProgress(), "sounds-core");
    const second = markLessonVisited(first, "sounds-core");
    expect(second).toBe(first);
    expect(visitedLessonIds(second)).toEqual(["sounds-core"]);
  });

  it("rejects malformed and future payloads explicitly", () => {
    expect(parseProgress("{bad", knownLessonIds)).toEqual({
      progress: emptyProgress(),
      corrupted: true,
      migrated: false,
    });
    expect(
      parseProgress(JSON.stringify({ schemaVersion: 4 }), knownLessonIds),
    ).toEqual({
      progress: emptyProgress(),
      corrupted: true,
      migrated: false,
    });
  });
});

describe("course progress v3 — retired v2.1 lesson ids: orphan-safe, route-aliased", () => {
  const realKnownLessonIds = new Set(
    courseModules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
  );

  it("orphans a stored retired lesson id rather than counting it, while the route layer owns its alias", () => {
    const retired = "sounds-core";
    // A retired v2.1 lesson id is not a current lesson, so progress migration
    // safely orphans it (never a crash, never a false current-lesson count).
    expect(realKnownLessonIds.has(retired)).toBe(false);
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 2,
        visitedLessonIds: [retired, "genuinely-unknown-id"],
        lastVisitedLessonId: retired,
        updatedAt: "2026-07-15T10:00:00.000Z",
      }),
      realKnownLessonIds,
    );
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.lessons).toEqual({});
    expect(parsed.progress.orphanedLessonIds).toEqual([
      retired,
      "genuinely-unknown-id",
    ]);
    // The opaque last-visited id is preserved verbatim; the route/map layer —
    // not progress — canonicalizes navigation via the explicit alias map.
    expect(parsed.progress.lastVisitedLessonId).toBe(retired);
    expect(
      LEGACY_LESSON_ALIASES.some((alias) => alias.legacyLessonId === retired),
    ).toBe(true);
  });

  it("keeps a truly unknown (non-aliased) id orphaned with no alias entry", () => {
    const unknown = "not-a-real-or-legacy-lesson";
    expect(
      LEGACY_LESSON_ALIASES.some((alias) => alias.legacyLessonId === unknown),
    ).toBe(false);
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 2,
        visitedLessonIds: [unknown],
        lastVisitedLessonId: null,
        updatedAt: "2026-07-15T10:00:00.000Z",
      }),
      realKnownLessonIds,
    );
    expect(parsed.progress.orphanedLessonIds).toEqual([unknown]);
    expect(parsed.progress.lessons).toEqual({});
  });
});
