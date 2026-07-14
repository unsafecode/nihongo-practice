/**
 * Pure scroll-plan/outcome helpers for RouteScrollManager. All browser/DOM
 * lifecycle work (requestAnimationFrame scheduling, actual scrollTo/
 * scrollIntoView calls, history.scrollRestoration) stays in the thin React
 * component; the decisions themselves are made here so they are directly
 * unit-testable without a DOM environment (design spec §7.1).
 */

import { lessonSectionAnchorId, type LessonSectionId } from "./lessonSections";
import { parseRouteTarget } from "./routeTarget";

export interface RouteLocationLike {
  pathname: string;
  search: string;
  hash: string;
}

export type ScrollPlan =
  | { kind: "reset" }
  | { kind: "anchor"; sectionId: LessonSectionId; anchorId: string };

/**
 * Decides how a route location transition should affect scroll position.
 * Only a validated lesson-section anchor produces an "anchor" plan; every
 * other case — including invalid/unrecognized anchors and ordinary route
 * changes — deterministically resets to the top, matching design spec
 * §7.1 rules 1 and 4 (push/replace/back/forward all reset unless a
 * validated anchor is requested).
 */
export function planRouteScroll(location: RouteLocationLike): ScrollPlan {
  const raw = `${location.pathname}${location.search}${location.hash}`;
  const result = parseRouteTarget(raw);
  if (result.valid && result.target.sectionId) {
    const sectionId = result.target.sectionId;
    return {
      kind: "anchor",
      sectionId,
      anchorId: lessonSectionAnchorId(sectionId),
    };
  }
  return { kind: "reset" };
}

export type ScrollOutcome =
  | { status: "reset" }
  | { status: "anchored"; anchorId: string }
  | { status: "anchor-missing"; anchorId: string };

/**
 * Resolves the final, testable outcome of executing a scroll plan. An
 * anchor plan whose element could not be found in the DOM reports
 * "anchor-missing" rather than a success-shaped no-op, giving later
 * components (e.g. a styled Notice) a clear failure path to react to.
 */
export function resolveScrollOutcome(
  plan: ScrollPlan,
  anchorElementExists: boolean,
): ScrollOutcome {
  if (plan.kind === "reset") return { status: "reset" };
  return anchorElementExists
    ? { status: "anchored", anchorId: plan.anchorId }
    : { status: "anchor-missing", anchorId: plan.anchorId };
}

/**
 * Reduced-motion users must never receive animated scrolling (design spec
 * §7.1 rule 5). `Element.scrollIntoView({ behavior: "smooth" })` ignores
 * the page's `scroll-behavior` CSS when a behavior is explicitly passed,
 * so the preference must be resolved explicitly rather than left to CSS.
 */
export function resolveScrollBehavior(
  prefersReducedMotion: boolean,
): "auto" | "smooth" {
  return prefersReducedMotion ? "auto" : "smooth";
}
