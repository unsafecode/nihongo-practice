/**
 * Pure route-path constants and builders, kept dependency-free (no React,
 * no react-router) so they can be imported by both the router wiring in
 * ./routes and the pure route/return-target helpers in ./routeTarget
 * without creating an import cycle between them.
 */

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
