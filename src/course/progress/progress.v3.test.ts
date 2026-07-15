import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  markLessonVisited,
  parseProgress,
  visitedLessonIds,
} from "./progress";

const knownLessonIds = new Set(["sounds-core", "sounds-special"]);

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
