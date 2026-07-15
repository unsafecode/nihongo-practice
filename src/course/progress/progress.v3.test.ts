import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  markLessonVisited,
  parseProgress,
  visitedLessonIds,
} from "./progress";
import { courseModules } from "../data/course";
import { LEGACY_LESSON_ALIASES } from "../routing/lessonRouteResolution";

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
