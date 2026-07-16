/**
 * Course progress storage schema and pure migration/query helpers.
 *
 * Storage key stays `nihongo.course.progress` (see ProgressContext.STORAGE_KEY).
 * v1 used "completed" language; v2 replaces it with "visited" semantics
 * throughout (Task 3 §B). v1 payloads already on disk are migrated
 * losslessly on read - see migrateV1ToV2.
 *
 * Slice C adds evidence-based practiced/consolidated transitions and the
 * lightweight `Da ripassare` review queue (design spec §10.4, §11.1). Those
 * mutations are pure and deterministic: every timestamp is supplied by the
 * caller as `evidence.at`, and the review-queue primitives live in the sibling
 * `reviewQueue` module. The load-bearing rule is that progress stores only
 * semantic IDs and interaction evidence — never a duplicated answer string.
 */

import {
  lessonHasOpenReview,
  resolveReviewEntry,
  reviewKeyFor,
  upsertReviewMistake,
} from "./reviewQueue";

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

// ── Evidence-based practiced/consolidated transitions (spec §10.4, §11.1) ─────

/**
 * One valid exercise attempt's evidence. The caller (the lesson/review UI via
 * `ProgressContext`) supplies the lesson's authored 3-5 required exercise IDs —
 * the practiced/consolidated gate — the assessed target IDs for the review
 * entry, and the transition timestamp, so these functions stay pure and
 * deterministic. No answer string is ever carried here, only semantic IDs.
 */
export interface ExerciseEvidence {
  readonly lessonId: string;
  readonly exerciseDefinitionId: string;
  /** The lesson's authored required exercise IDs (the evidence gate). */
  readonly requiredExerciseIds: readonly string[];
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
  /** ISO timestamp written at the transition this evidence describes. */
  readonly at: string;
}

/**
 * Whether an accepted attempt happened inside a lesson or in review mode. Only a
 * review-mode acceptance resolves an existing review entry (spec §10.4): a
 * same-lesson correction never silently removes the item that keeps the lesson
 * from consolidating.
 */
export type ReviewMode = "lesson" | "review";

function sameIdList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function sameLessonProgress(a: LessonProgressV3, b: LessonProgressV3): boolean {
  return (
    a.visitedAt === b.visitedAt &&
    a.practicedAt === b.practicedAt &&
    a.consolidatedAt === b.consolidatedAt &&
    sameIdList(a.attemptedExerciseIds, b.attemptedExerciseIds) &&
    sameIdList(a.acceptedExerciseIds, b.acceptedExerciseIds)
  );
}

function coversAll(present: readonly string[], required: readonly string[]): boolean {
  const set = new Set(present);
  return required.every((id) => set.has(id));
}

/**
 * Fold a valid attempt into a lesson's evidence: record the attempted exercise
 * ID (idempotent, encounter order) and set `practicedAt` once every required
 * exercise has at least one attempt (spec §11.1). Never touches accepted or
 * consolidated evidence. Returns the same reference when the attempt changes
 * nothing so callers can detect a no-op.
 */
function foldAttempt(
  lesson: LessonProgressV3,
  evidence: ExerciseEvidence,
): LessonProgressV3 {
  const attemptedExerciseIds = dedupeInEncounterOrder([
    ...lesson.attemptedExerciseIds,
    evidence.exerciseDefinitionId,
  ]);
  const attemptAdded =
    attemptedExerciseIds.length !== lesson.attemptedExerciseIds.length;
  const practicedAt =
    lesson.practicedAt ??
    (coversAll(attemptedExerciseIds, evidence.requiredExerciseIds)
      ? evidence.at
      : null);
  if (!attemptAdded && practicedAt === lesson.practicedAt) return lesson;
  return { ...lesson, attemptedExerciseIds, practicedAt };
}

function writeLesson(
  progress: CourseProgressV3,
  lessonId: string,
  lesson: LessonProgressV3,
  at: string,
): CourseProgressV3 {
  return {
    ...progress,
    lessons: { ...progress.lessons, [lessonId]: lesson },
    updatedAt: at,
  };
}

