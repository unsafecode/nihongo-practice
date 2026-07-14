import { PHASE_IDS, type PhaseId } from "../data/types";
import { knownVisitedLessonIds } from "../progress/progress";

/**
 * Minimal structural shape the course-map model needs from a lesson.
 * A full `Lesson` (see ../data/types) satisfies this directly.
 */
export interface CourseMapLessonOutline {
  readonly id: string;
}

/**
 * Minimal structural shape the course-map model needs from a module.
 * A full `CourseModule` (see ../data/types) satisfies this directly, so
 * `buildCourseMapModel(courseModules, ...)` yields a model whose
 * `entry.module` is the complete, richly-typed `CourseModule` — no cast
 * needed — while tests can still build tiny synthetic fixtures.
 */
export interface CourseMapModuleOutline {
  readonly id: string;
  readonly phase: PhaseId;
  readonly prerequisiteIds: readonly string[];
  readonly lessons: readonly CourseMapLessonOutline[];
}

export interface ModuleMapEntry<M extends CourseMapModuleOutline> {
  readonly module: M;
  /** Advisory prerequisite modules resolved from ids (empty = none/start here). */
  readonly prerequisiteModules: readonly M[];
  readonly visitedLessonIds: ReadonlySet<string>;
  readonly visitedCount: number;
  readonly totalCount: number;
  readonly isFullyVisited: boolean;
  readonly isCurrent: boolean;
  readonly isRecommended: boolean;
}

export interface CourseMapPhaseGroup<M extends CourseMapModuleOutline> {
  readonly phaseId: PhaseId;
  readonly modules: readonly ModuleMapEntry<M>[];
}

export interface CourseMapModel<M extends CourseMapModuleOutline> {
  readonly phases: readonly CourseMapPhaseGroup<M>[];
  readonly allVisited: boolean;
  readonly recommendedModuleId: string | null;
  readonly recommendedLessonId: string | null;
  readonly currentModuleId: string | null;
  readonly currentLessonId: string | null;
  readonly visitedLessonCount: number;
  readonly totalLessonCount: number;
}

/**
 * Pure, deterministic course-map view-model (design spec §4.2/§5.1-§5.4,
 * §6.2). Rules (Task 4 item 5):
 *
 * - If any known lesson is unvisited, the recommendation is the first
 *   unvisited lesson in approved module/lesson order — regardless of a
 *   module's advisory `prerequisiteIds` (prerequisites are display-only).
 * - `lastVisitedLessonId` identifies the "current" context when it is a
 *   recognized (known) lesson id; the recommendation is unaffected by it.
 *   When the current module still contains the recommended lesson, that
 *   module is both current and recommended.
 * - Opaque/legacy visited ids (not present in the given modules) never
 *   affect counts or the recommendation.
 * - Once every known lesson is visited, there is no recommendation
 *   (`recommendedLessonId`/`recommendedModuleId` are `null`); "current"
 *   falls back to the recognized `lastVisitedLessonId`, or — if that is
 *   absent/unrecognized — to the final module's first lesson (a capstone
 *   fallback, not a hardcoded id).
 */
export function buildCourseMapModel<M extends CourseMapModuleOutline>(
  modules: readonly M[],
  visitedLessonIds: readonly string[],
  lastVisitedLessonId: string | null,
): CourseMapModel<M> {
  const orderedLessons = modules.flatMap((courseModule) => courseModule.lessons);
  const knownLessonIds = new Set(orderedLessons.map((lessonItem) => lessonItem.id));
  const visitedSet = new Set(
    knownVisitedLessonIds([...visitedLessonIds], knownLessonIds),
  );

  const firstUnvisited = orderedLessons.find((lessonItem) => !visitedSet.has(lessonItem.id));
  const allVisited = firstUnvisited === undefined;

  const recognizedLastVisited =
    lastVisitedLessonId !== null && knownLessonIds.has(lastVisitedLessonId)
      ? lastVisitedLessonId
      : null;

  const modulesById = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));

  function moduleIdForLesson(lessonId: string): string | null {
    for (const courseModule of modules) {
      if (courseModule.lessons.some((lessonItem) => lessonItem.id === lessonId)) {
        return courseModule.id;
      }
    }
    return null;
  }

  const recommendedLessonId = allVisited ? null : firstUnvisited.id;
  const recommendedModuleId =
    recommendedLessonId === null ? null : moduleIdForLesson(recommendedLessonId);

  let currentLessonId: string | null;
  let currentModuleId: string | null;
  if (recognizedLastVisited !== null) {
    currentLessonId = recognizedLastVisited;
    currentModuleId = moduleIdForLesson(recognizedLastVisited);
  } else if (!allVisited) {
    currentLessonId = recommendedLessonId;
    currentModuleId = recommendedModuleId;
  } else {
    // All visited, nothing recognized to anchor on: fall back to the
    // final module's first lesson (the capstone, by course order).
    const fallbackModule = modules[modules.length - 1] ?? null;
    const fallbackLesson = fallbackModule?.lessons[0] ?? null;
    currentModuleId = fallbackModule?.id ?? null;
    currentLessonId = fallbackLesson?.id ?? null;
  }

  const phases: CourseMapPhaseGroup<M>[] = PHASE_IDS.map((phaseId) => ({
    phaseId,
    modules: modules
      .filter((courseModule) => courseModule.phase === phaseId)
      .map((courseModule): ModuleMapEntry<M> => {
        const visitedHere = new Set(
          courseModule.lessons
            .map((lessonItem) => lessonItem.id)
            .filter((id) => visitedSet.has(id)),
        );
        const prerequisiteModules = courseModule.prerequisiteIds
          .map((id) => modulesById.get(id))
          .filter((value): value is M => value !== undefined);
        return {
          module: courseModule,
          prerequisiteModules,
          visitedLessonIds: visitedHere,
          visitedCount: visitedHere.size,
          totalCount: courseModule.lessons.length,
          isFullyVisited:
            courseModule.lessons.length > 0 &&
            visitedHere.size === courseModule.lessons.length,
          isCurrent: courseModule.id === currentModuleId,
          isRecommended: courseModule.id === recommendedModuleId,
        };
      }),
  }));

  return {
    phases,
    allVisited,
    recommendedModuleId,
    recommendedLessonId,
    currentModuleId,
    currentLessonId,
    visitedLessonCount: visitedSet.size,
    totalLessonCount: orderedLessons.length,
  };
}
