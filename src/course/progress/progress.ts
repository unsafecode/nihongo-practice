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
  reconcileReviewQueueEntries,
  resolveReviewEntry,
  reviewKeyFor,
  upsertReviewMistake,
} from "./reviewQueue";
import { V4_ACTIVITY_MIGRATION_MAP } from "../base/migration/v4ActivityMap";
import { V4_CANDO_MIGRATION_MAP } from "../base/migration/v4CanDoMap";
import { V4_OWNERSHIP_MIGRATION_MAP } from "../base/migration/v4OwnershipMap";
import { lessonIdsForLevel } from "../levels/ownership";
import {
  COURSE_LEVEL_IDS,
  type CourseLevelId as SharedCourseLevelId,
} from "../levels/types";

/** V4-compatible A1/A2 alias retained for the unchanged runtime bridge. */
export type CourseLevelId = Exclude<SharedCourseLevelId, "a0">;

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

// ── Schema V4: level-aware progress (A1/A2), visited-only schema migration ─
//
// Phase 2 Task 5 replaces the single-level schema-v3 with level-aware schema-v4
// (design spec §17). Schema-v3 predates the A1/A2 split entirely, so there is
// no lossless "same shape, more fields" migration path: schema-v3→schema-v4 is a
// deliberate, one-way, visited-only migration. Only `visitedAt` transfers for
// a small explicit, reviewed map of v3 A1 lesson ids (`A1_V3_LESSON_ID_MAP`)
// — every other kind of evidence (practiced/consolidated timestamps,
// attempted/accepted exercise ids, review-queue entries, Can-do evidence,
// checkpoint attempts) is deliberately reset to zero, because the A1/A2
// catalog's exercises are new authored content the learner has never
// actually attempted. A2 always starts completely empty: no v3 concept of a
// second level ever existed to migrate from.
//
// This is a pure, deterministic, idempotent, side-effect-free migration:
// given the same v3 input it always produces the same v4 output (by value),
// it never mutates its input, and it never calls `Date` — every timestamp in
// the result is either the source's own `updatedAt` or `null`.

type V4CourseLevelId = CourseLevelId;
export type LessonId = string;
export type CanDoId = string;
export type CheckpointId = string;
export type ExerciseDefinitionId = string;
export type CheckpointAttemptId = string;

/** Alias kept for v4 naming parity with the design spec; identical shape to v3. */
export type LessonProgress = LessonProgressV3;

/**
 * Observed evidence for one Can-do statement (design spec §8). Only ever
 * records what actually happened — visited/practiced lessons, accepted
 * transfer exercises, and checkpoint attempts that sampled it — never a
 * pass/fail verdict or a mastery/certification claim.
 */
export interface CanDoEvidence {
  readonly canDoId: CanDoId;
  readonly visitedLessonIds: readonly LessonId[];
  readonly practicedLessonIds: readonly LessonId[];
  readonly acceptedTransferExerciseIds: readonly ExerciseDefinitionId[];
  readonly checkpointAttemptIds: readonly CheckpointAttemptId[];
  readonly lastUpdatedAt: string;
}

/**
 * One completed checkpoint attempt. The design spec (§17) references
 * `CheckpointAttemptId` but never defines this interface's shape; this is
 * modeled after `A1CheckpointDefinition`'s scenario/sampled-Can-do/minimum-
 * accepted-transfer-targets fields. Records only observational evidence —
 * which exercises were accepted and which Can-dos were sampled — never a
 * pass/fail verdict, matching `CanDoEvidence`'s truthful-copy constraint.
 */
export interface CheckpointAttempt {
  readonly id: CheckpointAttemptId;
  readonly checkpointId: CheckpointId;
  readonly attemptedAt: string;
  readonly acceptedExerciseIds: readonly ExerciseDefinitionId[];
  readonly sampledCanDoIds: readonly CanDoId[];
}

/** One legacy V4 level's (A1 or A2) complete, independent progress. */
export interface LevelProgress {
  readonly lessons: Readonly<Record<LessonId, LessonProgress>>;
  readonly canDos: Readonly<Record<CanDoId, CanDoEvidence>>;
  readonly checkpointAttempts: readonly CheckpointAttempt[];
  readonly lastVisitedLessonId: LessonId | null;
  readonly reviewQueue: readonly ReviewQueueEntry[];
  readonly orphanedLessonIds: readonly string[];
  readonly orphanedReviewKeys: readonly string[];
}

/**
 * Records that a schema-v3→schema-v4 migration happened and exactly what it did, so the UI
 * can show a truthful, dismissible one-time notice (design spec §17, Phase 2
 * Task 5 step 5). `acknowledgedAt` starts `null` and is set once the learner
 * dismisses the notice — acknowledging never deletes this record, so the
 * "what changed" explanation can stay available in progress help.
 */
export interface ProgressMigrationNotice {
  readonly fromSchemaVersion: 3 | 4;
  readonly preservedVisitedLessonIds?: readonly LessonId[];
  readonly resetEvidenceLessonIds?: readonly LessonId[];
  readonly acknowledgedAt: string | null;
}

/** The catalog revision written by every current schema-V4 progress record. */
export const CURRENT_COURSE_PROGRESS_CATALOG_VERSION = "a1-a2-v3" as const;

/** The first schema-V4 catalog revision accepted for deterministic normalization. */
export const LEGACY_COURSE_PROGRESS_CATALOG_VERSION = "a1-a2-v1" as const;

/** The prior schema-V4 catalog revision accepted for deterministic normalization. */
export const PREVIOUS_COURSE_PROGRESS_CATALOG_VERSION = "a1-a2-v2" as const;

type SupportedCourseProgressCatalogVersion =
  | typeof LEGACY_COURSE_PROGRESS_CATALOG_VERSION
  | typeof PREVIOUS_COURSE_PROGRESS_CATALOG_VERSION
  | typeof CURRENT_COURSE_PROGRESS_CATALOG_VERSION;

export interface CourseProgressV4 {
  readonly schemaVersion: 4;
  readonly catalogVersion: SupportedCourseProgressCatalogVersion;
  readonly levels: Readonly<Record<V4CourseLevelId, LevelProgress>>;
  readonly migrationNotice: ProgressMigrationNotice | null;
  readonly updatedAt: string;
}

/**
 * The structurally valid schema-V4 payload shapes accepted from storage.
 * Catalog v1 and v2 normalize to catalog v3; arbitrary catalog strings fail
 * closed.
 */
export type StoredCourseProgressV4 = CourseProgressV4;

/** Current runtime catalog keys supplied by ProgressContext, never imported here. */
export type KnownReviewKeysByLevel = Readonly<
  Partial<Record<SharedCourseLevelId, ReadonlySet<string>>>
>;

/** Current runtime lesson ids supplied by ProgressContext, never imported here. */
export type KnownLessonIdsByLevel = Readonly<
  Partial<Record<SharedCourseLevelId, ReadonlySet<string>>>
>;

export function emptyLevelProgress(): LevelProgress {
  return {
    lessons: {},
    canDos: {},
    checkpointAttempts: [],
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
  };
}

export function emptyProgressV4(): CourseProgressV4 {
  return {
    schemaVersion: 4,
    catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    levels: { a1: emptyLevelProgress(), a2: emptyLevelProgress() },
    migrationNotice: null,
    updatedAt: new Date(0).toISOString(),
  };
}

// ── Schema V5: Base/A1/A2 lossless ownership migration ────────────────────

/** The catalog revision written by every current schema-V5 progress record. */
export const CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION = "base-a1-a2-v1" as const;

export interface HistoricalCheckpointRef {
  readonly sourceLevel: "a1" | "a2";
  readonly attemptId: CheckpointAttemptId;
}

export interface CanDoEvidenceV5 extends CanDoEvidence {
  readonly historicalCheckpointRefs: readonly HistoricalCheckpointRef[];
}

export interface HistoricalActivityDisposition {
  readonly sourceLevel: SharedCourseLevelId;
  readonly lessonId: LessonId;
  readonly activityId: ExerciseDefinitionId;
  readonly disposition: "same-semantics" | "historical-orphan";
  readonly orphanedReview: ReviewQueueEntry | null;
}

export interface LevelProgressV5 extends LevelProgress {
  readonly canDos: Readonly<Record<CanDoId, CanDoEvidenceV5>>;
  readonly orphanedLessonRecords: Readonly<Record<LessonId, LessonProgress>>;
  readonly historicalActivityDispositions: readonly HistoricalActivityDisposition[];
}

export interface BaseOwnershipMigrationNotice extends ProgressMigrationNotice {
  readonly fromSchemaVersion: 4;
  /** Mapped lessons with actual V4 records, not every registry row. */
  readonly movedLessonIds: readonly LessonId[];
  /** Historical V4 activity ids that had actual evidence. */
  readonly historicalActivityIds: readonly ExerciseDefinitionId[];
  readonly resumeLevel: SharedCourseLevelId;
  readonly priorNotice: ProgressMigrationNotice | null;
  readonly acknowledgedAt: null | string;
}

