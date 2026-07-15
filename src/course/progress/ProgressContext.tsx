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
  type ExerciseEvidence,
  emptyProgress,
  markLessonVisited,
  parseProgress,
  recordExerciseAcceptance,
  recordExerciseMistake,
} from "./progress";
import { reconcileReviewQueue, reviewKeyFor } from "./reviewQueue";
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
  progress: CourseProgressV3;
  corrupted: boolean;
  migrated: boolean;
  persistenceAvailable: boolean;
  loadStatus: "empty" | "current" | "migrated" | "corrupted" | "unavailable";
}

export function loadProgress(storage: Storage | null): InitialProgress {
  const stored = readSetting(storage, STORAGE_KEY);
  const parsed = parseProgress(stored.value, knownLessonIds);
  const cleanupAvailable = parsed.corrupted
    ? removeSetting(storage, STORAGE_KEY)
    : stored.available;
  return {
    progress: reconcileReviewQueue(parsed.progress, knownReviewKeys),
    corrupted: parsed.corrupted,
    migrated: parsed.migrated,
    persistenceAvailable: stored.available && cleanupAvailable,
    loadStatus: !stored.available
      ? "unavailable"
      : parsed.corrupted
        ? "corrupted"
        : parsed.migrated
          ? "migrated"
          : stored.value === null
            ? "empty"
            : "current",
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
  progress: CourseProgressV3,
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
  const [progress, setProgress] = useState(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    setPersistenceAvailable(persistProgress(storage, progress).status === "saved");
  }, [progress, storage]);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((current) => markLessonVisited(current, lessonId));
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
    setProgress((current) =>
      input.outcome === "accepted"
        ? recordExerciseAcceptance(current, evidence, "lesson")
        : recordExerciseMistake(current, evidence),
    );
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
    setProgress((current) => recordExerciseAcceptance(current, evidence, "review"));
  }, []);

  const dismissCorruption = useCallback(() => {
    setCorrupted(false);
  }, []);

  const reset = useCallback(() => {
    setCorrupted(false);
    const result = resetStoredProgress(storage);
    setPersistenceAvailable(result.status === "removed");
    if (result.status === "removed") setProgress(emptyProgress());
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
