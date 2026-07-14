/**
 * Pure module+lesson route resolution for course lesson URLs
 * (`/percorso/:moduleId/:lessonId`).
 *
 * `LessonPage` must never accept a lesson by `lessonId` alone: the URL's
 * `moduleId` segment has to name either the lesson's real (canonical)
 * module, or one of the historical chapter ids retired during the Task 3
 * migration, paired with a lesson that chapter actually owned
 * (`LEGACY_CHAPTER_ROUTES`). A single legacy chapter can map to more than
 * one current module -- the old `traps` chapter split into
 * `questions-existence` (for `traps-particles`) and `capstone` (for
 * `traps-verbs`) -- so membership is tracked per chapter+lesson pair, not
 * per chapter alone. Any other pairing -- an unknown module, an unknown
 * lesson, a canonical module paired with the wrong lesson, or a legacy
 * chapter paired with a lesson it never owned -- is invalid and must fall
 * back to the existing invalid-route behavior (see routing/routes.tsx's
 * `InvalidRoute`).
 */

import type { CourseModule, Lesson, ModuleId } from "../data/types";

/** One historical chapter+lesson pairing and the module it now redirects to. */
export interface LegacyChapterRoute {
  readonly chapterId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
}

/**
 * Every historical (legacy chapter id, lesson id) pair retired during the
 * Task 3 migration, and the current module each one redirects to.
 *
 * Deliberately explicit and exhaustive: no other legacy chapters or
 * lessons are recognized, and each entry pairs a specific lesson with the
 * chapter that actually owned it, so a legacy chapter can never be used
 * to redirect a lesson it never contained (e.g. `travel-patterns` never
 * owned `traps-particles`, even though both now live in
 * `questions-existence`).
 */
export const LEGACY_CHAPTER_ROUTES: readonly LegacyChapterRoute[] = [
  {
    chapterId: "traps",
    lessonId: "traps-particles",
    moduleId: "questions-existence",
  },
  { chapterId: "traps", lessonId: "traps-verbs", moduleId: "capstone" },
  {
    chapterId: "travel-patterns",
    lessonId: "travel-questions",
    moduleId: "questions-existence",
  },
  {
    chapterId: "travel-patterns",
    lessonId: "travel-existence",
    moduleId: "questions-existence",
  },
];

function findLegacyChapterRoute(
  chapterId: string,
  lessonId: string,
): LegacyChapterRoute | undefined {
  return LEGACY_CHAPTER_ROUTES.find(
    (route) => route.chapterId === chapterId && route.lessonId === lessonId,
  );
}

export type LessonRouteResolution =
  | { kind: "match"; courseModule: CourseModule; lesson: Lesson }
  | { kind: "redirect"; courseModule: CourseModule; lesson: Lesson }
  | { kind: "invalid" };

const INVALID_RESOLUTION: LessonRouteResolution = { kind: "invalid" };

interface LessonEntry {
  courseModule: CourseModule;
  lesson: Lesson;
}

function findLessonEntry(
  lessonId: string,
  modules: readonly CourseModule[],
): LessonEntry | null {
  for (const courseModule of modules) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) return { courseModule, lesson };
  }
  return null;
}

/**
 * Resolves a `(moduleId, lessonId)` URL pair against `modules`.
 *
 * - `"match"`: `moduleId` is the lesson's real, current module -- render
 *   normally.
 * - `"redirect"`: `moduleId` is a recognized legacy chapter that actually
 *   owned `lessonId` (per `LEGACY_CHAPTER_ROUTES`) -- the caller should
 *   issue a replace redirect to `lessonPath(courseModule.id, lesson.id)`.
 * - `"invalid"`: anything else (unknown module, unknown lesson, canonical
 *   module paired with the wrong lesson, or a legacy chapter paired with
 *   a lesson it never owned) -- the caller should fall back to the
 *   existing invalid-route behavior.
 */
export function resolveLessonRoute(
  moduleId: string | undefined,
  lessonId: string | undefined,
  modules: readonly CourseModule[],
): LessonRouteResolution {
  if (!moduleId || !lessonId) return INVALID_RESOLUTION;

  const entry = findLessonEntry(lessonId, modules);
  if (!entry) return INVALID_RESOLUTION;

  const isCanonicalModuleId = modules.some(
    (courseModule) => courseModule.id === moduleId,
  );
  if (isCanonicalModuleId) {
    return moduleId === entry.courseModule.id
      ? { kind: "match", ...entry }
      : INVALID_RESOLUTION;
  }

  const legacyRoute = findLegacyChapterRoute(moduleId, lessonId);
  if (legacyRoute && legacyRoute.moduleId === entry.courseModule.id) {
    return { kind: "redirect", ...entry };
  }

  return INVALID_RESOLUTION;
}

/** Router `location.state` shape carried on a one-time legacy-module redirect. */
export interface LegacyModuleRedirectState {
  legacyModuleRedirect: true;
}

/** Shared state value the redirect navigation attaches; never persisted. */
export const LEGACY_MODULE_REDIRECT_STATE: LegacyModuleRedirectState = {
  legacyModuleRedirect: true,
};

/** Narrows an arbitrary `location.state` value to the redirect marker. */
export function isLegacyModuleRedirectState(
  state: unknown,
): state is LegacyModuleRedirectState {
  return (
    typeof state === "object" &&
    state !== null &&
    "legacyModuleRedirect" in state &&
    (state as { legacyModuleRedirect?: unknown }).legacyModuleRedirect ===
      true
  );
}
