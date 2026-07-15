import { describe, expect, it } from "vitest";
import { buildCourseMapModel, type CourseMapModuleOutline } from "./courseMapModel";
import { courseModules } from "../data/course";

/**
 * Minimal synthetic fixtures (mirrors the `ModuleOutline` convention in
 * ../progress/progress.ts): only the fields the pure model inspects, so
 * every scenario below stays small and easy to read. `buildCourseMapModel`
 * is generic, so the real `CourseModule[]` (see the "real course data"
 * describe block) satisfies the same input type with no cast.
 */
function moduleFixture(
  overrides: Partial<CourseMapModuleOutline> & Pick<CourseMapModuleOutline, "id" | "phase">,
): CourseMapModuleOutline {
  return {
    prerequisiteIds: [],
    lessons: [],
    ...overrides,
  };
}

function lessons(ids: string[]): { id: string }[] {
  return ids.map((id) => ({ id }));
}

describe("buildCourseMapModel: phase grouping and order", () => {
  it("groups modules into all four phases, always in orient/build/navigate/synthesize order", () => {
    // Deliberately interleaved input order, out of phase order, to prove
    // grouping is a real regrouping rather than trusting contiguous input.
    const modules = [
      moduleFixture({ id: "m-synth", phase: "synthesize", lessons: lessons(["s1"]) }),
      moduleFixture({ id: "m-orient-b", phase: "orient", lessons: lessons(["ob1"]) }),
      moduleFixture({ id: "m-build", phase: "build", lessons: lessons(["b1"]) }),
      moduleFixture({ id: "m-orient-a", phase: "orient", lessons: lessons(["oa1"]) }),
      moduleFixture({ id: "m-navigate", phase: "navigate", lessons: lessons(["n1"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);

    expect(model.phases.map((phase) => phase.phaseId)).toEqual([
      "orient",
      "build",
      "navigate",
      "synthesize",
    ]);
  });

  it("keeps each phase's modules in the given array order (not alphabetical/id order)", () => {
    const modules = [
      moduleFixture({ id: "m-orient-b", phase: "orient", lessons: lessons(["ob1"]) }),
      moduleFixture({ id: "m-orient-a", phase: "orient", lessons: lessons(["oa1"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);
    const orientPhase = model.phases.find((phase) => phase.phaseId === "orient");

    expect(orientPhase?.modules.map((entry) => entry.module.id)).toEqual([
      "m-orient-b",
      "m-orient-a",
    ]);
  });

  it("omits no module: every input module appears in exactly one phase group", () => {
    const modules = [
      moduleFixture({ id: "m-orient", phase: "orient", lessons: lessons(["o1"]) }),
      moduleFixture({ id: "m-build", phase: "build", lessons: lessons(["b1"]) }),
      moduleFixture({ id: "m-navigate", phase: "navigate", lessons: lessons(["n1"]) }),
      moduleFixture({ id: "m-synth", phase: "synthesize", lessons: lessons(["s1"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);
    const allModuleIds = model.phases.flatMap((phase) =>
      phase.modules.map((entry) => entry.module.id),
    );

    expect(allModuleIds.sort()).toEqual(
      ["m-build", "m-navigate", "m-orient", "m-synth"].sort(),
    );
  });
});

describe("buildCourseMapModel: recommendation follows §7.3 (prerequisite-aware, via recommendContinuationLessonId)", () => {
  it("skips a module whose advisory prerequisite is still unvisited and recommends the prerequisite's lesson instead", () => {
    // m1 depends on m2, and m2 comes later in array order. §7.3 rule 2 skips
    // m1's unvisited lesson (its prerequisite m2 is not yet fully visited) and
    // lands on m2's lesson, whose prerequisites are all met. This is the
    // single source of truth (recommendContinuationLessonId), not a duplicated
    // first-unvisited scan that would ignore prerequisites.
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", prerequisiteIds: ["m2"], lessons: lessons(["m1-a"]) }),
      moduleFixture({ id: "m2", phase: "orient", lessons: lessons(["m2-a"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);

    expect(model.recommendedLessonId).toBe("m2-a");
    expect(model.recommendedModuleId).toBe("m2");
  });

  it("recommends the first unvisited lesson whose prerequisites are met, in course order", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
      moduleFixture({ id: "m2", phase: "build", prerequisiteIds: ["m1"], lessons: lessons(["c"]) }),
    ];

    const model = buildCourseMapModel(modules, ["a"], null);

    expect(model.recommendedLessonId).toBe("b");
    expect(model.recommendedModuleId).toBe("m1");
  });
});

describe("buildCourseMapModel: opaque legacy visited ids", () => {
  it("does not count an unrecognized legacy id toward visited counts", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
    ];

    const model = buildCourseMapModel(modules, ["a", "legacy-ghost-id"], null);

    expect(model.visitedLessonCount).toBe(1);
    expect(model.totalLessonCount).toBe(2);
  });

  it("does not let an unrecognized legacy id affect the recommendation", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
    ];

    const model = buildCourseMapModel(modules, ["legacy-ghost-id"], null);

    expect(model.recommendedLessonId).toBe("a");
  });
});

describe("buildCourseMapModel: current vs recommended (coincide on the §7.3 continuation)", () => {
  it("resumes the recognized lastVisitedLessonId even when earlier lessons were skipped (§7.3 rule 1)", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
      moduleFixture({ id: "m2", phase: "build", prerequisiteIds: ["m1"], lessons: lessons(["c"]) }),
    ];
    // "a" and the later "c" visited (out of order), "b" skipped; last visited is "c".
    const model = buildCourseMapModel(modules, ["a", "c"], "c");

    // §7.3 rule 1: resume the valid last-visited lesson, not the earliest gap "b".
    // current and recommended therefore coincide on the resumed lesson.
    expect(model.recommendedLessonId).toBe("c");
    expect(model.recommendedModuleId).toBe("m2");
    expect(model.currentLessonId).toBe("c");
    expect(model.currentModuleId).toBe("m2");

    const m1Entry = model.phases.flatMap((p) => p.modules).find((e) => e.module.id === "m1");
    const m2Entry = model.phases.flatMap((p) => p.modules).find((e) => e.module.id === "m2");
    expect(m2Entry?.isRecommended).toBe(true);
    expect(m2Entry?.isCurrent).toBe(true);
    expect(m1Entry?.isRecommended).toBe(false);
    expect(m1Entry?.isCurrent).toBe(false);
  });

  it("marks the same module both current and recommended when they coincide", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a"], "a");

    expect(model.recommendedModuleId).toBe("m1");
    expect(model.currentModuleId).toBe("m1");

    const entry = model.phases.flatMap((p) => p.modules)[0];
    expect(entry.isCurrent).toBe(true);
    expect(entry.isRecommended).toBe(true);
  });

  it("falls back to the recommendation as current when lastVisitedLessonId is null", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    expect(model.currentLessonId).toBe(model.recommendedLessonId);
    expect(model.currentModuleId).toBe(model.recommendedModuleId);
  });
});

describe("buildCourseMapModel: all-visited fallback", () => {
  it("still reports allVisited as a count state, but recommends the valid last-visited lesson (not null) when everything is visited", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b"], "a");

    // allVisited stays a pure count state, but §7.3 keeps recommending the
    // valid last-visited lesson (or the first lesson) rather than going null.
    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("a");
    expect(model.recommendedModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });

  it("uses a recognized lastVisitedLessonId as current, even if it is not in the final module", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", phase: "synthesize", lessons: lessons(["b"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b"], "a");

    expect(model.allVisited).toBe(true);
    expect(model.currentModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });

  it("falls back to the very first lesson (not a capstone) when all lessons are visited and lastVisitedLessonId is null", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", phase: "synthesize", lessons: lessons(["b", "c"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b", "c"], null);

    // §7.3 rule 3 fallback is the first lesson in course order, never a capstone.
    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("a");
    expect(model.currentModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });

  it("falls back to the very first lesson when all lessons are visited and lastVisitedLessonId is an unrecognized opaque id", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", phase: "synthesize", lessons: lessons(["b", "c"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b", "c"], "legacy-ghost-id");

    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("a");
    expect(model.currentModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });
});

