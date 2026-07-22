import { describe, expect, it } from "vitest";
import { A1_LESSON_IDS, A1_MODULE_IDS, A1_MODULE_MANIFEST } from "../a1/manifest";
import { a1CanDoById } from "../a1/catalog/canDos";
import { semanticIconIds } from "../../components/icons/Icon";
import { A2_LESSON_IDS, A2_MODULE_IDS, A2_MODULE_MANIFEST } from "../a2/manifest";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { courseModules, courseModulesByLevel } from "./course";

/**
 * The runtime course source (Phase 2 Task 6, design spec §5/§6/§17): once the
 * A1 release catalog is validated, `courseModules` derives from it directly —
 * exactly 12 modules / 48 lessons with stable manifest ids, never a partial or
 * legacy A0→A1 assembly.
 */
describe("courseModules — A1 runtime source", () => {
  it("publishes exactly 12 modules and 48 lessons with stable manifest ids", () => {
    expect(courseModules).toHaveLength(12);
    const lessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(lessonIds).toHaveLength(48);
    expect(new Set(lessonIds).size).toBe(48);
    expect(courseModules.map((m) => m.id)).toEqual([...A1_MODULE_IDS]);
    expect(lessonIds.sort()).toEqual([...A1_LESSON_IDS].sort());
  });

  it("orders modules 1 through 12 matching the manifest", () => {
    expect(courseModules.map((m) => m.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("gives every module exactly 4 lessons in manifest order", () => {
    for (const courseModule of courseModules) {
      expect(courseModule.lessons.map((l) => l.id)).toEqual([
        ...A1_MODULE_MANIFEST[courseModule.id].lessonIds,
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
        A1_MODULE_MANIFEST[courseModule.id].prerequisiteIds,
      );
      for (const prerequisiteId of courseModule.prerequisiteIds) {
        expect(orderById.get(prerequisiteId)).toBeLessThan(courseModule.order);
      }
    }
  });

  it("gives every module a valid, distinct semantic icon id", () => {
    const seen = new Set<string>();
    for (const courseModule of courseModules) {
      expect(semanticIconIds).toContain(courseModule.iconId);
      expect(seen.has(courseModule.iconId)).toBe(false);
      seen.add(courseModule.iconId);
    }
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
