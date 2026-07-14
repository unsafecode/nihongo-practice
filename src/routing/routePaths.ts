/**
 * Pure route-path constants and builders, kept dependency-free (no React,
 * no react-router) so they can be imported by both the router wiring in
 * ./routes and the pure route/return-target helpers in ./routeTarget
 * without creating an import cycle between them.
 */

export const routePaths = {
  course: "/percorso",
  lesson: "/percorso/:chapterId/:lessonId",
  practice: "/pratica",
  lab: "/pratica/laboratorio",
  syllabary: "/pratica/sillabario",
  phrasebook: "/frasario",
} as const;

export function lessonPath(chapterId: string, lessonId: string): string {
  return `/percorso/${encodeURIComponent(chapterId)}/${encodeURIComponent(lessonId)}`;
}
