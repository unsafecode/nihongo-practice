import { describe, expect, it } from "vitest";
import {
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
  A1_MODULE_MANIFEST,
} from "../a1/manifest";
import { a1CanDoById } from "../a1/catalog/canDos";
import { semanticIconIds } from "../../components/icons/Icon";
import { A2_LESSON_IDS, A2_MODULE_IDS, A2_MODULE_MANIFEST } from "../a2/manifest";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { BASE_LESSON_IDS, BASE_MODULE_IDS, BASE_MODULE_MANIFEST } from "../base/manifest";
import {
  a1RetainedAreas,
  baseCourseModules,
  courseModules,
  courseModulesByLevel,
} from "./course";

/**
 * The runtime course source (Phase 2 Task 6, design spec §5/§6/§17): once the
 * A1 release catalog is validated, `courseModules` derives from it directly —
 * exactly 11 retained modules / 44 lessons with stable manifest ids. Rehomed
 * Base modules are active only at `courseModulesByLevel.a0`.
 */
describe("courseModules — retained A1 runtime source", () => {
  it("assigns every retained A1 module to a nonempty filtered authored area", () => {
    expect(
      courseModules.map((courseModule) => ({
        id: courseModule.id,
        areaId: Reflect.get(courseModule, "areaId"),
      })),
    ).toEqual(
      a1RetainedAreas.flatMap((area) =>
        area.moduleIds.map((id) => ({ id, areaId: area.id })),
      ),
    );
  });

  it("publishes exactly 11 modules and 44 lessons with stable retained manifest ids", () => {
    expect(courseModules).toHaveLength(11);
    const lessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(lessonIds).toHaveLength(44);
    expect(new Set(lessonIds).size).toBe(44);
    expect(courseModules.map((m) => m.id)).toEqual([...A1_RETAINED_MODULE_IDS]);
    expect(lessonIds.sort()).toEqual([...A1_RETAINED_LESSON_IDS].sort());
  });

  it("rebases retained modules into runtime order 1 through 11", () => {
    expect(courseModules.map((m) => m.order)).toEqual(
      Array.from({ length: 11 }, (_, index) => index + 1),
    );
  });

  it("gives every module exactly 4 lessons in manifest order", () => {
    for (const courseModule of courseModules) {
      expect(courseModule.lessons.map((l) => l.id)).toEqual([
        ...(A1_RETAINED_LESSON_IDS_BY_MODULE[courseModule.id] ?? []),
      ]);
    }
  });

  it("never sets legacy phase/coverage/sections/concept fields on any module or lesson", () => {
    for (const courseModule of courseModules) {
      expect(courseModule.phase).toBeUndefined();
      expect(courseModule.coverage).toBeUndefined();
      for (const lesson of courseModule.lessons) {
        expect(lesson.sections).toBeUndefined();
        expect(lesson.introducedConceptIds).toBeUndefined();
        expect(lesson.requiredConceptIds).toBeUndefined();
      }
    }
  });

  it("keeps prerequisites pointing only to strictly earlier modules, matching the manifest", () => {
    const orderById = new Map(courseModules.map((m) => [m.id, m.order]));
    for (const courseModule of courseModules) {
      expect(courseModule.prerequisiteIds).toEqual(
        A1_MODULE_MANIFEST[courseModule.id].prerequisiteIds.filter((id) =>
          A1_RETAINED_MODULE_IDS.includes(id),
        ),
      );
      for (const prerequisiteId of courseModule.prerequisiteIds) {
        expect(orderById.get(prerequisiteId)).toBeLessThan(courseModule.order);
      }
    }
  });

  it("gives every retained module a valid semantic icon id", () => {
    for (const courseModule of courseModules) {
      expect(semanticIconIds).toContain(courseModule.iconId);
    }
    expect(
      Object.fromEntries(courseModules.map((courseModule) => [courseModule.id, courseModule.iconId])),
    ).toMatchObject({
      introductions: "identity",
      "essential-questions": "questions",
      capstones: "capstone",
    });
  });

  it("uses the lesson id itself as the title copy id (stable, unambiguous)", () => {
    for (const courseModule of courseModules) {
      for (const lesson of courseModule.lessons) {
        expect(lesson.titleCopyId).toBe(lesson.id);
      }
    }
  });

  it("resolves each module's outcome copy id from the manifest", () => {
    for (const courseModule of courseModules) {
      expect(courseModule.outcomeCopyIds).toEqual([
        A1_MODULE_MANIFEST[courseModule.id].outcomeCopyId,
      ]);
    }
  });

  it("resolves each lesson's objective copy id from its authored Can-do descriptor, never fabricated", () => {
    for (const courseModule of courseModules) {
      for (const lesson of courseModule.lessons) {
        expect(lesson.objectiveCopyIds.length).toBeGreaterThan(0);
        for (const copyId of lesson.objectiveCopyIds) {
          const matchingCanDo = [...a1CanDoById.values()].find(
            (canDo) => canDo.descriptorCopyId === copyId,
          );
          expect(matchingCanDo, `no Can-do descriptor for ${copyId}`).toBeDefined();
          expect(matchingCanDo!.lessonIds).toContain(lesson.id);
        }
      }
    }
  });
});

