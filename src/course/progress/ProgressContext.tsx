import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  browserStorage,
  readSetting,
  removeSetting,
  writeSetting,
} from "../../settings/storage";
import {
  type CourseProgressV3,
  type CourseProgressV4,
  type ExerciseEvidence,
  type LevelProgress,
  emptyProgressV4,
  markLessonVisited,
  parseProgress,
  recordExerciseAcceptance,
  recordExerciseMistake,
} from "./progress";
import { reconcileReviewQueueEntries, reviewKeyFor } from "./reviewQueue";
import { exerciseIdsByLesson } from "../catalog/exercises";
import { courseModules } from "../data/course";

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
  [...exerciseIdsByLesson.entries()].flatMap(([lessonId, ids]) =>
    ids.map((id) => reviewKeyFor(lessonId, id)),
  ),
);

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
    // The authored 3-5 required IDs are the practiced/consolidated gate; an
    // unknown lesson falls back to just this exercise so a single accept can
    // never fabricate a whole-lesson gate.
    requiredExerciseIds: exerciseIdsByLesson.get(lessonId) ?? [exerciseDefinitionId],
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
}

interface InitialProgress {
  progress: CourseProgressV4;
  corrupted: boolean;
  migrated: boolean;
  persistenceAvailable: boolean;
  loadStatus: "empty" | "current" | "migrated" | "corrupted" | "unavailable";
}

export function loadProgress(storage: Storage | null): InitialProgress {
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

  if (parsed.corrupted) {
    const cleanupAvailable = removeSetting(storage, STORAGE_KEY);
    return {
      progress,
      corrupted: true,
      migrated: false,
      persistenceAvailable: stored.available && cleanupAvailable,
      loadStatus: !stored.available ? "unavailable" : "corrupted",
    };
  }

  if (parsed.migrated) {
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
  const [initial] = useState(() => loadProgress(storage));
  const [progressV4, setProgressV4] = useState(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    setPersistenceAvailable(persistProgress(storage, progressV4).status === "saved");
  }, [progressV4, storage]);

  const progress = useMemo(
    () => levelToV3Compat(progressV4.levels.a1, progressV4.updatedAt),
    [progressV4],
  );

  const markVisited = useCallback((lessonId: string) => {
    setProgressV4((current) => {
      const v3 = levelToV3Compat(current.levels.a1, current.updatedAt);
      const nextV3 = markLessonVisited(v3, lessonId);
      if (nextV3 === v3) return current;
      return {
        ...current,
        levels: { ...current.levels, a1: v3CompatToLevel(nextV3, current.levels.a1) },
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
      const nextV3 =
        input.outcome === "accepted"
          ? recordExerciseAcceptance(v3, evidence, "lesson")
          : recordExerciseMistake(v3, evidence);
      if (nextV3 === v3) return current;
      return {
        ...current,
        levels: { ...current.levels, a1: v3CompatToLevel(nextV3, current.levels.a1) },
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
      return {
        ...current,
        levels: { ...current.levels, a1: v3CompatToLevel(nextV3, current.levels.a1) },
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
