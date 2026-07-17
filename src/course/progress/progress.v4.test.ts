import { describe, expect, it } from "vitest";
import {
  A1_V3_LESSON_ID_MAP,
  A1_V3_PRESERVED_LESSON_IDS,
  acknowledgeMigrationNotice,
  clearAll,
  clearLevel,
  emptyLevelProgress,
  emptyProgressV4,
  migrateV3ToV4,
  parseProgress,
  recordCanDoEvidence,
  recordCheckpointAttempt,
  summarizeLevel,
  visitedLessonIdsForLevel,
  type CheckpointAttempt,
  type CourseProgressV3,
  type CourseProgressV4,
  type LevelProgress,
  type ModuleOutline,
} from "./progress";

const T0 = "2026-07-16T10:00:00.000Z";
const T1 = "2026-07-16T11:00:00.000Z";
const T2 = "2026-07-16T12:00:00.000Z";

function v3Lesson(overrides: Partial<CourseProgressV3["lessons"][string]> = {}) {
  return {
    visitedAt: null,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
    ...overrides,
  };
}

function v3Fixture(overrides: Partial<CourseProgressV3> = {}): CourseProgressV3 {
  return {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: {},
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
    updatedAt: T0,
    ...overrides,
  };
}

describe("A1_V3_PRESERVED_LESSON_IDS / A1_V3_LESSON_ID_MAP", () => {
  it("preserves the exact reviewed 39-lesson A1 subset", () => {
    expect(A1_V3_PRESERVED_LESSON_IDS).toEqual([
      "sounds-1", "sounds-2", "sounds-3", "sounds-4",
      "introductions-1", "introductions-2", "introductions-3",
      "essential-questions-1", "essential-questions-2", "essential-questions-3",
      "actions-1", "actions-2", "actions-3",
      "routines-1", "routines-2", "routines-3",
      "past-negative-1", "past-negative-2", "past-negative-3",
      "places-1", "places-2", "places-3", "places-4",
      "people-1", "people-2", "people-3",
      "descriptions-1", "descriptions-2", "descriptions-3",
      "shopping-1", "shopping-2", "shopping-3",
      "existence-needs-1", "existence-needs-2", "existence-needs-3",
      "capstones-1", "capstones-2", "capstones-3", "capstones-4",
    ]);
    expect(A1_V3_PRESERVED_LESSON_IDS).toHaveLength(39);
  });

  it("maps every preserved id to itself and aliases sounds-5 onto sounds-4", () => {
    for (const id of A1_V3_PRESERVED_LESSON_IDS) {
      expect(A1_V3_LESSON_ID_MAP[id]).toBe(id);
    }
    expect(A1_V3_LESSON_ID_MAP["sounds-5"]).toBe("sounds-4");
    expect(Object.keys(A1_V3_LESSON_ID_MAP)).toHaveLength(40);
  });
});

