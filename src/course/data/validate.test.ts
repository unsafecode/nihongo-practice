import { describe, expect, it } from "vitest";
import { semanticIconIds } from "../../components/icons/Icon";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { courseModules } from "./course";
import { examples } from "./examples";
import type { CourseModule, Lesson, LessonSections, PhaseId } from "./types";
import { findPrerequisiteCycle, validateCourse } from "./validate";

function emptySections(): LessonSections {
  return [
    { id: "rule", blocks: [] },
    { id: "comparison", blocks: [] },
    { id: "explore", blocks: [] },
    { id: "recap", blocks: [] },
  ];
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: "lesson-a",
    moduleId: "module-a",
    order: 1,
    titleCopyId: "lesson-a",
    objectiveCopyIds: ["lesson-a"],
    estimatedMinutes: 5,
    sections: emptySections(),
    ...overrides,
  };
}

function makeModule(overrides: Partial<CourseModule> = {}): CourseModule {
  const lessons = overrides.lessons ?? [makeLesson()];
  return {
    id: "module-a",
    phase: "orient",
    order: 1,
    prerequisiteIds: [],
    outcomeCopyIds: ["module-a"],
    estimatedMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    iconId: semanticIconIds[0],
    lessons,
    ...overrides,
  };
}

/**
 * Bypasses compile-time literal constraints (phase / icon / section id) to
 * build otherwise "impossible by type" fixtures that exercise
 * validateCourse's runtime defenses against malformed data. Scoped to this
 * test file only; never used to weaken production types.
 */
function asModule(shape: object): CourseModule {
  return shape as CourseModule;
}

/** Same rationale as `asModule`, scoped to lesson-level fixtures (sections). */
function asLesson(shape: object): Lesson {
  return shape as Lesson;
}

/** Two valid, linearly-dependent modules: a solid baseline to mutate from. */
function twoValidModules(): CourseModule[] {
  const moduleA = makeModule({
    id: "module-a",
    order: 1,
    phase: "orient",
    prerequisiteIds: [],
    lessons: [makeLesson({ id: "lesson-a", moduleId: "module-a", order: 1 })],
  });
  const moduleB = makeModule({
    id: "module-b",
    order: 2,
    phase: "orient",
    prerequisiteIds: ["module-a"],
    lessons: [makeLesson({ id: "lesson-b", moduleId: "module-b", order: 1 })],
  });
  return [moduleA, moduleB];
}

describe("findPrerequisiteCycle", () => {
  it("returns null when the prerequisite graph is acyclic", () => {
    expect(
      findPrerequisiteCycle([
        { id: "a", prerequisiteIds: [] },
        { id: "b", prerequisiteIds: ["a"] },
        { id: "c", prerequisiteIds: ["a", "b"] },
      ]),
    ).toBeNull();
  });

  it("detects a direct two-node cycle", () => {
    const cycle = findPrerequisiteCycle([
      { id: "a", prerequisiteIds: ["b"] },
      { id: "b", prerequisiteIds: ["a"] },
    ]);
    expect(cycle).not.toBeNull();
    expect(cycle).toContain("a");
    expect(cycle).toContain("b");
  });

  it("detects a self-referencing cycle", () => {
    const cycle = findPrerequisiteCycle([{ id: "a", prerequisiteIds: ["a"] }]);
    expect(cycle).not.toBeNull();
    expect(cycle).toContain("a");
  });

  it("detects a longer indirect cycle", () => {
    const cycle = findPrerequisiteCycle([
      { id: "a", prerequisiteIds: ["b"] },
      { id: "b", prerequisiteIds: ["c"] },
      { id: "c", prerequisiteIds: ["a"] },
    ]);
    expect(cycle).not.toBeNull();
    expect(cycle).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });
});

