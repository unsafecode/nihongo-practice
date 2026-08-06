/**
 * Pure route-path constants and builders, kept React/router-free so they can
 * be imported by both the router wiring in
 * ./routes and the pure route/return-target helpers in ./routeTarget
 * without creating an import cycle between them.
 */

import { levelParam, type CourseLevelId } from "../course/levels/types";

export const routePaths = {
  course: "/percorso",
  lesson: "/percorso/:moduleId/:lessonId",
  practice: "/pratica",
  lab: "/pratica/laboratorio",
  syllabary: "/pratica/sillabario",
  phrasebook: "/frasario",
} as const;

/**
 * Builds a lesson URL. `moduleId` is validated by
 * `course/routing/lessonRouteResolution.ts`: LessonPage requires it to name
 * either the lesson's real, current module, or one of the two module ids
 * renamed during the Task 3 migration (former `travel-patterns`/`traps`),
 * which are recognized as legacy aliases and redirected to their current
 * module. Any other module/lesson pairing is treated as an invalid route.
 */
export function lessonPath(moduleId: string, lessonId: string): string {
  return `/percorso/${encodeURIComponent(moduleId)}/${encodeURIComponent(lessonId)}`;
}

/**
 * Query param that selects the visible level on the course map (Phase 3
 * Task 8, design spec §5). It is a *query* param — never a new path segment —
 * so it can never collide with the existing `/percorso/:moduleId/:lessonId`
 * lesson route, and it still yields distinct browser-history entries so back/
 * forward restores the previously-selected level.
 */
export const courseLevelParam = "livello";

/** Deprecated binary CourseHome compatibility type; new URL code uses CourseLevelId. */
export type CourseLevelParam = "a1" | "a2";

/**
 * Course-map URL focused on a given level. Every option carries explicit URL
 * intent; default resolution is handled separately by the selection helper.
 */
export function coursePathForLevel(level: CourseLevelId): string {
  const params = new URLSearchParams({ [courseLevelParam]: levelParam(level) });
  return `${routePaths.course}?${params.toString()}`;
}

/**
 * @deprecated Old binary compatibility wrapper for CourseHome until Task6 wires
 * Base runtime data into map selection. New production code must use
 * parseExplicitCourseLevel + resolveCourseLevel. Keeping this A1/A2-only avoids
 * silently indexing Base data before CourseHome can render it.
 */
export function courseLevelFromParam(value: string | null): CourseLevelParam {
  return value === "a2" ? "a2" : "a1";
}