describe("migrateV3ToV4 — deterministic visited-only migration", () => {
  it("preserves only visitedAt for a safely mapped lesson, clearing every other kind of evidence", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-1": v3Lesson({
          visitedAt: T0,
          practicedAt: T1,
          consolidatedAt: T2,
          attemptedExerciseIds: ["sounds-1-x1"],
          acceptedExerciseIds: ["sounds-1-x1"],
        }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-1"]).toEqual({
      visitedAt: T0,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-1"]);
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toEqual(["sounds-1"]);
  });

  it("does not list a visited-only lesson (no stronger evidence lost) in resetEvidenceLessonIds", () => {
    const v3 = v3Fixture({
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-1"]);
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toEqual([]);
  });

  it("does not migrate an unreviewed/unmapped v3 lesson id into levels.a1.lessons", () => {
    const v3 = v3Fixture({
      lessons: { "capstones-orientation": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["capstones-orientation"]).toBeUndefined();
    expect(v4.levels.a1.orphanedLessonIds).toContain("capstones-orientation");
  });

  it("aliases sounds-5 onto sounds-4, keeping the earliest visit when sounds-4 was visited first", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-4": v3Lesson({ visitedAt: T0 }),
        "sounds-5": v3Lesson({ visitedAt: T1 }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"].visitedAt).toBe(T0);
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-4"]);
  });

  it("aliases sounds-5 onto sounds-4, keeping the earliest visit when sounds-5 was visited first", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-4": v3Lesson({ visitedAt: T1 }),
        "sounds-5": v3Lesson({ visitedAt: T0 }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"].visitedAt).toBe(T0);
  });

  it("dedupes duplicate destinations deterministically regardless of which duplicate is present", () => {
    // Only sounds-5 visited (sounds-4 never visited directly): still lands on
    // the sounds-4 destination because the alias always maps forward.
    const v3 = v3Fixture({ lessons: { "sounds-5": v3Lesson({ visitedAt: T0 }) } });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"]).toEqual({
      visitedAt: T0,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    expect(v4.levels.a1.lessons["sounds-5"]).toBeUndefined();
  });

  it("turns an unknown v3 lesson id into an A1 orphan", () => {
    const v3 = v3Fixture({
      lessons: { "some-genuinely-unknown-id": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["some-genuinely-unknown-id"]);
    expect(v4.levels.a1.lessons["some-genuinely-unknown-id"]).toBeUndefined();
  });

  it("carries forward pre-existing v3 orphans alongside newly discovered ones, deduplicated", () => {
    const v3 = v3Fixture({
      orphanedLessonIds: ["already-orphaned", "dup"],
      lessons: { dup: v3Lesson({ visitedAt: T0 }), fresh: v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["already-orphaned", "dup", "fresh"]);
  });

  it("produces a completely empty A2 level", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } }));
    expect(v4.levels.a2).toEqual(emptyLevelProgress());
  });

  it("clears the review queue and orphaned review keys entirely", () => {
    const v3 = v3Fixture({
      reviewQueue: [
        {
          reviewKey: "sounds-1:sounds-1-x1",
          lessonId: "sounds-1",
          exerciseDefinitionId: "sounds-1-x1",
          targetConceptIds: [],
          targetLexemeIds: [],
          mistakeCount: 1,
          lastMistakeAt: T0,
        },
      ],
      orphanedReviewKeys: ["ghost:ghost"],
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.reviewQueue).toEqual([]);
    expect(v4.levels.a1.orphanedReviewKeys).toEqual([]);
  });

  it("maps lastVisitedLessonId through the alias", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: "sounds-5" }));
    expect(v4.levels.a1.lastVisitedLessonId).toBe("sounds-4");
  });

  it("preserves an opaque/unmapped lastVisitedLessonId verbatim", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: "some-legacy-opaque-id" }));
    expect(v4.levels.a1.lastVisitedLessonId).toBe("some-legacy-opaque-id");
  });

  it("preserves a null lastVisitedLessonId", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: null }));
    expect(v4.levels.a1.lastVisitedLessonId).toBeNull();
  });

  it("uses the source updatedAt verbatim, never a freshly stamped Date", () => {
    const v4 = migrateV3ToV4(v3Fixture({ updatedAt: "2020-01-01T00:00:00.000Z" }));
    expect(v4.updatedAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("starts migrationNotice.acknowledgedAt as null", () => {
    const v4 = migrateV3ToV4(v3Fixture());
    expect(v4.migrationNotice?.acknowledgedAt).toBeNull();
    expect(v4.migrationNotice?.fromSchemaVersion).toBe(3);
  });

  it("is a pure function: never mutates its input", () => {
    const v3 = v3Fixture({
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      orphanedLessonIds: ["legacy"],
    });
    const snapshot = JSON.parse(JSON.stringify(v3));
    migrateV3ToV4(v3);
    expect(v3).toEqual(snapshot);
  });

  it("is deterministic/idempotent: migrating the same v3 payload twice yields equal (by value) results", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-1": v3Lesson({ visitedAt: T0 }),
        "sounds-5": v3Lesson({ visitedAt: T1 }),
        "unknown-x": v3Lesson({ visitedAt: T0 }),
      },
      orphanedLessonIds: ["legacy"],
    });
    expect(migrateV3ToV4(v3)).toEqual(migrateV3ToV4(v3));
  });
});

