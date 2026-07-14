/**
 * Pure router-safe helper for building lesson section links (design spec
 * §5.4 / Task D.1). The lesson rail and footer must link to a section of the
 * *current* lesson without leaving the lesson route, and those links must be
 * exactly what `RouteScrollManager`/`planRouteScroll` parse back into a
 * validated anchor. Rather than hand-assembling `pathname#section` strings in
 * components, everything goes through the shared `createRouteTarget` /
 * `serializeRouteTarget` contract so a link and the scroll manager can never
 * disagree, and an unrecognized path yields a safe fallback instead of a
 * broken or unsafe href.
 */

import {
  lessonSectionAnchorId,
  type LessonSectionId,
} from "./lessonSections";
import { lessonPath } from "./routePaths";
import { createRouteTarget, serializeRouteTarget } from "./routeTarget";

export interface LessonSectionTarget {
  /** Router `to` string, e.g. `/percorso/sounds/sounds-core#explore`. */
  readonly to: string;
  /** DOM id the link resolves to, e.g. `lesson-section-explore`. */
  readonly anchorId: string;
  /** Whether the composed target is a recognized course lesson section. */
  readonly valid: boolean;
}

export function lessonSectionTarget(
  moduleId: string,
  lessonId: string,
  sectionId: LessonSectionId,
): LessonSectionTarget {
  const result = createRouteTarget({
    pathname: lessonPath(moduleId, lessonId),
    sectionId,
  });
  return {
    to: serializeRouteTarget(result.target),
    anchorId: lessonSectionAnchorId(sectionId),
    valid: result.valid,
  };
}
