import { describe, expect, it } from "vitest";
import { courseModulesByLevel } from "./course";
import type { CourseModule } from "./types";
import {
  BaseCourseShapeError,
  assertA1CourseShape,
  assertA2CourseShape,
  assertBaseCourseShape,
} from "./runtimeShapeAssertion";

function clonedLevel(level: "a0" | "a1" | "a2"): CourseModule[] {
  return courseModulesByLevel[level].map((module) => ({
    ...module,
    prerequisiteIds: [...module.prerequisiteIds],
    outcomeCopyIds: [...module.outcomeCopyIds],
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      objectiveCopyIds: [...lesson.objectiveCopyIds],
    })),
  }));
}

describe("runtime course shape assertions", () => {
  it("accepts the exact published Base, A1, and A2 shapes", () => {
    expect(() => assertBaseCourseShape(courseModulesByLevel.a0)).not.toThrow();
    expect(() => assertA1CourseShape(courseModulesByLevel.a1)).not.toThrow();
    expect(() => assertA2CourseShape(courseModulesByLevel.a2)).not.toThrow();
    expect(courseModulesByLevel.a0).toHaveLength(10);
    expect(courseModulesByLevel.a1).toHaveLength(11);
    expect(courseModulesByLevel.a2).toHaveLength(15);
  });

  it("attributes empty and wrong-count shapes to their selected level", () => {
    expect(() => assertBaseCourseShape([])).toThrow(BaseCourseShapeError);
    expect(() => assertBaseCourseShape([])).toThrow(/a0/);
    expect(() => assertA1CourseShape(clonedLevel("a1").slice(1))).toThrow(
      /a1.*exactly 11 modules/i,
    );
    expect(() => assertA2CourseShape(clonedLevel("a2").slice(1))).toThrow(
      /a2.*exactly 15 modules/i,
    );
  });

  it("rejects duplicate module and lesson identifiers", () => {
    const duplicateModule = clonedLevel("a0");
    duplicateModule[1] = { ...duplicateModule[1]!, id: duplicateModule[0]!.id };
    expect(() => assertBaseCourseShape(duplicateModule)).toThrow(/a0.*duplicate module id/i);

    const duplicateLesson = clonedLevel("a1");
    duplicateLesson[1] = {
      ...duplicateLesson[1]!,
      lessons: [
        { ...duplicateLesson[1]!.lessons[0]!, id: duplicateLesson[0]!.lessons[0]!.id },
        ...duplicateLesson[1]!.lessons.slice(1),
      ],
    };
    expect(() => assertA1CourseShape(duplicateLesson)).toThrow(/a1.*duplicate lesson id/i);
  });

  it("rejects a mismatched owner and missing navigation fields", () => {
    const mismatchedOwner = clonedLevel("a2");
    mismatchedOwner[0] = {
      ...mismatchedOwner[0]!,
      lessons: [{ ...mismatchedOwner[0]!.lessons[0]!, moduleId: "other" }, ...mismatchedOwner[0]!.lessons.slice(1)],
    };
    expect(() => assertA2CourseShape(mismatchedOwner)).toThrow(/a2.*owning module/i);

    const missingFields = clonedLevel("a0");
    missingFields[0] = {
      ...missingFields[0]!,
      outcomeCopyIds: [],
      lessons: [
        { ...missingFields[0]!.lessons[0]!, titleCopyId: "", objectiveCopyIds: [] },
        ...missingFields[0]!.lessons.slice(1),
      ],
    };
    expect(() => assertBaseCourseShape(missingFields)).toThrow(/a0.*outcomeCopyIds/i);
  });

  it("rejects prerequisite references that are unknown or not earlier, wrong module order, and non-four lesson modules", () => {
    const badPrerequisite = clonedLevel("a1");
    badPrerequisite[1] = { ...badPrerequisite[1]!, prerequisiteIds: ["unknown"] };
    expect(() => assertA1CourseShape(badPrerequisite)).toThrow(/a1.*prerequisite.*unknown/i);

    const wrongOrder = clonedLevel("a2");
    wrongOrder[0] = { ...wrongOrder[0]!, order: 2 };
    expect(() => assertA2CourseShape(wrongOrder)).toThrow(/a2.*invalid module order/i);

    const threeLessons = clonedLevel("a0");
    threeLessons[0] = { ...threeLessons[0]!, lessons: threeLessons[0]!.lessons.slice(1) };
    expect(() => assertBaseCourseShape(threeLessons)).toThrow(/a0.*exactly four lessons/i);
  });
});
