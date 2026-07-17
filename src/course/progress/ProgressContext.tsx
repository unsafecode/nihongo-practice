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
  type CourseProgressV4,
  type ExerciseEvidence,
  type LevelProgress,
  type CanDoEvidence,
  type CheckpointAttempt,
  type LevelProgressSummary,
  type ProgressMigrationNotice,
  acknowledgeMigrationNotice as acknowledgeMigrationNoticeV4,
  emptyProgressV4,
  markLessonVisited,
  parseProgress,
  recordCanDoEvidence,
  recordCheckpointAttempt,
  recordExerciseAcceptance,
  recordExerciseMistake,
  summarizeLevel,
} from "./progress";
import { reconcileReviewQueueEntries, reviewKeyFor } from "./reviewQueue";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { courseModules } from "../data/course";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import {
  a1Checkpoint,
  A1_CHECKPOINT_ID,
  A1_CHECKPOINT_SCENARIO_LESSON_IDS,
} from "../a1/catalog/checkpoint";

export const STORAGE_KEY = "nihongo.course.progress";
const knownLessonIds = new Set(
  courseModules.flatMap((courseModule) =>
    courseModule.lessons.map((lesson) => lesson.id),
  ),
);

/**
 * Every review key the current catalog still recognises (`lessonId:exerciseId`).
 * A stored review entry outside this set is obsolete metadata: `loadProgress`
 * reconciles it into `orphanedReviewKeys` rather than dropping it (spec §10.4).
 */
const knownReviewKeys = new Set(
  [...knownLessonIds].flatMap((lessonId) =>
    (getLessonExercises(lessonId)?.exercises ?? []).map((exercise) =>
      reviewKeyFor(lessonId, exercise.definitionId),
    ),
  ),
);

/**
 * Every A1 lesson's one authored Can-do id (design spec §8), from
 * `a1CanDosAuthored`'s `lessonIds` — the same total, 1:1 mapping
 * `data/course.ts` already relies on. Evidence recording below never
 * fabricates a Can-do id for a lesson this map doesn't recognise.
 */
const lessonToCanDoId = new Map(
  a1CanDosAuthored.flatMap((canDo) => canDo.lessonIds.map((lessonId) => [lessonId, canDo.id])),
);

/** The A1 course modules' outline shape `summarizeLevel` needs. */
const a1ModuleOutline = courseModules.map((courseModule) => ({
  id: courseModule.id,
  prerequisiteIds: courseModule.prerequisiteIds,
  lessons: courseModule.lessons.map((lesson) => ({ id: lesson.id })),
}));

/**
 * Records observed Can-do evidence for one lesson interaction, resolving the
 * lesson's single authored Can-do id from {@link lessonToCanDoId}. A lesson
 * this map doesn't recognise (never expected for a real A1 lesson id) is a
 * safe no-op rather than a fabricated Can-do.
 */
function withCanDoEvidence(
  level: LevelProgress,
  lessonId: string,
  at: string,
  input: {
    readonly visited?: boolean;
    readonly practiced?: boolean;
    readonly acceptedTransferExerciseId?: string;
  },
): LevelProgress {
  const canDoId = lessonToCanDoId.get(lessonId);
  if (!canDoId) return level;
  return recordCanDoEvidence(level, {
    canDoId,
    at,
    visitedLessonId: input.visited ? lessonId : undefined,
    practicedLessonId: input.practiced ? lessonId : undefined,
    acceptedTransferExerciseId: input.acceptedTransferExerciseId,
  });
}

/**
 * Once every capstone scenario lesson (`A1_CHECKPOINT_SCENARIO_LESSON_IDS`)
 * has reached `consolidatedAt`, idempotently records the single A1 checkpoint
 * attempt (fixed id, so re-triggering — e.g. a later re-accept in an already
 * consolidated capstone — can never duplicate it, matching
 * `recordCheckpointAttempt`'s own by-id idempotence). Never a pass/fail
 * verdict: only which exercises were accepted and which Can-dos this attempt
 * sampled, then folded into each sampled Can-do's own `checkpointAttemptIds`
 * evidence.
 */
