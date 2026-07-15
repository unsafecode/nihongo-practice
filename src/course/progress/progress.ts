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

export interface LessonProgressV3 {
  visitedAt: string | null;
  practicedAt: string | null;
  consolidatedAt: string | null;
  attemptedExerciseIds: string[];
  acceptedExerciseIds: string[];
}

export interface ReviewQueueEntry {
  reviewKey: string;
  lessonId: string;
  exerciseDefinitionId: string;
  targetConceptIds: string[];
  targetLexemeIds: string[];
  mistakeCount: number;
  lastMistakeAt: string;
}

export interface CourseProgressV3 {
  schemaVersion: 3;
  catalogVersion: "a0-a1-v1";
  lessons: Record<string, LessonProgressV3>;
  lastVisitedLessonId: string | null;
  reviewQueue: ReviewQueueEntry[];
  orphanedLessonIds: string[];
  orphanedReviewKeys: string[];
  updatedAt: string;
}

export interface ProgressParseResult {
  progress: CourseProgressV3;
  corrupted: boolean;
  migrated: boolean;
}

export function emptyProgress(): CourseProgressV3 {
  return {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: {},
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
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
 * A genuinely absent `lastVisitedLessonId` (from a very old v1 payload
 * written before the field existed) normalizes to an explicit `null`, so
 * the v2 result is always well-formed - never `undefined`. No id remapping
 * is applied because Task 3 preserves every lesson id.
 */
export function migrateV1ToV2(v1: CourseProgressV1): CourseProgressV2 {
  return {
    schemaVersion: 2,
    visitedLessonIds: dedupeInEncounterOrder(v1.completedLessonIds),
    lastVisitedLessonId: v1.lastVisitedLessonId ?? null,
    updatedAt: v1.updatedAt,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isLessonProgressV3(value: unknown): value is LessonProgressV3 {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Partial<LessonProgressV3>;
  return (
    isOptionalString(lesson.visitedAt ?? null) &&
    isOptionalString(lesson.practicedAt ?? null) &&
    isOptionalString(lesson.consolidatedAt ?? null) &&
    isStringArray(lesson.attemptedExerciseIds) &&
    isStringArray(lesson.acceptedExerciseIds)
  );
}

function isReviewQueueEntry(value: unknown): value is ReviewQueueEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ReviewQueueEntry>;
  return (
    typeof entry.reviewKey === "string" &&
    typeof entry.lessonId === "string" &&
    typeof entry.exerciseDefinitionId === "string" &&
    isStringArray(entry.targetConceptIds) &&
    isStringArray(entry.targetLexemeIds) &&
    Number.isInteger(entry.mistakeCount) &&
    typeof entry.lastMistakeAt === "string"
  );
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

function isValidV3Shape(value: Partial<CourseProgressV3>): value is CourseProgressV3 {
  return (
    value.schemaVersion === 3 &&
    value.catalogVersion === "a0-a1-v1" &&
    !!value.lessons &&
    typeof value.lessons === "object" &&
    Object.values(value.lessons).every(isLessonProgressV3) &&
    isOptionalString(value.lastVisitedLessonId ?? null) &&
    Array.isArray(value.reviewQueue) &&
    value.reviewQueue.every(isReviewQueueEntry) &&
    isStringArray(value.orphanedLessonIds) &&
    isStringArray(value.orphanedReviewKeys) &&
    typeof value.updatedAt === "string"
  );
}

function lessonVisit(visitedAt: string): LessonProgressV3 {
  return {
    visitedAt,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
  };
}

export function migrateV2ToV3(
  progress: CourseProgressV2,
  knownLessonIds: ReadonlySet<string> = new Set(progress.visitedLessonIds),
): CourseProgressV3 {
  const lessons: Record<string, LessonProgressV3> = {};
  const orphanedLessonIds: string[] = [];

  for (const lessonId of dedupeInEncounterOrder(progress.visitedLessonIds)) {
    if (knownLessonIds.has(lessonId)) {
      lessons[lessonId] = lessonVisit(progress.updatedAt);
    } else {
      orphanedLessonIds.push(lessonId);
    }
  }

  return {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons,
    lastVisitedLessonId: progress.lastVisitedLessonId,
    reviewQueue: [],
    orphanedLessonIds,
    orphanedReviewKeys: [],
    updatedAt: progress.updatedAt,
  };
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
export function parseProgress(
  raw: string | null,
  knownLessonIds?: ReadonlySet<string>,
): ProgressParseResult {
  if (raw === null) {
    return { progress: emptyProgress(), corrupted: false, migrated: false };
  }
  try {
    const value = JSON.parse(raw) as { schemaVersion?: unknown };
    if (value.schemaVersion === 3) {
      const candidate = value as Partial<CourseProgressV3>;
      return isValidV3Shape(candidate)
        ? { progress: candidate, corrupted: false, migrated: false }
        : { progress: emptyProgress(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 2) {
      const candidate = value as Partial<CourseProgressV2>;
      return isValidV2Shape(candidate)
        ? {
            progress: migrateV2ToV3(
              candidate,
              knownLessonIds ?? new Set(candidate.visitedLessonIds),
            ),
            corrupted: false,
            migrated: true,
          }
        : { progress: emptyProgress(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 1) {
      const candidate = value as Partial<CourseProgressV1>;
      if (!isValidV1Shape(candidate)) {
        return { progress: emptyProgress(), corrupted: true, migrated: false };
      }
      const v2 = migrateV1ToV2(candidate);
      return {
        progress: migrateV2ToV3(
          v2,
          knownLessonIds ?? new Set(v2.visitedLessonIds),
        ),
        corrupted: false,
        migrated: true,
      };
    }
    return { progress: emptyProgress(), corrupted: true, migrated: false };
  } catch {
    return { progress: emptyProgress(), corrupted: true, migrated: false };
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
  progress: CourseProgressV3,
  lessonId: string,
): CourseProgressV3 {
  const alreadyCurrent =
    progress.lastVisitedLessonId === lessonId &&
    progress.lessons[lessonId]?.visitedAt !== null &&
    progress.lessons[lessonId] !== undefined;
  if (alreadyCurrent) return progress;

  const updatedAt = new Date().toISOString();
  const existing = progress.lessons[lessonId];
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: existing
        ? { ...existing, visitedAt: existing.visitedAt ?? updatedAt }
        : lessonVisit(updatedAt),
    },
    lastVisitedLessonId: lessonId,
    updatedAt,
  };
}

export function visitedLessonIds(progress: CourseProgressV3): string[] {
  return Object.entries(progress.lessons)
    .filter(([, lesson]) => lesson.visitedAt !== null)
    .map(([lessonId]) => lessonId);
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
  readonly id: string;
  readonly prerequisiteIds: readonly string[];
  readonly lessons: readonly { readonly id: string }[];
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
  modules: readonly ModuleOutline[],
  visitedLessonIds: readonly string[],
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
