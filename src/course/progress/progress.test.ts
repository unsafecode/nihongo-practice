import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  emptyProgressV5,
  knownVisitedLessonIds,
  markLessonVisited,
  migrateV1ToV2,
  migrateV4ToV5,
  parseProgress,
  recommendContinuationLessonId,
  visitedLessonIds,
  visitedLessonIdsForLevel,
  visitedPercent,
  type CourseProgressV1,
  type CourseProgressV3,
  type CourseProgressV4,
  type ModuleOutline,
} from "./progress";
import {
  loadProgress,
  persistProgress,
  resetStoredProgress,
  STORAGE_KEY,
} from "./ProgressContext";
import { legacyA1CourseModules as courseModules } from "../data/course";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function blockedStorage(): Storage {
  const blocked = (): never => {
    throw new Error("blocked");
  };
  return {
    get length() { return 0; },
    clear: blocked,
    getItem: blocked,
    key: blocked,
    removeItem: blocked,
    setItem: blocked,
  };
}

function v1Fixture(overrides: Partial<CourseProgressV1> = {}): CourseProgressV1 {
  return {
    schemaVersion: 1,
    completedLessonIds: [],
    lastVisitedLessonId: null,
    updatedAt: "2026-07-13T10:00:00.000Z",
    ...overrides,
  };
}

describe("emptyProgress", () => {
  it("starts with the v3 evidence schema and no lesson or review state", () => {
    expect(emptyProgress()).toEqual({
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: {},
      lastVisitedLessonId: null,
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
      updatedAt: new Date(0).toISOString(),
    });
  });
});

describe("migrateV1ToV2", () => {
  it("copies completed lesson ids into visitedLessonIds losslessly", () => {
    const migrated = migrateV1ToV2(v1Fixture({
      completedLessonIds: ["sounds-core", "sounds-special"],
    }));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.visitedLessonIds).toEqual(["sounds-core", "sounds-special"]);
  });

  it("deduplicates completed lesson ids in encounter order", () => {
    const migrated = migrateV1ToV2(v1Fixture({
      completedLessonIds: ["a", "b", "a", "c", "b"],
    }));
    expect(migrated.visitedLessonIds).toEqual(["a", "b", "c"]);
  });

  it("preserves unknown or legacy opaque lesson ids", () => {
    const migrated = migrateV1ToV2(v1Fixture({
      completedLessonIds: ["sounds-core", "an-old-removed-lesson"],
    }));
    expect(migrated.visitedLessonIds).toContain("an-old-removed-lesson");
  });

  it("preserves an opaque lastVisitedLessonId as-is", () => {
    const migrated = migrateV1ToV2(v1Fixture({
      lastVisitedLessonId: "some-legacy-opaque-id",
    }));
    expect(migrated.lastVisitedLessonId).toBe("some-legacy-opaque-id");
  });

  it("preserves a null lastVisitedLessonId", () => {
    const migrated = migrateV1ToV2(v1Fixture({ lastVisitedLessonId: null }));
    expect(migrated.lastVisitedLessonId).toBeNull();
  });

  it("preserves the original updatedAt timestamp instead of stamping a new one", () => {
    const migrated = migrateV1ToV2(v1Fixture({
      updatedAt: "2020-01-01T00:00:00.000Z",
    }));
    expect(migrated.updatedAt).toBe("2020-01-01T00:00:00.000Z");
  });
});

