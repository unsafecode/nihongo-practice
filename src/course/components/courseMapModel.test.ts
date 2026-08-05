import { describe, expect, it } from "vitest";
import {
  buildCourseMapModel,
  type CourseMapAreaOutline,
  type CourseMapModuleOutline,
} from "./courseMapModel";
import { courseModules } from "../data/course";
import { A1_AREAS } from "../a1/areas";

/**
 * Minimal synthetic fixtures (mirrors the `ModuleOutline` convention in
 * ../progress/progress.ts): only the fields the pure model inspects, so
 * every scenario below stays small and easy to read. `buildCourseMapModel`
 * is generic, so the real `CourseModule[]` (see the "real course data"
 * describe block) satisfies the same input type with no cast.
 *
 * The model always exposes a canonical flat module order for recommendation and
 * counting; A1 may additionally expose authored area entries for rendering.
 */
function moduleFixture(
  overrides: Partial<CourseMapModuleOutline> & Pick<CourseMapModuleOutline, "id">,
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

describe("buildCourseMapModel: flat module order", () => {
  it("keeps a level without an authored area catalog flat", () => {
    const model = buildCourseMapModel(
      [moduleFixture({ id: "a2-module", lessons: lessons(["a2-lesson"]) })],
      [],
      null,
    );

    expect(model.areas).toEqual([]);
    expect(model.modules.map((entry) => entry.module.id)).toEqual(["a2-module"]);
  });

  it("keeps every module in the given array order (not alphabetical/id order)", () => {
    const modules = [
      moduleFixture({ id: "m-b", lessons: lessons(["b1"]) }),
      moduleFixture({ id: "m-a", lessons: lessons(["a1"]) }),
      moduleFixture({ id: "m-c", lessons: lessons(["c1"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);

    expect(model.modules.map((entry) => entry.module.id)).toEqual([
      "m-b",
      "m-a",
      "m-c",
    ]);
  });

  describe("buildCourseMapModel: explicit area validation", () => {
    const modules = [
      moduleFixture({ id: "sounds", areaId: "sounds", lessons: lessons(["sounds-1"]) }),
      moduleFixture({
        id: "foundation",
        areaId: "foundations",
        lessons: lessons(["foundation-1"]),
      }),
    ];

    function area(
      id: string,
      moduleIds: readonly string[],
    ): CourseMapAreaOutline {
      return {
        id,
        moduleIds,
        titleCopyId: `${id}-title`,
        descriptionCopyId: `${id}-description`,
      };
    }

    it("fails closed when an explicit area catalog drops a module", () => {
      expect(() =>
        buildCourseMapModel(modules, [], null, {}, [area("sounds", ["sounds"])]),
      ).toThrow('area catalog omits module(s) "foundation"');
    });

    it("fails closed when a module is assigned to two areas", () => {
      expect(() =>
        buildCourseMapModel(modules, [], null, {}, [
          area("sounds", ["sounds"]),
          area("foundations", ["sounds", "foundation"]),
        ]),
      ).toThrow('module "sounds" belongs to more than one area');
    });

    it("fails closed when a module area disagrees with the authored module membership", () => {
      expect(() =>
        buildCourseMapModel(modules, [], null, {}, [
          area("foundations", ["sounds", "foundation"]),
        ]),
      ).toThrow('module "sounds" declares area "sounds", not "foundations"');
    });

    it("fails closed when an area-rendered module has no authored area id", () => {
      const withoutArea = [
        moduleFixture({ id: "sounds", lessons: lessons(["sounds-1"]) }),
      ];

      expect(() =>
        buildCourseMapModel(withoutArea, [], null, {}, [
          area("sounds", ["sounds"]),
        ]),
      ).toThrow('module "sounds" declares area "undefined", not "sounds"');
    });
  });

  it("omits no module: every input module appears in the flat list exactly once", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["b"]) }),
      moduleFixture({ id: "m3", lessons: lessons(["c"]) }),
      moduleFixture({ id: "m4", lessons: lessons(["d"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);
    const allModuleIds = model.modules.map((entry) => entry.module.id);

    expect(allModuleIds.sort()).toEqual(["m1", "m2", "m3", "m4"]);
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
      moduleFixture({ id: "m1", prerequisiteIds: ["m2"], lessons: lessons(["m1-a"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["m2-a"]) }),
    ];

    const model = buildCourseMapModel(modules, [], null);

    expect(model.recommendedLessonId).toBe("m2-a");
    expect(model.recommendedModuleId).toBe("m2");
  });

  it("recommends the first unvisited lesson whose prerequisites are met, in course order", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
      moduleFixture({ id: "m2", prerequisiteIds: ["m1"], lessons: lessons(["c"]) }),
    ];

    const model = buildCourseMapModel(modules, ["a"], null);

    expect(model.recommendedLessonId).toBe("b");
    expect(model.recommendedModuleId).toBe("m1");
  });
});

describe("buildCourseMapModel: opaque legacy visited ids", () => {
  it("does not count an unrecognized legacy id toward visited counts", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
    ];

    const model = buildCourseMapModel(modules, ["a", "legacy-ghost-id"], null);

    expect(model.visitedLessonCount).toBe(1);
    expect(model.totalLessonCount).toBe(2);
  });

  it("does not let an unrecognized legacy id affect the recommendation", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
    ];

    const model = buildCourseMapModel(modules, ["legacy-ghost-id"], null);

    expect(model.recommendedLessonId).toBe("a");
  });
});

