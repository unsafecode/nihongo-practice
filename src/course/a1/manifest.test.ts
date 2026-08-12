import { describe, expect, it } from "vitest";
import {
  A1_LESSON_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_MODULE_IDS,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
} from "./manifest";

const CANONICAL_A1_MODULE_ORDER = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
] as const;

const RETAINED_A1_MODULE_ORDER = [
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
] as const;

function fourLessons(moduleId: string): string[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

describe("A1 manifest retained partition", () => {
  it("keeps the existing canonical A1 aggregate unchanged at 16 modules / 64 lessons", () => {
    expect(A1_MODULE_IDS).toEqual(CANONICAL_A1_MODULE_ORDER);
    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(A1_LESSON_IDS).toEqual(CANONICAL_A1_MODULE_ORDER.flatMap(fourLessons));
    expect(A1_LESSON_IDS_BY_MODULE.sounds).toEqual(fourLessons("sounds"));
    expect(A1_LESSON_IDS_BY_MODULE["sentence-foundations"]).toEqual(
      fourLessons("sentence-foundations"),
    );
  });

  it("exports the interim retained runtime A1 partition at 11 modules / 44 lessons", () => {
    expect(A1_RETAINED_MODULE_IDS).toEqual(RETAINED_A1_MODULE_ORDER);
    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toEqual(RETAINED_A1_MODULE_ORDER.flatMap(fourLessons));
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);

    for (const moduleId of RETAINED_A1_MODULE_ORDER) {
      expect(A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId]).toEqual(fourLessons(moduleId));
    }
  });

  it("deep-freezes retained A1 partition arrays and excludes Base-owned stable lessons", () => {
    expect(Object.isFrozen(A1_RETAINED_MODULE_IDS)).toBe(true);
    expect(Object.isFrozen(A1_RETAINED_LESSON_IDS)).toBe(true);
    expect(Object.isFrozen(A1_RETAINED_LESSON_IDS_BY_MODULE)).toBe(true);
    for (const moduleId of A1_RETAINED_MODULE_IDS) {
      expect(Object.isFrozen(A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId])).toBe(true);
    }

    expect(A1_RETAINED_MODULE_IDS).not.toEqual(A1_MODULE_IDS);
    expect(A1_RETAINED_LESSON_IDS).not.toContain("sounds-1");
    expect(A1_RETAINED_LESSON_IDS).not.toContain("sentence-foundations-1");
    expect(A1_RETAINED_LESSON_IDS).not.toContain("topic-questions-1");
    expect(A1_RETAINED_LESSON_IDS).not.toContain("polite-verbs-1");
    expect(A1_RETAINED_LESSON_IDS).not.toContain("time-movement-1");
  });
});
