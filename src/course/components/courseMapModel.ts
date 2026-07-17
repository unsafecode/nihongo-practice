import {
  knownVisitedLessonIds,
  recommendContinuationLessonId,
} from "../progress/progress";

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
 *
 * The A1 release catalog has no phase concept (design spec §6, Phase 2
 * Task 6): the map is a single ordered path of twelve modules, not four
 * phase bands, so this outline intentionally carries no `phase` field.
 */
export interface CourseMapModuleOutline {
  readonly id: string;
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
  /** Lessons whose required exercises have all been attempted at least once
   * (`practicedAt` evidence). A strict subset concern of `visitedLessonIds`
   * in practice, but reported independently and truthfully — never inferred
   * from `visitedLessonIds` alone (design spec §17, Phase 2 Task 6). */
  readonly practicedLessonIds: ReadonlySet<string>;
  readonly practicedCount: number;
  /** Lessons whose required exercises have all been accepted at least once
   * (`consolidatedAt` evidence) — the "demonstrated" evidence tier. Never a
   * pass/fail verdict, only an observed-evidence count. */
  readonly demonstratedLessonIds: ReadonlySet<string>;
  readonly demonstratedCount: number;
}

/**
 * The minimal per-lesson evidence the course map needs beyond "visited":
 * whether the lesson's required exercises have ever been fully attempted
 * (`practicedAt`) or fully accepted (`consolidatedAt`). Mirrors the shape of
 * `LessonProgressV3` (see ../progress/progress) without depending on its
 * full type, so tests can build tiny synthetic fixtures.
 */
export interface CourseMapLessonEvidence {
  readonly practicedAt: string | null;
  readonly consolidatedAt: string | null;
}

export interface CourseMapModel<M extends CourseMapModuleOutline> {
  /** Every module, in the given (course) order — a single path, not phase bands. */
  readonly modules: readonly ModuleMapEntry<M>[];
  readonly allVisited: boolean;
  readonly recommendedModuleId: string | null;
  readonly recommendedLessonId: string | null;
  readonly currentModuleId: string | null;
  readonly currentLessonId: string | null;
  readonly visitedLessonCount: number;
  readonly totalLessonCount: number;
  readonly practicedLessonCount: number;
  readonly demonstratedLessonCount: number;
}

/**
 * Pure, deterministic course-map view-model (Phase 2 Task 6, design spec
 * §6/§17). The recommendation is the single source of truth defined in
 * §7.3 — `recommendContinuationLessonId` — never a duplicated algorithm:
 *
 * - The recommended lesson is (1) the recognized `lastVisitedLessonId`
 *   when it still maps to a known lesson; else (2) the first unvisited
 *   lesson in course order whose module prerequisites are fully visited;
 *   else (3) the very first lesson. It is only `null` when there are no
 *   lessons at all.
 * - "current" is the recognized `lastVisitedLessonId` when known, and
 *   otherwise the recommendation. Because §7.3 rule 1 already resumes a
 *   valid last-visited lesson, current and recommended coincide on the
 *   same continuation module.
 * - Opaque/legacy visited ids (not present in the given modules) never
 *   affect counts, the recommendation, or "current".
 * - `allVisited` remains a pure count state (every known lesson visited);
 *   it does not blank the recommendation. Even when everything is visited
 *   the recommendation is the valid last-visited lesson, or the first
 *   lesson fallback.
 * - The A1 release has no phase concept: modules are returned as a single
 *   ordered list (course order), not grouped into phase bands.
 */
export function buildCourseMapModel<M extends CourseMapModuleOutline>(
  modules: readonly M[],
  visitedLessonIds: readonly string[],
  lastVisitedLessonId: string | null,
  lessonEvidence: Readonly<Record<string, CourseMapLessonEvidence>> = {},
): CourseMapModel<M> {
  const orderedLessons = modules.flatMap((courseModule) => courseModule.lessons);
  const knownLessonIds = new Set(orderedLessons.map((lessonItem) => lessonItem.id));
  const visitedSet = new Set(
    knownVisitedLessonIds([...visitedLessonIds], knownLessonIds),
  );

  // Opaque/legacy evidence ids (not present in the given modules) never
  // affect these counts either, mirroring the visited-set behavior above.
  const practicedSet = new Set(
    orderedLessons
      .map((lessonItem) => lessonItem.id)
      .filter((id) => lessonEvidence[id]?.practicedAt != null),
  );
  const demonstratedSet = new Set(
    orderedLessons
      .map((lessonItem) => lessonItem.id)
      .filter((id) => lessonEvidence[id]?.consolidatedAt != null),
  );

  const firstUnvisited = orderedLessons.find((lessonItem) => !visitedSet.has(lessonItem.id));
  const allVisited = firstUnvisited === undefined;

  const recognizedLastVisited =
    lastVisitedLessonId !== null && knownLessonIds.has(lastVisitedLessonId)
      ? lastVisitedLessonId
      : null;

  const modulesById = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));

  function moduleIdForLesson(lessonId: string | null): string | null {
    if (lessonId === null) return null;
    for (const courseModule of modules) {
      if (courseModule.lessons.some((lessonItem) => lessonItem.id === lessonId)) {
        return courseModule.id;
      }
    }
    return null;
  }

  // Single source of truth (design spec §7.3): the map recommendation and the
  // CourseHome CTA both derive from this, never a re-implemented scan.
  const recommendedLessonId = recommendContinuationLessonId(
    modules,
    visitedLessonIds,
    lastVisitedLessonId,
  );
  const recommendedModuleId = moduleIdForLesson(recommendedLessonId);

  // "current" is the recognized last-visited context, otherwise the
  // recommendation. Since §7.3 resumes a valid last-visited lesson these
  // coincide, but the fallback keeps current well-defined when nothing is
  // recognized (e.g. a fresh or fully-visited course with no last visit).
  const currentLessonId = recognizedLastVisited ?? recommendedLessonId;
  const currentModuleId = moduleIdForLesson(currentLessonId);

  const moduleEntries: ModuleMapEntry<M>[] = modules.map((courseModule): ModuleMapEntry<M> => {
    const visitedHere = new Set(
      courseModule.lessons
        .map((lessonItem) => lessonItem.id)
        .filter((id) => visitedSet.has(id)),
    );
    const practicedHere = new Set(
      courseModule.lessons
        .map((lessonItem) => lessonItem.id)
        .filter((id) => practicedSet.has(id)),
    );
    const demonstratedHere = new Set(
      courseModule.lessons
        .map((lessonItem) => lessonItem.id)
        .filter((id) => demonstratedSet.has(id)),
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
      practicedLessonIds: practicedHere,
      practicedCount: practicedHere.size,
      demonstratedLessonIds: demonstratedHere,
      demonstratedCount: demonstratedHere.size,
    };
  });

  return {
    modules: moduleEntries,
    allVisited,
    recommendedModuleId,
    recommendedLessonId,
    currentModuleId,
    currentLessonId,
    visitedLessonCount: visitedSet.size,
    totalLessonCount: orderedLessons.length,
    practicedLessonCount: practicedSet.size,
    demonstratedLessonCount: demonstratedSet.size,
  };
}
