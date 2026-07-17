import { describe, expect, it } from "vitest";
import { A1_LESSON_IDS, A1_MODULE_IDS, A1_MODULE_MANIFEST } from "../a1/manifest";
import { a1CanDoById } from "../a1/catalog/canDos";
import { semanticIconIds } from "../../components/icons/Icon";
import { courseModules } from "./course";

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
