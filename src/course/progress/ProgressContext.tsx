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
  type CourseProgressV1,
  emptyProgress,
  parseProgress,
  setLastVisited,
  setLessonComplete,
} from "./progress";

export const STORAGE_KEY = "nihongo.course.progress";

interface ProgressContextValue {
  progress: CourseProgressV1;
  corrupted: boolean;
  persistenceAvailable: boolean;
  markVisited: (lessonId: string) => void;
  setComplete: (lessonId: string, complete: boolean) => void;
  dismissCorruption: () => void;
  reset: () => void;
}

interface InitialProgress {
  progress: CourseProgressV1;
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

export function resetStoredProgress(storage: Storage | null): boolean {
  return removeSetting(storage, STORAGE_KEY);
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => browserStorage(), []);
  const [initial] = useState(() => loadProgress(storage));
  const [progress, setProgress] = useState(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    setPersistenceAvailable(
      writeSetting(storage, STORAGE_KEY, JSON.stringify(progress)),
    );
  }, [progress, storage]);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((current) => setLastVisited(current, lessonId));
  }, []);

  const setComplete = useCallback((lessonId: string, complete: boolean) => {
    setProgress((current) => setLessonComplete(current, lessonId, complete));
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
      setComplete,
      dismissCorruption,
      reset,
    }),
    [
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      setComplete,
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