describe("buildCourseMapModel: counts", () => {
  it("exposes plain visited/total counts per module and overall", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a", "b", "c"]) }),
      moduleFixture({ id: "m2", phase: "build", lessons: lessons(["d"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "d"], "d");

    expect(model.visitedLessonCount).toBe(2);
    expect(model.totalLessonCount).toBe(4);

    const m1Entry = model.phases.flatMap((p) => p.modules).find((e) => e.module.id === "m1");
    expect(m1Entry?.visitedCount).toBe(1);
    expect(m1Entry?.totalCount).toBe(3);
    expect(m1Entry?.isFullyVisited).toBe(false);

    const m2Entry = model.phases.flatMap((p) => p.modules).find((e) => e.module.id === "m2");
    expect(m2Entry?.visitedCount).toBe(1);
    expect(m2Entry?.totalCount).toBe(1);
    expect(m2Entry?.isFullyVisited).toBe(true);
  });

  it("never reports a module with zero lessons as fully visited", () => {
    const modules = [moduleFixture({ id: "m1", phase: "orient", lessons: [] })];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.phases.flatMap((p) => p.modules)[0];
    expect(entry.isFullyVisited).toBe(false);
  });
});

describe("buildCourseMapModel: prerequisite data", () => {
  it("resolves advisory prerequisite ids to their module objects", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", phase: "build", prerequisiteIds: ["m1"], lessons: lessons(["b"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    const m2Entry = model.phases.flatMap((p) => p.modules).find((e) => e.module.id === "m2");
    expect(m2Entry?.prerequisiteModules.map((m) => m.id)).toEqual(["m1"]);
  });

  it("exposes an empty prerequisite list for a module with no prerequisites (none/start here)", () => {
    const modules = [moduleFixture({ id: "m1", phase: "orient", lessons: lessons(["a"]) })];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.phases.flatMap((p) => p.modules)[0];
    expect(entry.prerequisiteModules).toEqual([]);
  });

  it("silently drops an unknown prerequisite id instead of crashing", () => {
    const modules = [
      moduleFixture({ id: "m1", phase: "orient", prerequisiteIds: ["ghost-module"], lessons: lessons(["a"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.phases.flatMap((p) => p.modules)[0];
    expect(entry.prerequisiteModules).toEqual([]);
  });
});

describe("buildCourseMapModel: defensive edge cases", () => {
  it("handles an empty module list without crashing", () => {
    const model = buildCourseMapModel([], [], null);

    expect(model.phases.every((phase) => phase.modules.length === 0)).toBe(true);
    expect(model.allVisited).toBe(true);
    expect(model.currentModuleId).toBeNull();
    expect(model.currentLessonId).toBeNull();
    expect(model.recommendedModuleId).toBeNull();
    expect(model.recommendedLessonId).toBeNull();
    expect(model.visitedLessonCount).toBe(0);
    expect(model.totalLessonCount).toBe(0);
  });
});

describe("buildCourseMapModel: real course data", () => {
  it("groups the real eight modules into the correct phases and recommends the first lesson when nothing is visited", () => {
    const model = buildCourseMapModel(courseModules, [], null);
    const byPhase = Object.fromEntries(
      model.phases.map((phase) => [phase.phaseId, phase.modules.map((e) => e.module.id)]),
    );

    expect(byPhase.orient).toEqual(["sounds", "sentence-map"]);
    expect(byPhase.build).toEqual(["actions", "time"]);
    expect(byPhase.navigate).toEqual(["places", "people", "questions-existence"]);
    expect(byPhase.synthesize).toEqual(["capstone"]);

    // Nothing visited yet: recommendation is the very first lesson overall.
    expect(model.recommendedLessonId).toBe("sounds-core");
    expect(model.recommendedModuleId).toBe("sounds");
    expect(model.currentModuleId).toBe("sounds");
  });

  it("falls back to the first lesson (not a capstone) once every real lesson is visited with no recognizable current lesson", () => {
    const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
    const model = buildCourseMapModel(courseModules, allLessonIds, null);

    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("sounds-core");
    expect(model.currentModuleId).toBe("sounds");
    expect(model.currentLessonId).toBe("sounds-core");
  });
});
