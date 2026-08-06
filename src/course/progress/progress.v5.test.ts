import { describe, expect, it } from "vitest";
import { V4_ACTIVITY_INVENTORY } from "../base/migration/v4ActivityInventory";
import {
  V4_ACTIVITY_MIGRATION_MAP,
} from "../base/migration/v4ActivityMap";
import {
  V4_CANDO_MIGRATION_MAP,
} from "../base/migration/v4CanDoMap";
import {
  V4_OWNERSHIP_MIGRATION_MAP,
  V4_REHOMED_LESSON_IDS,
} from "../base/migration/v4OwnershipMap";
import { lessonIdsForLevel } from "../levels/ownership";
import {
  clearLevel,
  emptyProgressV4,
  emptyProgressV5,
  migrateV4ToV5,
  migrateV5Catalog,
  parseProgress,
  recordCanDoEvidence,
  type CourseProgressV4,
  type LessonProgress,
  type ReviewQueueEntry,
} from "./progress";

const T0 = "2026-08-01T10:00:00.000Z";
const T1 = "2026-08-01T11:00:00.000Z";
const T2 = "2026-08-01T12:00:00.000Z";

const rehomedActivities = V4_ACTIVITY_INVENTORY.filter(
  (row) => row.lessonId === "sounds-1",
);
const [soundsFirst, soundsSecond] = rehomedActivities;

function lesson(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    visitedAt: T0,
    practicedAt: T1,
    consolidatedAt: T2,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
    ...overrides,
  };
}

