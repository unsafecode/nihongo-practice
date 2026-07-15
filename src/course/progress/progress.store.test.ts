import { describe, expect, it } from "vitest";
import {
  loadProgress,
  persistProgress,
  resetStoredProgress,
} from "./ProgressContext";
import { emptyProgress } from "./progress";

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

describe("progress persistence results", () => {
  it("distinguishes saved, removed, and unavailable outcomes", () => {
    const storage = memoryStorage();
    expect(persistProgress(storage, emptyProgress())).toEqual({ status: "saved" });
    expect(resetStoredProgress(storage)).toEqual({ status: "removed" });
    expect(persistProgress(null, emptyProgress())).toEqual({
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

  it("reconciles an obsolete stored review entry into orphaned metadata on load", () => {
    const storage = memoryStorage();
    storage.setItem(
      "nihongo.course.progress",
      JSON.stringify({
        ...emptyProgress(),
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
      }),
    );
    const loaded = loadProgress(storage);
    expect(loaded.loadStatus).toBe("current");
    expect(loaded.progress.reviewQueue).toEqual([]);
    expect(loaded.progress.orphanedReviewKeys).toEqual([
      "ghost-lesson:ghost-lesson-x1",
    ]);
  });
});
