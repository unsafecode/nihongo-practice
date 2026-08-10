import { describe, expect, it } from "vitest";
import type { CourseLevelId } from "./types";
import {
  COURSE_LEVEL_PREFERENCE_KEY,
  courseLevelEvidence,
  parseExplicitCourseLevel,
  readCourseLevelPreference,
  resolveCourseLevel,
  writeCourseLevelPreference,
} from "./selection";
import {
  emptyProgressV5,
  type CourseProgressV5,
  type LevelProgressV5,
} from "../progress/progress";

const progressStorageKey = "nihongo.course.progress";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
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

function throwingStorage(): Storage {
  return {
    get length(): number {
      throw new Error("blocked");
    },
    clear: () => {
      throw new Error("blocked");
    },
    getItem: () => {
      throw new Error("blocked");
    },
    key: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
}

function withLevel(
  level: CourseLevelId,
  mutate: (levelProgress: LevelProgressV5) => LevelProgressV5,
): CourseProgressV5 {
  const progress = emptyProgressV5();
  return {
    ...progress,
    levels: {
      ...progress.levels,
      [level]: mutate(progress.levels[level]),
    },
  };
}

describe("parseExplicitCourseLevel", () => {
  it("parses only exact explicit URL intent and never defaults", () => {
    expect(parseExplicitCourseLevel("base")).toBe("a0");
    expect(parseExplicitCourseLevel("a1")).toBe("a1");
    expect(parseExplicitCourseLevel("a2")).toBe("a2");

    for (const value of [null, "", "BASE", "A1", "A2", " a1 ", "b1"]) {
      expect(parseExplicitCourseLevel(value)).toBeNull();
    }
  });
});

describe("resolveCourseLevel", () => {
  const emptyEvidence: Record<CourseLevelId, boolean> = {
    a0: false,
    a1: false,
    a2: false,
  };

  it("uses explicit URL intent before preference or evidence", () => {
    expect(
      resolveCourseLevel({
        explicit: "a2",
        preference: "a0",
        resumeLevel: "a0",
        evidence: { a0: true, a1: true, a2: false },
      }),
    ).toBe("a2");
  });

  it("uses a stored preference when explicit intent is absent", () => {
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: "a2",
        resumeLevel: "a0",
        evidence: { a0: false, a1: true, a2: false },
      }),
    ).toBe("a2");
  });

  it("uses an unacknowledged migration resume level before ordinary evidence fallback", () => {
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: "a0",
        evidence: { a0: true, a1: true, a2: false },
      }),
    ).toBe("a0");
  });

  it("still allows A2 resume when the migration notice points there", () => {
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: "a2",
        evidence: { a0: false, a1: true, a2: false },
      }),
    ).toBe("a2");
  });

  it("keeps returning A1/A2 learners on A1 when no explicit or preference exists", () => {
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: null,
        evidence: { ...emptyEvidence, a1: true },
      }),
    ).toBe("a1");
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: null,
        evidence: { ...emptyEvidence, a2: true },
      }),
    ).toBe("a1");
  });

  it("defaults fresh learners and A0-only evidence to Base", () => {
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: null,
        evidence: emptyEvidence,
      }),
    ).toBe("a0");
    expect(
      resolveCourseLevel({
        explicit: null,
        preference: null,
        resumeLevel: null,
        evidence: { ...emptyEvidence, a0: true },
      }),
    ).toBe("a0");
  });
});

describe("course level preference storage", () => {
  it("stores internal level ids under the level preference key without mutating progress", () => {
    const storage = memoryStorage({ [progressStorageKey]: "kept" });

    expect(writeCourseLevelPreference(storage, "a0")).toBe(true);
    expect(storage.getItem(COURSE_LEVEL_PREFERENCE_KEY)).toBe("a0");
    expect(storage.getItem(progressStorageKey)).toBe("kept");
    expect(readCourseLevelPreference(storage)).toBe("a0");
  });

  it("ignores invalid stored values and blocked storage", () => {
    expect(readCourseLevelPreference(memoryStorage({ [COURSE_LEVEL_PREFERENCE_KEY]: "base" }))).toBeNull();
    expect(readCourseLevelPreference(memoryStorage({ [COURSE_LEVEL_PREFERENCE_KEY]: "A2" }))).toBeNull();
    expect(readCourseLevelPreference(throwingStorage())).toBeNull();
    expect(writeCourseLevelPreference(throwingStorage(), "a2")).toBe(false);
    expect(readCourseLevelPreference(null)).toBeNull();
    expect(writeCourseLevelPreference(null, "a1")).toBe(false);
  });
});

describe("courseLevelEvidence", () => {
  it("returns false for every level in an empty V5 progress record", () => {
    expect(courseLevelEvidence(emptyProgressV5())).toEqual({
      a0: false,
      a1: false,
      a2: false,
    });
  });

  it.each([
    ["lesson records", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      lessons: {
        "lesson-1": {
          visitedAt: null,
          practicedAt: null,
          consolidatedAt: null,
          attemptedExerciseIds: [],
          acceptedExerciseIds: [],
        },
      },
    })],
    ["last visited pointer", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      lastVisitedLessonId: "lesson-1",
    })],
    ["Can-do evidence", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      canDos: {
        "can-do-1": {
          canDoId: "can-do-1",
          visitedLessonIds: [],
          practicedLessonIds: [],
          acceptedTransferExerciseIds: [],
          checkpointAttemptIds: [],
          historicalCheckpointRefs: [],
          lastUpdatedAt: "2026-08-06T00:00:00.000Z",
        },
      },
    })],
    ["checkpoint attempts", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      checkpointAttempts: [{
        id: "attempt-1",
        checkpointId: "checkpoint-1",
        attemptedAt: "2026-08-06T00:00:00.000Z",
        acceptedExerciseIds: [],
        sampledCanDoIds: [],
      }],
    })],
    ["active review queue", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      reviewQueue: [{
        reviewKey: "review-1",
        lessonId: "lesson-1",
        exerciseDefinitionId: "exercise-1",
        targetConceptIds: [],
        targetLexemeIds: [],
        mistakeCount: 1,
        lastMistakeAt: "2026-08-06T00:00:00.000Z",
      }],
    })],
    ["orphan lesson records", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      orphanedLessonRecords: {
        "old-lesson": {
          visitedAt: null,
          practicedAt: null,
          consolidatedAt: null,
          attemptedExerciseIds: [],
          acceptedExerciseIds: [],
        },
      },
    })],
    ["orphan lesson ids", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      orphanedLessonIds: ["old-lesson"],
    })],
    ["orphan review keys", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      orphanedReviewKeys: ["old-review"],
    })],
    ["historical activity dispositions", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      historicalActivityDispositions: [{
        sourceLevel: "a1",
        lessonId: "lesson-1",
        activityId: "activity-1",
        disposition: "historical-orphan",
        orphanedReview: null,
      }],
    })],
  ] as const)("detects %s as evidence", (_label, mutate) => {
    expect(courseLevelEvidence(withLevel("a2", mutate))).toEqual({
      a0: false,
      a1: false,
      a2: true,
    });
  });
});
