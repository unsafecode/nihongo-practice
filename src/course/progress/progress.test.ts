import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  parseProgress,
  setLessonComplete,
  setLastVisited,
  completionPercent,
} from "./progress";
import {
  loadProgress,
  resetStoredProgress,
  STORAGE_KEY,
} from "./ProgressContext";

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

describe("course progress", () => {
  it("parses valid v1 progress", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 1,
      completedLessonIds: ["sounds-core"],
      lastVisitedLessonId: "sounds-special",
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed.progress.completedLessonIds).toEqual(["sounds-core"]);
    expect(parsed.corrupted).toBe(false);
  });

  it("isolates corrupt data", () => {
    expect(parseProgress("{bad")).toEqual({
      progress: emptyProgress(),
      corrupted: true,
    });
  });

  it("rejects unsupported schema versions", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 2,
      completedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed.corrupted).toBe(true);
  });

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
    storage.setItem(STORAGE_KEY, JSON.stringify({ completedLessonIds: ["sounds-core"] }));
    storage.setItem("nihongo.script", "hiragana");

    expect(resetStoredProgress(storage)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("nihongo.script")).toBe("hiragana");
  });

  it("reports that null storage cannot persist progress", () => {
    expect(loadProgress(null).persistenceAvailable).toBe(false);
  });

  it("completes and reopens a lesson", () => {
    const done = setLessonComplete(emptyProgress(), "sounds-core", true);
    expect(done.completedLessonIds).toEqual(["sounds-core"]);
    expect(setLessonComplete(done, "sounds-core", false).completedLessonIds).toEqual([]);
  });

  it("records the last visited lesson", () => {
    expect(setLastVisited(emptyProgress(), "sounds-special").lastVisitedLessonId)
      .toBe("sounds-special");
  });

  it("calculates percentage across 16 lessons", () => {
    expect(completionPercent(["a", "b", "c", "d"], 16)).toBe(25);
  });
});
