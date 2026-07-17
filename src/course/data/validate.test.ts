import { describe, expect, it } from "vitest";
import { semanticIconIds } from "../../components/icons/Icon";
import { lessonPath } from "../../routing/routePaths";
import { courseModules } from "./course";
import { courseModules as legacyCourseModules } from "../catalog/assembleCourse";
import { examples } from "./examples";
import type {
  CourseModule,
  Lesson,
  LessonSections,
  PhaseId,
  StaticExample,
} from "./types";
import { findPrerequisiteCycle, validateCourse } from "./validate";

function testSource(referenceId: string) {
  return { domain: "test" as const, referenceId };
}

function wordSegment(id: string, jp: string, romaji: string) {
  return {
    id,
    jp,
    romaji,
    kind: "word" as const,
    tokenKind: "lexical" as const,
    boundaryBefore: "attach" as const,
    source: testSource(`segment:${id}`),
  };
}

function endingSegment(id: string, jp: string, romaji: string) {
  return {
    id,
    jp,
    romaji,
    kind: "ending" as const,
    tokenKind: "morpheme" as const,
    boundaryBefore: "attach" as const,
    source: testSource(`segment:${id}`),
  };
}

/**
 * Two segmented fixture examples forming a genuine before/after minimal pair
 * (ねこ → ねこだ) so `validSections` can declare an honest single-delta
 * comparison the real `validateComparison` accepts. Synthetic `.toEqual([])`
 * fixtures pass these as the example table; `.toContain` fixtures may pass
 * `{}` because the specific error they assert precedes/ignores example lookup.
 */
function fixtureExamples(): Record<string, StaticExample> {
  return {
    "fx-base": {
      id: "fx-base",
      jp: "ねこ",
      romaji: "neko",
      segments: [wordSegment("0", "ねこ", "neko")],
    },
    "fx-changed": {
      id: "fx-changed",
      jp: "ねこだ",
      romaji: "nekoda",
      segments: [wordSegment("0", "ねこ", "neko"), endingSegment("1", "だ", "da")],
    },
  };
}

/**
 * A fully valid typed four-section set (rule → comparison → explore → recap)
 * anchored to a specific lesson identity so the exploration's return target
 * resolves through the same `lessonPath`/route contract production uses.
 */
function validSections(
  moduleId: string,
  lessonId: string,
  objectiveId: string,
): LessonSections {
  return [
    { id: "rule", copyId: `${lessonId}-rule`, gear: "topic" },
    {
      id: "comparison",
      copyId: `${lessonId}-comparison`,
      comparison: {
        id: `cmp-${lessonId}`,
        baseExampleId: "fx-base",
        changedExampleId: "fx-changed",
        contrastDimension: "ending",
        changedGearIds: ["だ"],
        changedSegmentIds: ["1"],
      },
    },
    {
      id: "explore",
      copyId: `${lessonId}-explore`,
      exploration: {
        kind: "tool",
        data: {
          id: `exp-${lessonId}`,
          objectiveId,
          target: "syllabary",
          returnTarget: {
            pathname: lessonPath(moduleId, lessonId),
            sectionId: "explore",
          },
        },
      },
    },
    { id: "recap", copyId: `${lessonId}-recap` },
  ];
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  const id = overrides.id ?? "lesson-a";
  const moduleId = overrides.moduleId ?? "module-a";
  const objectiveCopyIds = overrides.objectiveCopyIds ?? [id];
  return {
    id,
    moduleId,
    order: 1,
    titleCopyId: id,
    objectiveCopyIds,
    introducedConceptIds: [],
    requiredConceptIds: [],
    estimatedMinutes: 5,
    sections: validSections(moduleId, id, objectiveCopyIds[0]),
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
    estimatedMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes!, 0),
    coverage: { verbCount: 0, vocabularyCount: 0 },
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
    expect(validateCourse(twoValidModules(), fixtureExamples())).toEqual([]);
  });

  it("rejects examples missing token metadata instead of synthesizing fallbacks", () => {
    const missingTokenKind = fixtureExamples();
    missingTokenKind["fx-base"] = {
      id: "fx-base",
      jp: "ねこ",
      romaji: "neko",
      segments: [
        {
          id: "0",
          jp: "ねこ",
          romaji: "neko",
          kind: "word",
          boundaryBefore: "attach",
          source: testSource("segment:0"),
        },
      ],
    } as StaticExample;
    expect(validateCourse(twoValidModules(), missingTokenKind)).toContain(
      "example romaji segments:fx-base",
    );

    const missingBoundary = fixtureExamples();
    missingBoundary["fx-base"] = {
      id: "fx-base",
      jp: "ねこ",
      romaji: "neko",
      segments: [
        {
          id: "0",
          jp: "ねこ",
          romaji: "neko",
          kind: "word",
          tokenKind: "lexical",
          source: testSource("segment:0"),
        },
      ],
    } as StaticExample;
    expect(validateCourse(twoValidModules(), missingBoundary)).toContain(
      "example romaji segments:fx-base",
    );

    const missingId = fixtureExamples();
    missingId["fx-base"] = {
      id: "fx-base",
      jp: "ねこ",
      romaji: "neko",
      segments: [
        {
          jp: "ねこ",
          romaji: "neko",
          kind: "word",
          tokenKind: "lexical",
          boundaryBefore: "attach",
          source: testSource("segment:0"),
        },
      ],
    } as StaticExample;
    expect(validateCourse(twoValidModules(), missingId)).toContain(
      "example romaji segments:fx-base",
    );
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
      expect(validateCourse([moduleA], fixtureExamples())).toEqual([]);
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
    expect(validateCourse([moduleA], fixtureExamples())).toEqual([]);
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
    moduleA.estimatedMinutes = moduleA.estimatedMinutes! + 100;
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
      expect(validateCourse([moduleA], fixtureExamples())).toEqual([]);
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

  it("runs typed comparison validation over a lesson's sections", () => {
    const base = makeLesson({ id: "lesson-a", moduleId: "module-a" });
    const broken = asLesson({
      ...base,
      sections: [
        base.sections![0],
        {
          id: "comparison",
          copyId: "lesson-a-comparison",
          comparison: {
            id: "cmp-lesson-a",
            baseExampleId: "missing-example",
            changedExampleId: "fx-changed",
            contrastDimension: "ending",
            changedGearIds: ["だ"],
            changedSegmentIds: ["1"],
          },
        },
        base.sections![2],
        base.sections![3],
      ],
    });
    const moduleA = makeModule({ lessons: [broken] });
    expect(validateCourse([moduleA], fixtureExamples())).toContain(
      "comparison-unknown-example:cmp-lesson-a:missing-example",
    );
  });

  it("runs typed exploration validation over a lesson's sections", () => {
    const base = makeLesson({ id: "lesson-a", moduleId: "module-a" });
    const broken = asLesson({
      ...base,
      sections: [
        base.sections![0],
        base.sections![1],
        {
          id: "explore",
          copyId: "lesson-a-explore",
          exploration: {
            kind: "tool",
            data: {
              id: "exp-lesson-a",
              objectiveId: "not-an-objective",
              target: "syllabary",
              returnTarget: {
                pathname: lessonPath("module-a", "lesson-a"),
                sectionId: "explore",
              },
            },
          },
        },
        base.sections![3],
      ],
    });
    const moduleA = makeModule({ lessons: [broken] });
    expect(validateCourse([moduleA], fixtureExamples())).toContain(
      "exploration-unknown-objective:exp-lesson-a:not-an-objective",
    );
  });
});

