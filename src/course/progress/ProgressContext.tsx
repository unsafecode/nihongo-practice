import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  browserStorage,
  readSetting,
  removeSetting,
  writeSetting,
  type StoredValue,
} from "../../settings/storage";
import {
  type CourseProgressV3,
  type CourseProgressV5,
  type ExerciseEvidence,
  type LevelProgressV5,
  type LessonProgress,
  type CanDoEvidence,
  type CheckpointAttempt,
  type LevelProgressSummary,
  type ModuleOutline,
  acknowledgeMigrationNotice as acknowledgeMigrationNoticeV4,
  clearLevel as clearLevelProgress,
  emptyProgressV5,
  markLessonVisited,
  parseProgress,
  recordCanDoEvidence,
  recordCheckpointAttempt,
  recordExerciseAcceptance,
  recordExerciseMistake,
  summarizeLevel,
} from "./progress";
import { reviewKeyFor } from "./reviewQueue";
import { getLessonExercises } from "../components/lessonExerciseModel";
import type { CheckpointDefinition, LessonId, ModuleId } from "../foundations/types";
import { lessonIdsForLevel, lessonOwner } from "../levels/ownership";
import type { CourseLevelId } from "../levels/types";
import {
  BASE_LESSON_IDS_BY_MODULE,
  BASE_MODULE_IDS,
} from "../base/manifest";
import { baseCanDos as baseCanDosAuthored } from "../base/catalog/canDos";
import {
  baseCheckpoint,
  BASE_CHECKPOINT_ID,
  BASE_CHECKPOINT_SCENARIO_LESSON_IDS,
} from "../base/catalog/checkpoint";
import {
  A1_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
} from "../a1/manifest";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import {
  a1Checkpoint,
  A1_CHECKPOINT_ID,
  A1_CHECKPOINT_SCENARIO_LESSON_IDS,
} from "../a1/catalog/checkpoint";
import {
  A2_LESSON_IDS_BY_MODULE,
  A2_MODULE_IDS,
  A2_SYNTHESIS_LESSON_IDS,
} from "../a2/manifest";
import { a2SemanticBuiltLessons } from "../a2/catalog/catalog";
import { a2Checkpoint, A2_CHECKPOINT_ID } from "../a2/catalog/checkpoint";

export const STORAGE_KEY = "nihongo.course.progress";

/**
 * The per-level runtime metadata every evidence mutation needs (Phase 3
 * Task 8). A1 and A2 each carry their own known-lesson/known-review-key sets,
 * their own lesson→primary-Can-do map, their own module outline for level
 * summaries, and their own checkpoint definition + scenario lessons. The V4
 * store is already level-aware, so recording A2 evidence only ever touches
 * `levels.a2` and leaves `levels.a1` byte-identical (no destructive migration).
 */
export interface LevelRuntime {
  readonly level: CourseLevelId;
  readonly knownLessonIds: ReadonlySet<string>;
  readonly knownReviewKeys: ReadonlySet<string>;
  /** lessonId → the Can-do whose evidence a visit/practice of that lesson records. */
  readonly lessonToCanDoId: ReadonlyMap<string, string>;
  readonly moduleOutline: readonly ModuleOutline[];
  readonly checkpoint: CheckpointDefinition;
  readonly checkpointAttemptId: string;
  readonly checkpointScenarioLessonIds: readonly string[];
}

function moduleOutlineFor(
  moduleIds: readonly ModuleId[],
  lessonIdsByModule: Readonly<Partial<Record<ModuleId, readonly LessonId[]>>>,
): readonly ModuleOutline[] {
  return moduleIds.map((moduleId, index) => ({
    id: moduleId,
    prerequisiteIds: index === 0 ? [] : [moduleIds[index - 1]!],
    lessons: (lessonIdsByModule[moduleId] ?? []).map((id) => ({ id })),
  }));
}

function currentExerciseDefinitionsFor(
  level: CourseLevelId,
  lessonId: string,
): readonly { readonly definitionId: string; readonly practicePurpose: string }[] {
  // Base has no current exercise model yet. `getLessonExercises("sounds-1")`
  // still resolves a retired V4 activity, so it must not reactivate it here.
  if (level === "a0") return [];
  const model = getLessonExercises(lessonId);
  return model && model.errors.length === 0 ? model.exercises : [];
}

