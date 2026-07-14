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
 * Builds a lesson URL. The `moduleId` segment is cosmetic: LessonPage
 * resolves the lesson by `lessonId` alone (lesson IDs are preserved across
 * the Task 3 module migration), so old bookmarked URLs whose module id no
 * longer exists (e.g. former `travel-patterns`/`traps`) keep resolving.
 */
export function lessonPath(moduleId: string, lessonId: string): string {
  return `/percorso/${encodeURIComponent(moduleId)}/${encodeURIComponent(lessonId)}`;
}