describe("parseProgress → CourseProgressV4", () => {
  it("treats null storage content as empty v4 progress", () => {
    expect(parseProgress(null)).toEqual({
      progress: emptyProgressV4(),
      corrupted: false,
      migrated: false,
    });
  });

  it("passes a valid v4 payload through unchanged, by reference, with no migration", () => {
    const progress = emptyProgressV4();
    const raw = JSON.stringify(progress);
    const parsed = parseProgress(raw);
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(false);
    expect(parsed.progress).toEqual(progress);
  });

  it("migrates a valid v3 payload directly into v4", () => {
    const v3 = v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } });
    const parsed = parseProgress(JSON.stringify(v3));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress).toEqual(migrateV3ToV4(v3));
  });

  it("migrates a valid v2 payload all the way through v3 into v4", () => {
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 2,
        visitedLessonIds: ["sounds-1"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: T0,
      }),
      new Set(["sounds-1"]),
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(4);
    expect(parsed.progress.levels.a1.lessons["sounds-1"].visitedAt).toBe(T0);
    expect(parsed.progress.levels.a1.lastVisitedLessonId).toBe("sounds-1");
  });

  it("migrates a valid v1 payload all the way through v3 into v4", () => {
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 1,
        completedLessonIds: ["sounds-1"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: T0,
      }),
      new Set(["sounds-1"]),
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(4);
    expect(parsed.progress.levels.a1.lessons["sounds-1"].visitedAt).toBe(T0);
  });

  it("rejects malformed JSON as corrupted", () => {
    expect(parseProgress("{bad")).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a future/unknown schema version (5) without throwing", () => {
    expect(parseProgress(JSON.stringify({ schemaVersion: 5 }))).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a malformed v4 shape (wrong number of levels) as corrupted", () => {
    const malformed = { ...emptyProgressV4(), levels: { a1: emptyLevelProgress() } };
    expect(parseProgress(JSON.stringify(malformed))).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects an invalid timestamp type in v4 as corrupted", () => {
    const malformed = { ...emptyProgressV4(), updatedAt: 12345 };
    expect(parseProgress(JSON.stringify(malformed))).toEqual({
      progress: emptyProgressV4(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects an invalid timestamp type inside a level's lesson evidence as corrupted", () => {
    const malformed = {
      ...emptyProgressV4(),
      levels: {
        a1: { ...emptyLevelProgress(), lessons: { "sounds-1": { ...v3Lesson(), visitedAt: 42 } } },
        a2: emptyLevelProgress(),
      },
    };
    expect(parseProgress(JSON.stringify(malformed)).corrupted).toBe(true);
  });

  it("does not corrupt on extra/unknown lesson ids embedded directly in a valid v4 payload", () => {
    const withExtra: CourseProgressV4 = {
      ...emptyProgressV4(),
      levels: {
        a1: { ...emptyLevelProgress(), orphanedLessonIds: ["some-unknown-id"] },
        a2: emptyLevelProgress(),
      },
    };
    const parsed = parseProgress(JSON.stringify(withExtra));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual(["some-unknown-id"]);
  });
});

describe("recordCanDoEvidence", () => {
  it("records the first piece of evidence for a Can-do", () => {
    const level = emptyLevelProgress();
    const next = recordCanDoEvidence(level, {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T0,
    });
    expect(next.canDos["cd-greet"]).toEqual({
      canDoId: "cd-greet",
      visitedLessonIds: ["introductions-1"],
      practicedLessonIds: [],
      acceptedTransferExerciseIds: [],
      checkpointAttemptIds: [],
      lastUpdatedAt: T0,
    });
  });

  it("accumulates evidence across calls, deduplicated in encounter order", () => {
    let level = emptyLevelProgress();
    level = recordCanDoEvidence(level, { canDoId: "cd-greet", visitedLessonId: "introductions-1", at: T0 });
    level = recordCanDoEvidence(level, { canDoId: "cd-greet", practicedLessonId: "introductions-1", at: T1 });
    level = recordCanDoEvidence(level, {
      canDoId: "cd-greet",
      acceptedTransferExerciseId: "cd-greet-transfer-1",
      at: T2,
    });
    const evidence = level.canDos["cd-greet"];
    expect(evidence.visitedLessonIds).toEqual(["introductions-1"]);
    expect(evidence.practicedLessonIds).toEqual(["introductions-1"]);
    expect(evidence.acceptedTransferExerciseIds).toEqual(["cd-greet-transfer-1"]);
    expect(evidence.lastUpdatedAt).toBe(T2);
  });

  it("is idempotent by reference when nothing new is recorded", () => {
    const first = recordCanDoEvidence(emptyLevelProgress(), {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T0,
    });
    const again = recordCanDoEvidence(first, {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T1,
    });
    expect(again).toBe(first);
  });

  it("never invents a pass/fail verdict — evidence is only observational id lists", () => {
    const level = recordCanDoEvidence(emptyLevelProgress(), {
      canDoId: "cd-greet",
      checkpointAttemptId: "attempt-1",
      at: T0,
    });
    expect(Object.keys(level.canDos["cd-greet"]).sort()).toEqual([
      "acceptedTransferExerciseIds",
      "canDoId",
      "checkpointAttemptIds",
      "lastUpdatedAt",
      "practicedLessonIds",
      "visitedLessonIds",
    ]);
  });
});

describe("recordCheckpointAttempt", () => {
  function attempt(overrides: Partial<CheckpointAttempt> = {}): CheckpointAttempt {
    return {
      id: "attempt-1",
      checkpointId: "checkpoint-a1-1",
      attemptedAt: T0,
      acceptedExerciseIds: ["ex-1", "ex-2"],
      sampledCanDoIds: ["cd-greet"],
      ...overrides,
    };
  }

  it("appends a new checkpoint attempt", () => {
    const level = recordCheckpointAttempt(emptyLevelProgress(), attempt());
    expect(level.checkpointAttempts).toEqual([attempt()]);
  });

  it("is idempotent by attempt id: recording the same id twice is a no-op", () => {
    const first = recordCheckpointAttempt(emptyLevelProgress(), attempt());
    const again = recordCheckpointAttempt(first, attempt({ attemptedAt: T1 }));
    expect(again).toBe(first);
  });

  it("accumulates distinct attempt ids in order", () => {
    let level = recordCheckpointAttempt(emptyLevelProgress(), attempt({ id: "attempt-1" }));
    level = recordCheckpointAttempt(level, attempt({ id: "attempt-2" }));
    expect(level.checkpointAttempts.map((a) => a.id)).toEqual(["attempt-1", "attempt-2"]);
  });
});

describe("clearLevel / clearAll", () => {
  function nonEmptyProgress(): CourseProgressV4 {
    const a1: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-1",
    };
    return { ...emptyProgressV4(), levels: { a1, a2: emptyLevelProgress() }, updatedAt: T0 };
  }

  it("clears only the targeted level, leaving the other level untouched", () => {
    const progress = nonEmptyProgress();
    const cleared = clearLevel(progress, "a1", T1);
    expect(cleared.levels.a1).toEqual(emptyLevelProgress());
    expect(cleared.levels.a2).toEqual(progress.levels.a2);
    expect(cleared.updatedAt).toBe(T1);
  });

  it("never touches the migrationNotice when clearing a level", () => {
    const progress: CourseProgressV4 = {
      ...nonEmptyProgress(),
      migrationNotice: {
        fromSchemaVersion: 3,
        preservedVisitedLessonIds: ["sounds-1"],
        resetEvidenceLessonIds: [],
        acknowledgedAt: null,
      },
    };
    const cleared = clearLevel(progress, "a1", T1);
    expect(cleared.migrationNotice).toEqual(progress.migrationNotice);
  });

  it("is a no-op (same reference) when the level is already empty", () => {
    const progress = emptyProgressV4();
    expect(clearLevel(progress, "a1", T1)).toBe(progress);
  });

  it("clears both levels entirely", () => {
    const progress = nonEmptyProgress();
    const cleared = clearAll(T1);
    expect(cleared.levels.a1).toEqual(emptyLevelProgress());
    expect(cleared.levels.a2).toEqual(emptyLevelProgress());
    expect(cleared.updatedAt).toBe(T1);
    expect(cleared).not.toBe(progress);
  });
});