function knownReviewKeysFor(
  level: CourseLevelId,
  lessonIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(
    [...lessonIds].flatMap((lessonId) =>
      currentExerciseDefinitionsFor(level, lessonId).map((exercise) =>
        reviewKeyFor(lessonId, exercise.definitionId),
      ),
    ),
  );
}

function lessonToCanDoIdFor(
  level: CourseLevelId,
  canDos: readonly { readonly id: string; readonly lessonIds: readonly string[] }[],
): ReadonlyMap<string, string> {
  return new Map(
    canDos.flatMap((canDo) =>
      canDo.lessonIds
        .filter((lessonId) => lessonOwner(lessonId)?.levelId === level)
        .map((lessonId) => [lessonId, canDo.id] as const),
    ),
  );
}

const baseLessonToCanDoId = lessonToCanDoIdFor("a0", baseCanDosAuthored);
const a1LessonToCanDoId = lessonToCanDoIdFor("a1", a1CanDosAuthored);
const a2LessonToCanDoId = new Map(
  a2SemanticBuiltLessons
    .filter((built) => lessonOwner(built.recipe.id)?.levelId === "a2")
    .map((built) => [built.recipe.id, built.recipe.primaryCanDoId]),
);

const a0KnownLessonIds = new Set(lessonIdsForLevel("a0"));
const a1KnownLessonIds = new Set(lessonIdsForLevel("a1"));
const a2KnownLessonIds = new Set(lessonIdsForLevel("a2"));
// The exact pre-split A1 source catalog for V1/V2 migration. This deliberately
// excludes all new Base-only ids; current level ownership remains below.
const preSplitA1LessonIds = new Set(A1_LESSON_IDS);

function checkpointWithRuntimeSample(
  checkpoint: CheckpointDefinition,
  allowedCanDoIds: ReadonlySet<string>,
): CheckpointDefinition {
  const sampledCanDoIds = checkpoint.sampledCanDoIds.filter((id) =>
    allowedCanDoIds.has(id),
  );
  if (sampledCanDoIds.length === 0) {
    throw new Error(`checkpoint "${checkpoint.id}" has no runtime-owned sampled Can-dos`);
  }
  for (const canDoId of sampledCanDoIds) {
    if (!allowedCanDoIds.has(canDoId)) {
      throw new Error(
        `checkpoint "${checkpoint.id}" samples non-runtime Can-do "${canDoId}"`,
      );
    }
  }
  return Object.freeze({
    ...checkpoint,
    sampledCanDoIds: Object.freeze([...sampledCanDoIds]),
  });
}

const a1CheckpointRuntime = checkpointWithRuntimeSample(
  a1Checkpoint,
  new Set(a1LessonToCanDoId.values()),
);

export const LEVEL_RUNTIME: Readonly<Record<CourseLevelId, LevelRuntime>> = {
  a0: {
    level: "a0",
    knownLessonIds: a0KnownLessonIds,
    knownReviewKeys: knownReviewKeysFor("a0", a0KnownLessonIds),
    lessonToCanDoId: baseLessonToCanDoId,
    moduleOutline: moduleOutlineFor(BASE_MODULE_IDS, BASE_LESSON_IDS_BY_MODULE),
    checkpoint: baseCheckpoint,
    checkpointAttemptId: BASE_CHECKPOINT_ID,
    checkpointScenarioLessonIds: BASE_CHECKPOINT_SCENARIO_LESSON_IDS,
  },
  a1: {
    level: "a1",
    knownLessonIds: a1KnownLessonIds,
    knownReviewKeys: knownReviewKeysFor("a1", a1KnownLessonIds),
    lessonToCanDoId: a1LessonToCanDoId,
    moduleOutline: moduleOutlineFor(A1_RETAINED_MODULE_IDS, A1_RETAINED_LESSON_IDS_BY_MODULE),
    checkpoint: a1CheckpointRuntime,
    checkpointAttemptId: A1_CHECKPOINT_ID,
    checkpointScenarioLessonIds: A1_CHECKPOINT_SCENARIO_LESSON_IDS,
  },
  a2: {
    level: "a2",
    knownLessonIds: a2KnownLessonIds,
    knownReviewKeys: knownReviewKeysFor("a2", a2KnownLessonIds),
    lessonToCanDoId: a2LessonToCanDoId,
    moduleOutline: moduleOutlineFor(A2_MODULE_IDS, A2_LESSON_IDS_BY_MODULE),
    checkpoint: a2Checkpoint,
    checkpointAttemptId: A2_CHECKPOINT_ID,
    checkpointScenarioLessonIds: A2_SYNTHESIS_LESSON_IDS,
  },
};

