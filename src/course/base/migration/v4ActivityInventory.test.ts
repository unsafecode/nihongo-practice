import { describe, expect, it } from "vitest";
import { V4_ACTIVITY_INVENTORY } from "./v4ActivityInventory";

const REHOMED_LESSON_IDS = [
  "sounds-1",
  "sounds-2",
  "sounds-3",
  "sounds-4",
  "sentence-foundations-1",
  "sentence-foundations-2",
  "sentence-foundations-3",
  "sentence-foundations-4",
  "topic-questions-1",
  "topic-questions-2",
  "topic-questions-3",
  "topic-questions-4",
  "polite-verbs-1",
  "polite-verbs-2",
  "polite-verbs-3",
  "polite-verbs-4",
  "time-movement-1",
  "time-movement-2",
  "time-movement-3",
  "time-movement-4",
] as const;

describe("V4 activity inventory", () => {
  it("covers exactly the 20 rehomed lessons and keeps each lesson populated", () => {
    const lessonIds = [...new Set(V4_ACTIVITY_INVENTORY.map((row) => row.lessonId))].sort();
    expect(lessonIds).toEqual([...REHOMED_LESSON_IDS].sort());

    const rowsByLesson = new Map<string, typeof V4_ACTIVITY_INVENTORY>();
    for (const row of V4_ACTIVITY_INVENTORY) {
      const rows = rowsByLesson.get(row.lessonId) ?? [];
      rowsByLesson.set(row.lessonId, [...rows, row]);
    }

    for (const lessonId of REHOMED_LESSON_IDS) {
      expect(rowsByLesson.get(lessonId)?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("keeps lesson-definition pairs and review keys unique, with non-empty fields", () => {
    const pairs = new Set<string>();
    const reviewKeys = new Set<string>();

    for (const row of V4_ACTIVITY_INVENTORY) {
      expect(row.lessonId.trim()).not.toBe("");
      expect(row.definitionId.trim()).not.toBe("");
      expect(row.reviewKey.trim()).not.toBe("");
      expect(row.practiceFunction.trim()).not.toBe("");

      const pairKey = `${row.lessonId}::${row.definitionId}`;
      expect(pairs.has(pairKey)).toBe(false);
      expect(reviewKeys.has(row.reviewKey)).toBe(false);
      pairs.add(pairKey);
      reviewKeys.add(row.reviewKey);
    }

    expect(pairs.size).toBe(V4_ACTIVITY_INVENTORY.length);
    expect(reviewKeys.size).toBe(V4_ACTIVITY_INVENTORY.length);
  });

  it("is runtime immutable and deep-frozen", () => {
    expect(Object.isFrozen(V4_ACTIVITY_INVENTORY)).toBe(true);
    for (const row of V4_ACTIVITY_INVENTORY) {
      expect(Object.isFrozen(row)).toBe(true);
    }

    expect(() => {
      (V4_ACTIVITY_INVENTORY as V4ActivityInventoryRow[]).push({
        lessonId: "nope",
        definitionId: "nope",
        reviewKey: "nope:nope",
        practiceFunction: "nope",
      });
    }).toThrow();
  });
});

interface V4ActivityInventoryRow {
  lessonId: string;
  definitionId: string;
  reviewKey: string;
  practiceFunction: string;
}