export interface CourseProgressV5 {
  readonly schemaVersion: 5;
  readonly catalogVersion: typeof CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION;
  readonly levels: Readonly<Record<SharedCourseLevelId, LevelProgressV5>>;
  readonly migrationNotice: BaseOwnershipMigrationNotice | null;
  readonly updatedAt: string;
}

const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export function emptyLevelProgressV5(): LevelProgressV5 {
  return {
    lessons: {},
    canDos: {},
    checkpointAttempts: [],
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
    orphanedLessonRecords: {},
    historicalActivityDispositions: [],
  };
}

export function emptyProgressV5(): CourseProgressV5 {
  return {
    schemaVersion: 5,
    catalogVersion: CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
    levels: {
      a0: emptyLevelProgressV5(),
      a1: emptyLevelProgressV5(),
      a2: emptyLevelProgressV5(),
    },
    migrationNotice: null,
    updatedAt: EPOCH_TIMESTAMP,
  };
}

/**
 * All 40 real, currently-published `a0-a1-v1` v3 lesson ids, in their own
 * authored order (design spec catalog). This is checked in tests
 * (`progress.v4.test.ts`) against both the leaf authoring file
 * (`../catalog/lessonPlans.ts`'s `lessonPlans`) and the assembled runtime
 * catalog (`../data/course.ts`'s `courseModules`), so a catalog id rename
 * fails that test instead of quietly changing what this migration does. It
 * includes this schema-v3's own real named capstone ids
 * (`capstones-orientation`, `capstones-self-introduction`,
 * `capstones-everyday-outing`, `capstones-travel-day`) exactly as shipped;
 * the *numbered* `capstones-1..4` ids never existed in v3 — they are v4 A1
 * catalog ids (`../a1/catalog/module12Capstones.ts`) — and so cannot appear
 * here. This is the *complete* published set, not the safe migration-source
 * subset — see `A1_V3_SAFE_SOURCE_LESSON_IDS` for that.
 */
export const A1_V3_PUBLISHED_LESSON_IDS = [
  "sounds-1", "sounds-2", "sounds-3", "sounds-4", "sounds-5",
  "introductions-1", "introductions-2", "introductions-3",
  "essential-questions-1", "essential-questions-2", "essential-questions-3",
  "actions-1", "actions-2", "actions-3",
  "routines-1", "routines-2", "routines-3",
  "past-negative-1", "past-negative-2", "past-negative-3",
  "places-1", "places-2", "places-3", "places-4",
  "people-1", "people-2", "people-3",
  "descriptions-1", "descriptions-2", "descriptions-3",
  "shopping-1", "shopping-2", "shopping-3",
  "existence-needs-1", "existence-needs-2", "existence-needs-3",
  "capstones-orientation", "capstones-self-introduction",
  "capstones-everyday-outing", "capstones-travel-day",
] as const;

/**
 * The explicit, reviewed subset of `A1_V3_PUBLISHED_LESSON_IDS` (39 of the
 * 40 published ids) Phase 2 Task 5 recognises as *safe* migration sources —
 * ones with a genuine content equivalent in the v4 catalog. Derived by
 * excluding exactly one published id, `capstones-orientation`: it is a
 * `capstone: false` warm-up lesson (assessed concepts only — `topic-wa`,
 * `copula-desu`, `object-o`, `polite-masu` — no capstone scenario content;
 * see `../catalog/lessonPlans.ts`), and the v4 catalog's numbered
 * `capstones-4` slot at the same ordinal position is a *different*, mixed
 * identity/action/description/topic-change synthesis scenario
 * (`../a1/catalog/module12Capstones.ts`), not a safe semantic twin of
 * orientation. The other three named v3 capstones *do* have a safe v4 twin
 * (reviewed by scenario content, not just ordinal position — this is a
 * manual editorial judgment call, not an automated content-equivalence
 * test):
 * `capstones-self-introduction` → `capstones-1` (self-introduction +
 * reciprocal question), `capstones-everyday-outing` → `capstones-2` (daily
 * routine, place, preference & purchase), `capstones-travel-day` →
 * `capstones-3` (movement, transport, route question & need). Any v3 lesson
 * id *not* in this list (including `capstones-orientation`) is unknown under
 * `A1_V3_LESSON_ID_MAP` and becomes an A1 orphan on migration.
 */
export const A1_V3_SAFE_SOURCE_LESSON_IDS: readonly string[] =
  A1_V3_PUBLISHED_LESSON_IDS.filter((id) => id !== "capstones-orientation");

/**
 * Maps every v3 source lesson id this migration recognises as safe
 * (`A1_V3_SAFE_SOURCE_LESSON_IDS`, 39 ids) onto its v4 destination lesson
 * id. Most ids are unchanged. `sounds-5` — a since-retired fifth sounds
 * lesson — aliases onto `sounds-4` so a learner who visited it keeps that
 * evidence under the lesson that absorbed its content. The three named v3
 * capstones with a genuine v4 content twin alias onto their matching
 * numbered scenario: `capstones-self-introduction` → `capstones-1`,
 * `capstones-everyday-outing` → `capstones-2`, `capstones-travel-day` →
 * `capstones-3`. `capstones-orientation` is deliberately *absent* from this
 * map — it has no safe v4 twin (see `A1_V3_SAFE_SOURCE_LESSON_IDS`'s doc
 * comment) — so it is treated as unknown and orphaned on migration, and
 * `capstones-4` never receives a migrated visit from any v3 source.
 */
export const A1_V3_LESSON_ID_MAP: Readonly<Record<string, string>> = {
  ...Object.fromEntries(A1_V3_SAFE_SOURCE_LESSON_IDS.map((id) => [id, id])),
  "sounds-5": "sounds-4",
  "capstones-self-introduction": "capstones-1",
  "capstones-everyday-outing": "capstones-2",
  "capstones-travel-day": "capstones-3",
};

/**
 * The canonical, de-duplicated v4 destination lesson ids `migrateV3ToV4`
 * iterates in order, so its output never depends on the source payload's key
 * ordering. Derived once, at module load, from `A1_V3_LESSON_ID_MAP`'s
 * values in `A1_V3_SAFE_SOURCE_LESSON_IDS` order — never hand-maintained
 * separately from the map, so it cannot drift out of sync with it. Has 38
 * entries: 39 safe sources minus one, because `sounds-5` collapses onto the
 * already-listed `sounds-4` rather than adding a new destination.
 * `capstones-4` is never among these: no safe v3 source maps to it.
 */
export const A1_V4_DESTINATION_LESSON_IDS: readonly string[] = dedupeInEncounterOrder(
  A1_V3_SAFE_SOURCE_LESSON_IDS.map((sourceId) => A1_V3_LESSON_ID_MAP[sourceId]),
);

function hasStrongerEvidence(lesson: LessonProgressV3): boolean {
  return (
    lesson.practicedAt !== null ||
    lesson.consolidatedAt !== null ||
    lesson.attemptedExerciseIds.length > 0 ||
    lesson.acceptedExerciseIds.length > 0
  );
}

/**
 * Deterministically migrates a schema-v3 payload into schema-v4 (design spec §17, Phase 2
 * Task 5 steps 2-3). Visited-only: only `visitedAt` transfers for the
 * reviewed `A1_V3_LESSON_ID_MAP`, dropping every other kind of evidence.
 * It writes the current schema-V4 catalog revision directly, so a migrated schema-v3
 * record never first lands on the retired V4 catalog revision.
 * Iterates `A1_V4_DESTINATION_LESSON_IDS` — the map's destinations in
 * canonical (not payload-encounter) order — so the result never depends on
 * the source JSON's key ordering. When more than one source id maps to the
 * same destination (`sounds-4`/`sounds-5`, or a named v3 capstone id and its
 * numbered v4 destination), the earliest non-null `visitedAt` wins
 * (ISO-8601 strings sort lexicographically), and the destination is flagged
 * in `resetEvidenceLessonIds` if *any* contributing source id had
 * practiced/consolidated/attempted/accepted evidence that this migration
 * discards. The review queue is cleared entirely — the new catalog's review
 * keys share nothing with the old ones. A2 is always completely empty. Never
 * calls `Date` — every timestamp comes from the source payload. Pure: never
 * mutates `v3`.
 */