/**
 * Record a valid exercise attempt, advancing `visited → practiced` only when the
 * lesson's whole required set has been attempted (spec §11.1). A brand-new
 * lesson is materialised as visited-at-`evidence.at` because practising a lesson
 * means its route rendered. Fully idempotent by reference: a repeat attempt that
 * changes no evidence returns the exact same object with no `updatedAt` churn.
 * This never invents accepted or consolidated evidence or touches the queue.
 */
export function recordExerciseAttempt(
  progress: CourseProgressV3,
  evidence: ExerciseEvidence,
): CourseProgressV3 {
  const existing = progress.lessons[evidence.lessonId];
  const lesson = foldAttempt(existing ?? lessonVisit(evidence.at), evidence);
  if (existing !== undefined && lesson === existing) return progress;
  return writeLesson(progress, evidence.lessonId, lesson, evidence.at);
}

/**
 * Record a non-accepted valid attempt: it still counts toward `practiced`, but
 * it also upserts a lightweight review entry (incrementing on repeats) and
 * clears the lesson's `consolidatedAt` because a new relevant mistake has
 * entered the queue (spec §11.2). Visited and practiced evidence is retained. A
 * mistake is never a no-op — the queue entry always upserts.
 */
export function recordExerciseMistake(
  progress: CourseProgressV3,
  evidence: ExerciseEvidence,
): CourseProgressV3 {
  const existing = progress.lessons[evidence.lessonId];
  const attempted = foldAttempt(existing ?? lessonVisit(evidence.at), evidence);
  const lesson =
    attempted.consolidatedAt === null
      ? attempted
      : { ...attempted, consolidatedAt: null };
  const reviewQueue = upsertReviewMistake(progress.reviewQueue, {
    lessonId: evidence.lessonId,
    exerciseDefinitionId: evidence.exerciseDefinitionId,
    targetConceptIds: evidence.targetConceptIds,
    targetLexemeIds: evidence.targetLexemeIds,
    at: evidence.at,
  });
  return {
    ...progress,
    lessons: { ...progress.lessons, [evidence.lessonId]: lesson },
    reviewQueue,
    updatedAt: evidence.at,
  };
}

/**
 * Record an accepted attempt: it counts toward `practiced`, records accepted
 * evidence (idempotent, encounter order), and — in review mode only — resolves
 * the matching review entry (spec §10.4). The lesson advances to
 * `consolidated` only when it is practiced, every required exercise has an
 * accepted result, and no active review entry remains for the lesson (spec
 * §11.1). A no-op acceptance on an already-consolidated lesson returns the same
 * reference with no `updatedAt` churn.
 */
export function recordExerciseAcceptance(
  progress: CourseProgressV3,
  evidence: ExerciseEvidence,
  mode: ReviewMode = "lesson",
): CourseProgressV3 {
  const existing = progress.lessons[evidence.lessonId];
  const attempted = foldAttempt(existing ?? lessonVisit(evidence.at), evidence);
  const acceptedExerciseIds = dedupeInEncounterOrder([
    ...attempted.acceptedExerciseIds,
    evidence.exerciseDefinitionId,
  ]);

  const reviewKey = reviewKeyFor(evidence.lessonId, evidence.exerciseDefinitionId);
  const reviewQueue =
    mode === "review"
      ? resolveReviewEntry(progress.reviewQueue, reviewKey)
      : progress.reviewQueue;
  const reviewResolved = reviewQueue.length !== progress.reviewQueue.length;

  const gateMet =
    attempted.practicedAt !== null &&
    coversAll(acceptedExerciseIds, evidence.requiredExerciseIds) &&
    !lessonHasOpenReview(reviewQueue, evidence.lessonId);
  const consolidatedAt =
    attempted.consolidatedAt ?? (gateMet ? evidence.at : null);

  const lesson: LessonProgressV3 = { ...attempted, acceptedExerciseIds, consolidatedAt };

  if (existing !== undefined && sameLessonProgress(existing, lesson) && !reviewResolved) {
    return progress;
  }
  return {
    ...progress,
    lessons: { ...progress.lessons, [evidence.lessonId]: lesson },
    reviewQueue,
    updatedAt: evidence.at,
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
