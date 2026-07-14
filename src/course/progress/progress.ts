/**
 * Course progress storage schema and pure migration/query helpers.
 *
 * Storage key stays `nihongo.course.progress` (see ProgressContext.STORAGE_KEY).
 * v1 used "completed" language; v2 replaces it with "visited" semantics
 * throughout (Task 3 §B). v1 payloads already on disk are migrated
 * losslessly on read - see migrateV1ToV2.
 */

export interface CourseProgressV1 {
  schemaVersion: 1;
  completedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}

export interface CourseProgressV2 {
  schemaVersion: 2;
  visitedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}

export function emptyProgress(): CourseProgressV2 {
  return {
    schemaVersion: 2,
    visitedLessonIds: [],
    lastVisitedLessonId: null,
    updatedAt: new Date(0).toISOString(),
  };
}

function dedupeInEncounterOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Losslessly migrates a v1 "completed" snapshot into the v2 "visited"
 * schema. Every completed lesson id - including unknown/legacy opaque ids
 * no longer recognized by the current course data - is copied into
 * `visitedLessonIds` (deduplicated, in encounter order). The opaque
 * `lastVisitedLessonId` and original `updatedAt` are preserved verbatim.
 * No id remapping is applied because Task 3 preserves every lesson id.
 */
export function migrateV1ToV2(v1: CourseProgressV1): CourseProgressV2 {
  return {
    schemaVersion: 2,
    visitedLessonIds: dedupeInEncounterOrder(v1.completedLessonIds),
    lastVisitedLessonId: v1.lastVisitedLessonId,
    updatedAt: v1.updatedAt,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isValidV1Shape(value: Partial<CourseProgressV1>): value is CourseProgressV1 {
  return (
    value.schemaVersion === 1 &&
    isStringArray(value.completedLessonIds) &&
    isOptionalString(value.lastVisitedLessonId ?? null) &&
    typeof value.updatedAt === "string"
  );
}

function isValidV2Shape(value: Partial<CourseProgressV2>): value is CourseProgressV2 {
  return (
    value.schemaVersion === 2 &&
    isStringArray(value.visitedLessonIds) &&
    isOptionalString(value.lastVisitedLessonId ?? null) &&
    typeof value.updatedAt === "string"
  );
}

/**
 * Parses raw stored text into current-schema (v2) progress.
 * Explicit, non-throwing behavior for every payload shape:
 * - `null` (nothing stored yet) -> empty v2 progress, not corrupted.
 * - valid v2 -> passed through unchanged.
 * - valid v1 -> migrated to v2 via migrateV1ToV2.
 * - malformed JSON, malformed v1/v2 shape, missing schemaVersion, or a
 *   future/unknown schemaVersion -> empty v2 progress, corrupted: true.
 * No genuine unversioned (pre-schemaVersion) payload has ever shipped from
 * this codebase, so an absent schemaVersion is treated as corrupted rather
 * than guessed at.
 */
export function parseProgress(raw: string | null): {
  progress: CourseProgressV2;
  corrupted: boolean;
} {
  if (raw === null) return { progress: emptyProgress(), corrupted: false };
  try {
    const value = JSON.parse(raw) as
      & { schemaVersion?: unknown }
      & Partial<CourseProgressV1>
      & Partial<CourseProgressV2>;
    if (value.schemaVersion === 2) {
      return isValidV2Shape(value)
        ? { progress: value, corrupted: false }
        : { progress: emptyProgress(), corrupted: true };
    }
    if (value.schemaVersion === 1) {
      return isValidV1Shape(value)
        ? { progress: migrateV1ToV2(value), corrupted: false }
        : { progress: emptyProgress(), corrupted: true };
    }
    return { progress: emptyProgress(), corrupted: true };
  } catch {
    return { progress: emptyProgress(), corrupted: true };
  }
}

/**
 * Marks a lesson visited: adds it to `visitedLessonIds` (idempotent) and
 * records it as the last visited lesson, in one action. This is the only
 * mutation Task 3 exposes - there is no complete/uncomplete toggle.
 *
 * Fully idempotent by reference: if `lessonId` is already in
 * `visitedLessonIds` *and* already `lastVisitedLessonId`, this returns the
 * exact same `progress` object (no new object, no `updatedAt` bump). This
 * is a defensive contract - callers (notably `LessonPage`'s visited-marking
 * effect) may invoke this repeatedly for the same lesson across renders,
 * and a no-op re-mark must not produce a fresh object/timestamp that would
 * cascade into unnecessary context rerenders and storage writes.
 */
export function markLessonVisited(
  progress: CourseProgressV2,
  lessonId: string,
): CourseProgressV2 {
  const alreadyCurrent =
    progress.lastVisitedLessonId === lessonId &&
    progress.visitedLessonIds.includes(lessonId);
  if (alreadyCurrent) return progress;

  const visited = new Set(progress.visitedLessonIds);
  visited.add(lessonId);
  return {
    ...progress,
    visitedLessonIds: [...visited],
    lastVisitedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
}

/** Filters stored visited ids down to ones the current course still recognizes. */
export function knownVisitedLessonIds(
  visitedLessonIds: string[],
  knownLessonIds: ReadonlySet<string>,
): string[] {
  return visitedLessonIds.filter((id) => knownLessonIds.has(id));
}

export function visitedPercent(visited: string[], total: number): number {
  return total === 0 ? 0 : Math.round((visited.length / total) * 100);
}

/**
 * Minimal structural view of the course a continuation recommendation
 * needs. `CourseModule[]` satisfies this directly (no cast required) -
 * kept separate from the full course data type so this pure function
 * stays easy to unit test with small synthetic fixtures.
 */
export interface ModuleOutline {
  id: string;
  prerequisiteIds: string[];
  lessons: { id: string }[];
}

/**
 * Recommends which lesson to continue with next (design spec §7.3):
 * 1. the last visited lesson, if it still exists in the current course;
 * 2. else the first unvisited lesson in course order whose module's
 *    prerequisite modules are all themselves fully visited;
 * 3. else the very first lesson in course order.
 * Prerequisites are advisory only - this never blocks navigation, it only
 * orders the suggestion. An unknown prerequisite module id never blocks.
 */
export function recommendContinuationLessonId(
  modules: ModuleOutline[],
  visitedLessonIds: string[],
  lastVisitedLessonId: string | null,
): string | null {
  const orderedLessons = modules.flatMap((courseModule) => courseModule.lessons);
  if (orderedLessons.length === 0) return null;

  const knownLessonIds = new Set(orderedLessons.map((lesson) => lesson.id));
  if (lastVisitedLessonId !== null && knownLessonIds.has(lastVisitedLessonId)) {
    return lastVisitedLessonId;
  }

  const visited = new Set(visitedLessonIds);
  const modulesById = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));

  function isModuleFullyVisited(moduleId: string): boolean {
    const courseModule = modulesById.get(moduleId);
    if (!courseModule) return true; // unknown prerequisite id never blocks
    return courseModule.lessons.every((lesson) => visited.has(lesson.id));
  }

  for (const courseModule of modules) {
    for (const lesson of courseModule.lessons) {
      if (visited.has(lesson.id)) continue;
      if (courseModule.prerequisiteIds.every(isModuleFullyVisited)) {
        return lesson.id;
      }
    }
  }

  return orderedLessons[0].id;
}