describe("courseModulesByLevel.a0 — Base runtime source", () => {
  it("publishes exactly the Base manifest's 10 modules and 40 lessons", () => {
    expect(courseModulesByLevel.a0).toBe(baseCourseModules);
    expect(baseCourseModules.map((module) => module.id)).toEqual([...BASE_MODULE_IDS]);
    expect(baseCourseModules.flatMap((module) => module.lessons)).toHaveLength(40);
    expect(baseCourseModules.flatMap((module) => module.lessons.map((lesson) => lesson.id))).toEqual([
      ...BASE_LESSON_IDS,
    ]);
  });

  it("uses manifest order, prerequisites, outcomes, and authored Can-do descriptors", () => {
    for (const module of baseCourseModules) {
      const manifest = BASE_MODULE_MANIFEST[module.id];
      expect(module.order).toBe(manifest.order);
      expect(module.prerequisiteIds).toEqual(manifest.prerequisiteIds);
      expect(module.outcomeCopyIds).toEqual([manifest.outcomeCopyId]);
      expect(module.lessons).toHaveLength(4);
      for (const lesson of module.lessons) {
        expect(lesson.titleCopyId).toBe(lesson.id);
        expect(lesson.objectiveCopyIds).toHaveLength(1);
      }
    }
  });
});

/**
 * The A2 runtime source (Phase 3 Task 8, design spec §5): `courseModulesByLevel.a2`
 * is derived directly from the frozen A2 manifest + the authored A2 Can-dos,
 * mirroring the A1 derivation. A1 stays reachable at `courseModulesByLevel.a1`
 * and is byte-identical to the existing `courseModules` export (every A1 URL/
 * default output stable).
 */
describe("courseModulesByLevel — level-aware runtime source", () => {
  it("keeps A1 identical to the existing courseModules export (stable A1 output)", () => {
    expect(courseModulesByLevel.a1).toBe(courseModules);
  });

  it("derives exactly 15 A2 modules / 60 lessons from the frozen A2 catalog", () => {
    const a2 = courseModulesByLevel.a2;
    expect(a2).toHaveLength(15);
    const lessonIds = a2.flatMap((m) => m.lessons.map((l) => l.id));
    expect(lessonIds).toHaveLength(60);
    expect(new Set(lessonIds).size).toBe(60);
    expect(a2.map((m) => m.id)).toEqual([...A2_MODULE_IDS]);
    expect(lessonIds.slice().sort()).toEqual([...A2_LESSON_IDS].slice().sort());
  });

  it("leaves A2 modules outside the A1-only area model", () => {
    for (const courseModule of courseModulesByLevel.a2) {
      expect(courseModule.areaId).toBeUndefined();
    }
  });

  it("orders A2 modules 1..15 and gives every module its manifest lessons in order", () => {
    const a2 = courseModulesByLevel.a2;
    expect(a2.map((m) => m.order)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
    for (const courseModule of a2) {
      expect(courseModule.lessons.map((l) => l.id)).toEqual([
        ...A2_MODULE_MANIFEST[courseModule.id].lessonIds,
      ]);
      expect(courseModule.prerequisiteIds).toEqual(
        A2_MODULE_MANIFEST[courseModule.id].prerequisiteIds,
      );
    }
  });

  it("gives every A2 module a valid semantic icon id and each lesson a stable titleCopyId", () => {
    for (const courseModule of courseModulesByLevel.a2) {
      expect(semanticIconIds).toContain(courseModule.iconId);
      expect(courseModule.outcomeCopyIds).toEqual([
        A2_MODULE_MANIFEST[courseModule.id].outcomeCopyId,
      ]);
      for (const lesson of courseModule.lessons) {
        expect(lesson.titleCopyId).toBe(lesson.id);
      }
    }
  });

  it("resolves each A2 lesson objective from a real authored Can-do descriptor that serves it", () => {
    const canDoByDescriptor = new Map(
      a2CanDosAuthored.map((canDo) => [canDo.descriptorCopyId, canDo]),
    );
    for (const courseModule of courseModulesByLevel.a2) {
      for (const lesson of courseModule.lessons) {
        expect(lesson.objectiveCopyIds.length).toBeGreaterThan(0);
        for (const copyId of lesson.objectiveCopyIds) {
          const canDo = canDoByDescriptor.get(copyId);
          expect(canDo, `no A2 Can-do descriptor for ${copyId}`).toBeDefined();
          expect(canDo!.lessonIds).toContain(lesson.id);
        }
      }
    }
  });

  it("keeps A1 and A2 lesson id namespaces disjoint (level resolvable from a module/lesson id)", () => {
    const a1LessonIds = new Set(
      courseModulesByLevel.a1.flatMap((m) => m.lessons.map((l) => l.id)),
    );
    const a2LessonIds = courseModulesByLevel.a2.flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    for (const id of a2LessonIds) expect(a1LessonIds.has(id)).toBe(false);
  });
});