describe("validateCourse (synthetic fixtures)", () => {
  it("passes for a minimal valid two-module fixture", () => {
    expect(validateCourse(twoValidModules(), {})).toEqual([]);
  });

  it("flags a duplicate module id", () => {
    const [moduleA, moduleB] = twoValidModules();
    const dup = makeModule({
      ...moduleB,
      id: "module-a",
      order: 2,
      lessons: [makeLesson({ id: "lesson-c", moduleId: "module-a", order: 1 })],
    });
    expect(validateCourse([moduleA, dup], {})).toContain(
      "duplicate module:module-a",
    );
  });

  it("flags a duplicate lesson id across different modules", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [makeLesson({ id: "shared", moduleId: "module-a", order: 1 })],
    });
    const moduleB = makeModule({
      id: "module-b",
      order: 2,
      prerequisiteIds: ["module-a"],
      lessons: [makeLesson({ id: "shared", moduleId: "module-b", order: 1 })],
    });
    expect(validateCourse([moduleA, moduleB], {})).toContain(
      "duplicate lesson:shared",
    );
  });

  it("flags a lesson whose moduleId does not match its containing module", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [
        makeLesson({ id: "lesson-a", moduleId: "someone-else", order: 1 }),
      ],
    });
    expect(validateCourse([moduleA], {})).toContain("wrong module:lesson-a");
  });

  it("flags an invalid phase", () => {
    const moduleA = asModule({
      ...makeModule(),
      phase: "unknown-phase",
    });
    expect(validateCourse([moduleA], {})).toContain(
      "invalid phase:module-a:unknown-phase",
    );
  });

  it("accepts every real PhaseId value", () => {
    const phases: PhaseId[] = ["orient", "build", "navigate", "synthesize"];
    for (const phase of phases) {
      const moduleA = makeModule({ phase });
      expect(validateCourse([moduleA], {})).toEqual([]);
    }
  });

  it("flags module order that is not contiguous starting at 1", () => {
    const moduleA = makeModule({ id: "module-a", order: 1 });
    const moduleB = makeModule({
      id: "module-b",
      order: 3,
      prerequisiteIds: ["module-a"],
      lessons: [makeLesson({ id: "lesson-b", moduleId: "module-b" })],
    });
    expect(validateCourse([moduleA, moduleB], {})).toContain(
      "module order:module-b",
    );
  });

  it("flags lesson order that is not contiguous starting at 1 within its module", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [
        makeLesson({ id: "lesson-a", moduleId: "module-a", order: 1 }),
        makeLesson({ id: "lesson-a2", moduleId: "module-a", order: 3 }),
      ],
    });
    expect(validateCourse([moduleA], {})).toContain(
      "lesson order:lesson-a2",
    );
  });

  it("flags a prerequisite id that does not exist", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      prerequisiteIds: ["ghost"],
    });
    expect(validateCourse([moduleA], {})).toContain(
      "unknown prerequisite:module-a:ghost",
    );
  });

  it("flags a prerequisite id that does not point to an earlier module", () => {
    const [moduleA, moduleB] = twoValidModules();
    const lateA = makeModule({
      ...moduleA,
      prerequisiteIds: ["module-b"],
    });
    expect(validateCourse([lateA, moduleB], {})).toContain(
      "late prerequisite:module-a:module-b",
    );
  });

  it("flags an empty module with no lessons", () => {
    const moduleA = makeModule({ id: "module-a", order: 1, lessons: [] });
    expect(validateCourse([moduleA], {})).toContain("empty module:module-a");
  });

  it("does not require a fixed lesson count per module", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [
        makeLesson({ id: "lesson-1", moduleId: "module-a", order: 1 }),
        makeLesson({ id: "lesson-2", moduleId: "module-a", order: 2 }),
        makeLesson({ id: "lesson-3", moduleId: "module-a", order: 3 }),
      ],
    });
    expect(validateCourse([moduleA], {})).toEqual([]);
  });

  it("flags a non-positive or non-finite module estimate", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const moduleA = makeModule({ id: "module-a", order: 1 });
      moduleA.estimatedMinutes = bad;
      expect(validateCourse([moduleA], {})).toContain(
        "invalid module estimate:module-a",
      );
    }
  });

  it("flags a non-positive or non-finite lesson estimate", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [
        makeLesson({
          id: "lesson-a",
          moduleId: "module-a",
          order: 1,
          estimatedMinutes: -3,
        }),
      ],
    });
    expect(validateCourse([moduleA], {})).toContain(
      "invalid lesson estimate:lesson-a",
    );
  });

  it("flags a module estimate that does not equal the sum of its lessons", () => {
    const moduleA = makeModule({ id: "module-a", order: 1 });
    moduleA.estimatedMinutes = moduleA.estimatedMinutes + 100;
    expect(validateCourse([moduleA], {})).toContain(
      "module estimate mismatch:module-a",
    );
  });

  it("flags an invalid semantic icon id", () => {
    const moduleA = asModule({ ...makeModule(), iconId: "not-a-real-icon" });
    expect(validateCourse([moduleA], {})).toContain(
      "invalid icon:module-a:not-a-real-icon",
    );
  });

  it("accepts every real semantic icon id", () => {
    for (const iconId of semanticIconIds) {
      const moduleA = makeModule({ iconId });
      expect(validateCourse([moduleA], {})).toEqual([]);
    }
  });

  it("flags a lesson without exactly four sections in the required order", () => {
    const badLesson = asLesson({
      ...makeLesson({ id: "lesson-a", moduleId: "module-a" }),
      sections: [
        { id: "comparison", blocks: [] },
        { id: "rule", blocks: [] },
        { id: "explore", blocks: [] },
        { id: "recap", blocks: [] },
      ],
    });
    const moduleA = makeModule({ lessons: [badLesson] });
    expect(validateCourse([moduleA], {})).toContain(
      "invalid sections:lesson-a",
    );
  });

  it("flags a lesson with a missing section", () => {
    const badLesson = asLesson({
      ...makeLesson({ id: "lesson-a", moduleId: "module-a" }),
      sections: [
        { id: "rule", blocks: [] },
        { id: "comparison", blocks: [] },
        { id: "recap", blocks: [] },
      ],
    });
    const moduleA = makeModule({ lessons: [badLesson] });
    expect(validateCourse([moduleA], {})).toContain(
      "invalid sections:lesson-a",
    );
  });

  it("reports the DFS-detected prerequisite cycle even when order checks are bypassed", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      prerequisiteIds: ["module-b"],
    });
    const moduleB = makeModule({
      id: "module-b",
      order: 1,
      prerequisiteIds: ["module-a"],
      lessons: [makeLesson({ id: "lesson-b", moduleId: "module-b" })],
    });
    const errors = validateCourse([moduleA, moduleB], {});
    expect(errors.some((message) => message.startsWith("prerequisite cycle:"))).toBe(
      true,
    );
  });

  it("keeps existing example/preset checks working over nested sections", () => {
    const moduleA = makeModule({
      id: "module-a",
      order: 1,
      lessons: [
        makeLesson({
          id: "lesson-a",
          moduleId: "module-a",
          sections: [
            {
              id: "rule",
              blocks: [{ type: "rule", copyId: "rule-copy", gear: "x" }],
            },
            {
              id: "comparison",
              blocks: [
                {
                  type: "examples",
                  copyId: "examples-copy",
                  exampleIds: ["missing-example"],
                },
              ],
            },
            { id: "explore", blocks: [] },
            { id: "recap", blocks: [] },
          ],
        }),
      ],
    });
    expect(validateCourse([moduleA], {})).toContain(
      "unknown example:lesson-a:missing-example",
    );
  });
});