const KNOWN_REVIEW_KEYS_BY_LEVEL: Readonly<
  Record<CourseLevelId, ReadonlySet<string>>
> = {
  a0: LEVEL_RUNTIME.a0.knownReviewKeys,
  a1: LEVEL_RUNTIME.a1.knownReviewKeys,
  a2: LEVEL_RUNTIME.a2.knownReviewKeys,
};

const KNOWN_LESSON_IDS_BY_LEVEL: Readonly<
  Record<CourseLevelId, ReadonlySet<string>>
> = {
  a0: LEVEL_RUNTIME.a0.knownLessonIds,
  a1: LEVEL_RUNTIME.a1.knownLessonIds,
  a2: LEVEL_RUNTIME.a2.knownLessonIds,
};

export type OwnerResult =
  | { readonly ok: true; readonly level: CourseLevelId; readonly runtime: LevelRuntime }
  | { readonly ok: false; readonly lessonId: string };

/**
 * Resolves the canonical registry owner and refuses any runtime whose lesson or
 * primary Can-do map is incomplete. No mutation may use a fallback owner.
 */
export function runtimeForLesson(
  lessonId: string,
  runtimes: Readonly<Record<CourseLevelId, LevelRuntime>> = LEVEL_RUNTIME,
): OwnerResult {
  const owner = lessonOwner(lessonId);
  if (!owner) return { ok: false, lessonId };
  const runtime = runtimes[owner.levelId];
  if (
    runtime.level !== owner.levelId ||
    !runtime.knownLessonIds.has(lessonId) ||
    !runtime.lessonToCanDoId.has(lessonId)
  ) {
    return { ok: false, lessonId };
  }
  return { ok: true, level: owner.levelId, runtime };
}

/**
 * Records observed Can-do evidence for one lesson interaction, resolving the
 * lesson's Can-do id from the given level's {@link LevelRuntime.lessonToCanDoId}.
 * A lesson that level does not recognise is a safe no-op rather than a
 * fabricated Can-do.
 */
function withCanDoEvidence(
  level: LevelProgressV5,
  runtime: LevelRuntime,
  lessonId: string,
  at: string,
  input: {
    readonly visited?: boolean;
    readonly practiced?: boolean;
    readonly acceptedTransferExerciseId?: string;
  },
): LevelProgressV5 {
  const canDoId = runtime.lessonToCanDoId.get(lessonId);
  if (!canDoId) {
    throw new Error(`incomplete runtime for lesson "${lessonId}"`);
  }
  return recordCanDoEvidence(level, {
    canDoId,
    at,
    visitedLessonId: input.visited ? lessonId : undefined,
    practicedLessonId: input.practiced ? lessonId : undefined,
    acceptedTransferExerciseId: input.acceptedTransferExerciseId,
  });
}

/**
 * Once every checkpoint scenario lesson for this level has reached
 * `consolidatedAt`, idempotently records the single level checkpoint attempt
 * (fixed id per level), then folds it into each sampled Can-do's evidence.
 * Never a pass/fail verdict — only which exercises were accepted and which
 * Can-dos this attempt sampled. Generalized over the level runtime so A1 and
 * A2 share one implementation.
 */
function withCheckpointAttempt(
  level: LevelProgressV5,
  runtime: LevelRuntime,
  at: string,
): LevelProgressV5 {
  const allConsolidated = runtime.checkpointScenarioLessonIds.every(
    (lessonId) => level.lessons[lessonId]?.consolidatedAt != null,
  );
  if (!allConsolidated) return level;

  const attempt: CheckpointAttempt = {
    id: `${runtime.checkpointAttemptId}-attempt-1`,
    checkpointId: runtime.checkpoint.id,
    attemptedAt: at,
    acceptedExerciseIds: runtime.checkpointScenarioLessonIds.flatMap(
      (lessonId) => level.lessons[lessonId]?.acceptedExerciseIds ?? [],
    ),
    sampledCanDoIds: runtime.checkpoint.sampledCanDoIds,
  };
  const withAttempt = recordCheckpointAttempt(level, attempt);
  if (withAttempt === level) return level; // already recorded — no duplicate evidence fold

  return runtime.checkpoint.sampledCanDoIds.reduce(
    (acc, canDoId) => recordCanDoEvidence(acc, { canDoId, at, checkpointAttemptId: attempt.id }),
    withAttempt,
  );
}

