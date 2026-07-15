import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  planRouteScroll,
  prefersReducedMotion,
  resolveScrollBehavior,
  resolveScrollOutcome,
  type ScrollOutcome,
} from "./scrollPlan";

export interface RouteScrollManagerProps {
  /**
   * Invoked with the outcome of the most recently executed scroll plan.
   * Lets later wiring (e.g. a styled Notice for a guided return whose
   * target section could not be found) react to a real failure path
   * instead of treating a missing anchor as a silent success.
   */
  onScrollOutcome?: (outcome: ScrollOutcome) => void;
}

/**
 * Resets scroll deterministically on every route location transition
 * (push/replace/back/forward), or scrolls to a validated lesson-section
 * anchor when the incoming location requests one (design spec §7.1).
 *
 * Mounted once at the router level (see ./routes) so it observes every
 * route. It never moves focus — a guided return may focus/label its
 * section in a later task — and it takes over scroll positioning for the
 * app's lifetime by disabling the browser's own scroll restoration on
 * mount and restoring whatever value was there before on cleanup.
 *
 * All decision-making (what to do, and what the outcome was) lives in the
 * pure helpers in ./scrollPlan so it is unit-testable without a DOM
 * environment; this component only schedules/cancels the actual browser
 * calls and cannot itself be exercised by the project's node-environment
 * Vitest setup.
 */
export function RouteScrollManager({
  onScrollOutcome,
}: RouteScrollManagerProps): null {
  const location = useLocation();
  const onScrollOutcomeRef = useRef(onScrollOutcome);
  onScrollOutcomeRef.current = onScrollOutcome;

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("scrollRestoration" in window.history)
    ) {
      return;
    }
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const plan = planRouteScroll(location);
    let cancelled = false;

    function report(outcome: ScrollOutcome) {
      if (!cancelled) onScrollOutcomeRef.current?.(outcome);
    }

    if (plan.kind === "reset") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      report(resolveScrollOutcome(plan, false));
      return () => {
        cancelled = true;
      };
    }

    // Wait a frame so the just-committed route's DOM — including its
    // lesson section anchors — has finished layout before measuring it.
    // Cancelling on cleanup avoids a stale scroll landing after a fast
    // follow-up transition supersedes this one.
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const element = document.getElementById(plan.anchorId);
      if (element) {
        element.scrollIntoView({
          behavior: resolveScrollBehavior(prefersReducedMotion()),
          block: "start",
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      report(resolveScrollOutcome(plan, Boolean(element)));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
    // react-router gives every location transition (push/replace/pop) a
    // fresh object with a unique `key`, so depending on `location` itself
    // reruns this effect exactly once per transition.
  }, [location]);

  return null;
}
