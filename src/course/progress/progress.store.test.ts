import { describe, expect, it } from "vitest";
import {
  loadProgress,
  persistProgress,
  resetStoredProgress,
} from "./ProgressContext";
import { emptyProgressV4 } from "./progress";

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
    expect(loaded.loadStatus).toBe("current");
    expect(loaded.progress.levels.a1.reviewQueue).toEqual([]);
    expect(loaded.progress.levels.a1.orphanedReviewKeys).toEqual([
      "ghost-lesson:ghost-lesson-x1",
    ]);
    // Untouched raw storage: reconciliation is an in-memory projection only
    // (persisting it back is the calling React effect's responsibility).
    expect(storage.getItem("nihongo.course.progress")).toBe(
      JSON.stringify(stored),
    );
  });
});
