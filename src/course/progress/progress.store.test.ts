import { describe, expect, it } from "vitest";
import {
  loadProgress,
  persistProgress,
  resetStoredProgress,
  STORAGE_KEY,
} from "./ProgressContext";
import { emptyProgressV4 } from "./progress";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { reviewKeyFor } from "./reviewQueue";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

/**
 * A real, Map-backed storage adapter whose reads and removals work normally
 * but whose `setItem` always throws — the same controlled failure a full or
 * privacy-locked browser storage produces. Used to exercise the genuine
 * write path (`persistProgress` via `writeSetting`), not a mock of the
 * function under test.
 */
function writeBlockedMemoryStorage(initial: Readonly<Record<string, string>> = {}): Storage {
  const values = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: () => {
      throw new Error("storage quota exceeded");
    },
  };
}

function catalogV1Payload(): string {
  const currentDefinitionId =
    getLessonExercises("introductions-1")!.exercises[0]!.definitionId;
  const removedDefinitionId = "introductions-1-round-1-8";
  const knownReview = {
    reviewKey: reviewKeyFor("introductions-1", currentDefinitionId),
    lessonId: "introductions-1",
    exerciseDefinitionId: currentDefinitionId,
    targetConceptIds: ["a1-concept-topic-wa"],
    targetLexemeIds: [],
    mistakeCount: 2,
    lastMistakeAt: "2026-07-16T10:00:00.000Z",
  };
  const removedReview = {
    reviewKey: reviewKeyFor("introductions-1", removedDefinitionId),
    lessonId: "introductions-1",
    exerciseDefinitionId: removedDefinitionId,
    targetConceptIds: ["a1-concept-topic-wa"],
    targetLexemeIds: [],
    mistakeCount: 1,
    lastMistakeAt: "2026-07-16T11:00:00.000Z",
  };
  return JSON.stringify({
    schemaVersion: 4,
    catalogVersion: "a1-a2-v1",
    levels: {
      a1: {
        lessons: {
          "introductions-1": {
            visitedAt: "2026-07-13T10:00:00.000Z",
            practicedAt: "2026-07-14T10:00:00.000Z",
            consolidatedAt: null,
            attemptedExerciseIds: [currentDefinitionId, removedDefinitionId],
            acceptedExerciseIds: [currentDefinitionId],
          },
        },
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: "introductions-1",
        reviewQueue: [knownReview, removedReview],
        orphanedLessonIds: ["older-a1-lesson"],
        orphanedReviewKeys: ["older-a1-review"],
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
    migrationNotice: {
      fromSchemaVersion: 3,
      preservedVisitedLessonIds: ["sounds-1"],
      resetEvidenceLessonIds: [],
      acknowledgedAt: null,
    },
    updatedAt: "2026-07-16T11:00:00.000Z",
  });
}

describe("progress persistence results", () => {
  it("distinguishes saved, removed, and unavailable outcomes", () => {
    const storage = memoryStorage();
    expect(persistProgress(storage, emptyProgressV4())).toEqual({ status: "saved" });
    expect(resetStoredProgress(storage)).toEqual({ status: "removed" });
    expect(persistProgress(null, emptyProgressV4())).toEqual({
      status: "unavailable",
    });
  });

  it("reports a migrated load explicitly", () => {
    const storage = memoryStorage();
    storage.setItem(
      "nihongo.course.progress",
      JSON.stringify({
        schemaVersion: 2,
        visitedLessonIds: ["sounds-core"],
        lastVisitedLessonId: "sounds-core",
        updatedAt: "2026-07-13T10:00:00.000Z",
      }),
    );
    expect(loadProgress(storage).loadStatus).toBe("migrated");
  });

  it("normalizes a stored v4 catalog-v1 payload to v2 and persists the reconciled result", () => {
    const rawV1 = catalogV1Payload();
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, rawV1);

    const loaded = loadProgress(storage);

    expect(loaded.corrupted).toBe(false);
    expect(loaded.migrated).toBe(true);
    expect(loaded.persistenceAvailable).toBe(true);
    expect(loaded.progress.catalogVersion).toBe("a1-a2-v2");
    expect(loaded.progress.levels.a1.lessons["introductions-1"]?.attemptedExerciseIds).toEqual(
      JSON.parse(rawV1).levels.a1.lessons["introductions-1"].attemptedExerciseIds,
    );
    expect(loaded.progress.levels.a1.reviewQueue).toHaveLength(1);
    expect(loaded.progress.levels.a1.orphanedReviewKeys).toEqual([
      "older-a1-review",
      reviewKeyFor("introductions-1", "introductions-1-round-1-8"),
    ]);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).catalogVersion).toBe(
      "a1-a2-v2",
    );
  });

  it("keeps the normalized v4 catalog result in memory and raw catalog-v1 bytes on disk when write-back fails", () => {
    const rawV1 = catalogV1Payload();
    const storage = writeBlockedMemoryStorage({ [STORAGE_KEY]: rawV1 });

    const loaded = loadProgress(storage);

    expect(loaded.corrupted).toBe(false);
    expect(loaded.migrated).toBe(true);
    expect(loaded.persistenceAvailable).toBe(false);
    expect(loaded.progress.catalogVersion).toBe("a1-a2-v2");
    expect(storage.getItem(STORAGE_KEY)).toBe(rawV1);
  });

  it("keeps raw v3 storage untouched and migrated progress in memory when the write-back after migration fails", () => {
    // Real controlled failure (Phase 2 Task 5, requirement 4): a stored v3
    // payload migrates in memory, `loadProgress` attempts to write the
    // migrated v4 straight back, and that write fails on a real storage
    // adapter whose `setItem` throws. The raw v3 bytes already on disk must
    // survive completely unmodified, the caller still receives the migrated
    // v4 for in-memory use this session, and persistence is reported
    // unavailable — never a silent success.
    const rawV3 = JSON.stringify({
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: {
        "sounds-1": {
          visitedAt: "2026-07-13T10:00:00.000Z",
          practicedAt: null,
          consolidatedAt: null,
          attemptedExerciseIds: [],
          acceptedExerciseIds: [],
        },
      },
      lastVisitedLessonId: "sounds-1",
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
      updatedAt: "2026-07-13T10:00:00.000Z",
    });
    const storage = writeBlockedMemoryStorage({
      "nihongo.course.progress": rawV3,
    });

    const loaded = loadProgress(storage);

    expect(loaded.migrated).toBe(true);
    expect(loaded.corrupted).toBe(false);
    expect(loaded.loadStatus).toBe("migrated");
    expect(loaded.persistenceAvailable).toBe(false);
    expect(loaded.progress.schemaVersion).toBe(4);
    expect(loaded.progress.levels.a1.lessons["sounds-1"]).toEqual({
      visitedAt: "2026-07-13T10:00:00.000Z",
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    // The raw v3 bytes on disk are byte-for-byte unchanged: the failed
    // write-back never partially overwrote storage.
    expect(storage.getItem("nihongo.course.progress")).toBe(rawV3);
  });

  it("reconciles an obsolete stored review entry into orphaned metadata on load", () => {
    // A raw v3 payload is always migrated to v4 on load (Phase 2 Task 5), and
    // migration clears the review queue entirely regardless of whether its
    // keys are still recognised — so this exercises reconciliation the way it
    // actually still matters post-migration: a *stored v4* payload whose
    // review queue references a lesson/exercise pair the catalog has since
    // stopped recognising (a real, controlled failure scenario for the real
    // storage adapter, not a mock of reconcileReviewQueueEntries itself).
    const storage = memoryStorage();
    const stored = {
      ...emptyProgressV4(),
      levels: {
        ...emptyProgressV4().levels,
        a1: {
          ...emptyProgressV4().levels.a1,
          reviewQueue: [
            {
              reviewKey: "ghost-lesson:ghost-lesson-x1",
              lessonId: "ghost-lesson",
              exerciseDefinitionId: "ghost-lesson-x1",
              targetConceptIds: [],
              targetLexemeIds: [],
              mistakeCount: 2,
              lastMistakeAt: "2026-07-15T10:00:00.000Z",
            },
          ],
        },
      },
    };
    storage.setItem("nihongo.course.progress", JSON.stringify(stored));

    const loaded = loadProgress(storage);
    expect(loaded.loadStatus).toBe("migrated");
    expect(loaded.progress.levels.a1.reviewQueue).toEqual([]);
    expect(loaded.progress.levels.a1.orphanedReviewKeys).toEqual([
      "ghost-lesson:ghost-lesson-x1",
    ]);
    // Catalog reconciliation is a normalization, so the existing migration
    // persistence path writes the usable V2 result back to storage.
    expect(JSON.parse(storage.getItem("nihongo.course.progress")!)).toMatchObject({
      catalogVersion: "a1-a2-v2",
      levels: {
        a1: {
          reviewQueue: [],
          orphanedReviewKeys: ["ghost-lesson:ghost-lesson-x1"],
        },
      },
    });
  });
});