describe("buildCourseMapModel: current vs recommended (coincide on the §7.3 continuation)", () => {
  it("resumes the recognized lastVisitedLessonId even when earlier lessons were skipped (§7.3 rule 1)", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
      moduleFixture({ id: "m2", prerequisiteIds: ["m1"], lessons: lessons(["c"]) }),
    ];
    // "a" and the later "c" visited (out of order), "b" skipped; last visited is "c".
    const model = buildCourseMapModel(modules, ["a", "c"], "c");

    // §7.3 rule 1: resume the valid last-visited lesson, not the earliest gap "b".
    // current and recommended therefore coincide on the resumed lesson.
    expect(model.recommendedLessonId).toBe("c");
    expect(model.recommendedModuleId).toBe("m2");
    expect(model.currentLessonId).toBe("c");
    expect(model.currentModuleId).toBe("m2");

    const m1Entry = model.modules.find((e) => e.module.id === "m1");
    const m2Entry = model.modules.find((e) => e.module.id === "m2");
    expect(m2Entry?.isRecommended).toBe(true);
    expect(m2Entry?.isCurrent).toBe(true);
    expect(m1Entry?.isRecommended).toBe(false);
    expect(m1Entry?.isCurrent).toBe(false);
  });

  it("marks the same module both current and recommended when they coincide", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a"], "a");

    expect(model.recommendedModuleId).toBe("m1");
    expect(model.currentModuleId).toBe("m1");

    const entry = model.modules[0];
    expect(entry.isCurrent).toBe(true);
    expect(entry.isRecommended).toBe(true);
  });

  it("falls back to the recommendation as current when lastVisitedLessonId is null", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    expect(model.currentLessonId).toBe(model.recommendedLessonId);
    expect(model.currentModuleId).toBe(model.recommendedModuleId);
  });
});

describe("buildCourseMapModel: all-visited fallback", () => {
  it("still reports allVisited as a count state, but recommends the valid last-visited lesson (not null) when everything is visited", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) }),
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
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["b"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b"], "a");

    expect(model.allVisited).toBe(true);
    expect(model.currentModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });

  it("falls back to the very first lesson (not the last module) when all lessons are visited and lastVisitedLessonId is null", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["b", "c"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "b", "c"], null);

    // §7.3 rule 3 fallback is the first lesson in course order, never the last module.
    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("a");
    expect(model.currentModuleId).toBe("m1");
    expect(model.currentLessonId).toBe("a");
  });

  it("falls back to the very first lesson when all lessons are visited and lastVisitedLessonId is an unrecognized opaque id", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["b", "c"]) }),
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
      moduleFixture({ id: "m1", lessons: lessons(["a", "b", "c"]) }),
      moduleFixture({ id: "m2", lessons: lessons(["d"]) }),
    ];
    const model = buildCourseMapModel(modules, ["a", "d"], "d");

    expect(model.visitedLessonCount).toBe(2);
    expect(model.totalLessonCount).toBe(4);

    const m1Entry = model.modules.find((e) => e.module.id === "m1");
    expect(m1Entry?.visitedCount).toBe(1);
    expect(m1Entry?.totalCount).toBe(3);
    expect(m1Entry?.isFullyVisited).toBe(false);

    const m2Entry = model.modules.find((e) => e.module.id === "m2");
    expect(m2Entry?.visitedCount).toBe(1);
    expect(m2Entry?.totalCount).toBe(1);
    expect(m2Entry?.isFullyVisited).toBe(true);
  });

  it("never reports a module with zero lessons as fully visited", () => {
    const modules = [moduleFixture({ id: "m1", lessons: [] })];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.modules[0];
    expect(entry.isFullyVisited).toBe(false);
  });
});