/**
 * Folds an exercise attempt's Can-do/checkpoint evidence into `level`, called
 * only once the v3 mutator already confirmed the attempt actually changed
 * something. `wasPracticedAt`/`nowPracticedAt` (the lesson's `practicedAt`
 * just before/after the mutation) detect a genuine null→non-null transition
 * so practiced evidence is recorded exactly once, not on every later attempt
 * in an already-practiced lesson. Transfer evidence and the checkpoint-attempt
 * check only ever apply to an accepted result — a retry never contributes
 * either (design spec §8, §11.1).
 */
function withAttemptEvidence(
  level: LevelProgressV5,
  runtime: LevelRuntime,
  lessonId: string,
  exerciseDefinitionId: string,
  wasPracticedAt: string | null,
  nowPracticedAt: string | null,
  accepted: boolean,
  at: string,
): LevelProgressV5 {
  const justPracticed = wasPracticedAt === null && nowPracticedAt !== null;
  const practicePurpose = accepted
    ? currentExerciseDefinitionsFor(runtime.level, lessonId).find(
        (exercise) => exercise.definitionId === exerciseDefinitionId,
      )?.practicePurpose
    : undefined;
  let next = withCanDoEvidence(level, runtime, lessonId, at, {
    practiced: justPracticed,
    acceptedTransferExerciseId:
      practicePurpose === "transfer" ? exerciseDefinitionId : undefined,
  });
  if (accepted) next = withCheckpointAttempt(next, runtime, at);
  return next;
}

/**
 * A single evaluated, structurally-valid exercise attempt reported by the
 * lesson UI. Carries only semantic IDs and the engine's assessed targets — the
 * required-exercise gate and transition timestamp are resolved here so callers
 * never fabricate either. `invalid-input` results are not attempts and are never
 * reported through this surface.
 */
export interface ExerciseAttemptInput {
  readonly lessonId: string;
  readonly exerciseDefinitionId: string;
  readonly outcome: "accepted" | "retry";
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
}

/** An accepted attempt produced in review mode, resolving its queue entry. */
export interface ReviewResolutionInput {
  readonly lessonId: string;
  readonly exerciseDefinitionId: string;
  readonly targetConceptIds: readonly string[];
  readonly targetLexemeIds: readonly string[];
}

type MutationErrorCode =
  | "unknown-lesson-owner"
  | "incomplete-lesson-runtime"
  | "unknown-exercise-definition";

export interface ProgressMutationError {
  readonly code: MutationErrorCode;
  readonly lessonId: string;
}

type EvidenceResult =
  | { readonly ok: true; readonly evidence: Omit<ExerciseEvidence, "at"> }
  | { readonly ok: false; readonly error: ProgressMutationError };

function errorForRuntime(lessonId: string): ProgressMutationError {
  return {
    code: lessonOwner(lessonId) === null ? "unknown-lesson-owner" : "incomplete-lesson-runtime",
    lessonId,
  };
}

function evidenceFor(
  runtime: LevelRuntime,
  lessonId: string,
  exerciseDefinitionId: string,
  targetConceptIds: readonly string[],
  targetLexemeIds: readonly string[],
): EvidenceResult {
  const definitions = currentExerciseDefinitionsFor(runtime.level, lessonId);
  const definition = definitions.find((item) => item.definitionId === exerciseDefinitionId);
  if (
    !definition ||
    !runtime.knownReviewKeys.has(reviewKeyFor(lessonId, exerciseDefinitionId))
  ) {
    return {
      ok: false,
      error: { code: "unknown-exercise-definition", lessonId },
    };
  }
  return {
    ok: true,
    evidence: {
      lessonId,
      exerciseDefinitionId,
      requiredExerciseIds: definitions.map((item) => item.definitionId),
      targetConceptIds,
      targetLexemeIds,
    },
  };
}