export function migrateV3ToV4(v3: CourseProgressV3): CourseProgressV4 {
  const sourceIdsByDestination = new Map<string, string[]>();
  for (const [sourceId, destinationId] of Object.entries(A1_V3_LESSON_ID_MAP)) {
    const sources = sourceIdsByDestination.get(destinationId) ?? [];
    sources.push(sourceId);
    sourceIdsByDestination.set(destinationId, sources);
  }

  const lessons: Record<string, LessonProgress> = {};
  const preservedVisitedLessonIds: string[] = [];
  const resetEvidenceLessonIds: string[] = [];
  // Mapped source ids whose stronger evidence would otherwise vanish with no
  // accounting at all: `visitedAt: null` on every contributing source for a
  // destination (so no visit ever transfers, and the destination gets no
  // `lessons[destinationId]` entry) while at least one of them still has
  // real practiced/consolidated/attempted/accepted evidence. Recorded below
  // as orphan recovery data, same as a genuinely unmapped source id (Phase 2
  // Task 5 quality-review minor #6) — never silently dropped.
  const noVisitEvidenceSourceIds: string[] = [];

  for (const destinationId of A1_V4_DESTINATION_LESSON_IDS) {
    const sourceIds = sourceIdsByDestination.get(destinationId) ?? [destinationId];
    let earliestVisitedAt: string | null = null;
    let lostStrongerEvidence = false;
    const evidenceOnlySourceIds: string[] = [];
    for (const sourceId of sourceIds) {
      const source = v3.lessons[sourceId];
      if (!source) continue;
      const visitedAt = source.visitedAt;
      const strongerEvidence = hasStrongerEvidence(source);
      if (visitedAt !== null) {
        if (earliestVisitedAt === null || visitedAt < earliestVisitedAt) {
          earliestVisitedAt = visitedAt;
        }
      } else if (strongerEvidence) {
        evidenceOnlySourceIds.push(sourceId);
      }
      if (strongerEvidence) lostStrongerEvidence = true;
    }
    if (earliestVisitedAt === null) {
      // No contributing source for this destination ever recorded a visit,
      // so nothing safely transfers here (see the `continue` below). Any
      // source that nonetheless carries real evidence is retained as
      // recovery data rather than discarded without any accounting.
      noVisitEvidenceSourceIds.push(...evidenceOnlySourceIds);
      continue;
    }
    lessons[destinationId] = {
      visitedAt: earliestVisitedAt,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    };
    preservedVisitedLessonIds.push(destinationId);
    if (lostStrongerEvidence) resetEvidenceLessonIds.push(destinationId);
  }

  const mappedSourceIds = new Set(Object.keys(A1_V3_LESSON_ID_MAP));
  const unmappedSourceLessonIds = Object.keys(v3.lessons).filter(
    (lessonId) => !mappedSourceIds.has(lessonId),
  );
  const orphanedLessonIds = dedupeInEncounterOrder([
    ...v3.orphanedLessonIds,
    ...unmappedSourceLessonIds,
    ...noVisitEvidenceSourceIds,
  ]);

  const lastVisitedLessonId =
    v3.lastVisitedLessonId === null
      ? null
      : (A1_V3_LESSON_ID_MAP[v3.lastVisitedLessonId] ?? v3.lastVisitedLessonId);

  const a1: LevelProgress = {
    lessons,
    canDos: {},
    checkpointAttempts: [],
    lastVisitedLessonId,
    reviewQueue: [],
    orphanedLessonIds,
    orphanedReviewKeys: [],
  };

  return {
    schemaVersion: 4,
    catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    levels: { a1, a2: emptyLevelProgress() },
    migrationNotice: {
      fromSchemaVersion: 3,
      preservedVisitedLessonIds,
      resetEvidenceLessonIds,
      acknowledgedAt: null,
    },
    updatedAt: v3.updatedAt,
  };
}

function isCanDoEvidence(value: unknown): value is CanDoEvidence {
  if (!value || typeof value !== "object") return false;
  const evidence = value as Partial<CanDoEvidence>;
  return (
    typeof evidence.canDoId === "string" &&
    isStringArray(evidence.visitedLessonIds) &&
    isStringArray(evidence.practicedLessonIds) &&
    isStringArray(evidence.acceptedTransferExerciseIds) &&
    isStringArray(evidence.checkpointAttemptIds) &&
    typeof evidence.lastUpdatedAt === "string"
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isCheckpointAttempt(value: unknown): value is CheckpointAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Partial<CheckpointAttempt>;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.checkpointId === "string" &&
    typeof attempt.attemptedAt === "string" &&
    isStringArray(attempt.acceptedExerciseIds) &&
    isStringArray(attempt.sampledCanDoIds)
  );
}

function isLevelProgress(value: unknown): value is LevelProgress {
  if (!value || typeof value !== "object") return false;
  const level = value as Partial<LevelProgress>;
  return (
    !!level.lessons &&
    typeof level.lessons === "object" &&
    Object.values(level.lessons).every(isLessonProgressV3) &&
    !!level.canDos &&
    typeof level.canDos === "object" &&
    Object.values(level.canDos).every(isCanDoEvidence) &&
    Array.isArray(level.checkpointAttempts) &&
    level.checkpointAttempts.every(isCheckpointAttempt) &&
    isOptionalString(level.lastVisitedLessonId ?? null) &&
    Array.isArray(level.reviewQueue) &&
    level.reviewQueue.every(isReviewQueueEntry) &&
    isStringArray(level.orphanedLessonIds) &&
    isStringArray(level.orphanedReviewKeys)
  );
}

function isProgressMigrationNotice(
  value: unknown,
): value is ProgressMigrationNotice | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const notice = value as Partial<ProgressMigrationNotice>;
  return (
    notice.fromSchemaVersion === 3 &&
    isStringArray(notice.preservedVisitedLessonIds) &&
    isStringArray(notice.resetEvidenceLessonIds) &&
    isOptionalString(notice.acknowledgedAt ?? null)
  );
}

function isSupportedCatalogVersion(
  value: unknown,
): value is SupportedCourseProgressCatalogVersion {
  return (
    value === LEGACY_COURSE_PROGRESS_CATALOG_VERSION ||
    value === PREVIOUS_COURSE_PROGRESS_CATALOG_VERSION ||
    value === CURRENT_COURSE_PROGRESS_CATALOG_VERSION
  );
}

function isValidV4Shape(
  value: Partial<StoredCourseProgressV4>,
): value is StoredCourseProgressV4 {
  return (
    value.schemaVersion === 4 &&
    isSupportedCatalogVersion(value.catalogVersion) &&
    !!value.levels &&
    typeof value.levels === "object" &&
    Object.keys(value.levels).length === 2 &&
    isLevelProgress(value.levels.a1) &&
    isLevelProgress(value.levels.a2) &&
    // No `?? null` fallback here: a truly valid V4 payload must explicitly
    // carry `migrationNotice` as `null` or a valid record.
    // `isProgressMigrationNotice` already rejects `undefined` (an omitted
    // field) on its own — `typeof undefined !== "object"` and
    // `undefined !== null` both fail — so an omitted field is correctly
    // treated as corrupt/invalid rather than silently defaulted and passed
    // through with `migrationNotice` actually `undefined` at runtime.
    isProgressMigrationNotice(value.migrationNotice) &&
    typeof value.updatedAt === "string"
  );
}

function isHistoricalCheckpointRef(value: unknown): value is HistoricalCheckpointRef {
  if (!isPlainRecord(value)) return false;
  const ref = value as Partial<HistoricalCheckpointRef>;
  return (
    hasOwnFields(value, ["sourceLevel", "attemptId"]) &&
    (ref.sourceLevel === "a1" || ref.sourceLevel === "a2") &&
    typeof ref.attemptId === "string"
  );
}