function review(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ReviewQueueEntry {
  return {
    reviewKey: `${lessonId}:${exerciseDefinitionId}`,
    lessonId,
    exerciseDefinitionId,
    targetConceptIds: ["preserved-concept"],
    targetLexemeIds: ["preserved-lexeme"],
    mistakeCount: 3,
    lastMistakeAt: at,
  };
}

function v4EvidenceFixture(): CourseProgressV4 {
  const base = emptyProgressV4();
  const movedCanDo = {
    canDoId: "a1-can-do-sounds",
    visitedLessonIds: ["sounds-1"],
    practicedLessonIds: ["sounds-1"],
    acceptedTransferExerciseIds: [soundsSecond!.definitionId],
    checkpointAttemptIds: ["a1-checkpoint-attempt-1", "a1-checkpoint-attempt-1"],
    lastUpdatedAt: T2,
  };

  return {
    ...base,
    levels: {
      a1: {
        ...base.levels.a1,
        lessons: {
          "sounds-1": lesson({
            attemptedExerciseIds: [soundsFirst!.definitionId, soundsSecond!.definitionId],
            acceptedExerciseIds: [soundsSecond!.definitionId],
          }),
          "introductions-1": lesson({
            visitedAt: T1,
            attemptedExerciseIds: ["introductions-1-current"],
          }),
          "unknown-retired-a1": lesson({
            visitedAt: T2,
            acceptedExerciseIds: ["retired-activity"],
          }),
        },
        canDos: {
          [movedCanDo.canDoId]: movedCanDo,
          "a1-can-do-introductions": {
            canDoId: "a1-can-do-introductions",
            visitedLessonIds: ["introductions-1"],
            practicedLessonIds: [],
            acceptedTransferExerciseIds: [],
            checkpointAttemptIds: [],
            lastUpdatedAt: T1,
          },
        },
        checkpointAttempts: [{
          id: "a1-checkpoint-attempt-1",
          checkpointId: "a1-checkpoint",
          attemptedAt: T2,
          acceptedExerciseIds: [soundsSecond!.definitionId],
          sampledCanDoIds: ["a1-can-do-sounds"],
        }],
        lastVisitedLessonId: "sounds-1",
        reviewQueue: [
          review("sounds-1", soundsFirst!.definitionId, T2),
          review("introductions-1", "introductions-1-current", T1),
        ],
        orphanedLessonIds: ["existing-a1-orphan"],
        orphanedReviewKeys: ["existing-a1-orphan-review"],
      },
      a2: {
        ...base.levels.a2,
        lessons: {
          "connected-conversation-1": lesson({
            attemptedExerciseIds: ["a2-current"],
            acceptedExerciseIds: ["a2-current"],
          }),
        },
        canDos: {
          "a2-can-do-connected-conversation": {
            canDoId: "a2-can-do-connected-conversation",
            visitedLessonIds: ["connected-conversation-1"],
            practicedLessonIds: ["connected-conversation-1"],
            acceptedTransferExerciseIds: ["a2-current"],
            checkpointAttemptIds: ["a2-checkpoint-attempt-1"],
            lastUpdatedAt: T2,
          },
        },
        checkpointAttempts: [{
          id: "a2-checkpoint-attempt-1",
          checkpointId: "a2-checkpoint",
          attemptedAt: T2,
          acceptedExerciseIds: ["a2-current"],
          sampledCanDoIds: ["a2-can-do-connected-conversation"],
        }],
        lastVisitedLessonId: "connected-conversation-1",
        reviewQueue: [review("connected-conversation-1", "a2-current", T2)],
        orphanedLessonIds: ["existing-a2-orphan"],
        orphanedReviewKeys: ["existing-a2-orphan-review"],
      },
    },
    migrationNotice: {
      fromSchemaVersion: 3,
      preservedVisitedLessonIds: ["sounds-1"],
      resetEvidenceLessonIds: [],
      acknowledgedAt: null,
    },
    updatedAt: T2,
  };
}

describe("V4 to V5 migration registries", () => {
  it("makes the reviewed twenty-lesson ownership transfer explicit and exact", () => {
    expect(V4_REHOMED_LESSON_IDS).toEqual([
      "sounds-1", "sounds-2", "sounds-3", "sounds-4",
      "sentence-foundations-1", "sentence-foundations-2",
      "sentence-foundations-3", "sentence-foundations-4",
      "topic-questions-1", "topic-questions-2", "topic-questions-3", "topic-questions-4",
      "polite-verbs-1", "polite-verbs-2", "polite-verbs-3", "polite-verbs-4",
      "time-movement-1", "time-movement-2", "time-movement-3", "time-movement-4",
    ]);
    expect(V4_OWNERSHIP_MIGRATION_MAP).toHaveLength(20);
    expect(new Set(V4_OWNERSHIP_MIGRATION_MAP.map((row) => row.sourceLessonId))).toEqual(
      new Set(V4_REHOMED_LESSON_IDS),
    );
    expect(V4_OWNERSHIP_MIGRATION_MAP).toEqual(
      V4_REHOMED_LESSON_IDS.map((lessonId) => ({
        sourceLevel: "a1",
        sourceLessonId: lessonId,
        destinationLevel: "a0",
        destinationLessonId: lessonId,
      })),
    );
    expect([...new Set(V4_ACTIVITY_INVENTORY.map((row) => row.lessonId))].sort()).toEqual(
      [...V4_REHOMED_LESSON_IDS].sort(),
    );
    expect(V4_OWNERSHIP_MIGRATION_MAP.every(
      (row) => lessonIdsForLevel("a0").includes(row.destinationLessonId),
    )).toBe(true);
    expect(Object.isFrozen(V4_OWNERSHIP_MIGRATION_MAP)).toBe(true);
    expect(V4_OWNERSHIP_MIGRATION_MAP.every(Object.isFrozen)).toBe(true);
  });

  it("maps every reviewed V4 activity exactly once to a deliberately non-active historical disposition", () => {
    expect(V4_ACTIVITY_MIGRATION_MAP).toHaveLength(80);
    expect(
      new Set(
        V4_ACTIVITY_MIGRATION_MAP.map(
          (row) => `${row.sourceLevel}:${row.sourceLessonId}:${row.sourceActivityId}`,
        ),
      ),
    ).toHaveLength(80);
    expect(
      V4_ACTIVITY_MIGRATION_MAP.map((row) => [
        row.sourceLessonId,
        row.sourceActivityId,
      ]),
    ).toEqual(V4_ACTIVITY_INVENTORY.map((row) => [row.lessonId, row.definitionId]));
    const destinationBySourceLesson = new Map(
      V4_OWNERSHIP_MIGRATION_MAP.map((row) => [
        row.sourceLessonId,
        `${row.destinationLevel}:${row.destinationLessonId}`,
      ]),
    );
    expect(V4_ACTIVITY_MIGRATION_MAP.every((row) =>
      `${row.destinationLevel}:${row.destinationLessonId}` ===
        destinationBySourceLesson.get(row.sourceLessonId) &&
      row.destinationActivityId === null &&
      row.disposition === "historical-orphan",
    )).toBe(true);
    expect(Object.isFrozen(V4_ACTIVITY_MIGRATION_MAP)).toBe(true);
    expect(V4_ACTIVITY_MIGRATION_MAP.every(Object.isFrozen)).toBe(true);
  });

  it("moves only the five stable Base Can-dos with their ids unchanged", () => {
    expect(V4_CANDO_MIGRATION_MAP).toEqual([
      "a1-can-do-sounds",
      "a1-can-do-sentence-foundations",
      "a1-can-do-topic-questions",
      "a1-can-do-polite-verbs",
      "a1-can-do-time-movement",
    ].map((canDoId) => ({
      sourceLevel: "a1",
      sourceCanDoId: canDoId,
      destinationLevel: "a0",
      destinationCanDoId: canDoId,
    })));
    expect(Object.isFrozen(V4_CANDO_MIGRATION_MAP)).toBe(true);
    expect(V4_CANDO_MIGRATION_MAP.every(Object.isFrozen)).toBe(true);
  });
});

describe("migrateV4ToV5", () => {
  it("losslessly rehomes actual Base evidence while retaining unrelated active and orphan evidence", () => {
    const v4 = v4EvidenceFixture();
    const sourceMovedLesson = v4.levels.a1.lessons["sounds-1"]!;
    const sourceMovedCanDo = v4.levels.a1.canDos["a1-can-do-sounds"]!;
    const sourceChangedReview = v4.levels.a1.reviewQueue[0]!;

    const v5 = migrateV4ToV5(v4);
    const { historicalCheckpointRefs, ...movedCanDo } =
      v5.levels.a0.canDos["a1-can-do-sounds"]!;

    expect(v5).toMatchObject({
      schemaVersion: 5,
      catalogVersion: "base-a1-a2-v1",
      updatedAt: T2,
      migrationNotice: {
        fromSchemaVersion: 4,
        movedLessonIds: ["sounds-1"],
        historicalActivityIds: [soundsFirst!.definitionId, soundsSecond!.definitionId],
        resumeLevel: "a0",
        priorNotice: v4.migrationNotice,
        acknowledgedAt: null,
      },
    });
    expect(v5.levels.a0.lessons["sounds-1"]).toEqual(sourceMovedLesson);
    expect(v5.levels.a1.lessons["sounds-1"]).toBeUndefined();
    expect(v5.levels.a1.lessons["introductions-1"]).toEqual(
      v4.levels.a1.lessons["introductions-1"],
    );
    expect(v5.levels.a2.lessons["connected-conversation-1"]).toEqual(
      v4.levels.a2.lessons["connected-conversation-1"],
    );
    expect(v5.levels.a1.orphanedLessonRecords["unknown-retired-a1"]).toEqual(
      v4.levels.a1.lessons["unknown-retired-a1"],
    );
    expect(v5.levels.a1.orphanedLessonIds).toEqual([
      "existing-a1-orphan",
      "unknown-retired-a1",
    ]);

    expect(movedCanDo).toEqual(sourceMovedCanDo);
    expect(historicalCheckpointRefs).toEqual([
      { sourceLevel: "a1", attemptId: "a1-checkpoint-attempt-1" },
    ]);
    expect(v5.levels.a1.canDos["a1-can-do-sounds"]).toBeUndefined();
    expect(v5.levels.a1.checkpointAttempts).toEqual(v4.levels.a1.checkpointAttempts);
    expect(v5.levels.a1.canDos["a1-can-do-introductions"]).toEqual({
      ...v4.levels.a1.canDos["a1-can-do-introductions"],
      historicalCheckpointRefs: [],
    });
    expect(v5.levels.a2.canDos["a2-can-do-connected-conversation"]).toEqual({
      ...v4.levels.a2.canDos["a2-can-do-connected-conversation"],
      historicalCheckpointRefs: [],
    });

    expect(v5.levels.a0.lastVisitedLessonId).toBe("sounds-1");
    expect(v5.levels.a1.lastVisitedLessonId).toBe("introductions-1");
    expect(v5.levels.a0.reviewQueue).toEqual([]);
    expect(v5.levels.a0.orphanedReviewKeys).toContain(sourceChangedReview.reviewKey);
    expect(v5.levels.a0.historicalActivityDispositions).toEqual([
      {
        sourceLevel: "a1",
        lessonId: "sounds-1",
        activityId: soundsFirst!.definitionId,
        disposition: "historical-orphan",
        orphanedReview: sourceChangedReview,
      },
      {
        sourceLevel: "a1",
        lessonId: "sounds-1",
        activityId: soundsSecond!.definitionId,
        disposition: "historical-orphan",
        orphanedReview: null,
      },
    ]);
    expect(v5.levels.a1.reviewQueue).toEqual([v4.levels.a1.reviewQueue[1]]);
    expect(v5.levels.a2.reviewQueue).toEqual(v4.levels.a2.reviewQueue);
  });

  it("preserves every fixture evidence atom once as active or typed historical evidence", () => {
    const v4 = v4EvidenceFixture();
    const v5 = migrateV4ToV5(v4);
    const sourceAtoms = [
      ...v4.levels.a1.lessons["sounds-1"]!.attemptedExerciseIds,
      ...v4.levels.a1.lessons["sounds-1"]!.acceptedExerciseIds,
      v4.levels.a1.reviewQueue[0]!.reviewKey,
      ...v4.levels.a1.canDos["a1-can-do-sounds"]!.checkpointAttemptIds,
      "unknown-retired-a1",
      ...v4.levels.a2.lessons["connected-conversation-1"]!.attemptedExerciseIds,
      ...v4.levels.a2.lessons["connected-conversation-1"]!.acceptedExerciseIds,
    ];
    const destinationAtoms = [
      ...v5.levels.a0.lessons["sounds-1"]!.attemptedExerciseIds,
      ...v5.levels.a0.lessons["sounds-1"]!.acceptedExerciseIds,
      ...v5.levels.a0.historicalActivityDispositions.flatMap((row) => [
        row.activityId,
        ...(row.orphanedReview ? [row.orphanedReview.reviewKey] : []),
      ]),
      ...v5.levels.a0.canDos["a1-can-do-sounds"]!.historicalCheckpointRefs.map(
        (ref) => ref.attemptId,
      ),
      ...Object.keys(v5.levels.a1.orphanedLessonRecords),
      ...v5.levels.a2.lessons["connected-conversation-1"]!.attemptedExerciseIds,
      ...v5.levels.a2.lessons["connected-conversation-1"]!.acceptedExerciseIds,
    ];

    expect(destinationAtoms).toEqual(expect.arrayContaining(sourceAtoms));
    expect(v5.levels.a0.historicalActivityDispositions.every(
      (row) => row.disposition === "historical-orphan",
    )).toBe(true);
  });

  it("is pure, deterministic, and parse-idempotent without timestamp churn", () => {
    const v4 = v4EvidenceFixture();
    const before = structuredClone(v4);

    const first = migrateV4ToV5(v4);
    const second = migrateV4ToV5(v4);
    const parsed = parseProgress(JSON.stringify(first));

    expect(v4).toEqual(before);
    expect(first).toEqual(second);
    expect(parsed).toEqual({ progress: first, corrupted: false, migrated: false });
    expect(migrateV5Catalog(first)).toBe(first);
  });

  it("fails closed for malformed, unversioned, and future schema payloads", () => {
    for (const raw of ["{bad", JSON.stringify({}), JSON.stringify({ schemaVersion: 6 })]) {
      expect(parseProgress(raw)).toEqual({
        progress: emptyProgressV5(),
        corrupted: true,
        migrated: false,
      });
    }
  });

  it("fails closed when a current V5 level omits an explicit required field", () => {
    const malformed = structuredClone(emptyProgressV5());
    delete (malformed.levels.a0 as { lastVisitedLessonId?: string | null })
      .lastVisitedLessonId;

    expect(parseProgress(JSON.stringify(malformed))).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("reconciles unknown lesson records across all three levels and retains unknown review detail", () => {
      const current = emptyProgressV5();
      const a1UnknownReview = review("unknown-a1", "unknown-a1-x1", T1);
      const a2UnknownReview = review("unknown-a2", "unknown-a2-x1", T2);
      const stored = {
        ...current,
        levels: {
          a0: {
            ...current.levels.a0,
            lessons: {
              "sounds-1": lesson(),
              "unknown-a0": lesson(),
            },
          },
          a1: {
            ...current.levels.a1,
            lessons: {
              "introductions-1": lesson(),
              "unknown-a1": lesson(),
            },
            reviewQueue: [a1UnknownReview],
          },
          a2: {
            ...current.levels.a2,
            lessons: {
              "connected-conversation-1": lesson(),
              "unknown-a2": lesson(),
            },
            reviewQueue: [a2UnknownReview],
          },
        },
      };
      const knownLessons = {
        a0: new Set(["sounds-1"]),
        a1: new Set(["introductions-1"]),
        a2: new Set(["connected-conversation-1"]),
      };
      const knownReviewKeys = {
        a0: new Set<string>(),
        a1: new Set<string>(),
        a2: new Set<string>(),
      };

      const parsed = parseProgress(
        JSON.stringify(stored),
        undefined,
        knownReviewKeys,
        knownLessons,
      );

      expect(parsed).toMatchObject({ corrupted: false, migrated: true });
      for (const [levelId, unknownLessonId] of [
        ["a0", "unknown-a0"],
        ["a1", "unknown-a1"],
        ["a2", "unknown-a2"],
      ] as const) {
        expect(parsed.progress.levels[levelId].lessons[unknownLessonId]).toBeUndefined();
        expect(parsed.progress.levels[levelId].orphanedLessonRecords[unknownLessonId]).toEqual(
          (stored.levels[levelId].lessons as Record<string, LessonProgress>)[unknownLessonId],
        );
        expect(parsed.progress.levels[levelId].orphanedLessonIds).toContain(unknownLessonId);
      }
      expect(parsed.progress.levels.a1.reviewQueue).toEqual([]);
      expect(parsed.progress.levels.a2.reviewQueue).toEqual([]);
      expect(parsed.progress.levels.a1.historicalActivityDispositions[0]?.orphanedReview).toEqual(
        a1UnknownReview,
      );
      expect(parsed.progress.levels.a2.historicalActivityDispositions[0]?.orphanedReview).toEqual(
        a2UnknownReview,
      );
  });

  it("keeps V5 historical ledgers intact when pure level helpers write or clear Base", () => {
      const base = emptyProgressV5();
      const seeded = {
        ...base,
        levels: {
          ...base.levels,
          a0: {
            ...base.levels.a0,
            historicalActivityDispositions: [{
              sourceLevel: "a1" as const,
              lessonId: "sounds-1",
              activityId: soundsFirst!.definitionId,
              disposition: "historical-orphan" as const,
              orphanedReview: null,
            }],
          },
        },
      };

      const recorded = recordCanDoEvidence(seeded.levels.a0, {
        canDoId: "a0-can-do",
        visitedLessonId: "sounds-1",
        at: T1,
      });
      const cleared = clearLevel({ ...seeded, levels: { ...seeded.levels, a0: recorded } }, "a0", T2);

      expect(recorded.canDos["a0-can-do"]).toEqual({
        canDoId: "a0-can-do",
        visitedLessonIds: ["sounds-1"],
        practicedLessonIds: [],
        acceptedTransferExerciseIds: [],
        checkpointAttemptIds: [],
        lastUpdatedAt: T1,
        historicalCheckpointRefs: [],
      });
      expect(recorded.historicalActivityDispositions).toEqual(
        seeded.levels.a0.historicalActivityDispositions,
      );
      expect(cleared.levels.a0).toEqual(emptyProgressV5().levels.a0);
  });

  it("creates an empty Base for empty V4 while ownership still exposes A1 44 and A2 60", () => {
    const v5 = migrateV4ToV5(emptyProgressV4());
    expect(v5.levels.a0).toEqual(emptyProgressV5().levels.a0);
    expect(lessonIdsForLevel("a1")).toHaveLength(44);
    expect(lessonIdsForLevel("a2")).toHaveLength(60);
  });
});
