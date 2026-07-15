import { describe, expect, it } from "vitest";
import { curriculumFoundation } from "../curriculum/foundation";
import { assembledCurriculum } from "./curriculum";
import { validateCurriculum } from "./validateCurriculum";
import { validateCourse } from "../data/validate";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { lessonPath } from "../../routing/routePaths";
import {
  LEGACY_LESSON_ALIASES,
  resolveLessonRoute,
} from "../routing/lessonRouteResolution";
import {
  assembleCourse,
  assembledCourse,
  assembledExamples,
  courseModules,
  CourseAssemblyError,
} from "./assembleCourse";

/**
 * Runtime assembly acceptance (design spec §5, §9, §13; Slice B plan Task 4).
 * These tests assert the pure catalog→runtime adapter publishes the complete,
 * validated 12-module / 40-lesson A0→A1 course in the existing `CourseModule`
 * shape without duplicating Japanese, preserves the four stable route sections,
 * resolves every lesson route and every legacy alias, and never emits partial
 * content when validation fails.
 */

const releaseCoverage = validateCurriculum(assembledCurriculum, {
  enforceReleaseTargets: true,
}).coverage;

describe("assembleCourse: structure", () => {
  it("publishes exactly 12 modules and 40 lessons", () => {
    expect(courseModules).toHaveLength(12);
    expect(
      courseModules.reduce((sum, module) => sum + module.lessons.length, 0),
    ).toBe(40);
  });

  it("keeps module id, phase, order, and prerequisites exactly from the catalog foundation", () => {
    expect(courseModules.map((module) => module.id)).toEqual(
      curriculumFoundation.modules.map((module) => module.id),
    );
    for (const foundation of curriculumFoundation.modules) {
      const module = courseModules.find((item) => item.id === foundation.id);
      expect(module, foundation.id).toBeDefined();
      expect(module?.phase).toBe(foundation.phase);
      expect(module?.order).toBe(foundation.order);
      expect(module?.prerequisiteIds).toEqual([...foundation.prerequisiteIds]);
    }
  });

  it("orders lessons 1..N within each module", () => {
    for (const module of courseModules) {
      expect(module.lessons.map((lesson) => lesson.order)).toEqual(
        module.lessons.map((_, index) => index + 1),
      );
      for (const lesson of module.lessons) {
        expect(lesson.moduleId).toBe(module.id);
      }
    }
  });
});

/**
 * The number of unique verb lexemes a module's course-map card should claim
 * (design spec §13.3): the union of the verbs the module *introduces* and the
 * verbs its lessons *practice* (spiral review of earlier verbs), deduplicated
 * by lexeme id. A module that only reviews earlier verbs — no capstone module
 * introduces a new one — must still show that reuse instead of reporting
 * zero, which would hide the very spiral repetition the course map exists to
 * expose.
 */
function practicedVerbLexemeCount(computed: {
  readonly introducedVerbIds: readonly string[];
  readonly practicedVerbIds: readonly string[];
}): number {
  return new Set([...computed.introducedVerbIds, ...computed.practicedVerbIds])
    .size;
}

describe("assembleCourse: computed coverage metadata", () => {
  it("sets verbCount to the union of introduced and practiced verb lexemes, and vocabularyCount to introduced lexemes, per module", () => {
    for (const module of courseModules) {
      const computed = releaseCoverage.moduleCoverage[module.id];
      expect(computed, module.id).toBeDefined();
      expect(module.coverage.verbCount, module.id).toBe(
        practicedVerbLexemeCount(computed),
      );
      expect(module.coverage.vocabularyCount).toBe(
        computed.introducedLexemeIds.length,
      );
    }
  });

  it("reports the capstones as introducing no new vocabulary but practicing a nonzero union of reused verbs (spiral reuse, review found 29)", () => {
    const capstones = courseModules.find((module) => module.id === "capstones");
    const computed = releaseCoverage.moduleCoverage["capstones"];
    expect(capstones?.coverage.vocabularyCount).toBe(0);
    expect(capstones?.coverage.verbCount).toBe(
      practicedVerbLexemeCount(computed),
    );
    expect(capstones?.coverage.verbCount).toBeGreaterThan(0);
    expect(capstones?.coverage.verbCount).toBe(29);
  });
});

