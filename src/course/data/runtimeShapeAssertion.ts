import type { CourseModule } from "./types";

interface ShapeSpec {
  readonly level: "a0" | "a1" | "a2";
  readonly modules: number;
  readonly lessons: number;
  readonly makeError: (message: string) => Error;
}

const BASE_SHAPE: ShapeSpec = {
  level: "a0",
  modules: 10,
  lessons: 40,
  makeError: (message) => new BaseCourseShapeError(message),
};

const A1_SHAPE: ShapeSpec = {
  level: "a1",
  modules: 11,
  lessons: 44,
  makeError: (message) => new A1CourseShapeError(message),
};

const A2_SHAPE: ShapeSpec = {
  level: "a2",
  modules: 15,
  lessons: 60,
  makeError: (message) => new A2CourseShapeError(message),
};

export class BaseCourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid a0 course shape — ${message}`);
    this.name = "BaseCourseShapeError";
  }
}

export class A1CourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid a1 course shape — ${message}`);
    this.name = "A1CourseShapeError";
  }
}

export class A2CourseShapeError extends Error {
  constructor(message: string) {
    super(`data/course: refusing to export an invalid a2 course shape — ${message}`);
    this.name = "A2CourseShapeError";
  }
}

/**
 * The always-bundled gate deliberately validates only assembled navigation
 * structure. Editorial/deep-content validation stays in the release checks.
 */
function assertCourseShapeCore(
  modules: readonly CourseModule[],
  spec: ShapeSpec,
): void {
  if (modules.length === 0) {
    throw spec.makeError("courseModules resolved to an empty array.");
  }
  if (modules.length !== spec.modules) {
    throw spec.makeError(`expected exactly ${spec.modules} modules, got ${modules.length}.`);
  }

  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();
  let lessonCount = 0;

  for (const [moduleIndex, courseModule] of modules.entries()) {
    if (!courseModule.id) throw spec.makeError("a module has no id.");
    if (moduleIds.has(courseModule.id)) {
      throw spec.makeError(`duplicate module id "${courseModule.id}".`);
    }
    if (courseModule.order !== moduleIndex + 1) {
      throw spec.makeError(
        `module "${courseModule.id}" has an invalid module order (${courseModule.order}).`,
      );
    }
    if (!courseModule.iconId) {
      throw spec.makeError(`module "${courseModule.id}" has no iconId.`);
    }
    if (
      !Array.isArray(courseModule.outcomeCopyIds) ||
      courseModule.outcomeCopyIds.length === 0 ||
      courseModule.outcomeCopyIds.some((id) => !id)
    ) {
      throw spec.makeError(`module "${courseModule.id}" has no outcomeCopyIds.`);
    }
    if (!Array.isArray(courseModule.lessons) || courseModule.lessons.length !== 4) {
      throw spec.makeError(`module "${courseModule.id}" must have exactly four lessons.`);
    }

    for (const prerequisiteId of courseModule.prerequisiteIds) {
      if (!moduleIds.has(prerequisiteId)) {
        throw spec.makeError(
          `module "${courseModule.id}" prerequisite "${prerequisiteId}" is unknown or not earlier.`,
        );
      }
    }

    for (const [lessonIndex, lesson] of courseModule.lessons.entries()) {
      lessonCount += 1;
      if (!lesson.id) {
        throw spec.makeError(`module "${courseModule.id}" has a lesson with no id.`);
      }
      if (lessonIds.has(lesson.id)) {
        throw spec.makeError(`duplicate lesson id "${lesson.id}".`);
      }
      if (lesson.moduleId !== courseModule.id) {
        throw spec.makeError(
          `lesson "${lesson.id}" names moduleId "${lesson.moduleId}", not its owning module "${courseModule.id}".`,
        );
      }
      if (lesson.order !== lessonIndex + 1) {
        throw spec.makeError(`lesson "${lesson.id}" has an invalid lesson order (${lesson.order}).`);
      }
      if (!lesson.titleCopyId) {
        throw spec.makeError(`lesson "${lesson.id}" has no titleCopyId.`);
      }
      if (
        !Array.isArray(lesson.objectiveCopyIds) ||
        lesson.objectiveCopyIds.length === 0 ||
        lesson.objectiveCopyIds.some((id) => !id)
      ) {
        throw spec.makeError(`lesson "${lesson.id}" has no objectiveCopyIds.`);
      }
      lessonIds.add(lesson.id);
    }
    moduleIds.add(courseModule.id);
  }

  if (lessonCount !== spec.lessons) {
    throw spec.makeError(
      `expected exactly ${spec.lessons} lessons across all modules, got ${lessonCount}.`,
    );
  }
}

export function assertBaseCourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  assertCourseShapeCore(modules, BASE_SHAPE);
}

export function assertA1CourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  assertCourseShapeCore(modules, A1_SHAPE);
}

export function assertA2CourseShape(
  modules: readonly CourseModule[],
): asserts modules is readonly CourseModule[] {
  assertCourseShapeCore(modules, A2_SHAPE);
}