describe("acknowledgeMigrationNotice", () => {
  it("stamps acknowledgedAt without deleting the migration record", () => {
    const migrated = migrateV3ToV4(v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } }));
    const acknowledged = acknowledgeMigrationNotice(migrated, T1);
    expect(acknowledged.migrationNotice?.acknowledgedAt).toBe(T1);
    expect(acknowledged.migrationNotice?.preservedVisitedLessonIds).toEqual(
      migrated.migrationNotice?.preservedVisitedLessonIds,
    );
  });

  it("is a no-op when there is no migration notice", () => {
    const progress = emptyProgressV4();
    expect(acknowledgeMigrationNotice(progress, T1)).toBe(progress);
  });

  it("is a no-op when the notice is already acknowledged", () => {
    const migrated = migrateV3ToV4(v3Fixture());
    const once = acknowledgeMigrationNotice(migrated, T1);
    const twice = acknowledgeMigrationNotice(once, T2);
    expect(twice).toBe(once);
  });
});

describe("visitedLessonIdsForLevel / summarizeLevel", () => {
  const outline: ModuleOutline[] = [
    { id: "m1", prerequisiteIds: [], lessons: [{ id: "sounds-1" }, { id: "sounds-2" }] },
  ];

  it("projects only visited lesson ids for a level", () => {
    const level: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: {
        "sounds-1": v3Lesson({ visitedAt: T0 }),
        "sounds-2": v3Lesson({ visitedAt: null }),
      },
    };
    expect(visitedLessonIdsForLevel(level)).toEqual(["sounds-1"]);
  });

  it("summarizes one level independently of the other level's evidence", () => {
    const a1: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-1",
    };
    const a2: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-2": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-2",
    };
    const progress: CourseProgressV4 = { ...emptyProgressV4(), levels: { a1, a2 } };

    const a1Summary = summarizeLevel(progress, "a1", outline);
    expect(a1Summary.visitedLessonCount).toBe(1);
    expect(a1Summary.totalLessonCount).toBe(2);
    expect(a1Summary.visitedPercent).toBe(50);

    const a2Summary = summarizeLevel(progress, "a2", outline);
    expect(a2Summary.visitedLessonCount).toBe(1);
    // A2's evidence must never be inflated/deflated by A1's — same outline,
    // independently computed from a2's own lessons only.
    expect(a2Summary.recommendedContinuationLessonId).not.toBe(
      a1Summary.recommendedContinuationLessonId,
    );
  });
});