describe("assembleCourse: stable lesson sections", () => {
  it("gives every lesson the four stable route sections in order", () => {
    for (const module of courseModules) {
      for (const lesson of module.lessons) {
        expect(lesson.sections.map((section) => section.id)).toEqual([
          ...LESSON_SECTION_IDS,
        ]);
      }
    }
  });

  it("resolves every referenced comparison and exploration example to a runtime example", () => {
    for (const module of courseModules) {
      for (const lesson of module.lessons) {
        const [, comparison, explore] = lesson.sections;
        for (const exampleId of [
          comparison.comparison.baseExampleId,
          comparison.comparison.changedExampleId,
        ]) {
          expect(assembledExamples[exampleId], exampleId).toBeDefined();
        }
        if (explore.exploration.kind === "transformation") {
          for (const selection of [
            explore.exploration.data.initialSelection,
            explore.exploration.data.targetSelection,
          ]) {
            if ("exampleId" in selection) {
              expect(
                assembledExamples[selection.exampleId],
                selection.exampleId,
              ).toBeDefined();
            }
          }
        }
      }
    }
  });
});

describe("assembleCourse: honest runtime course", () => {
  it("passes the full runtime course integrity validator with no errors", () => {
    expect(validateCourse(courseModules, assembledExamples)).toEqual([]);
  });

  it("derives each example's jp and romaji from its segments", () => {
    for (const example of Object.values(assembledExamples)) {
      if (!example.segments) continue;
      expect(example.segments.map((s) => s.jp).join("")).toBe(example.jp);
      expect(example.segments.map((s) => s.romaji).join("")).toBe(
        example.romaji,
      );
    }
  });
});

describe("assembleCourse: route resolution", () => {
  it("resolves all 40 current lesson routes to a match", () => {
    let resolved = 0;
    for (const module of courseModules) {
      for (const lesson of module.lessons) {
        const resolution = resolveLessonRoute(
          module.id,
          lesson.id,
          courseModules,
        );
        expect(resolution.kind, lessonPath(module.id, lesson.id)).toBe("match");
        resolved += 1;
      }
    }
    expect(resolved).toBe(40);
  });

  it("preserves every previously published v2.1 lesson id via an explicit legacy alias", () => {
    const currentLessonIds = new Set(
      courseModules.flatMap((module) => module.lessons.map((l) => l.id)),
    );
    const removedV2Lessons = [
      "sounds-core",
      "sounds-special",
      "sentence-order",
      "sentence-omission",
      "actions-object",
      "actions-masu",
      "time-past",
      "time-negative",
      "places-action",
      "places-movement",
      "people-particles",
      "people-desire",
      "travel-questions",
      "travel-existence",
      "traps-particles",
      "traps-verbs",
    ];
    const aliasedLegacyLessonIds = new Set(
      LEGACY_LESSON_ALIASES.map((alias) => alias.legacyLessonId),
    );
    for (const legacyLessonId of removedV2Lessons) {
      expect(currentLessonIds.has(legacyLessonId), legacyLessonId).toBe(false);
      expect(aliasedLegacyLessonIds.has(legacyLessonId), legacyLessonId).toBe(
        true,
      );
    }
  });

  it("redirects each legacy v2 module+lesson url to its canonical current lesson", () => {
    for (const alias of LEGACY_LESSON_ALIASES) {
      const resolution = resolveLessonRoute(
        alias.legacyModuleId,
        alias.legacyLessonId,
        courseModules,
      );
      expect(resolution.kind, alias.legacyLessonId).toBe("redirect");
      if (resolution.kind !== "redirect") continue;
      expect(resolution.courseModule.id).toBe(alias.moduleId);
      expect(resolution.lesson.id).toBe(alias.lessonId);
      // The canonical target must itself be a real current lesson.
      expect(
        courseModules
          .find((module) => module.id === alias.moduleId)
          ?.lessons.some((lesson) => lesson.id === alias.lessonId),
        alias.lessonId,
      ).toBe(true);
    }
  });
});

describe("assembleCourse: fail-closed validation", () => {
  it("throws a deterministic assembly error with structured codes when the catalog is invalid", () => {
    const broken = {
      ...assembledCurriculum,
      lessons: assembledCurriculum.lessons.map((lesson, index) =>
        index === 0 ? { ...lesson, estimatedMinutes: 20 } : lesson,
      ),
    };
    let thrown: unknown;
    try {
      assembleCourse(broken);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(CourseAssemblyError);
    expect((thrown as CourseAssemblyError).codes).toContain(
      "lesson-duration-out-of-range",
    );
  });

  it("assembles successfully from the real validated catalog", () => {
    expect(() => assembleCourse()).not.toThrow();
    expect(assembledCourse.modules).toBe(courseModules);
  });
});
