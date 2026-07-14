/**
 * Pure module+lesson route resolution for course lesson URLs
 * (`/percorso/:moduleId/:lessonId`).
 *
 * `LessonPage` must never accept a lesson by `lessonId` alone: the URL's
 * `moduleId` segment has to name either the lesson's real (canonical)
 * module, or one of the two module ids renamed during the Task 3
 * migration (`LEGACY_MODULE_ALIASES`). Any other pairing -- an unknown
 * module, an unknown lesson, a canonical module paired with the wrong
 * lesson, or a legacy alias paired with a lesson outside the module it
 * used to name -- is invalid and must fall back to the existing
 * invalid-route behavior (see routing/routes.tsx's `InvalidRoute`).
 */

import type { CourseModule, Lesson, ModuleId } from "../data/types";

/**
 * The only two module ids that changed during the Task 3 migration.
 * Deliberately small and explicit: no other legacy names are recognized,
 * and every recognized alias must map to a module id that still exists.
 */
export const LEGACY_MODULE_ALIASES: Readonly<Record<string, ModuleId>> = {
  "travel-patterns": "questions-existence",
  traps: "capstone",
};

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
 * - `"redirect"`: `moduleId` is a recognized legacy alias whose canonical
 *   module id owns the lesson -- the caller should issue a replace
 *   redirect to `lessonPath(courseModule.id, lesson.id)`.
 * - `"invalid"`: anything else (unknown module, unknown lesson, canonical
 *   module paired with the wrong lesson, or a legacy alias paired with a
 *   lesson outside the module it used to name) -- the caller should fall
 *   back to the existing invalid-route behavior.
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

  const canonicalModuleId = LEGACY_MODULE_ALIASES[moduleId];
  if (canonicalModuleId && canonicalModuleId === entry.courseModule.id) {
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