describe("course data invariants (real data)", () => {
  it("contains 8 modules and 16 lessons", () => {
    expect(courseModules).toHaveLength(8);
    expect(courseModules.flatMap((courseModule) => courseModule.lessons)).toHaveLength(
      16,
    );
  });

  it("has unique IDs and valid references", () => {
    expect(validateCourse(courseModules, examples)).toEqual([]);
  });

  it("orders modules 1 through 8", () => {
    expect(courseModules.map((courseModule) => courseModule.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("assigns the four phases in the approved orient/build/navigate/synthesize sequence", () => {
    expect(courseModules.map((courseModule) => courseModule.phase)).toEqual([
      "orient",
      "orient",
      "build",
      "build",
      "navigate",
      "navigate",
      "navigate",
      "synthesize",
    ]);
  });

  it("uses variable module sizes, not a fixed two-lessons-per-module shape", () => {
    expect(courseModules.map((courseModule) => courseModule.lessons.length)).toEqual([
      2, 2, 2, 2, 2, 2, 3, 1,
    ]);
  });

  it("keeps prerequisites pointing only to strictly earlier modules", () => {
    const orderById = new Map(
      courseModules.map((courseModule) => [courseModule.id, courseModule.order]),
    );
    for (const courseModule of courseModules) {
      for (const prerequisiteId of courseModule.prerequisiteIds) {
        expect(orderById.get(prerequisiteId)).toBeLessThan(courseModule.order);
      }
    }
  });

  it("has no cycles in the prerequisite graph", () => {
    expect(
      findPrerequisiteCycle(
        courseModules.map((courseModule) => ({
          id: courseModule.id,
          prerequisiteIds: courseModule.prerequisiteIds,
        })),
      ),
    ).toBeNull();
  });

  it("gives every lesson exactly four sections in rule/comparison/explore/recap order", () => {
    for (const courseModule of courseModules) {
      for (const lesson of courseModule.lessons) {
        expect(lesson.sections.map((section) => section.id)).toEqual(
          LESSON_SECTION_IDS,
        );
      }
    }
  });

  it("preserves all 16 existing lesson IDs", () => {
    const lessonIds = courseModules
      .flatMap((courseModule) => courseModule.lessons)
      .map((lesson) => lesson.id)
      .sort();
    expect(lessonIds).toEqual(
      [
        "actions-masu",
        "actions-object",
        "places-action",
        "places-movement",
        "people-desire",
        "people-particles",
        "sentence-omission",
        "sentence-order",
        "sounds-core",
        "sounds-special",
        "time-negative",
        "time-past",
        "traps-particles",
        "traps-verbs",
        "travel-existence",
        "travel-questions",
      ].sort(),
    );
  });

  it("moves traps-particles into the questions/existence module and keeps traps-verbs as the sole capstone lesson", () => {
    const trapsParticles = courseModules
      .flatMap((courseModule) => courseModule.lessons)
      .find((lesson) => lesson.id === "traps-particles");
    const trapsVerbs = courseModules
      .flatMap((courseModule) => courseModule.lessons)
      .find((lesson) => lesson.id === "traps-verbs");
    expect(trapsParticles).toBeDefined();
    expect(trapsVerbs).toBeDefined();
    const trapsParticlesModule = courseModules.find(
      (courseModule) => courseModule.id === trapsParticles!.moduleId,
    )!;
    const trapsVerbsModule = courseModules.find(
      (courseModule) => courseModule.id === trapsVerbs!.moduleId,
    )!;
    expect(trapsParticlesModule.order).toBe(7);
    expect(trapsVerbsModule.order).toBe(8);
    expect(trapsVerbsModule.lessons).toHaveLength(1);
  });

  it("gives every module a valid semantic icon id", () => {
    for (const courseModule of courseModules) {
      expect(semanticIconIds).toContain(courseModule.iconId);
    }
  });

  it("makes every module's estimate equal the sum of its lessons' estimates", () => {
    for (const courseModule of courseModules) {
      const total = courseModule.lessons.reduce(
        (sum, lesson) => sum + lesson.estimatedMinutes,
        0,
      );
      expect(courseModule.estimatedMinutes).toBe(total);
    }
  });
});
