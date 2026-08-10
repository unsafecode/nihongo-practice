import { readSetting, writeSetting } from "../../settings/storage";
import type { CourseProgressV5, LevelProgressV5 } from "../progress/progress";
import { COURSE_LEVEL_IDS, type CourseLevelId } from "./types";

export const COURSE_LEVEL_PREFERENCE_KEY = "nihongo.course.level";

function isCourseLevelId(value: unknown): value is CourseLevelId {
  return value === "a0" || value === "a1" || value === "a2";
}

export function parseExplicitCourseLevel(value: string | null): CourseLevelId | null {
  if (value === "base") return "a0";
  if (value === "a1" || value === "a2") return value;
  return null;
}

export function readCourseLevelPreference(storage: Storage | null): CourseLevelId | null {
  const stored = readSetting(storage, COURSE_LEVEL_PREFERENCE_KEY);
  return isCourseLevelId(stored.value) ? stored.value : null;
}

export function writeCourseLevelPreference(
  storage: Storage | null,
  level: CourseLevelId,
): boolean {
  return writeSetting(storage, COURSE_LEVEL_PREFERENCE_KEY, level);
}

export function resolveCourseLevel({
  explicit,
  preference,
  resumeLevel,
  evidence,
}: {
  explicit: CourseLevelId | null;
  preference: CourseLevelId | null;
  resumeLevel?: CourseLevelId | null;
  evidence: Record<CourseLevelId, boolean>;
}): CourseLevelId {
  if (isCourseLevelId(explicit)) return explicit;
  if (isCourseLevelId(preference)) return preference;
  if (isCourseLevelId(resumeLevel)) return resumeLevel;
  if (evidence.a1 || evidence.a2) return "a1";
  return "a0";
}

function levelHasEvidence(level: LevelProgressV5): boolean {
  return (
    Object.keys(level.lessons).length > 0 ||
    level.lastVisitedLessonId !== null ||
    Object.keys(level.canDos).length > 0 ||
    level.checkpointAttempts.length > 0 ||
    level.reviewQueue.length > 0 ||
    Object.keys(level.orphanedLessonRecords).length > 0 ||
    level.orphanedLessonIds.length > 0 ||
    level.orphanedReviewKeys.length > 0 ||
    level.historicalActivityDispositions.length > 0
  );
}

export function courseLevelEvidence(
  progress: CourseProgressV5,
): Record<CourseLevelId, boolean> {
  return Object.fromEntries(
    COURSE_LEVEL_IDS.map((level) => [level, levelHasEvidence(progress.levels[level])]),
  ) as Record<CourseLevelId, boolean>;
}
