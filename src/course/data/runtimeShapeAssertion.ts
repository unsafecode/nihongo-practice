import type { CourseModule } from "./types";

/**
 * The production runtime's own fail-closed structural gate (Phase 2 Task 6,
 * finding I3). `data/course.ts` calls this instead of the full
 * `validateA1Release()` content validator, so the shipped browser bundle
 * never carries `validateFoundations.ts`/`validateA1.ts` (2500+ lines of
 * catalog-cross-referencing content validation, still run in full by the
 * `prebuild` npm script via `scripts/validateA1Release.ts`, and by the test
 * suite via `validateA1.test.ts`).
 *
 * This is deliberately *not* a content validator: it never cross-references
 * the example/Can-do/verb-recurrence catalogs the full validator does — it
 * only asserts the already-assembled `courseModules` shape itself is sane
 * (every id present, every count positive, every id unique). That is exactly
 * the class of defect a genuine runtime assembly bug (a broken manifest
 * import, an empty lessons array, a duplicate id from a bad merge) would
 * produce, and exactly what this module can check without re-importing the
 * content it would otherwise have to duplicate. A production bundle that
 * somehow reached an invalid shape still throws here rather than exporting
 * `courseModules` partially or silently — the same fail-closed guarantee,
 * just split across build time (full content) and runtime (structural
 * sanity) instead of both living in one always-bundled call.
 */

const EXPECTED_MODULE_COUNT = 12;
const EXPECTED_LESSON_COUNT = 48;

export class A1CourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid course shape — ${message}`);
    this.name = "A1CourseShapeError";
  }
}

/**
 * Throws {@link A1CourseShapeError} unless `modules` is a structurally sane,
 * non-empty course: every module/lesson id present and unique, every count
 * positive, and the release's known fixed module/lesson totals (12 modules,
 * 48 lessons — 44 semantic + 4 phonetic) still hold.
 */
export function assertA1CourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  if (modules.length === 0) {
    throw new A1CourseShapeError("courseModules resolved to an empty array.");
  }

  const seenModuleIds = new Set<string>();
  const seenLessonIds = new Set<string>();
  let totalLessons = 0;

  for (const courseModule of modules) {
    if (!courseModule.id) {
      throw new A1CourseShapeError("a module has no id.");
    }
    if (seenModuleIds.has(courseModule.id)) {
      throw new A1CourseShapeError(`duplicate module id "${courseModule.id}".`);
    }
    seenModuleIds.add(courseModule.id);

    if (!courseModule.iconId) {
      throw new A1CourseShapeError(`module "${courseModule.id}" has no iconId.`);
    }
    if (!Array.isArray(courseModule.outcomeCopyIds) || courseModule.outcomeCopyIds.length === 0) {
      throw new A1CourseShapeError(`module "${courseModule.id}" has no outcomeCopyIds.`);
    }
    if (!Array.isArray(courseModule.lessons) || courseModule.lessons.length === 0) {
      throw new A1CourseShapeError(`module "${courseModule.id}" has no lessons.`);
    }

    for (const lesson of courseModule.lessons) {
      totalLessons += 1;
      if (!lesson.id) {
        throw new A1CourseShapeError(`module "${courseModule.id}" has a lesson with no id.`);
      }
      if (seenLessonIds.has(lesson.id)) {
        throw new A1CourseShapeError(`duplicate lesson id "${lesson.id}".`);
      }
      seenLessonIds.add(lesson.id);

      if (lesson.moduleId !== courseModule.id) {
        throw new A1CourseShapeError(
          `lesson "${lesson.id}" names moduleId "${lesson.moduleId}", not its owning module "${courseModule.id}".`,
        );
      }
      if (!Number.isInteger(lesson.order) || lesson.order < 1) {
        throw new A1CourseShapeError(`lesson "${lesson.id}" has an invalid order (${lesson.order}).`);
      }
      if (!lesson.titleCopyId) {
        throw new A1CourseShapeError(`lesson "${lesson.id}" has no titleCopyId.`);
      }
      if (!Array.isArray(lesson.objectiveCopyIds) || lesson.objectiveCopyIds.length === 0) {
        throw new A1CourseShapeError(`lesson "${lesson.id}" has no objectiveCopyIds.`);
      }
    }
  }

  // Structural correctness (ids present/unique, required fields non-empty) is
  // checked above, per-module/per-lesson, so those specific defects are
  // reported precisely. Only once the whole shape is otherwise sound do we
  // check it also matches the release's known fixed totals — this catches a
  // manifest/build regression that silently drops or duplicates whole
  // modules/lessons without masking the more specific error above it.
  if (modules.length !== EXPECTED_MODULE_COUNT) {
    throw new A1CourseShapeError(
      `expected exactly ${EXPECTED_MODULE_COUNT} modules, got ${modules.length}.`,
    );
  }
  if (totalLessons !== EXPECTED_LESSON_COUNT) {
    throw new A1CourseShapeError(
      `expected exactly ${EXPECTED_LESSON_COUNT} lessons across all modules, got ${totalLessons}.`,
    );
  }
}
