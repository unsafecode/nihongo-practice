import { describe, expect, it } from "vitest";
import {
  emptyLevelProgress,
  emptyProgress,
  emptyProgressV4,
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

  it("migrates accumulated v3 evidence via the v3→v4 visited-only migration on reload (l1 is not a reviewed A1 id, so it is orphaned)", () => {
    // Phase 2 Task 5: schemaVersion 3 is no longer the current schema, so a
    // previously-stored, fully-formed v3 payload always migrates to v4 on
    // load. "l1" (this describe block's fixture lesson id) is not one of
    // the explicit reviewed A1 v3 lesson ids, so — correctly — none of its
    // evidence transfers, not even `visitedAt`; it becomes an A1 orphan.
    const progress = fullyConsolidated();
    const parsed = parseProgress(JSON.stringify(progress), new Set(["l1"]));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(4);
    expect(parsed.progress.levels.a1.lessons).toEqual({});
    expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual(["l1"]);
  });

  it("rejects a v3 record with a malformed review entry as corrupt", () => {
    const bad = {
      ...emptyProgress(),
      reviewQueue: [{ reviewKey: "l1:l1-x1", lessonId: "l1" }],
    };
    expect(parseProgress(JSON.stringify(bad), knownLessonIds)).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
  });
});

describe("course progress schema v3", () => {
  // "sounds-1" is both a v1/v2-era known lesson id (for this test's catalog
  // stand-in) AND one of the explicit reviewed A1 v3 lesson ids preserved by
  // the v3→v4 migration (Phase 2 Task 5), so it demonstrates the
  // "preserved" path end-to-end. "sounds-core" remains a fixture for ids
  // that were known at the v1/v2 stage but are NOT part of the reviewed v3
  // set, demonstrating the "orphaned by the v3→v4 migration" path.
  const knownLessonIdsWithReviewed = new Set(["sounds-1", "sounds-special"]);

  it("migrates v2 visits, preserving a reviewed id's visit and orphaning both an unmapped-but-known id and a never-known id", () => {
    expect(
      parseProgress(
        JSON.stringify({
          schemaVersion: 2,
          visitedLessonIds: ["sounds-1", "sounds-core", "removed-id"],
          lastVisitedLessonId: "sounds-1",
          updatedAt: "2026-07-13T10:00:00.000Z",
        }),
        new Set(["sounds-1", "sounds-core", "sounds-special"]),
      ),
    ).toEqual({
      progress: {
        schemaVersion: 4,
        catalogVersion: "a1-a2-v1",
        levels: {
          a1: {
            lessons: {
              "sounds-1": {
                visitedAt: "2026-07-13T10:00:00.000Z",
                practicedAt: null,
                consolidatedAt: null,
                attemptedExerciseIds: [],
                acceptedExerciseIds: [],
              },
            },
            canDos: {},
            checkpointAttempts: [],
            lastVisitedLessonId: "sounds-1",
            reviewQueue: [],
            orphanedLessonIds: ["removed-id", "sounds-core"],
            orphanedReviewKeys: [],
          },
          a2: emptyLevelProgress(),
        },
        migrationNotice: {
          fromSchemaVersion: 3,
          preservedVisitedLessonIds: ["sounds-1"],
          resetEvidenceLessonIds: [],
          acknowledgedAt: null,
        },
        updatedAt: "2026-07-13T10:00:00.000Z",
      },
      corrupted: false,
      migrated: true,
    });
  });

  it("migrates v1 directly without inventing practice evidence for a reviewed lesson", () => {
    const result = parseProgress(
      JSON.stringify({
        schemaVersion: 1,
        completedLessonIds: ["sounds-1"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: "2026-07-13T10:00:00.000Z",
      }),
      knownLessonIdsWithReviewed,
    );
    expect(result.migrated).toBe(true);
    expect(result.progress.levels.a1.lessons["sounds-1"]).toMatchObject({
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
  });

  it("migrates a valid v3 payload into v4, preserving only the visit timestamp for a reviewed lesson", () => {
    const progress = markLessonVisited(emptyProgress(), "sounds-1");
    const parsed = parseProgress(
      JSON.stringify(progress),
      knownLessonIdsWithReviewed,
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(4);
    expect(parsed.progress.levels.a1.lessons["sounds-1"]).toEqual({
      visitedAt: progress.lessons["sounds-1"].visitedAt,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    expect(parsed.progress.levels.a2).toEqual(emptyLevelProgress());
  });

  it("marks visits idempotently and projects visited lesson ids", () => {
    const first = markLessonVisited(emptyProgress(), "sounds-core");
    const second = markLessonVisited(first, "sounds-core");
    expect(second).toBe(first);
    expect(visitedLessonIds(second)).toEqual(["sounds-core"]);
  });

  it("rejects malformed and future payloads explicitly", () => {
    expect(parseProgress("{bad", knownLessonIds)).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
    expect(
      parseProgress(JSON.stringify({ schemaVersion: 5 }), knownLessonIds),
    ).toEqual({
      progress: emptyProgressV4(),
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
    expect(parsed.progress.levels.a1.lessons).toEqual({});
    expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual([
      retired,
      "genuinely-unknown-id",
    ]);
    // The opaque last-visited id is preserved verbatim; the route/map layer —
    // not progress — canonicalizes navigation via the explicit alias map.
    expect(parsed.progress.levels.a1.lastVisitedLessonId).toBe(retired);
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
    expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual([unknown]);
    expect(parsed.progress.levels.a1.lessons).toEqual({});
  });
});
