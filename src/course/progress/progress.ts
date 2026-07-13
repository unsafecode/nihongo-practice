export interface CourseProgressV1 {
  schemaVersion: 1;
  completedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}

export function emptyProgress(): CourseProgressV1 {
  return {
    schemaVersion: 1,
    completedLessonIds: [],
    lastVisitedLessonId: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function parseProgress(raw: string | null): {
  progress: CourseProgressV1;
  corrupted: boolean;
} {
  if (raw === null) return { progress: emptyProgress(), corrupted: false };
  try {
    const value = JSON.parse(raw) as Partial<CourseProgressV1>;
    if (
      value.schemaVersion !== 1 ||
      !Array.isArray(value.completedLessonIds) ||
      !value.completedLessonIds.every((id) => typeof id === "string") ||
      !(value.lastVisitedLessonId === null || typeof value.lastVisitedLessonId === "string") ||
      typeof value.updatedAt !== "string"
    ) {
      return { progress: emptyProgress(), corrupted: true };
    }
    return { progress: value as CourseProgressV1, corrupted: false };
  } catch {
    return { progress: emptyProgress(), corrupted: true };
  }
}

export function setLessonComplete(
  progress: CourseProgressV1,
  lessonId: string,
  complete: boolean,
): CourseProgressV1 {
  const ids = new Set(progress.completedLessonIds);
  complete ? ids.add(lessonId) : ids.delete(lessonId);
  return {
    ...progress,
    completedLessonIds: [...ids],
    updatedAt: new Date().toISOString(),
  };
}

export function setLastVisited(
  progress: CourseProgressV1,
  lessonId: string,
): CourseProgressV1 {
  return {
    ...progress,
    lastVisitedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
}

export function completionPercent(completed: string[], total: number): number {
  return total === 0 ? 0 : Math.round((completed.length / total) * 100);
}