/**
 * Bridges v4's level-aware storage onto the still-v3-shaped public
 * `ProgressContextValue.progress` field. The app's existing components
 * (`CourseHome`, `LessonPage`, etc.) all target the A1 catalog today and were
 * built entirely against `CourseProgressV3`; rather than touch every
 * consumer for Phase 2 Task 5, `progressV5.levels.a1` is projected through
 * this bridge so those components keep working unchanged while progress is
 * actually stored level-aware underneath (spec §17). `canDos` and
 * `checkpointAttempts` have no v3 analogue and are intentionally dropped in
 * this direction — nothing v3-shaped ever reads them.
 */
function levelToV3Compat(level: LevelProgressV5, updatedAt: string): CourseProgressV3 {
  return {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: { ...level.lessons },
    lastVisitedLessonId: level.lastVisitedLessonId,
    reviewQueue: [...level.reviewQueue],
    orphanedLessonIds: [...level.orphanedLessonIds],
    orphanedReviewKeys: [...level.orphanedReviewKeys],
    updatedAt,
  };
}

/** The inverse of `levelToV3Compat`: folds a v3-shaped mutation result back
 * into a `LevelProgress`, preserving whatever v4-only evidence (`canDos`,
 * `checkpointAttempts`) the level already carried — the v3 mutators never
 * see or touch those fields, so they must never be discarded here. */
function v3CompatToLevel(
  v3: CourseProgressV3,
  previous: LevelProgressV5,
): LevelProgressV5 {
  return {
    ...previous,
    lessons: v3.lessons,
    lastVisitedLessonId: v3.lastVisitedLessonId,
    reviewQueue: v3.reviewQueue,
    orphanedLessonIds: v3.orphanedLessonIds,
    orphanedReviewKeys: v3.orphanedReviewKeys,
  };
}

export interface ProgressContextValue {
  progress: CourseProgressV3;
  corrupted: boolean;
  persistenceAvailable: boolean;
  markVisited: (lessonId: string) => void;
  recordAttempt: (input: ExerciseAttemptInput) => void;
  resolveReview: (input: ReviewResolutionInput) => void;
  dismissCorruption: () => void;
  reset: () => void;
  /**
   * Resets ONE level back to empty, leaving the other level's serialized
   * evidence byte-identical (Phase 3 Task 8 spec-fix, ISSUE 3). Unlike the
   * global {@link reset}, this never removes the whole stored record — it
   * writes a scoped update through the same persistence path every other
   * mutation uses, so the untouched level survives a reload and a save
   * failure is reported truthfully via `persistenceAvailable`. Inferring the
   * level is the caller's job (Course Home passes its selected level), so a
   * level-scoped surface can never wipe the level the learner is not looking
   * at.
   */
  clearLevel: (level: CourseLevelId) => void;
  /** Non-null exactly once for a learner whose legacy progress migrated to V5. */
  migrationNotice: CourseProgressV5["migrationNotice"];
  /** Stamps `migrationNotice.acknowledgedAt` — never deletes the record (its "what changed" copy stays available). */
  acknowledgeMigrationNotice: () => void;
  /** A1's independent, truthful visited-lesson summary (design spec §7.3, §17) — never A2 evidence. */
  levelSummary: LevelProgressSummary;
  /** Observed A1 Can-do evidence, by Can-do id — never a pass/fail verdict (design spec §8). */
  canDoEvidence: Readonly<Record<string, CanDoEvidence>>;
  /** Every completed A1 checkpoint attempt so far, oldest first (design spec §17). */
  checkpointAttempts: readonly CheckpointAttempt[];
  /**
   * The full level-aware V5 state. Consumers can read each owning level without going through
   * the A1-only v3-compat projection above.
   */
  progressV5: CourseProgressV5;
  /** One lesson's own evidence, resolved from whichever level owns it. */
  lessonEvidence: (lessonId: string) => LessonProgress | undefined;
  /** A given level's independent visited-lesson summary — never the other level's evidence. */
  levelSummaryFor: (level: CourseLevelId) => LevelProgressSummary;
  /** A given level's observed Can-do evidence, by Can-do id. */
  canDoEvidenceFor: (level: CourseLevelId) => Readonly<Record<string, CanDoEvidence>>;
  /** A given level's completed checkpoint attempts, oldest first. */
  checkpointAttemptsFor: (level: CourseLevelId) => readonly CheckpointAttempt[];
  /** The last rejected owner/exercise mutation; reads never create this state. */
  mutationError: ProgressMutationError | null;
  clearMutationError: () => void;
}