function withCheckpointAttempt(level: LevelProgress, at: string): LevelProgress {
  const allConsolidated = A1_CHECKPOINT_SCENARIO_LESSON_IDS.every(
    (lessonId) => level.lessons[lessonId]?.consolidatedAt != null,
  );
  if (!allConsolidated) return level;

  const attempt: CheckpointAttempt = {
    id: `${A1_CHECKPOINT_ID}-attempt-1`,
    checkpointId: a1Checkpoint.id,
    attemptedAt: at,
    acceptedExerciseIds: A1_CHECKPOINT_SCENARIO_LESSON_IDS.flatMap(
      (lessonId) => level.lessons[lessonId]?.acceptedExerciseIds ?? [],
    ),
    sampledCanDoIds: a1Checkpoint.sampledCanDoIds,
  };
  const withAttempt = recordCheckpointAttempt(level, attempt);
  if (withAttempt === level) return level; // already recorded — no duplicate evidence fold

  return a1Checkpoint.sampledCanDoIds.reduce(
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
  level: LevelProgress,
  lessonId: string,
  exerciseDefinitionId: string,
  wasPracticedAt: string | null,
  nowPracticedAt: string | null,
  accepted: boolean,
  at: string,
): LevelProgress {
  const justPracticed = wasPracticedAt === null && nowPracticedAt !== null;
  const practicePurpose = accepted
    ? getLessonExercises(lessonId)?.exercises.find(
        (exercise) => exercise.definitionId === exerciseDefinitionId,
      )?.practicePurpose
    : undefined;
  let next = withCanDoEvidence(level, lessonId, at, {
    practiced: justPracticed,
    acceptedTransferExerciseId:
      practicePurpose === "transfer" ? exerciseDefinitionId : undefined,
  });
  if (accepted) next = withCheckpointAttempt(next, at);
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

function evidenceFor(
  lessonId: string,
  exerciseDefinitionId: string,
  targetConceptIds: readonly string[],
  targetLexemeIds: readonly string[],
  at: string,
): ExerciseEvidence {
  return {
    lessonId,
    exerciseDefinitionId,
    // The authored practice-round required IDs are the practiced/consolidated
    // gate; an unknown lesson falls back to just this exercise so a single
    // accept can never fabricate a whole-lesson gate.
    requiredExerciseIds:
      getLessonExercises(lessonId)?.exercises.map((exercise) => exercise.definitionId) ?? [
        exerciseDefinitionId,
      ],
    targetConceptIds,
    targetLexemeIds,
    at,
  };
}

/**
 * Bridges v4's level-aware storage onto the still-v3-shaped public
 * `ProgressContextValue.progress` field. The app's existing components
 * (`CourseHome`, `LessonPage`, etc.) all target the A1 catalog today and were
 * built entirely against `CourseProgressV3`; rather than touch every
 * consumer for Phase 2 Task 5, `progressV4.levels.a1` is projected through
 * this bridge so those components keep working unchanged while progress is
 * actually stored level-aware underneath (spec §17). `canDos` and
 * `checkpointAttempts` have no v3 analogue and are intentionally dropped in
 * this direction — nothing v3-shaped ever reads them.
 */
function levelToV3Compat(level: LevelProgress, updatedAt: string): CourseProgressV3 {
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
function v3CompatToLevel(v3: CourseProgressV3, previous: LevelProgress): LevelProgress {
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
  /** Non-null exactly once for a learner whose v3 progress migrated to v4 (spec §17). */
  migrationNotice: ProgressMigrationNotice | null;
  /** Stamps `migrationNotice.acknowledgedAt` — never deletes the record (its "what changed" copy stays available). */
  acknowledgeMigrationNotice: () => void;
  /** A1's independent, truthful visited-lesson summary (design spec §7.3, §17) — never A2 evidence. */
  levelSummary: LevelProgressSummary;
  /** Observed A1 Can-do evidence, by Can-do id — never a pass/fail verdict (design spec §8). */
  canDoEvidence: Readonly<Record<string, CanDoEvidence>>;
  /** Every completed A1 checkpoint attempt so far, oldest first (design spec §17). */
  checkpointAttempts: readonly CheckpointAttempt[];
}

interface InitialProgress {
  progress: CourseProgressV4;
  corrupted: boolean;
  migrated: boolean;
  persistenceAvailable: boolean;
  loadStatus: "empty" | "current" | "migrated" | "corrupted" | "unavailable";
}

interface PreparedProgress {
  progress: CourseProgressV4;
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
  const parsed = parseProgress(stored.value, knownLessonIds);
  const a1 = parsed.progress.levels.a1;
  const reconciled = reconcileReviewQueueEntries(
    a1.reviewQueue,
    a1.orphanedReviewKeys,
    knownReviewKeys,
  );
  const progress: CourseProgressV4 = reconciled.changed
    ? {
        ...parsed.progress,
        levels: {
          ...parsed.progress.levels,
          a1: {
            ...a1,
            reviewQueue: reconciled.reviewQueue,
            orphanedReviewKeys: reconciled.orphanedReviewKeys,
          },
        },
      }
    : parsed.progress;

  return { progress, corrupted: parsed.corrupted, migrated: parsed.migrated, stored };
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
    // A v1/v2/v3 payload only ever gets deterministically migrated once: the
    // migrated v4 is written straight back so every subsequent load sees
    // schemaVersion 4 directly and passes it through by reference (never
    // re-running the migration, never re-stamping its notice or
    // timestamps). If the write fails, the migrated v4 is still returned
    // for use in memory this session, persistence is reported unavailable,
    // and the raw v3 (or older) bytes already on disk are left completely
    // untouched — `writeSetting` either fully replaces the stored value or
    // throws without touching it, never a partial write.
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
  progress: CourseProgressV4,
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
  const [progressV4, setProgressV4] = useState(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.stored.available,
  );
  // Guards the one-time initial-mount side effects (corrupted cleanup,
  // migrated write-back) so they run exactly once, deferred from render into
  // this effect, without re-running on every later `progressV4` change —
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
    // `persistProgress` call commits `progressV4` here — never a second,
    // duplicate write-back for the same migrated payload (minor #4).
    setPersistenceAvailable(persistProgress(storage, progressV4).status === "saved");
  }, [progressV4, storage, initial]);

  const progress = useMemo(
    () => levelToV3Compat(progressV4.levels.a1, progressV4.updatedAt),
    [progressV4],
  );

  const markVisited = useCallback((lessonId: string) => {
    setProgressV4((current) => {
      const v3 = levelToV3Compat(current.levels.a1, current.updatedAt);
      const nextV3 = markLessonVisited(v3, lessonId);
      if (nextV3 === v3) return current;
      const level = withCanDoEvidence(
        v3CompatToLevel(nextV3, current.levels.a1),
        lessonId,
        nextV3.updatedAt,
        { visited: true },
      );
      return {
        ...current,
        levels: { ...current.levels, a1: level },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const recordAttempt = useCallback((input: ExerciseAttemptInput) => {
    const at = new Date().toISOString();
    const evidence = evidenceFor(
      input.lessonId,
      input.exerciseDefinitionId,
      input.targetConceptIds,
      input.targetLexemeIds,
      at,
    );
    setProgressV4((current) => {
      const v3 = levelToV3Compat(current.levels.a1, current.updatedAt);
      const accepted = input.outcome === "accepted";
      const nextV3 = accepted
        ? recordExerciseAcceptance(v3, evidence, "lesson")
        : recordExerciseMistake(v3, evidence);
      if (nextV3 === v3) return current;
      const level = withAttemptEvidence(
        v3CompatToLevel(nextV3, current.levels.a1),
        input.lessonId,
        input.exerciseDefinitionId,
        v3.lessons[input.lessonId]?.practicedAt ?? null,
        nextV3.lessons[input.lessonId]?.practicedAt ?? null,
        accepted,
        nextV3.updatedAt,
      );
      return {
        ...current,
        levels: { ...current.levels, a1: level },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const resolveReview = useCallback((input: ReviewResolutionInput) => {
    const at = new Date().toISOString();
    const evidence = evidenceFor(
      input.lessonId,
      input.exerciseDefinitionId,
      input.targetConceptIds,
      input.targetLexemeIds,
      at,
    );
    setProgressV4((current) => {
      const v3 = levelToV3Compat(current.levels.a1, current.updatedAt);
      const nextV3 = recordExerciseAcceptance(v3, evidence, "review");
      if (nextV3 === v3) return current;
      const level = withAttemptEvidence(
        v3CompatToLevel(nextV3, current.levels.a1),
        input.lessonId,
        input.exerciseDefinitionId,
        v3.lessons[input.lessonId]?.practicedAt ?? null,
        nextV3.lessons[input.lessonId]?.practicedAt ?? null,
        true,
        nextV3.updatedAt,
      );
      return {
        ...current,
        levels: { ...current.levels, a1: level },
        updatedAt: nextV3.updatedAt,
      };
    });
  }, []);

  const dismissCorruption = useCallback(() => {
    setCorrupted(false);
  }, []);

  const reset = useCallback(() => {
    setCorrupted(false);
    const result = resetStoredProgress(storage);
    setPersistenceAvailable(result.status === "removed");
    if (result.status === "removed") setProgressV4(emptyProgressV4());
  }, [storage]);

  const acknowledgeMigrationNotice = useCallback(() => {
    setProgressV4((current) =>
      acknowledgeMigrationNoticeV4(current, new Date().toISOString()),
    );
  }, []);

  const levelSummary = useMemo(
    () => summarizeLevel(progressV4, "a1", a1ModuleOutline),
    [progressV4],
  );
  const canDoEvidence = progressV4.levels.a1.canDos;
  const checkpointAttempts = progressV4.levels.a1.checkpointAttempts;

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
      migrationNotice: progressV4.migrationNotice,
      acknowledgeMigrationNotice,
      levelSummary,
      canDoEvidence,
      checkpointAttempts,
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
      progressV4.migrationNotice,
      acknowledgeMigrationNotice,
      levelSummary,
      canDoEvidence,
      checkpointAttempts,
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