describe("buildCourseMapModel: practiced/demonstrated evidence tiers (design spec §17, Phase 2 Task 6)", () => {
  it("defaults every lesson/module/overall practiced and demonstrated count to zero when no evidence is given", () => {
    const modules = [moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) })];
    const model = buildCourseMapModel(modules, ["a"], "a");

    expect(model.practicedLessonCount).toBe(0);
    expect(model.demonstratedLessonCount).toBe(0);
    const entry = model.modules[0];
    expect(entry.practicedCount).toBe(0);
    expect(entry.demonstratedCount).toBe(0);
    expect(entry.practicedLessonIds.size).toBe(0);
    expect(entry.demonstratedLessonIds.size).toBe(0);
  });

  it("counts a lesson as practiced only once its practicedAt evidence is non-null", () => {
    const modules = [moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) })];
    const model = buildCourseMapModel(modules, ["a", "b"], "b", {
      a: { practicedAt: "2024-01-01T00:00:00.000Z", consolidatedAt: null },
    });

    const entry = model.modules[0];
    expect(entry.practicedLessonIds.has("a")).toBe(true);
    expect(entry.practicedLessonIds.has("b")).toBe(false);
    expect(entry.practicedCount).toBe(1);
    expect(model.practicedLessonCount).toBe(1);
  });

  it("counts a lesson as demonstrated only once its consolidatedAt evidence is non-null, independent of practiced", () => {
    const modules = [moduleFixture({ id: "m1", lessons: lessons(["a", "b"]) })];
    const model = buildCourseMapModel(modules, ["a", "b"], "b", {
      a: {
        practicedAt: "2024-01-01T00:00:00.000Z",
        consolidatedAt: "2024-01-02T00:00:00.000Z",
      },
    });

    const entry = model.modules[0];
    expect(entry.demonstratedLessonIds.has("a")).toBe(true);
    expect(entry.demonstratedLessonIds.has("b")).toBe(false);
    expect(entry.demonstratedCount).toBe(1);
    expect(model.demonstratedLessonCount).toBe(1);
    // Demonstrated evidence never implies less than the practiced evidence
    // reported alongside it — both tiers stay independently truthful.
    expect(entry.practicedLessonIds.has("a")).toBe(true);
  });

  it("ignores evidence for an unrecognized/opaque lesson id", () => {
    const modules = [moduleFixture({ id: "m1", lessons: lessons(["a"]) })];
    const model = buildCourseMapModel(modules, ["a"], "a", {
      "legacy-orphan": {
        practicedAt: "2024-01-01T00:00:00.000Z",
        consolidatedAt: "2024-01-01T00:00:00.000Z",
      },
    });

    expect(model.practicedLessonCount).toBe(0);
    expect(model.demonstratedLessonCount).toBe(0);
  });
});

describe("buildCourseMapModel: prerequisite data", () => {
  it("resolves advisory prerequisite ids to their module objects", () => {
    const modules = [
      moduleFixture({ id: "m1", lessons: lessons(["a"]) }),
      moduleFixture({ id: "m2", prerequisiteIds: ["m1"], lessons: lessons(["b"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    const m2Entry = model.modules.find((e) => e.module.id === "m2");
    expect(m2Entry?.prerequisiteModules.map((m) => m.id)).toEqual(["m1"]);
  });

  it("exposes an empty prerequisite list for a module with no prerequisites (none/start here)", () => {
    const modules = [moduleFixture({ id: "m1", lessons: lessons(["a"]) })];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.modules[0];
    expect(entry.prerequisiteModules).toEqual([]);
  });

  it("silently drops an unknown prerequisite id instead of crashing", () => {
    const modules = [
      moduleFixture({ id: "m1", prerequisiteIds: ["ghost-module"], lessons: lessons(["a"]) }),
    ];
    const model = buildCourseMapModel(modules, [], null);

    const entry = model.modules[0];
    expect(entry.prerequisiteModules).toEqual([]);
  });
});

describe("buildCourseMapModel: defensive edge cases", () => {
  it("handles an empty module list without crashing", () => {
    const model = buildCourseMapModel([], [], null);

    expect(model.modules).toEqual([]);
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
  it("groups the real A1 modules into the canonical, exhaustive course areas", () => {
    const model = buildCourseMapModel(courseModules, [], null, {}, A1_AREAS);

    expect(
      model.areas.map((entry) => ({
        id: entry.area.id,
        moduleIds: entry.modules.map((module) => module.module.id),
      })),
    ).toEqual(
      A1_AREAS.map((area) => ({ id: area.id, moduleIds: area.moduleIds })),
    );
  });

  it("keeps the real sixteen modules in their canonical order and recommends the first lesson when nothing is visited", () => {
    const model = buildCourseMapModel(courseModules, [], null);

    expect(model.modules.map((e) => e.module.id)).toEqual([
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
    ]);

    // Nothing visited yet: recommendation is the very first lesson overall.
    expect(model.recommendedLessonId).toBe("sounds-1");
    expect(model.recommendedModuleId).toBe("sounds");
    expect(model.currentModuleId).toBe("sounds");
  });

  it("falls back to the first lesson (not the last module) once every real lesson is visited with no recognizable current lesson", () => {
    const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
    const model = buildCourseMapModel(courseModules, allLessonIds, null);

    expect(model.allVisited).toBe(true);
    expect(model.recommendedLessonId).toBe("sounds-1");
    expect(model.currentModuleId).toBe("sounds");
    expect(model.currentLessonId).toBe("sounds-1");
  });
});
