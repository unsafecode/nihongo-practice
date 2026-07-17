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

// ── V4: level-aware progress (A1/A2), visited-only migration ──────────────
//
// Phase 2 Task 5 replaces the single-level v3 schema with a level-aware v4
// schema (design spec §17). v3 predates the A1/A2 split entirely, so there is
// no lossless "same shape, more fields" migration path: v3→v4 is a
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

export type CourseLevelId = "a1" | "a2";
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

/** One level's (A1 or A2) complete, independent progress (design spec §17). */
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
 * Records that a v3→v4 migration happened and exactly what it did, so the UI
 * can show a truthful, dismissible one-time notice (design spec §17, Phase 2
 * Task 5 step 5). `acknowledgedAt` starts `null` and is set once the learner
 * dismisses the notice — acknowledging never deletes this record, so the
 * "what changed" explanation can stay available in progress help.
 */
export interface ProgressMigrationNotice {
  readonly fromSchemaVersion: 3;
  readonly preservedVisitedLessonIds: readonly LessonId[];
  readonly resetEvidenceLessonIds: readonly LessonId[];
  readonly acknowledgedAt: string | null;
}

export interface CourseProgressV4 {
  readonly schemaVersion: 4;
  readonly catalogVersion: "a1-a2-v1";
  readonly levels: Readonly<Record<CourseLevelId, LevelProgress>>;
  readonly migrationNotice: ProgressMigrationNotice | null;
  readonly updatedAt: string;
}

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
    catalogVersion: "a1-a2-v1",
    levels: { a1: emptyLevelProgress(), a2: emptyLevelProgress() },
    migrationNotice: null,
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * All 40 real, currently-published `a0-a1-v1` v3 lesson ids, in their own
 * authored order (design spec catalog). This is checked in tests
 * (`progress.v4.test.ts`) against both the leaf authoring file
 * (`../catalog/lessonPlans.ts`'s `lessonPlans`) and the assembled runtime
 * catalog (`../data/course.ts`'s `courseModules`), so a catalog id rename
 * fails that test instead of quietly changing what this migration does. It
 * includes this v3 schema's own real named capstone ids
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
 * Deterministically migrates a v3 payload into v4 (design spec §17, Phase 2
 * Task 5 steps 2-3). Visited-only: only `visitedAt` transfers for the
 * reviewed `A1_V3_LESSON_ID_MAP`, dropping every other kind of evidence.
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
    catalogVersion: "a1-a2-v1",
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

function isValidV4Shape(value: Partial<CourseProgressV4>): value is CourseProgressV4 {
  return (
    value.schemaVersion === 4 &&
    value.catalogVersion === "a1-a2-v1" &&
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

export interface ProgressParseResult {
  progress: CourseProgressV4;
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
 * Parses raw stored text into current-schema (v4) progress.
 * Explicit, non-throwing behavior for every payload shape:
 * - `null` (nothing stored yet) -> empty v4 progress, not corrupted.
 * - valid v4 -> passed through unchanged, by direct reference (no migration).
 * - valid v3 -> migrated to v4 via migrateV3ToV4 (visited-only, Phase 2 Task 5).
 * - valid v2 -> migrated to v3 via migrateV2ToV3, then to v4.
 * - valid v1 -> migrated to v2 via migrateV1ToV2, then to v3, then to v4.
 * - malformed JSON, malformed v1/v2/v3/v4 shape, missing schemaVersion, or a
 *   future/unknown schemaVersion -> empty v4 progress, corrupted: true.
 * No genuine unversioned (pre-schemaVersion) payload has ever shipped from
 * this codebase, so an absent schemaVersion is treated as corrupted rather
 * than guessed at.
 */
export function parseProgress(
  raw: string | null,
  knownLessonIds?: ReadonlySet<string>,
): ProgressParseResult {
  if (raw === null) {
    return { progress: emptyProgressV4(), corrupted: false, migrated: false };
  }
  try {
    const value = JSON.parse(raw) as { schemaVersion?: unknown };
    if (value.schemaVersion === 4) {
      const candidate = value as Partial<CourseProgressV4>;
      return isValidV4Shape(candidate)
        ? { progress: candidate, corrupted: false, migrated: false }
        : { progress: emptyProgressV4(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 3) {
      const candidate = value as Partial<CourseProgressV3>;
      return isValidV3Shape(candidate)
        ? { progress: migrateV3ToV4(candidate), corrupted: false, migrated: true }
        : { progress: emptyProgressV4(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 2) {
      const candidate = value as Partial<CourseProgressV2>;
      return isValidV2Shape(candidate)
        ? {
            progress: migrateV3ToV4(
              migrateV2ToV3(
                candidate,
                knownLessonIds ?? new Set(candidate.visitedLessonIds),
              ),
            ),
            corrupted: false,
            migrated: true,
          }
        : { progress: emptyProgressV4(), corrupted: true, migrated: false };
    }
    if (value.schemaVersion === 1) {
      const candidate = value as Partial<CourseProgressV1>;
      if (!isValidV1Shape(candidate)) {
        return { progress: emptyProgressV4(), corrupted: true, migrated: false };
      }
      const v2 = migrateV1ToV2(candidate);
      return {
        progress: migrateV3ToV4(
          migrateV2ToV3(v2, knownLessonIds ?? new Set(v2.visitedLessonIds)),
        ),
        corrupted: false,
        migrated: true,
      };
    }
    return { progress: emptyProgressV4(), corrupted: true, migrated: false };
  } catch {
    return { progress: emptyProgressV4(), corrupted: true, migrated: false };
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

// ── V4 level-scoped mutators: Can-do evidence, checkpoint attempts, clearing ──
//
// These are new pure, exported functions operating directly on `LevelProgress`
// / `CourseProgressV4` (Phase 2 Task 5 step 4). They are deliberately not yet
// wired into `ProgressContext`'s public `useProgress()` hook interface — no
// current UI surfaces Can-do/checkpoint evidence or level clearing, so wiring
// them up is left to the task that introduces that UI (rewiring the app onto
// the new A1/A2 catalog). They are fully covered here so the storage contract
// they must satisfy (idempotence, no mutation, level isolation, never
// touching locale/script settings) is locked in ahead of that UI work.

/** Visited lesson ids within one level — the v4 analogue of `visitedLessonIds`. */
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

  const next: CanDoEvidence = {
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
  level: LevelProgress,
  attempt: CheckpointAttempt,
): LevelProgress {
  if (level.checkpointAttempts.some((existing) => existing.id === attempt.id)) {
    return level;
  }
  return { ...level, checkpointAttempts: [...level.checkpointAttempts, attempt] };
}

function levelIsEmpty(level: LevelProgress): boolean {
  return (
    Object.keys(level.lessons).length === 0 &&
    Object.keys(level.canDos).length === 0 &&
    level.checkpointAttempts.length === 0 &&
    level.lastVisitedLessonId === null &&
    level.reviewQueue.length === 0 &&
    level.orphanedLessonIds.length === 0 &&
    level.orphanedReviewKeys.length === 0
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
  progress: CourseProgressV4,
  level: CourseLevelId,
  at: string,
): CourseProgressV4 {
  if (levelIsEmpty(progress.levels[level])) return progress;
  return {
    ...progress,
    levels: { ...progress.levels, [level]: emptyLevelProgress() },
    updatedAt: at,
  };
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
  progress: CourseProgressV4,
  at: string,
): CourseProgressV4 {
  const notice = progress.migrationNotice;
  if (!notice || notice.acknowledgedAt !== null) return progress;
  return { ...progress, migrationNotice: { ...notice, acknowledgedAt: at } };
}

export interface LevelProgressSummary {
  readonly level: CourseLevelId;
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
  progress: CourseProgressV4,
  level: CourseLevelId,
  modules: readonly ModuleOutline[],
): LevelProgressSummary {
  const levelProgress = progress.levels[level];
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
