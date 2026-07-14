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
  type CourseProgressV2,
  emptyProgress,
  markLessonVisited,
  parseProgress,
} from "./progress";

export const STORAGE_KEY = "nihongo.course.progress";

export interface ProgressContextValue {
  progress: CourseProgressV2;
  corrupted: boolean;
  persistenceAvailable: boolean;
  markVisited: (lessonId: string) => void;
  dismissCorruption: () => void;
  reset: () => void;
}

interface InitialProgress {
  progress: CourseProgressV2;
  corrupted: boolean;
  persistenceAvailable: boolean;
}

export function loadProgress(storage: Storage | null): InitialProgress {
  const stored = readSetting(storage, STORAGE_KEY);
  const parsed = parseProgress(stored.value);
  const cleanupAvailable = parsed.corrupted
    ? removeSetting(storage, STORAGE_KEY)
    : stored.available;
  return {
    ...parsed,
    persistenceAvailable: stored.available && cleanupAvailable,
  };
}

/**
 * Persists progress to storage and reports whether the write actually
 * succeeded - never reports success after `setItem` throws (e.g. storage
 * quota exceeded or unavailable in private browsing).
 */
export function persistProgress(
  storage: Storage | null,
  progress: CourseProgressV2,
): boolean {
  return writeSetting(storage, STORAGE_KEY, JSON.stringify(progress));
}

export function resetStoredProgress(storage: Storage | null): boolean {
  return removeSetting(storage, STORAGE_KEY);
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
    setPersistenceAvailable(persistProgress(storage, progress));
  }, [progress, storage]);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((current) => markLessonVisited(current, lessonId));
  }, []);

  const dismissCorruption = useCallback(() => {
    setCorrupted(false);
  }, []);

  const reset = useCallback(() => {
    setCorrupted(false);
    setPersistenceAvailable(resetStoredProgress(storage));
    setProgress(emptyProgress());
  }, [storage]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      dismissCorruption,
      reset,
    }),
    [
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
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
