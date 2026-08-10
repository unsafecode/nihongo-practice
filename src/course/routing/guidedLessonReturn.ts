/**
 * The course-aware half of the guided-return contract.
 *
 * `routing/routeTarget.ts` and `routing/guidedToolLink.ts` stay deliberately
 * course-data-independent: they prove a `from` value is a safe, known-shape
 * route (and, for `/percorso/:moduleId/:lessonId`, that the section anchor is
 * a real `LessonSectionId`). They cannot know whether a *shape-valid* pair
 * such as `/percorso/sounds/traps-verbs#explore` is a genuine lesson-in-module
 * association — `sounds` is a real module and `traps-verbs` is a real lesson,
 * but the module does not own that lesson, so following the return would land
 * on `InvalidRoute`.
 *
 * This module supplies the injected `GuidedReturnLessonValidator` that closes
 * that gap by reusing the single source of truth for module/lesson pairing —
 * Task 3's `resolveLessonRoute` over the real `courseModules`:
 *
 *   - a canonical match  -> `ok`   (keep the target as-is),
 *   - a recognized legacy chapter pair -> `canonical` (rewrite the target to
 *     the lesson's *current* module, preserving the validated section anchor
 *     so a `#explore` return survives and a pathname-only legacy return stays
 *     return-to-top — and so the return never triggers a second redirect),
 *   - anything else (canonical module + wrong lesson, unknown lesson, or a
 *     legacy chapter paired with a lesson it never owned) -> `mismatch`.
 *
 * It imports only *downward* (course data + Task 3 resolver + the pure route
 * helpers), so no import cycle is created with the generic routing layer.
 */

import type {
  GuidedReturnLessonCheck,
  GuidedReturnLessonValidator,
} from "../../routing/guidedToolLink";
import { lessonPath } from "../../routing/routePaths";
import type { RouteTarget } from "../../routing/routeTarget";
import type { CourseModule } from "../data/types";
import { legacyA1CourseModules as courseModules } from "../data/course";
import { resolveLessonRoute } from "./lessonRouteResolution";

const COURSE_LESSON_PREFIX_SEGMENT = "percorso";

/**
 * Extracts the `(moduleId, lessonId)` pair from a `/percorso/x/y` pathname.
 * Returns `null` for anything that is not exactly that two-segment shape —
 * the generic parser only guarantees the target is a course-lesson pathname,
 * and this stays defensive rather than assuming that guarantee.
 */
function lessonIdsFromPathname(
  pathname: string,
): { moduleId: string; lessonId: string } | null {
  const segments = pathname.split("/");
  // A well-formed lesson pathname splits to ["", "percorso", moduleId, lessonId].
  if (segments.length !== 4) return null;
  const [, prefix, moduleId, lessonId] = segments;
  if (prefix !== COURSE_LESSON_PREFIX_SEGMENT) return null;
  if (!moduleId || !lessonId) return null;
  return { moduleId, lessonId };
}

/**
 * Builds a `GuidedReturnLessonValidator` bound to a specific module set. The
 * factory keeps the check pure and injectable for tests; the default export
 * binds it to the real `courseModules`.
 */
export function validateGuidedLessonReturnWith(
  modules: readonly CourseModule[],
): GuidedReturnLessonValidator {
  return (target: RouteTarget): GuidedReturnLessonCheck => {
    const ids = lessonIdsFromPathname(target.pathname);
    if (!ids) return { kind: "mismatch" };

    const resolution = resolveLessonRoute(ids.moduleId, ids.lessonId, modules);
    if (resolution.kind === "match") return { kind: "ok" };
    if (resolution.kind === "redirect") {
      return {
        kind: "canonical",
        target: {
          pathname: lessonPath(resolution.courseModule.id, resolution.lesson.id),
          search: target.search,
          sectionId: target.sectionId,
        },
      };
    }
    return { kind: "mismatch" };
  };
}

/** The real-data validator every guided tool page passes to `readGuidedReturn`. */
export const validateGuidedLessonReturn: GuidedReturnLessonValidator =
  validateGuidedLessonReturnWith(courseModules);