function hasOwnFields(value: object, fields: readonly string[]): boolean {
  return (
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function isLessonProgressV5(value: unknown): value is LessonProgress {
  if (!isPlainRecord(value)) return false;
  const lesson = value as Partial<LessonProgress>;
  return (
    hasOwnFields(value, [
      "visitedAt",
      "practicedAt",
      "consolidatedAt",
      "attemptedExerciseIds",
      "acceptedExerciseIds",
    ]) &&
    isOptionalString(lesson.visitedAt) &&
    isOptionalString(lesson.practicedAt) &&
    isOptionalString(lesson.consolidatedAt) &&
    isStringArray(lesson.attemptedExerciseIds) &&
    isStringArray(lesson.acceptedExerciseIds)
  );
}

function isCanDoEvidenceV5(value: unknown): value is CanDoEvidenceV5 {
  if (!isPlainRecord(value)) return false;
  const evidence = value as Partial<CanDoEvidenceV5>;
  return (
    hasOwnFields(value, [
      "canDoId",
      "visitedLessonIds",
      "practicedLessonIds",
      "acceptedTransferExerciseIds",
      "checkpointAttemptIds",
      "lastUpdatedAt",
      "historicalCheckpointRefs",
    ]) &&
    typeof evidence.canDoId === "string" &&
    isStringArray(evidence.visitedLessonIds) &&
    isStringArray(evidence.practicedLessonIds) &&
    isStringArray(evidence.acceptedTransferExerciseIds) &&
    isStringArray(evidence.checkpointAttemptIds) &&
    typeof evidence.lastUpdatedAt === "string" &&
    Array.isArray(evidence.historicalCheckpointRefs) &&
    evidence.historicalCheckpointRefs.every(isHistoricalCheckpointRef)
  );
}

function isHistoricalActivityDisposition(
  value: unknown,
): value is HistoricalActivityDisposition {
  if (!isPlainRecord(value)) return false;
  const disposition = value as Partial<HistoricalActivityDisposition>;
  return (
    hasOwnFields(value, [
      "sourceLevel",
      "lessonId",
      "activityId",
      "disposition",
      "orphanedReview",
    ]) &&
    (disposition.sourceLevel === "a0" ||
      disposition.sourceLevel === "a1" ||
      disposition.sourceLevel === "a2") &&
    typeof disposition.lessonId === "string" &&
    typeof disposition.activityId === "string" &&
    (disposition.disposition === "same-semantics" ||
      disposition.disposition === "historical-orphan") &&
    (disposition.orphanedReview === null ||
      isReviewQueueEntry(disposition.orphanedReview))
  );
}

function isLevelProgressV5(value: unknown): value is LevelProgressV5 {
  if (!isPlainRecord(value)) return false;
  const level = value as Partial<LevelProgressV5>;
  return (
    hasOwnFields(value, [
      "lessons",
      "canDos",
      "checkpointAttempts",
      "lastVisitedLessonId",
      "reviewQueue",
      "orphanedLessonIds",
      "orphanedReviewKeys",
      "orphanedLessonRecords",
      "historicalActivityDispositions",
    ]) &&
    isPlainRecord(level.lessons) &&
    Object.values(level.lessons).every(isLessonProgressV5) &&
    isPlainRecord(level.canDos) &&
    Object.values(level.canDos).every(isCanDoEvidenceV5) &&
    Array.isArray(level.checkpointAttempts) &&
    level.checkpointAttempts.every(isCheckpointAttempt) &&
    isOptionalString(level.lastVisitedLessonId) &&
    Array.isArray(level.reviewQueue) &&
    level.reviewQueue.every(isReviewQueueEntry) &&
    isStringArray(level.orphanedLessonIds) &&
    isStringArray(level.orphanedReviewKeys) &&
    isPlainRecord(level.orphanedLessonRecords) &&
    Object.values(level.orphanedLessonRecords).every(isLessonProgressV5) &&
    Array.isArray(level.historicalActivityDispositions) &&
    level.historicalActivityDispositions.every(isHistoricalActivityDisposition) &&
    !Object.keys(level.lessons).some((lessonId) =>
      Object.prototype.hasOwnProperty.call(level.orphanedLessonRecords, lessonId),
    ) &&
    !level.reviewQueue.some((review) =>
      level.orphanedReviewKeys!.includes(review.reviewKey) ||
      level.historicalActivityDispositions!.some(
        (disposition) => disposition.orphanedReview?.reviewKey === review.reviewKey,
      ),
    )
  );
}

function isBaseOwnershipMigrationNotice(
  value: unknown,
): value is BaseOwnershipMigrationNotice | null {
  if (value === null) return true;
  if (!isPlainRecord(value)) return false;
  const notice = value as Partial<BaseOwnershipMigrationNotice>;
  return (
    hasOwnFields(value, [
      "fromSchemaVersion",
      "movedLessonIds",
      "historicalActivityIds",
      "resumeLevel",
      "priorNotice",
      "acknowledgedAt",
    ]) &&
    notice.fromSchemaVersion === 4 &&
    isStringArray(notice.movedLessonIds) &&
    isStringArray(notice.historicalActivityIds) &&
    (notice.resumeLevel === "a0" ||
      notice.resumeLevel === "a1" ||
      notice.resumeLevel === "a2") &&
    isProgressMigrationNotice(notice.priorNotice) &&
    isOptionalString(notice.acknowledgedAt)
  );
}

function isValidV5Shape(value: Partial<CourseProgressV5>): value is CourseProgressV5 {
  if (
    !hasOwnFields(value, [
      "schemaVersion",
      "catalogVersion",
      "levels",
      "migrationNotice",
      "updatedAt",
    ]) ||
    value.schemaVersion !== 5 ||
    value.catalogVersion !== CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION ||
    !isPlainRecord(value) ||
    !isPlainRecord(value.levels) ||
    typeof value.updatedAt !== "string" ||
    !isBaseOwnershipMigrationNotice(value.migrationNotice)
  ) {
    return false;
  }

  const levelIds = Object.keys(value.levels).sort();
  return (
    levelIds.length === COURSE_LEVEL_IDS.length &&
    levelIds.every((levelId, index) => levelId === COURSE_LEVEL_IDS[index]) &&
    isLevelProgressV5(value.levels.a0) &&
    isLevelProgressV5(value.levels.a1) &&
    isLevelProgressV5(value.levels.a2)
  );
}

/**
 * Reconciles one V4 level against the current runtime catalog without touching
 * learner evidence. Unknown lesson records stay intact as historical evidence
 * and are additionally named in `orphanedLessonIds`; only active review entries
 * whose original definition is absent move into the orphan-key ledger.
 */
function reconcileV4LevelCatalog(
  level: LevelProgress,
  knownReviewKeys: ReadonlySet<string> | undefined,
  knownLessonIds: ReadonlySet<string> | undefined,
): LevelProgress {
  const dedupedOrphanedLessonIds = dedupeInEncounterOrder(level.orphanedLessonIds);
  let orphanedLessonIds = sameIdList(
    dedupedOrphanedLessonIds,
    level.orphanedLessonIds,
  )
    ? level.orphanedLessonIds
    : dedupedOrphanedLessonIds;
  if (knownLessonIds) {
    const knownOrphans = new Set(orphanedLessonIds);
    const newlyOrphanedLessonIds = Object.keys(level.lessons)
      .filter((lessonId) => !knownLessonIds.has(lessonId))
      .sort()
      .filter((lessonId) => !knownOrphans.has(lessonId));
    if (newlyOrphanedLessonIds.length > 0) {
      orphanedLessonIds = [...orphanedLessonIds, ...newlyOrphanedLessonIds];
    }
  }

  const review = knownReviewKeys
    ? reconcileReviewQueueEntries(
        level.reviewQueue,
        level.orphanedReviewKeys,
        knownReviewKeys,
      )
    : null;
  const reviewsChanged = review?.changed ?? false;
  if (orphanedLessonIds === level.orphanedLessonIds && !reviewsChanged) {
    return level;
  }

  return {
    ...level,
    ...(orphanedLessonIds === level.orphanedLessonIds
      ? {}
      : { orphanedLessonIds }),
    ...(reviewsChanged
      ? {
          reviewQueue: review!.reviewQueue,
          orphanedReviewKeys: review!.orphanedReviewKeys,
        }
      : {}),
  };
}

/**
 * Normalizes a structurally valid schema-V4 catalog into catalog v3.
 *
 * The V4 shape is unchanged, so this does not reset any lesson timestamps,
 * attempted/accepted definition ids, Can-do evidence, checkpoint attempts,
 * migration notice, or top-level timestamp. Runtime catalog sets are injected
 * by `ProgressContext` to keep this storage module independent of components:
 * they determine only which active review keys remain actionable and which
 * unknown lesson records are also listed as orphans.
 *
 * A current catalog-v3 record with nothing to reconcile is returned by reference.
 */
export function migrateV4Catalog(
  progress: CourseProgressV4,
  knownReviewKeysByLevel?: KnownReviewKeysByLevel,
  knownLessonIdsByLevel?: KnownLessonIdsByLevel,
): CourseProgressV4 {
  let levels = progress.levels;
  for (const levelId of ["a1", "a2"] as const) {
    const currentLevel = levels[levelId];
    const reconciled = reconcileV4LevelCatalog(
      currentLevel,
      knownReviewKeysByLevel?.[levelId],
      knownLessonIdsByLevel?.[levelId],
    );
    if (reconciled !== currentLevel) {
      levels = { ...levels, [levelId]: reconciled };
    }
  }

  if (
    progress.catalogVersion === CURRENT_COURSE_PROGRESS_CATALOG_VERSION &&
    levels === progress.levels
  ) {
    return progress as CourseProgressV4;
  }

  return {
    ...progress,
    catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    levels,
  };
}

export interface V5MigrationRuntimeIds {
  readonly knownLessonIdsByLevel?: KnownLessonIdsByLevel;
  readonly knownReviewKeysByLevel?: KnownReviewKeysByLevel;
}

function defaultKnownLessonIdsByLevel(): KnownLessonIdsByLevel {
  return Object.fromEntries(
    COURSE_LEVEL_IDS.map((levelId) => [levelId, new Set(lessonIdsForLevel(levelId))]),
  ) as KnownLessonIdsByLevel;
}

function cloneLessonProgress(lesson: LessonProgress): LessonProgress {
  return {
    visitedAt: lesson.visitedAt,
    practicedAt: lesson.practicedAt,
    consolidatedAt: lesson.consolidatedAt,
    attemptedExerciseIds: [...lesson.attemptedExerciseIds],
    acceptedExerciseIds: [...lesson.acceptedExerciseIds],
  };
}

function cloneReviewEntry(review: ReviewQueueEntry): ReviewQueueEntry {
  return {
    reviewKey: review.reviewKey,
    lessonId: review.lessonId,
    exerciseDefinitionId: review.exerciseDefinitionId,
    targetConceptIds: [...review.targetConceptIds],
    targetLexemeIds: [...review.targetLexemeIds],
    mistakeCount: review.mistakeCount,
    lastMistakeAt: review.lastMistakeAt,
  };
}

function cloneCheckpointAttempt(attempt: CheckpointAttempt): CheckpointAttempt {
  return {
    id: attempt.id,
    checkpointId: attempt.checkpointId,
    attemptedAt: attempt.attemptedAt,
    acceptedExerciseIds: [...attempt.acceptedExerciseIds],
    sampledCanDoIds: [...attempt.sampledCanDoIds],
  };
}

function canDoEvidenceV5(
  evidence: CanDoEvidence,
  historicalCheckpointRefs: readonly HistoricalCheckpointRef[] = [],
  checkpointAttemptIds: readonly CheckpointAttemptId[] = evidence.checkpointAttemptIds,
): CanDoEvidenceV5 {
  return {
    canDoId: evidence.canDoId,
    visitedLessonIds: [...evidence.visitedLessonIds],
    practicedLessonIds: [...evidence.practicedLessonIds],
    acceptedTransferExerciseIds: [...evidence.acceptedTransferExerciseIds],
    checkpointAttemptIds: [...checkpointAttemptIds],
    lastUpdatedAt: evidence.lastUpdatedAt,
    historicalCheckpointRefs: [...historicalCheckpointRefs],
  };
}

function latestVisitedLessonId(lessons: Readonly<Record<string, LessonProgress>>): string | null {
  const candidates = Object.entries(lessons)
    .filter(([, lesson]) => lesson.visitedAt !== null)
    .sort(([leftId, left], [rightId, right]) => {
      if (left.visitedAt! > right.visitedAt!) return -1;
      if (left.visitedAt! < right.visitedAt!) return 1;
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
  return candidates[0]?.[0] ?? null;
}

function resumeLevelForV4Migration(
  a0LastVisitedLessonId: string | null,
  a1LastVisitedLessonId: string | null,
  a2LastVisitedLessonId: string | null,
  a1Lessons: Readonly<Record<string, LessonProgress>>,
  a2Lessons: Readonly<Record<string, LessonProgress>>,
): SharedCourseLevelId {
  if (a0LastVisitedLessonId !== null) return "a0";
  if (a1LastVisitedLessonId === null && a2LastVisitedLessonId !== null) return "a2";
  if (a1LastVisitedLessonId !== null && a2LastVisitedLessonId === null) return "a1";
  if (a1LastVisitedLessonId === null && a2LastVisitedLessonId === null) {
    return latestVisitedLessonId(a1Lessons) === null ? "a0" : "a1";
  }

  const a1VisitedAt = a1Lessons[a1LastVisitedLessonId!]?.visitedAt ?? null;
  const a2VisitedAt = a2Lessons[a2LastVisitedLessonId!]?.visitedAt ?? null;
  if (a1VisitedAt !== null && a2VisitedAt !== null && a1VisitedAt !== a2VisitedAt) {
    return a1VisitedAt > a2VisitedAt ? "a1" : "a2";
  }
  if (a1VisitedAt !== null && a2VisitedAt === null) return "a1";
  if (a2VisitedAt !== null && a1VisitedAt === null) return "a2";
  return COURSE_LEVEL_IDS.find(
    (levelId) =>
      (levelId === "a1" && a1LastVisitedLessonId !== null) ||
      (levelId === "a2" && a2LastVisitedLessonId !== null),
  ) ?? "a0";
}

function migrateLevelRecords(
  level: LevelProgress,
  knownLessonIds: ReadonlySet<string>,
  excludedLessonIds: ReadonlySet<string> = new Set(),
): Pick<LevelProgressV5, "lessons" | "orphanedLessonIds" | "orphanedLessonRecords"> {
  const lessons: Record<string, LessonProgress> = {};
  const orphanedLessonRecords: Record<string, LessonProgress> = {};
  const newlyOrphanedLessonIds: string[] = [];

  for (const lessonId of Object.keys(level.lessons).sort()) {
    if (excludedLessonIds.has(lessonId)) continue;
    const lesson = cloneLessonProgress(level.lessons[lessonId]!);
    if (knownLessonIds.has(lessonId)) {
      lessons[lessonId] = lesson;
    } else {
      orphanedLessonRecords[lessonId] = lesson;
      newlyOrphanedLessonIds.push(lessonId);
    }
  }

  return {
    lessons,
    orphanedLessonIds: dedupeInEncounterOrder([
      ...level.orphanedLessonIds,
      ...newlyOrphanedLessonIds,
    ]),
    orphanedLessonRecords,
  };
}

function historicalDispositionsForV4(
  v4: CourseProgressV4,
): {
  readonly dispositions: readonly HistoricalActivityDisposition[];
  readonly historicalActivityIds: readonly string[];
  readonly movedReviewKeys: readonly string[];
} {
  const sourceReviews = v4.levels.a1.reviewQueue;
  const dispositions: HistoricalActivityDisposition[] = [];
  const historicalActivityIds: string[] = [];
  const movedReviewKeys: string[] = [];

  for (const ownership of V4_OWNERSHIP_MIGRATION_MAP) {
    const lesson = v4.levels.a1.lessons[ownership.sourceLessonId];
    const reviews = sourceReviews.filter(
      (review) => review.lessonId === ownership.sourceLessonId,
    );
    const evidencedActivityIds = dedupeInEncounterOrder([
      ...(lesson?.attemptedExerciseIds ?? []),
      ...(lesson?.acceptedExerciseIds ?? []),
      ...reviews.map((review) => review.exerciseDefinitionId),
    ]);
    for (const activityId of evidencedActivityIds) {
      const activity = V4_ACTIVITY_MIGRATION_MAP.find(
        (row) =>
          row.sourceLessonId === ownership.sourceLessonId &&
          row.sourceActivityId === activityId,
      );
      if (activity?.disposition === "same-semantics") continue;
      const matchingReview = reviews.find(
        (review) => review.exerciseDefinitionId === activityId,
      );
      dispositions.push({
        sourceLevel: "a1",
        lessonId: ownership.sourceLessonId,
        activityId,
        disposition: "historical-orphan",
        orphanedReview: matchingReview ? cloneReviewEntry(matchingReview) : null,
      });
      historicalActivityIds.push(activityId);
      if (matchingReview) movedReviewKeys.push(matchingReview.reviewKey);
    }

  }

  return {
    dispositions,
    historicalActivityIds: dedupeInEncounterOrder(historicalActivityIds),
    movedReviewKeys: dedupeInEncounterOrder(movedReviewKeys),
  };
}

function historicalActivityKey(disposition: HistoricalActivityDisposition): string {
  return `${disposition.sourceLevel}\u0000${disposition.lessonId}\u0000${disposition.activityId}`;
}

function mergeHistoricalActivityDispositions(
  existing: readonly HistoricalActivityDisposition[],
  additions: readonly HistoricalActivityDisposition[],
): readonly HistoricalActivityDisposition[] {
  const merged: HistoricalActivityDisposition[] = [];
  const indexByKey = new Map<string, number>();
  let changed = false;

  for (const disposition of [...existing, ...additions]) {
    const key = historicalActivityKey(disposition);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(disposition);
      continue;
    }
    changed = true;
    const current = merged[existingIndex]!;
    if (current.orphanedReview === null && disposition.orphanedReview !== null) {
      merged[existingIndex] = { ...current, orphanedReview: disposition.orphanedReview };
    }
  }

  return changed || additions.length > 0 ? merged : existing;
}

function historicalDispositionsForRetiredReviews(
  sourceLevel: SharedCourseLevelId,
  reviews: readonly ReviewQueueEntry[],
): readonly HistoricalActivityDisposition[] {
  return reviews.map((review) => ({
    sourceLevel,
    lessonId: review.lessonId,
    activityId: review.exerciseDefinitionId,
    disposition: "historical-orphan",
    orphanedReview: cloneReviewEntry(review),
  }));
}

class V5ReconciliationConflictError extends Error {
  constructor(levelId: SharedCourseLevelId, kind: "lesson" | "review", ids: readonly string[]) {
    super(`V5 ${kind} overlap in ${levelId}: ${ids.join(", ")}`);
    this.name = "V5ReconciliationConflictError";
  }
}

/**
 * Losslessly moves V4 evidence into the three-level V5 schema. The registry
 * rows, supplied runtime ownership sets, and source payload are the only
 * inputs; it neither reads the clock nor mutates V4 objects.
 */
export function migrateV4ToV5(
  v4: CourseProgressV4,
  runtimeIds: V5MigrationRuntimeIds = {},
): CourseProgressV5 {
  const knownLessonIdsByLevel =
    runtimeIds.knownLessonIdsByLevel ?? defaultKnownLessonIdsByLevel();
  const rehomedSourceIds = new Set(
    V4_OWNERSHIP_MIGRATION_MAP.map((row) => row.sourceLessonId),
  );
  const a1Records = migrateLevelRecords(
    v4.levels.a1,
    knownLessonIdsByLevel.a1 ?? new Set(),
    rehomedSourceIds,
  );
  const a2Records = migrateLevelRecords(
    v4.levels.a2,
    knownLessonIdsByLevel.a2 ?? new Set(),
  );

  const movedLessons: Record<string, LessonProgress> = {};
  const movedLessonIds: string[] = [];
  for (const ownership of V4_OWNERSHIP_MIGRATION_MAP) {
    const source = v4.levels.a1.lessons[ownership.sourceLessonId];
    if (!source) continue;
    movedLessons[ownership.destinationLessonId] = cloneLessonProgress(source);
    movedLessonIds.push(ownership.destinationLessonId);
  }

  const a0CanDos: Record<string, CanDoEvidenceV5> = {};
  const a1CanDos: Record<string, CanDoEvidenceV5> = {};
  for (const [canDoId, evidence] of Object.entries(v4.levels.a1.canDos)) {
    const ownership = V4_CANDO_MIGRATION_MAP.find(
      (row) => row.sourceCanDoId === canDoId,
    );
    const refs = ownership
      ? dedupeInEncounterOrder(
          evidence.checkpointAttemptIds,
        ).map((attemptId) => ({ sourceLevel: "a1" as const, attemptId }))
      : [];
    const converted = canDoEvidenceV5(
      evidence,
      refs,
      ownership ? [] : evidence.checkpointAttemptIds,
    );
    if (ownership) a0CanDos[ownership.destinationCanDoId] = converted;
    else a1CanDos[canDoId] = converted;
  }
  const a2CanDos = Object.fromEntries(
    Object.entries(v4.levels.a2.canDos).map(([canDoId, evidence]) => [
      canDoId,
      canDoEvidenceV5(evidence),
    ]),
  ) as Record<string, CanDoEvidenceV5>;

  const historical = historicalDispositionsForV4(v4);
  const a1RetainedReviews = v4.levels.a1.reviewQueue
    .filter((review) => !rehomedSourceIds.has(review.lessonId))
    .map(cloneReviewEntry);
  const a1RetiredReviews = runtimeIds.knownReviewKeysByLevel?.a1
    ? a1RetainedReviews.filter(
        (review) => !runtimeIds.knownReviewKeysByLevel!.a1!.has(review.reviewKey),
      )
    : [];
  const a1Reviews = a1RetainedReviews.filter(
    (review) => !a1RetiredReviews.includes(review),
  );
  const a2RetiredReviews = runtimeIds.knownReviewKeysByLevel?.a2
    ? v4.levels.a2.reviewQueue.filter(
        (review) => !runtimeIds.knownReviewKeysByLevel!.a2!.has(review.reviewKey),
      )
    : [];
  const a2Reviews = v4.levels.a2.reviewQueue
    .filter((review) => !a2RetiredReviews.includes(review))
    .map(cloneReviewEntry);

  const movedLastVisit = V4_OWNERSHIP_MIGRATION_MAP.find(
    (row) => row.sourceLessonId === v4.levels.a1.lastVisitedLessonId,
  );
  const a0LastVisitedLessonId = movedLastVisit?.destinationLessonId ?? null;
  const sourceA1LastVisitedLessonId = v4.levels.a1.lastVisitedLessonId;
  const a1LastVisitedLessonId =
    a0LastVisitedLessonId !== null
      ? latestVisitedLessonId(a1Records.lessons)
      : sourceA1LastVisitedLessonId;
  const sourceA2LastVisitedLessonId = v4.levels.a2.lastVisitedLessonId;
  const a2LastVisitedLessonId = sourceA2LastVisitedLessonId;
  const resumeLevel = resumeLevelForV4Migration(
    a0LastVisitedLessonId,
    a1LastVisitedLessonId,
    a2LastVisitedLessonId,
    v4.levels.a1.lessons,
    v4.levels.a2.lessons,
  );

  return {
    schemaVersion: 5,
    catalogVersion: CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
    levels: {
      a0: {
        lessons: movedLessons,
        canDos: a0CanDos,
        checkpointAttempts: [],
        lastVisitedLessonId: a0LastVisitedLessonId,
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: dedupeInEncounterOrder(historical.movedReviewKeys),
        orphanedLessonRecords: {},
        historicalActivityDispositions: historical.dispositions,
      },
      a1: {
        lessons: a1Records.lessons,
        canDos: a1CanDos,
        checkpointAttempts: v4.levels.a1.checkpointAttempts.map(cloneCheckpointAttempt),
        lastVisitedLessonId: a1LastVisitedLessonId,
        reviewQueue: a1Reviews,
        orphanedLessonIds: a1Records.orphanedLessonIds,
        orphanedReviewKeys: dedupeInEncounterOrder([
          ...v4.levels.a1.orphanedReviewKeys,
          ...a1RetiredReviews.map((review) => review.reviewKey),
        ]),
        orphanedLessonRecords: a1Records.orphanedLessonRecords,
        historicalActivityDispositions: mergeHistoricalActivityDispositions(
          [],
          historicalDispositionsForRetiredReviews("a1", a1RetiredReviews),
        ),
      },
      a2: {
        lessons: a2Records.lessons,
        canDos: a2CanDos,
        checkpointAttempts: v4.levels.a2.checkpointAttempts.map(cloneCheckpointAttempt),
        lastVisitedLessonId: a2LastVisitedLessonId,
        reviewQueue: a2Reviews,
        orphanedLessonIds: a2Records.orphanedLessonIds,
        orphanedReviewKeys: dedupeInEncounterOrder([
          ...v4.levels.a2.orphanedReviewKeys,
          ...a2RetiredReviews.map((review) => review.reviewKey),
        ]),
        orphanedLessonRecords: a2Records.orphanedLessonRecords,
        historicalActivityDispositions: mergeHistoricalActivityDispositions(
          [],
          historicalDispositionsForRetiredReviews("a2", a2RetiredReviews),
        ),
      },
    },
    migrationNotice: {
      fromSchemaVersion: 4,
      movedLessonIds,
      historicalActivityIds: historical.historicalActivityIds,
      resumeLevel,
      priorNotice: v4.migrationNotice,
      acknowledgedAt: null,
    },
    updatedAt: v4.updatedAt,
  };
}

function reconcileV5LevelCatalog(
  level: LevelProgressV5,
  levelId: SharedCourseLevelId,
  knownReviewKeys: ReadonlySet<string> | undefined,
  knownLessonIds: ReadonlySet<string> | undefined,
): LevelProgressV5 {
  let orphanedLessonIds = dedupeInEncounterOrder(level.orphanedLessonIds);
  let orphanedReviewKeys = dedupeInEncounterOrder(level.orphanedReviewKeys);
  let lessons = level.lessons as Record<string, LessonProgress>;
  let orphanedLessonRecords =
    level.orphanedLessonRecords as Record<string, LessonProgress>;
  let historicalActivityDispositions = mergeHistoricalActivityDispositions(
    level.historicalActivityDispositions,
    [],
  );
  const overlappingLessonIds = Object.keys(level.lessons).filter((lessonId) =>
    Object.prototype.hasOwnProperty.call(level.orphanedLessonRecords, lessonId),
  );
  const conflictingLessonIds = overlappingLessonIds.filter(
    (lessonId) => !sameLessonProgress(
      level.lessons[lessonId]!,
      level.orphanedLessonRecords[lessonId]!,
    ),
  );
  if (conflictingLessonIds.length > 0) {
    throw new V5ReconciliationConflictError(levelId, "lesson", conflictingLessonIds);
  }
  if (overlappingLessonIds.length > 0) {
    orphanedLessonRecords = { ...orphanedLessonRecords };
    for (const lessonId of overlappingLessonIds) {
      delete orphanedLessonRecords[lessonId];
    }
    orphanedLessonIds = orphanedLessonIds.filter(
      (lessonId) => !overlappingLessonIds.includes(lessonId),
    );
  }
  const activeReviewKeys = new Set(level.reviewQueue.map((review) => review.reviewKey));
  const historicalReviewKeys = new Set([
    ...level.orphanedReviewKeys,
    ...level.historicalActivityDispositions.flatMap((disposition) =>
      disposition.orphanedReview === null ? [] : [disposition.orphanedReview.reviewKey],
    ),
  ]);
  const overlappingReviewKeys = [...activeReviewKeys].filter((reviewKey) =>
    historicalReviewKeys.has(reviewKey),
  );
  if (overlappingReviewKeys.length > 0) {
    throw new V5ReconciliationConflictError(levelId, "review", overlappingReviewKeys);
  }

  if (knownLessonIds) {
    const unknownLessonIds = Object.keys(level.lessons)
      .filter((lessonId) => !knownLessonIds.has(lessonId))
      .sort();
    if (unknownLessonIds.length > 0) {
      lessons = { ...level.lessons };
      orphanedLessonRecords = { ...level.orphanedLessonRecords };
      for (const lessonId of unknownLessonIds) {
        delete lessons[lessonId];
        if (!orphanedLessonRecords[lessonId]) {
          orphanedLessonRecords[lessonId] = level.lessons[lessonId]!;
        }
      }
      orphanedLessonIds = dedupeInEncounterOrder([
        ...orphanedLessonIds,
        ...unknownLessonIds,
      ]);
    }
  }

  if (knownReviewKeys) {
    const unknownReviews = level.reviewQueue.filter(
      (review) => !knownReviewKeys.has(review.reviewKey),
    );
    if (unknownReviews.length > 0) {
      const remainingReviews = level.reviewQueue.filter((review) =>
        knownReviewKeys.has(review.reviewKey),
      );
      historicalActivityDispositions = mergeHistoricalActivityDispositions(
        historicalActivityDispositions,
        historicalDispositionsForRetiredReviews(levelId, unknownReviews),
      );
      orphanedReviewKeys = dedupeInEncounterOrder([
        ...orphanedReviewKeys,
        ...unknownReviews.map((review) => review.reviewKey),
      ]);
      return {
        ...level,
        lessons,
        orphanedLessonRecords,
        orphanedLessonIds,
        reviewQueue: remainingReviews,
        orphanedReviewKeys,
        historicalActivityDispositions,
      };
    }
  }

  if (
    lessons === level.lessons &&
    orphanedLessonRecords === level.orphanedLessonRecords &&
    sameIdList(orphanedLessonIds, level.orphanedLessonIds) &&
    sameIdList(orphanedReviewKeys, level.orphanedReviewKeys) &&
    historicalActivityDispositions === level.historicalActivityDispositions
  ) {
    return level;
  }
  return {
    ...level,
    lessons,
    orphanedLessonRecords,
    orphanedLessonIds,
    orphanedReviewKeys,
    historicalActivityDispositions,
  };
}

/** Reconciles current V5 catalog ownership without touching valid evidence. */
export function migrateV5Catalog(
  progress: CourseProgressV5,
  knownReviewKeysByLevel?: KnownReviewKeysByLevel,
  knownLessonIdsByLevel?: KnownLessonIdsByLevel,
): CourseProgressV5 {
  let levels = progress.levels;
  for (const levelId of COURSE_LEVEL_IDS) {
    const current = levels[levelId];
    const reconciled = reconcileV5LevelCatalog(
      current,
      levelId,
      knownReviewKeysByLevel?.[levelId],
      knownLessonIdsByLevel?.[levelId],
    );
    if (reconciled !== current) levels = { ...levels, [levelId]: reconciled };
  }
  return levels === progress.levels ? progress : { ...progress, levels };
}

export interface ProgressParseResult {
  progress: CourseProgressV5;
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

function dedupeInEncounterOrder(ids: readonly string[]): string[] {
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
 * Parses raw stored text into current-schema (v5) progress.
 * Explicit, non-throwing behavior for every payload shape:
 * - `null` (nothing stored yet) -> empty v5 progress, not corrupted.
 * - valid current schema-v5 -> passed through unchanged, by direct reference when its
 *   runtime catalog reconciliation is already current.
 * - valid schema-v4 catalog revisions -> normalized, then migrated losslessly to v5.
 * - valid v3/v2/v1 -> continue their existing chain to v4, then migrate to v5.
 * - malformed JSON, malformed v1/v2/v3/v4/v5 shape, missing schemaVersion, or a
 *   future/unknown schemaVersion -> empty v5 progress, corrupted: true.
 * No genuine unversioned (pre-schemaVersion) payload has ever shipped from
 * this codebase, so an absent schemaVersion is treated as corrupted rather
 * than guessed at.
 */
export function parseProgress(
  raw: string | null,
  knownLessonIds?: ReadonlySet<string>,
  knownReviewKeysByLevel?: KnownReviewKeysByLevel,
  knownLessonIdsByLevel?: KnownLessonIdsByLevel,
): ProgressParseResult {
  if (raw === null) {
    return { progress: emptyProgressV5(), corrupted: false, migrated: false };
  }
  try {
    const value = JSON.parse(raw) as { schemaVersion?: unknown };
    if (value.schemaVersion === 5) {
      const candidate = value as Partial<CourseProgressV5>;
      if (!isValidV5Shape(candidate)) {
        return { progress: emptyProgressV5(), corrupted: true, migrated: false };
      }
      const progress = migrateV5Catalog(
        candidate,
        knownReviewKeysByLevel,
        knownLessonIdsByLevel,
      );
      return {
        progress,
        corrupted: false,
        migrated: progress !== candidate,
      };
    }
    if (value.schemaVersion === 4) {
      const candidate = value as Partial<StoredCourseProgressV4>;
      if (!isValidV4Shape(candidate)) {
        return { progress: emptyProgressV5(), corrupted: true, migrated: false };
      }
      const v4 = migrateV4Catalog(candidate);
      const progress = migrateV5Catalog(
        migrateV4ToV5(v4, { knownLessonIdsByLevel, knownReviewKeysByLevel }),
        knownReviewKeysByLevel,
        knownLessonIdsByLevel,
      );
      return {
        progress,
        corrupted: false,
        migrated: true,
      };
    }
    if (value.schemaVersion === 3) {
      const candidate = value as Partial<CourseProgressV3>;
      return isValidV3Shape(candidate)
        ? {
            progress: migrateV5Catalog(
              migrateV4ToV5(migrateV3ToV4(candidate), {
                knownLessonIdsByLevel,
                knownReviewKeysByLevel,
              }),
              knownReviewKeysByLevel,
              knownLessonIdsByLevel,
            ),
            corrupted: false,
            migrated: true,
          }
        : { progress: emptyProgressV5(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 2) {
      const candidate = value as Partial<CourseProgressV2>;
      return isValidV2Shape(candidate)
        ? {
            progress: migrateV5Catalog(
              migrateV4ToV5(
                migrateV3ToV4(
                  migrateV2ToV3(
                    candidate,
                    knownLessonIds ?? new Set(candidate.visitedLessonIds),
                  ),
                ),
                { knownLessonIdsByLevel, knownReviewKeysByLevel },
              ),
              knownReviewKeysByLevel,
              knownLessonIdsByLevel,
            ),
            corrupted: false,
            migrated: true,
          }
        : { progress: emptyProgressV5(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 1) {
      const candidate = value as Partial<CourseProgressV1>;
      if (!isValidV1Shape(candidate)) {
        return { progress: emptyProgressV5(), corrupted: true, migrated: false };
      }
      const v2 = migrateV1ToV2(candidate);
      return {
        progress: migrateV5Catalog(
          migrateV4ToV5(
            migrateV3ToV4(
              migrateV2ToV3(v2, knownLessonIds ?? new Set(v2.visitedLessonIds)),
            ),
            { knownLessonIdsByLevel, knownReviewKeysByLevel },
          ),
          knownReviewKeysByLevel,
          knownLessonIdsByLevel,
        ),
        corrupted: false,
        migrated: true,
      };
    }
    return { progress: emptyProgressV5(), corrupted: true, migrated: false };
  } catch {
    return { progress: emptyProgressV5(), corrupted: true, migrated: false };
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

// ── V5 level-scoped mutators with V4-compatible overloads ───────────────────
//
// These are new pure, exported functions operating directly on `LevelProgress`
// / `CourseProgressV4` (Phase 2 Task 5 step 4). They are deliberately not yet
// wired into `ProgressContext`'s public `useProgress()` hook interface — no
// current UI surfaces Can-do/checkpoint evidence or level clearing, so wiring
// them up is left to the task that introduces that UI (rewiring the app onto
// the new A1/A2 catalog). They are fully covered here so the storage contract
// they must satisfy (idempotence, no mutation, level isolation, never
// touching locale/script settings) is locked in ahead of that UI work.

/** Visited lesson ids within one level. */
export function visitedLessonIdsForLevel(level: LevelProgressV5): string[];
export function visitedLessonIdsForLevel(level: LevelProgress): string[];
export function visitedLessonIdsForLevel(level: LevelProgress): string[] {
  return Object.entries(level.lessons)
    .filter(([, lesson]) => lesson.visitedAt !== null)
    .map(([lessonId]) => lessonId);
}

/**
 * What to add to one Can-do's accumulated evidence in a single call. Every
 * field besides `canDoId`/`at` is optional — callers supply only the
 * evidence this particular interaction produced.
 */
export interface CanDoEvidenceInput {
  readonly canDoId: CanDoId;
  readonly visitedLessonId?: LessonId;
  readonly practicedLessonId?: LessonId;
  readonly acceptedTransferExerciseId?: ExerciseDefinitionId;
  readonly checkpointAttemptId?: CheckpointAttemptId;
  readonly at: string;
}

/**
 * Records observed Can-do evidence (design spec §8): accumulates whichever
 * ids are supplied (idempotent, encounter order) and stamps `lastUpdatedAt`.
 * Never records a pass/fail verdict — only which lessons/exercises/attempts
 * produced evidence. Returns the same `level` reference when nothing new was
 * recorded, matching the existing V3 mutators' no-op contract.
 */
export function recordCanDoEvidence(
  level: LevelProgressV5,
  input: CanDoEvidenceInput,
): LevelProgressV5;
export function recordCanDoEvidence(
  level: LevelProgress,
  input: CanDoEvidenceInput,
): LevelProgress;
export function recordCanDoEvidence(
  level: LevelProgress,
  input: CanDoEvidenceInput,
): LevelProgress {
  const existing = level.canDos[input.canDoId];
  const visitedLessonIds = input.visitedLessonId
    ? dedupeInEncounterOrder([
        ...(existing?.visitedLessonIds ?? []),
        input.visitedLessonId,
      ])
    : (existing?.visitedLessonIds ?? []);
  const practicedLessonIds = input.practicedLessonId
    ? dedupeInEncounterOrder([
        ...(existing?.practicedLessonIds ?? []),
        input.practicedLessonId,
      ])
    : (existing?.practicedLessonIds ?? []);
  const acceptedTransferExerciseIds = input.acceptedTransferExerciseId
    ? dedupeInEncounterOrder([
        ...(existing?.acceptedTransferExerciseIds ?? []),
        input.acceptedTransferExerciseId,
      ])
    : (existing?.acceptedTransferExerciseIds ?? []);
  const checkpointAttemptIds = input.checkpointAttemptId
    ? dedupeInEncounterOrder([
        ...(existing?.checkpointAttemptIds ?? []),
        input.checkpointAttemptId,
      ])
    : (existing?.checkpointAttemptIds ?? []);

  const unchanged =
    existing !== undefined &&
    sameIdList(existing.visitedLessonIds, visitedLessonIds) &&
    sameIdList(existing.practicedLessonIds, practicedLessonIds) &&
    sameIdList(
      existing.acceptedTransferExerciseIds,
      acceptedTransferExerciseIds,
    ) &&
    sameIdList(existing.checkpointAttemptIds, checkpointAttemptIds);
  if (unchanged) return level;

  const next: CanDoEvidence | CanDoEvidenceV5 =
    "historicalActivityDispositions" in level
      ? {
          canDoId: input.canDoId,
          visitedLessonIds,
          practicedLessonIds,
          acceptedTransferExerciseIds,
          checkpointAttemptIds,
          lastUpdatedAt: input.at,
          historicalCheckpointRefs: [
            ...((existing as CanDoEvidenceV5 | undefined)
              ?.historicalCheckpointRefs ?? []),
          ],
        }
      : {
    canDoId: input.canDoId,
    visitedLessonIds,
    practicedLessonIds,
    acceptedTransferExerciseIds,
    checkpointAttemptIds,
    lastUpdatedAt: input.at,
      };
  return { ...level, canDos: { ...level.canDos, [input.canDoId]: next } };
}

/**
 * Records one completed checkpoint attempt, idempotent by `attempt.id`: an
 * attempt id is only ever recorded once. Never a pass/fail verdict — only
 * which exercises were accepted and which Can-dos this attempt sampled.
 */
export function recordCheckpointAttempt(
  level: LevelProgressV5,
  attempt: CheckpointAttempt,
): LevelProgressV5;
export function recordCheckpointAttempt(
  level: LevelProgress,
  attempt: CheckpointAttempt,
): LevelProgress;
export function recordCheckpointAttempt(
  level: LevelProgress,
  attempt: CheckpointAttempt,
): LevelProgress {
  if (level.checkpointAttempts.some((existing) => existing.id === attempt.id)) {
    return level;
  }
  return { ...level, checkpointAttempts: [...level.checkpointAttempts, attempt] };
}

function levelIsEmpty(level: LevelProgress | LevelProgressV5): boolean {
  return (
    Object.keys(level.lessons).length === 0 &&
    Object.keys(level.canDos).length === 0 &&
    level.checkpointAttempts.length === 0 &&
    level.lastVisitedLessonId === null &&
    level.reviewQueue.length === 0 &&
    level.orphanedLessonIds.length === 0 &&
    level.orphanedReviewKeys.length === 0 &&
    (!("orphanedLessonRecords" in level) ||
      (Object.keys(level.orphanedLessonRecords).length === 0 &&
        level.historicalActivityDispositions.length === 0))
  );
}

/**
 * Resets one level back to empty while leaving the other level and the
 * migration notice untouched — A1/A2 evidence never contaminates each other,
 * even when clearing. Purely an in-memory transform: never touches storage,
 * so it can never clear locale/script settings by construction. Returns the
 * same reference when the level is already empty.
 */
export function clearLevel(
  progress: CourseProgressV5,
  level: SharedCourseLevelId,
  at: string,
): CourseProgressV5;
export function clearLevel(
  progress: CourseProgressV4,
  level: CourseLevelId,
  at: string,
): CourseProgressV4;
export function clearLevel(
  progress: CourseProgressV4 | CourseProgressV5,
  level: CourseLevelId,
  at: string,
): CourseProgressV4 | CourseProgressV5;
export function clearLevel(
  progress: CourseProgressV4 | CourseProgressV5,
  level: SharedCourseLevelId,
  at: string,
): CourseProgressV4 | CourseProgressV5 {
  const levels = progress.levels as Partial<
    Record<SharedCourseLevelId, LevelProgress | LevelProgressV5>
  >;
  const current = levels[level];
  if (!current || levelIsEmpty(current)) return progress;
  const nextLevel =
    "orphanedLessonRecords" in current ? emptyLevelProgressV5() : emptyLevelProgress();
  return {
    ...progress,
    levels: { ...progress.levels, [level]: nextLevel },
    updatedAt: at,
  } as CourseProgressV4 | CourseProgressV5;
}

/**
 * Resets both levels back to empty, equivalent to `emptyProgressV4()`
 * stamped with `at`. Purely an in-memory transform: never touches storage,
 * so it can never clear locale/script settings by construction.
 */
export function clearAll(at: string): CourseProgressV4 {
  return { ...emptyProgressV4(), updatedAt: at };
}

/**
 * Acknowledges the pending migration notice by stamping `acknowledgedAt` —
 * never deletes the notice record, so its "what changed" explanation stays
 * available in progress help even after acknowledgement (Phase 2 Task 5 step
 * 4). A no-op (same reference) when there is no notice, or it is already
 * acknowledged.
 */
export function acknowledgeMigrationNotice(
  progress: CourseProgressV5,
  at: string,
): CourseProgressV5;
export function acknowledgeMigrationNotice(
  progress: CourseProgressV4,
  at: string,
): CourseProgressV4;
export function acknowledgeMigrationNotice(
  progress: CourseProgressV4 | CourseProgressV5,
  at: string,
): CourseProgressV4 | CourseProgressV5;
export function acknowledgeMigrationNotice(
  progress: CourseProgressV4 | CourseProgressV5,
  at: string,
): CourseProgressV4 | CourseProgressV5 {
  const notice = progress.migrationNotice;
  if (!notice || notice.acknowledgedAt !== null) return progress;
  return {
    ...progress,
    migrationNotice: { ...notice, acknowledgedAt: at },
  } as CourseProgressV4 | CourseProgressV5;
}

export interface LevelProgressSummary {
  readonly level: SharedCourseLevelId;
  readonly visitedLessonCount: number;
  readonly totalLessonCount: number;
  readonly visitedPercent: number;
  readonly recommendedContinuationLessonId: LessonId | null;
}

/**
 * An independent progress summary for one level, computed only from that
 * level's own lessons — A1 and A2 evidence never cross-contaminate a
 * summary, even when both are computed from the same `modules` outline.
 */
export function summarizeLevel(
  progress: CourseProgressV5,
  level: SharedCourseLevelId,
  modules: readonly ModuleOutline[],
): LevelProgressSummary;
export function summarizeLevel(
  progress: CourseProgressV4,
  level: CourseLevelId,
  modules: readonly ModuleOutline[],
): LevelProgressSummary;
export function summarizeLevel(
  progress: CourseProgressV4 | CourseProgressV5,
  level: CourseLevelId,
  modules: readonly ModuleOutline[],
): LevelProgressSummary;
export function summarizeLevel(
  progress: CourseProgressV4 | CourseProgressV5,
  level: SharedCourseLevelId,
  modules: readonly ModuleOutline[],
): LevelProgressSummary {
  const levelProgress = (
    progress.levels as Partial<Record<SharedCourseLevelId, LevelProgress>>
  )[level] ?? emptyLevelProgress();
  const visited = visitedLessonIdsForLevel(levelProgress);
  const totalLessonCount = modules.reduce(
    (sum, courseModule) => sum + courseModule.lessons.length,
    0,
  );
  return {
    level,
    visitedLessonCount: visited.length,
    totalLessonCount,
    visitedPercent: visitedPercent(visited, totalLessonCount),
    recommendedContinuationLessonId: recommendContinuationLessonId(
      modules,
      visited,
      levelProgress.lastVisitedLessonId,
    ),
  };
}