interface InitialProgress {
  progress: CourseProgressV5;
  corrupted: boolean;
  migrated: boolean;
  persistenceAvailable: boolean;
  loadStatus: "empty" | "current" | "migrated" | "corrupted" | "unavailable";
}

interface PreparedProgress {
  progress: CourseProgressV5;
  corrupted: boolean;
  migrated: boolean;
  stored: StoredValue;
}

/**
 * The read/parse/reconcile portion of `loadProgress`, with zero side
 * effects — no `setItem`, no `removeItem`. Safe to call during React render,
 * including from a lazy `useState` initializer (Phase 2 Task 5
 * quality-review minor #5): unlike `loadProgress`, this never writes the
 * corrupted-cleanup removal or the migrated write-back to storage itself.
 * `loadProgress` wraps this with those side effects for direct callers, and
 * `ProgressProvider` instead defers them into a mount effect (see the
 * `didCommitInitialSideEffectRef` guard below).
 */
export function prepareProgress(storage: Storage | null): PreparedProgress {
  const stored = readSetting(storage, STORAGE_KEY);
  // V1/V2 payloads may contain all exact pre-split A1 ids. Keep that source
  // set distinct from the current retained-A1 runtime; V5 reconciliation
  // remains level-scoped.
  const parsed = parseProgress(
    stored.value,
    preSplitA1LessonIds,
    KNOWN_REVIEW_KEYS_BY_LEVEL,
    KNOWN_LESSON_IDS_BY_LEVEL,
  );

  return {
    progress: parsed.progress,
    corrupted: parsed.corrupted,
    migrated: parsed.migrated,
    stored,
  };
}

export function loadProgress(storage: Storage | null): InitialProgress {
  const { progress, corrupted, migrated, stored } = prepareProgress(storage);

  if (corrupted) {
    const cleanupAvailable = removeSetting(storage, STORAGE_KEY);
    return {
      progress,
      corrupted: true,
      migrated: false,
      persistenceAvailable: stored.available && cleanupAvailable,
      loadStatus: !stored.available ? "unavailable" : "corrupted",
    };
  }

  if (migrated) {
    // A legacy schema-v1/v2/v3 payload, legacy schema-v4 catalog, or stale schema-v4 catalog
    // reconciliation is normalized once and written straight back. Every later
    // load then sees current schema/catalog data by reference, without
    // re-stamping evidence or migration timestamps. If the write fails, the
    // usable normalized state still remains in memory while the raw source
    // bytes stay untouched — `writeSetting` either fully replaces the stored
    // value or throws without a partial write.
    const writeResult = persistProgress(storage, progress);
    return {
      progress,
      corrupted: false,
      migrated: true,
      persistenceAvailable: stored.available && writeResult.status === "saved",
      loadStatus: !stored.available ? "unavailable" : "migrated",
    };
  }

  return {
    progress,
    corrupted: false,
    migrated: false,
    persistenceAvailable: stored.available,
    loadStatus: !stored.available ? "unavailable" : stored.value === null ? "empty" : "current",
  };
}

export type ProgressPersistenceResult =
  | { status: "saved" }
  | { status: "removed" }
  | { status: "unavailable" };

/**
 * Persists progress to storage and reports whether the write actually
 * succeeded - never reports success after `setItem` throws (e.g. storage
 * quota exceeded or unavailable in private browsing).
 */
export function persistProgress(
  storage: Storage | null,
  progress: CourseProgressV5,
): ProgressPersistenceResult {
  return writeSetting(storage, STORAGE_KEY, JSON.stringify(progress))
    ? { status: "saved" }
    : { status: "unavailable" };
}

export function resetStoredProgress(
  storage: Storage | null,
): ProgressPersistenceResult {
  return removeSetting(storage, STORAGE_KEY)
    ? { status: "removed" }
    : { status: "unavailable" };
}

