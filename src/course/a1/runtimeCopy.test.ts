import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import {
  a1RuntimeLessonCopy,
  a1RuntimeModuleCopy,
  a1RuntimeObjectiveCopy,
  a1RuntimeOutcomeCopy,
} from "./runtimeCopy";

/**
 * Phase 2 Task 6: the A1 manifest carries only locale-independent copy ids;
 * these four functions are the single place that resolves them into real
 * `CourseCopy` dictionaries. Every id `data/course.ts` actually assigns must
 * resolve to non-blank text in both locales, and the resolved dictionaries
 * must contain exactly those ids — never more (which would leak unrelated
 * copy into the runtime's orphan-key checks) and never fewer.
 */
describe("A1 runtime copy", () => {
  const locales = ["en", "it"] as const;

  it("names all 12 modules with non-blank text, distinct per module", () => {
    for (const locale of locales) {
      const modules = a1RuntimeModuleCopy(locale);
      expect(Object.keys(modules).sort()).toEqual(
        courseModules.map((m) => m.id).sort(),
      );
      const titles = new Set<string>();
      for (const module of courseModules) {
        const title = modules[module.id]?.title;
        expect(title?.trim().length ?? 0).toBeGreaterThan(0);
        titles.add(title!);
      }
      expect(titles.size).toBe(courseModules.length);
    }
  });

  it("titles all 48 lessons as '<module title> <position>', non-blank", () => {
    for (const locale of locales) {
      const modules = a1RuntimeModuleCopy(locale);
      const lessons = a1RuntimeLessonCopy(locale);
      const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
      expect(Object.keys(lessons).sort()).toEqual([...allLessonIds].sort());
      for (const module of courseModules) {
        module.lessons.forEach((lesson, index) => {
          expect(lessons[lesson.id]?.title).toBe(
            `${modules[module.id]!.title} ${index + 1}`,
          );
        });
      }
    }
  });

  it("resolves exactly the referenced Can-do objective copy ids, non-blank", () => {
    const knownObjectiveIds = new Set(
      courseModules.flatMap((m) => m.lessons.flatMap((l) => l.objectiveCopyIds ?? [])),
    );
    for (const locale of locales) {
      const objectives = a1RuntimeObjectiveCopy(locale);
      expect(new Set(Object.keys(objectives))).toEqual(knownObjectiveIds);
      for (const id of knownObjectiveIds) {
        expect(objectives[id]?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("resolves exactly the referenced module outcome copy ids, non-blank", () => {
    const knownOutcomeIds = new Set(
      courseModules.flatMap((m) => m.outcomeCopyIds ?? []),
    );
    for (const locale of locales) {
      const outcomes = a1RuntimeOutcomeCopy(locale);
      expect(new Set(Object.keys(outcomes))).toEqual(knownOutcomeIds);
      for (const id of knownOutcomeIds) {
        expect(outcomes[id]?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("differs between locales for every module and lesson title", () => {
    const modulesEn = a1RuntimeModuleCopy("en");
    const modulesIt = a1RuntimeModuleCopy("it");
    for (const module of courseModules) {
      expect(modulesEn[module.id]!.title).not.toBe(modulesIt[module.id]!.title);
    }
  });
});