describe("course data invariants (real data)", () => {
  it("contains 12 modules and 48 lessons (the validated A1 release)", () => {
    expect(courseModules).toHaveLength(12);
    expect(courseModules.flatMap((courseModule) => courseModule.lessons)).toHaveLength(
      48,
    );
  });

  it("has unique IDs and valid references (checked via the legacy full-shape validator against the legacy-full catalog; the live A1 courseModules has its own dedicated validateA1Release pipeline, proven in data/course.test.ts, since validateCourse's phase/estimate/sections checks do not apply to the sections-less A1 release)", () => {
    expect(validateCourse(legacyCourseModules, examples)).toEqual([]);
  });

  it("orders modules 1 through 12", () => {
    expect(courseModules.map((courseModule) => courseModule.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("gives every module exactly four lessons (the approved A1 uniform budget)", () => {
    expect(courseModules.map((courseModule) => courseModule.lessons.length)).toEqual([
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
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

  it("publishes exactly the approved 48 lesson IDs, including the consolidated sounds-4 (no sounds-5) and renumbered capstones-1..4", () => {
    const lessonIds = courseModules
      .flatMap((courseModule) => courseModule.lessons)
      .map((lesson) => lesson.id)
      .sort();
    expect(lessonIds).toEqual(
      [
        "sounds-1", "sounds-2", "sounds-3", "sounds-4",
        "introductions-1", "introductions-2", "introductions-3", "introductions-4",
        "essential-questions-1", "essential-questions-2", "essential-questions-3", "essential-questions-4",
        "actions-1", "actions-2", "actions-3", "actions-4",
        "routines-1", "routines-2", "routines-3", "routines-4",
        "past-negative-1", "past-negative-2", "past-negative-3", "past-negative-4",
        "places-1", "places-2", "places-3", "places-4",
        "people-1", "people-2", "people-3", "people-4",
        "descriptions-1", "descriptions-2", "descriptions-3", "descriptions-4",
        "shopping-1", "shopping-2", "shopping-3", "shopping-4",
        "existence-needs-1", "existence-needs-2", "existence-needs-3", "existence-needs-4",
        "capstones-1", "capstones-2", "capstones-3", "capstones-4",
      ].sort(),
    );
  });

  it("makes module 12 the capstones module: four renumbered capstone lessons", () => {
    const capstones = courseModules.find(
      (courseModule) => courseModule.id === "capstones",
    );
    expect(capstones).toBeDefined();
    expect(capstones!.order).toBe(12);
    expect(capstones!.lessons.map((lesson) => lesson.id)).toEqual([
      "capstones-1",
      "capstones-2",
      "capstones-3",
      "capstones-4",
    ]);
  });

  it("gives every module a valid semantic icon id", () => {
    for (const courseModule of courseModules) {
      expect(semanticIconIds).toContain(courseModule.iconId);
    }
  });
});

