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

/**
 * The A1 runtime shape gate stays pinned to the last complete 12-module /
 * 48-lesson boundary while the expanded 16-module manifest awaits authored
 * content. These values must move with the runtime assembly, never by exposing
 * incomplete manifest modules as routes.
 */
const EXPECTED_A1_RUNTIME_MODULE_COUNT = 12;
const EXPECTED_A1_RUNTIME_LESSON_COUNT = 48;

/** The fixed A2 release totals (Phase 3 Task 8): 15 modules × 4 lessons. */
const EXPECTED_A2_MODULE_COUNT = 15;
const EXPECTED_A2_LESSON_COUNT = 60;

export class A1CourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid course shape — ${message}`);
    this.name = "A1CourseShapeError";
  }
}

export class A2CourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid A2 course shape — ${message}`);
    this.name = "A2CourseShapeError";
  }
}

/**
 * Shared, level-agnostic structural core for {@link assertA1CourseShape} and
 * {@link assertA2CourseShape}. Checks every module/lesson id is present and
 * unique, every required field is non-empty, every lesson names its owning
 * module, orders are positive integers, and the level's fixed module/lesson
 * totals hold — throwing the level-specific `makeError` rather than exporting
 * anything partial. It never cross-references content catalogs (that is the
 * build-time `validate*Release()` gate's job); it only proves the assembled
 * `modules` shape itself is sane.
 */
function assertCourseShapeCore(
  modules: readonly CourseModule[],
  expectedModuleCount: number,
  expectedLessonCount: number,
  makeError: (message: string) => Error,
): void {
  if (modules.length === 0) {
    throw makeError("courseModules resolved to an empty array.");
  }

  const seenModuleIds = new Set<string>();
  const seenLessonIds = new Set<string>();
  let totalLessons = 0;

  for (const courseModule of modules) {
    if (!courseModule.id) {
      throw makeError("a module has no id.");
    }
    if (seenModuleIds.has(courseModule.id)) {
      throw makeError(`duplicate module id "${courseModule.id}".`);
    }
    seenModuleIds.add(courseModule.id);

    if (!courseModule.iconId) {
      throw makeError(`module "${courseModule.id}" has no iconId.`);
    }
    if (!Array.isArray(courseModule.outcomeCopyIds) || courseModule.outcomeCopyIds.length === 0) {
      throw makeError(`module "${courseModule.id}" has no outcomeCopyIds.`);
    }
    if (!Array.isArray(courseModule.lessons) || courseModule.lessons.length === 0) {
      throw makeError(`module "${courseModule.id}" has no lessons.`);
    }

    for (const lesson of courseModule.lessons) {
      totalLessons += 1;
      if (!lesson.id) {
        throw makeError(`module "${courseModule.id}" has a lesson with no id.`);
      }
      if (seenLessonIds.has(lesson.id)) {
        throw makeError(`duplicate lesson id "${lesson.id}".`);
      }
      seenLessonIds.add(lesson.id);

      if (lesson.moduleId !== courseModule.id) {
        throw makeError(
          `lesson "${lesson.id}" names moduleId "${lesson.moduleId}", not its owning module "${courseModule.id}".`,
        );
      }
      if (!Number.isInteger(lesson.order) || lesson.order < 1) {
        throw makeError(`lesson "${lesson.id}" has an invalid order (${lesson.order}).`);
      }
      if (!lesson.titleCopyId) {
        throw makeError(`lesson "${lesson.id}" has no titleCopyId.`);
      }
      if (!Array.isArray(lesson.objectiveCopyIds) || lesson.objectiveCopyIds.length === 0) {
        throw makeError(`lesson "${lesson.id}" has no objectiveCopyIds.`);
      }
    }
  }

  // Structural correctness (ids present/unique, required fields non-empty) is
  // checked above, per-module/per-lesson, so those specific defects are
  // reported precisely. Only once the whole shape is otherwise sound do we
  // check it also matches the release's known fixed totals — this catches a
  // manifest/build regression that silently drops or duplicates whole
  // modules/lessons without masking the more specific error above it.
  if (modules.length !== expectedModuleCount) {
    throw makeError(
      `expected exactly ${expectedModuleCount} modules, got ${modules.length}.`,
    );
  }
  if (totalLessons !== expectedLessonCount) {
    throw makeError(
      `expected exactly ${expectedLessonCount} lessons across all modules, got ${totalLessons}.`,
    );
  }
}

/**
 * Throws {@link A1CourseShapeError} unless `modules` is a structurally sane,
 * non-empty course: every module/lesson id present and unique, every count
 * positive, and the last complete runtime's fixed module/lesson totals
 * (12 modules, 48 lessons — 44 semantic + 4 phonetic) still hold. The
 * expanded manifest intentionally does not change this assertion until its
 * complete authored content is ready for runtime assembly.
 */
export function assertA1CourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  assertCourseShapeCore(
    modules,
    EXPECTED_A1_RUNTIME_MODULE_COUNT,
    EXPECTED_A1_RUNTIME_LESSON_COUNT,
    (message) => new A1CourseShapeError(message),
  );
}

/**
 * Throws {@link A2CourseShapeError} unless `modules` is a structurally sane,
 * non-empty A2 course: every module/lesson id present and unique, every count
 * positive, and the A2 release's fixed totals (15 modules, 60 lessons) hold.
 * Mirrors {@link assertA1CourseShape} exactly, just with the A2 totals and
 * error type, so a corrupted A2 assembly throws here rather than shipping a
 * partial `a2CourseModules` export.
 */
export function assertA2CourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  assertCourseShapeCore(
    modules,
    EXPECTED_A2_MODULE_COUNT,
    EXPECTED_A2_LESSON_COUNT,
    (message) => new A2CourseShapeError(message),
  );
}