export const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined,
);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => browserStorage(), []);
  // Render-pure: `prepareProgress` never writes to storage, so it is safe to
  // call from this lazy `useState` initializer (Phase 2 Task 5
  // quality-review minor #5). The corrupted-cleanup removal and the
  // migrated write-back are deferred to the mount effect below instead of
  // running here during render.
  const [initial] = useState(() => prepareProgress(storage));
  const [progressV5, setProgressV5] = useState<CourseProgressV5>(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [mutationError, setMutationError] = useState<ProgressMutationError | null>(null);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.stored.available,
  );
  // Guards the one-time initial-mount side effects (corrupted cleanup,
  // migrated write-back) so they run exactly once, deferred from render into
  // this effect, without re-running on every later V5 progress change —
  // ongoing persistence below still runs on every change as before.
  const didCommitInitialSideEffectRef = useRef(false);

  useEffect(() => {
    if (!didCommitInitialSideEffectRef.current) {
      didCommitInitialSideEffectRef.current = true;
      // Deferred from render (minor #5): removing a corrupted stored value
      // is the same cleanup `loadProgress` performs for direct callers, just
      // moved out of the lazy state initializer and into this effect.
      if (initial.corrupted) removeSetting(storage, STORAGE_KEY);
    }
    // Whether this is the initial mount (current/empty, migrated, or
    // corrupted-then-recreated) or a later change, exactly one
    // `persistProgress` call commits `progressV5` here — never a second,
    // duplicate write-back for the same migrated payload (minor #4).
    setPersistenceAvailable(persistProgress(storage, progressV5).status === "saved");
  }, [progressV5, storage, initial]);

  const progress = useMemo(
    () => levelToV3Compat(progressV5.levels.a1, progressV5.updatedAt),
    [progressV5],
  );

  const markVisited = useCallback((lessonId: string) => {
    const owner = runtimeForLesson(lessonId);
    if (!owner.ok) {
      setMutationError(errorForRuntime(lessonId));
      return;
    }
    setMutationError(null);
    const { level, runtime } = owner;
    setProgressV5((current) => {
      const v3 = levelToV3Compat(current.levels[level], current.updatedAt);
      const nextV3 = markLessonVisited(v3, lessonId);
      if (nextV3 === v3) return current;
      const levelProgress = withCanDoEvidence(
        v3CompatToLevel(nextV3, current.levels[level]),
        runtime,
        lessonId,
        nextV3.updatedAt,
        { visited: true },
      );
      return {
        ...current,
        levels: { ...current.levels, [level]: levelProgress },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const recordAttempt = useCallback((input: ExerciseAttemptInput) => {
    const owner = runtimeForLesson(input.lessonId);
    if (!owner.ok) {
      setMutationError(errorForRuntime(input.lessonId));
      return;
    }
    const evidenceResult = evidenceFor(
      owner.runtime,
      input.lessonId,
      input.exerciseDefinitionId,
      input.targetConceptIds,
      input.targetLexemeIds,
    );
    if (!evidenceResult.ok) {
      setMutationError(evidenceResult.error);
      return;
    }
    setMutationError(null);
    const at = new Date().toISOString();
    const evidence: ExerciseEvidence = { ...evidenceResult.evidence, at };
    const { level, runtime } = owner;
    setProgressV5((current) => {
      const v3 = levelToV3Compat(current.levels[level], current.updatedAt);
      const accepted = input.outcome === "accepted";
      const nextV3 = accepted
        ? recordExerciseAcceptance(v3, evidence, "lesson")
        : recordExerciseMistake(v3, evidence);
      if (nextV3 === v3) return current;
      const levelProgress = withAttemptEvidence(
        v3CompatToLevel(nextV3, current.levels[level]),
        runtime,
        input.lessonId,
        input.exerciseDefinitionId,
        v3.lessons[input.lessonId]?.practicedAt ?? null,
        nextV3.lessons[input.lessonId]?.practicedAt ?? null,
        accepted,
        nextV3.updatedAt,
      );
      return {
        ...current,
        levels: { ...current.levels, [level]: levelProgress },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const resolveReview = useCallback((input: ReviewResolutionInput) => {
    const owner = runtimeForLesson(input.lessonId);
    if (!owner.ok) {
      setMutationError(errorForRuntime(input.lessonId));
      return;
    }
    const evidenceResult = evidenceFor(
      owner.runtime,
      input.lessonId,
      input.exerciseDefinitionId,
      input.targetConceptIds,
      input.targetLexemeIds,
    );
    if (!evidenceResult.ok) {
      setMutationError(evidenceResult.error);
      return;
    }
    setMutationError(null);
    const at = new Date().toISOString();
    const evidence: ExerciseEvidence = { ...evidenceResult.evidence, at };
    const { level, runtime } = owner;
    setProgressV5((current) => {
      const v3 = levelToV3Compat(current.levels[level], current.updatedAt);
      const nextV3 = recordExerciseAcceptance(v3, evidence, "review");
      if (nextV3 === v3) return current;
      const levelProgress = withAttemptEvidence(
        v3CompatToLevel(nextV3, current.levels[level]),
        runtime,
        input.lessonId,
        input.exerciseDefinitionId,
        v3.lessons[input.lessonId]?.practicedAt ?? null,
        nextV3.lessons[input.lessonId]?.practicedAt ?? null,
        true,
        nextV3.updatedAt,
      );
      return {
        ...current,
        levels: { ...current.levels, [level]: levelProgress },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const dismissCorruption = useCallback(() => {
    setCorrupted(false);
  }, []);

  const reset = useCallback(() => {
    setCorrupted(false);
    setMutationError(null);
    const result = resetStoredProgress(storage);
    setPersistenceAvailable(result.status === "removed");
    if (result.status === "removed") setProgressV5(emptyProgressV5());
  }, [storage]);

  // Level-scoped reset (ISSUE 3). Never removes the whole stored record the
  // way `reset` does — it maps the current V4 store through the pure
  // `clearLevel`, which empties exactly the one level and returns the other
  // level (and the migration notice) by reference, then hands the result to
  // `setProgressV4`. The ongoing-persistence effect below writes that scoped
  // update and updates `persistenceAvailable` from the real write result, so
  // the preserved level is genuinely re-serialized to storage and a failed
  // save is reported truthfully — exactly the persistence/error path every
  // other evidence mutation already uses. A no-op (same reference from
  // `clearLevel`) when that level is already empty means no needless write.
  const clearLevel = useCallback((level: CourseLevelId) => {
    setCorrupted(false);
    setMutationError(null);
    setProgressV5((current) =>
      clearLevelProgress(current, level, new Date().toISOString()),
    );
  }, []);

  const acknowledgeMigrationNotice = useCallback(() => {
    setProgressV5((current) =>
      acknowledgeMigrationNoticeV4(current, new Date().toISOString()),
    );
  }, []);

  const levelSummary = useMemo(
    () => summarizeLevel(progressV5, "a1", LEVEL_RUNTIME.a1.moduleOutline),
    [progressV5],
  );
  const canDoEvidence = progressV5.levels.a1.canDos;
  const checkpointAttempts = progressV5.levels.a1.checkpointAttempts;

  const lessonEvidence = useCallback(
    (lessonId: string): LessonProgress | undefined => {
      const owner = runtimeForLesson(lessonId);
      return owner.ok ? progressV5.levels[owner.level].lessons[lessonId] : undefined;
    },
    [progressV5],
  );
  const levelSummaryFor = useCallback(
    (level: CourseLevelId): LevelProgressSummary =>
      summarizeLevel(progressV5, level, LEVEL_RUNTIME[level].moduleOutline),
    [progressV5],
  );
  const canDoEvidenceFor = useCallback(
    (level: CourseLevelId): Readonly<Record<string, CanDoEvidence>> =>
      progressV5.levels[level].canDos,
    [progressV5],
  );
  const checkpointAttemptsFor = useCallback(
    (level: CourseLevelId): readonly CheckpointAttempt[] =>
      progressV5.levels[level].checkpointAttempts,
    [progressV5],
  );
  const clearMutationError = useCallback(() => setMutationError(null), []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      recordAttempt,
      resolveReview,
      dismissCorruption,
      reset,
      clearLevel,
      migrationNotice: progressV5.migrationNotice,
      acknowledgeMigrationNotice,
      levelSummary,
      canDoEvidence,
      checkpointAttempts,
      progressV5,
      lessonEvidence,
      levelSummaryFor,
      canDoEvidenceFor,
      checkpointAttemptsFor,
      mutationError,
      clearMutationError,
    }),
    [
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      recordAttempt,
      resolveReview,
      dismissCorruption,
      reset,
      clearLevel,
      progressV5,
      acknowledgeMigrationNotice,
      levelSummary,
      canDoEvidence,
      checkpointAttempts,
      lessonEvidence,
      levelSummaryFor,
      canDoEvidenceFor,
      checkpointAttemptsFor,
      mutationError,
      clearMutationError,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within ProgressProvider");
  return value;
}