describe("parseProgress", () => {
  it("migrates valid v2 progress through V4 into Base", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 2,
      visitedLessonIds: ["sounds-1"],
      lastVisitedLessonId: "sounds-1",
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(5);
    expect(visitedLessonIdsForLevel(parsed.progress.levels.a0)).toEqual([
      "sounds-1",
    ]);
    expect(parsed.progress.levels.a0.lastVisitedLessonId).toBe("sounds-1");
  });

  it("migrates a valid v1 payload into V5 on read", () => {
    const parsed = parseProgress(JSON.stringify(v1Fixture({
      completedLessonIds: ["sounds-1"],
      lastVisitedLessonId: "sounds-2",
    })));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(5);
    expect(visitedLessonIdsForLevel(parsed.progress.levels.a0)).toEqual([
      "sounds-1",
    ]);
    expect(parsed.progress.levels.a1.lastVisitedLessonId).toBeNull();
  });

  it("normalizes a real v1 payload that omits lastVisitedLessonId to null without losing visited data", () => {
    // A genuine on-disk v1 snapshot from before lastVisitedLessonId existed:
    // the field is absent entirely (not null). Parsed through the real
    // migration path (no casts), it must yield a well-formed V5 object with an
    // explicit null last-visited, preserving every visited id and the stamp.
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 1,
        completedLessonIds: ["sounds-1", "sounds-2"],
        updatedAt: "2026-07-13T10:00:00.000Z",
      }),
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.progress.schemaVersion).toBe(5);
    expect(visitedLessonIdsForLevel(parsed.progress.levels.a0)).toEqual([
      "sounds-1",
      "sounds-2",
    ]);
    expect(parsed.progress.updatedAt).toBe("2026-07-13T10:00:00.000Z");
    // Must be an explicit null, never undefined.
    expect(parsed.progress.levels.a1.lastVisitedLessonId).toBeNull();
    expect(
      Object.prototype.hasOwnProperty.call(
        parsed.progress.levels.a0,
        "lastVisitedLessonId",
      ),
    ).toBe(true);
  });

  it("treats null storage content as empty V5 progress", () => {
    expect(parseProgress(null)).toEqual({
      progress: emptyProgressV5(),
      corrupted: false,
      migrated: false,
    });
  });

  it("isolates malformed JSON as corrupted", () => {
    expect(parseProgress("{bad")).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("treats a malformed v1 shape as corrupted", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 1,
      completedLessonIds: "not-an-array",
      lastVisitedLessonId: null,
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("treats a malformed v2 shape as corrupted", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 2,
      visitedLessonIds: "not-an-array",
      lastVisitedLessonId: null,
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a future/unknown schema version without throwing", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 6,
      visitedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("treats a payload with no schemaVersion field as corrupted", () => {
    const parsed = parseProgress(JSON.stringify({
      completedLessonIds: ["sounds-core"],
    }));
    expect(parsed).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });
});

describe("markLessonVisited", () => {
  it("adds lesson evidence and records it as last visited", () => {
    const next = markLessonVisited(emptyProgress(), "sounds-core");
    expect(visitedLessonIds(next)).toEqual(["sounds-core"]);
    expect(next.lastVisitedLessonId).toBe("sounds-core");
  });

  it("accumulates multiple visited lessons across calls", () => {
    const afterFirst = markLessonVisited(emptyProgress(), "sounds-core");
    const afterSecond = markLessonVisited(afterFirst, "sounds-special");
    expect(visitedLessonIds(afterSecond)).toEqual(["sounds-core", "sounds-special"]);
    expect(afterSecond.lastVisitedLessonId).toBe("sounds-special");
  });

  it("does not duplicate a lesson visited more than once", () => {
    const afterFirst = markLessonVisited(emptyProgress(), "sounds-core");
    const afterAgain = markLessonVisited(afterFirst, "sounds-core");
    expect(visitedLessonIds(afterAgain)).toEqual(["sounds-core"]);
    expect(afterAgain.lastVisitedLessonId).toBe("sounds-core");
  });

  it("does not offer a completion toggle API", () => {
    // Task B point 4: complete/uncomplete/toggle controls are removed entirely.
    // markLessonVisited only ever adds a visited id; there is no boolean flag.
    const progress = markLessonVisited(emptyProgress(), "sounds-core");
    expect(Object.keys(progress)).not.toContain("completedLessonIds");
  });

  it("is idempotent: marking the same already-current lesson again returns the exact same object with an unchanged updatedAt", () => {
    // Regression for the LessonPage infinite-loop bug: the effect that marks
    // a lesson visited runs again any time markVisited is invoked (fresh
    // resolution object, remount, etc). If the lesson is already visited and
    // already `lastVisitedLessonId`, this must be a true no-op - the exact
    // same object reference, not just equal fields - so that a memoized
    // ProgressContext value does not rerender/re-persist on repeat calls.
    const first = markLessonVisited(emptyProgress(), "sounds-core");
    const second = markLessonVisited(first, "sounds-core");
    expect(second).toBe(first);
    expect(second.updatedAt).toBe(first.updatedAt);
  });

  it("still updates lastVisitedLessonId (and returns a new object) when re-visiting a lesson that was visited but is no longer the last-visited one", () => {
    const afterFirst = markLessonVisited(emptyProgress(), "sounds-core");
    const afterSecond = markLessonVisited(afterFirst, "sounds-special");
    const afterReturn = markLessonVisited(afterSecond, "sounds-core");
    expect(afterReturn).not.toBe(afterSecond);
    expect(afterReturn.lastVisitedLessonId).toBe("sounds-core");
    expect(visitedLessonIds(afterReturn)).toEqual(["sounds-core", "sounds-special"]);
  });
});

describe("knownVisitedLessonIds", () => {
  it("filters out ids that no longer exist in the current course", () => {
    const known = new Set(["sounds-core", "sounds-special"]);
    expect(
      knownVisitedLessonIds(["sounds-core", "an-old-removed-lesson"], known),
    ).toEqual(["sounds-core"]);
  });

  it("preserves the original order of the retained ids", () => {
    const known = new Set(["a", "b", "c"]);
    expect(knownVisitedLessonIds(["c", "a", "b"], known)).toEqual(["c", "a", "b"]);
  });
});

describe("visitedPercent", () => {
  it("calculates percentage across 40 lessons", () => {
    expect(visitedPercent(["a", "b", "c", "d", "e"], 40)).toBe(13);
  });

  it("returns 0 when there are no lessons to visit", () => {
    expect(visitedPercent([], 0)).toBe(0);
  });
});

describe("recommendContinuationLessonId (synthetic outline)", () => {
  const outline: ModuleOutline[] = [
    { id: "m1", prerequisiteIds: [], lessons: [{ id: "m1-a" }, { id: "m1-b" }] },
    { id: "m2", prerequisiteIds: ["m1"], lessons: [{ id: "m2-a" }] },
  ];

  it("recommends the first lesson in course order when nothing is visited", () => {
    expect(recommendContinuationLessonId(outline, [], null)).toBe("m1-a");
  });

  it("recommends the last visited lesson when it still exists", () => {
    expect(recommendContinuationLessonId(outline, ["m1-a"], "m1-a")).toBe("m1-a");
  });

  it("falls back past a stale last-visited id that no longer exists", () => {
    expect(recommendContinuationLessonId(outline, [], "a-removed-lesson-id"))
      .toBe("m1-a");
  });

  it("does not skip ahead to a later module while an earlier module still has an unvisited lesson", () => {
    // m1-a visited, m1-b still unvisited; m2 depends on m1 (not fully visited yet).
    const result = recommendContinuationLessonId(outline, ["m1-a"], null);
    expect(result).toBe("m1-b");
  });

  it("recommends the next module's lesson once its prerequisite module is fully visited", () => {
    const result = recommendContinuationLessonId(outline, ["m1-a", "m1-b"], null);
    expect(result).toBe("m2-a");
  });

  it("recommends the first lesson in course order once everything is visited", () => {
    const result = recommendContinuationLessonId(
      outline,
      ["m1-a", "m1-b", "m2-a"],
      null,
    );
    expect(result).toBe("m1-a");
  });

  it("returns null when there are no modules at all", () => {
    expect(recommendContinuationLessonId([], [], null)).toBeNull();
  });

  it("does not block on an unknown prerequisite module id", () => {
    const withUnknownPrereq: ModuleOutline[] = [
      { id: "m1", prerequisiteIds: ["ghost"], lessons: [{ id: "m1-a" }] },
    ];
    expect(recommendContinuationLessonId(withUnknownPrereq, [], null)).toBe("m1-a");
  });
});

describe("recommendContinuationLessonId (real course data)", () => {
  it("recommends the first lesson of the course from a clean slate", () => {
    expect(recommendContinuationLessonId(courseModules, [], null)).toBe(
      "sounds-1",
    );
  });

  it("recommends the first lesson of the next module once earlier modules are fully visited", () => {
    // Visit every lesson in the first six modules; §7.3 rule 2 advances to the
    // first unvisited lesson whose module prerequisites are all fully visited.
    const visited = courseModules
      .slice(0, 6)
      .flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const nextModule = courseModules[6];
    expect(recommendContinuationLessonId(courseModules, visited, null)).toBe(
      nextModule.lessons[0].id,
    );
  });

  it("recommends the first capstone lesson once every earlier module is fully visited", () => {
    const visited = courseModules
      .slice(0, courseModules.length - 1)
      .flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const capstones = courseModules[courseModules.length - 1];
    expect(recommendContinuationLessonId(courseModules, visited, null)).toBe(
      capstones.lessons[0].id,
    );
  });
});

function v4FixtureFromV3(v3: CourseProgressV3): CourseProgressV4 {
  return {
    schemaVersion: 4,
    catalogVersion: "a1-a2-v3",
    levels: {
      a1: {
        lessons: v3.lessons,
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: v3.lastVisitedLessonId,
        reviewQueue: v3.reviewQueue,
        orphanedLessonIds: v3.orphanedLessonIds,
        orphanedReviewKeys: v3.orphanedReviewKeys,
      },
      a2: {
        lessons: {},
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: null,
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: [],
      },
    },
    migrationNotice: null,
    updatedAt: v3.updatedAt,
  };
}

describe("progress storage lifecycle", () => {
  it("removes only the corrupt progress key", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "{bad");
    storage.setItem("nihongo.locale.primary", "it");

    expect(loadProgress(storage).corrupted).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("nihongo.locale.primary")).toBe("it");
  });

  it("resets only stored course progress", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ visitedLessonIds: ["sounds-core"] }));
    storage.setItem("nihongo.script", "hiragana");

    expect(resetStoredProgress(storage)).toEqual({ status: "removed" });
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("nihongo.script")).toBe("hiragana");
  });

  it("reports that null storage cannot persist progress", () => {
    expect(loadProgress(null).persistenceAvailable).toBe(false);
  });

  it("round-trips progress through working storage", () => {
    const storage = memoryStorage();
    const progress = migrateV4ToV5(v4FixtureFromV3(
      markLessonVisited(emptyProgress(), "sounds-1"),
    ));

    expect(persistProgress(storage, progress)).toEqual({ status: "saved" });
    expect(loadProgress(storage)).toEqual({
      progress,
      corrupted: false,
      persistenceAvailable: true,
      migrated: false,
      loadStatus: "current",
    });
  });

  it("reports write failure explicitly without throwing when storage is blocked", () => {
    const storage = blockedStorage();
    const progress = migrateV4ToV5(v4FixtureFromV3(
      markLessonVisited(emptyProgress(), "sounds-core"),
    ));

    expect(persistProgress(storage, progress)).toEqual({ status: "unavailable" });
  });

  it("reports read failure explicitly without throwing when storage is blocked", () => {
    expect(loadProgress(blockedStorage()).persistenceAvailable).toBe(false);
  });
});
