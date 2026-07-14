/**
 * The shared, typed deep-link contract used by every guided lesson→tool link
 * (design spec §5.4, §6.5-6.7, §7.1-7.2). A guided tool URL always carries:
 *
 *   - the tool's own validated preset/target (owned by each tool module:
 *     `lab/presets.ts`, `syllabary/groups.ts`), and
 *   - a single internal *return* route (`?from=...`) that brings the learner
 *     back to the exact lesson section they left from (normally `#explore`).
 *
 * The return route is validated exclusively through the Task 2 pure
 * `routeTarget` helpers — there is deliberately no second path parser here.
 * A raw `from` value from an external boundary (a crafted link, a stored
 * value) is turned into an explicit typed `GuidedReturn`: `absent`, `valid`
 * (with a safe serialized `href`), or `invalid` (with a reason and a safe
 * fallback). Callers surface `invalid` as a styled Notice and never silently
 * present a home-page fallback as if the intended return had succeeded.
 */

import { routePaths } from "./routePaths";
import {
  createRouteTarget,
  FALLBACK_ROUTE_TARGET,
  isCourseLessonPathname,
  parseRouteTarget,
  serializeRouteTarget,
  type CreateRouteTargetInput,
  type RouteTarget,
  type RouteTargetInvalidReason,
  type RouteTargetResult,
} from "./routeTarget";

/** The single query parameter carrying a guided tool's internal return route. */
export const GUIDED_RETURN_PARAM = "from";

/**
 * Why a raw return value was rejected: any generic route reason, a duplicated
 * key, or — added by the guided-return layer's course-association check — a
 * `/percorso/<module>/<lesson>` pair that is shape-valid but does not name a
 * real lesson-in-module association (`module-lesson-mismatch`).
 */
export type GuidedReturnInvalidReason =
  | RouteTargetInvalidReason
  | "duplicate"
  | "module-lesson-mismatch";

/**
 * The result of validating a parsed course-lesson return target against the
 * real course data. This keeps `routeTarget.ts` course-data-independent: the
 * generic parser proves shape and safety, and an *injected* validator proves
 * the module actually owns the lesson (Task 3 `resolveLessonRoute`).
 *
 * - `ok`: `moduleId` names the lesson's current module — keep the target.
 * - `canonical`: `moduleId` is a recognized legacy chapter that owned the
 *   lesson — replace the target with the canonical current-module target
 *   (preserving the already-validated section anchor) so the return never
 *   triggers a second legacy redirect.
 * - `mismatch`: any other pairing — surfaced as `module-lesson-mismatch`.
 */
export type GuidedReturnLessonCheck =
  | { readonly kind: "ok" }
  | { readonly kind: "canonical"; readonly target: RouteTarget }
  | { readonly kind: "mismatch" };

export type GuidedReturnLessonValidator = (
  target: RouteTarget,
) => GuidedReturnLessonCheck;

/**
 * The typed outcome of reading a guided return. `valid` carries both the
 * parsed `RouteTarget` and the canonical serialized `href` a caller can hand
 * to a router `to` (identical string on every round trip). `invalid` carries
 * the reason and the shared safe fallback target.
 */
export type GuidedReturn =
  | { readonly status: "absent" }
  | {
      readonly status: "valid";
      readonly target: RouteTarget;
      readonly href: string;
    }
  | {
      readonly status: "invalid";
      readonly reason: GuidedReturnInvalidReason;
      readonly fallback: RouteTarget;
    };

/** The href plus the validation result of a built guided-tool deep link. */
export interface GuidedToolHref {
  readonly href: string;
  readonly returnResult: RouteTargetResult;
}

/**
 * Parses one raw `from` value (already URL-decoded, e.g. from
 * `URLSearchParams.get`) into a typed `GuidedReturn`. `null`/empty is
 * `absent`; everything else is validated through `parseRouteTarget`, so a
 * plain legacy pathname (no `#section`) is accepted and returns the learner
 * to the lesson top, while any unsafe/unknown/bad-section value is `invalid`.
 *
 * `parseRouteTarget` proves only that the value is a safe, known-shape route;
 * a `/percorso/<module>/<lesson>` pair can be shape-valid yet name a lesson
 * the module does not own. When `validateLesson` is supplied, every parsed
 * course-lesson target is checked against the real course data: a mismatch
 * becomes `invalid: "module-lesson-mismatch"` (never a return Action), and a
 * recognized legacy chapter pair is canonicalized to its current module so
 * the return does not trigger a second redirect.
 */
export function parseGuidedReturnValue(
  raw: string | null,
  validateLesson?: GuidedReturnLessonValidator,
): GuidedReturn {
  if (raw === null || raw === "") return { status: "absent" };
  const result = parseRouteTarget(raw);
  if (!result.valid) {
    return {
      status: "invalid",
      reason: result.reason ?? "unsafe-path",
      fallback: result.target,
    };
  }
  let target = result.target;
  if (validateLesson && isCourseLessonPathname(target.pathname)) {
    const check = validateLesson(target);
    if (check.kind === "mismatch") {
      return {
        status: "invalid",
        reason: "module-lesson-mismatch",
        fallback: FALLBACK_ROUTE_TARGET,
      };
    }
    if (check.kind === "canonical") {
      target = check.target;
    }
  }
  return {
    status: "valid",
    target,
    href: serializeRouteTarget(target),
  };
}

/**
 * Reads the guided return from a tool page's query string. A duplicated
 * `from` key is rejected outright (`invalid: "duplicate"`) rather than
 * silently trusting one of two conflicting returns. An optional
 * `validateLesson` is forwarded to `parseGuidedReturnValue` so the tool page
 * can enforce the real lesson-in-module association.
 */
export function readGuidedReturn(
  params: URLSearchParams,
  validateLesson?: GuidedReturnLessonValidator,
): GuidedReturn {
  const all = params.getAll(GUIDED_RETURN_PARAM);
  if (all.length > 1) {
    return {
      status: "invalid",
      reason: "duplicate",
      fallback: { pathname: routePaths.course, search: "", sectionId: null },
    };
  }
  return parseGuidedReturnValue(
    all.length === 1 ? all[0] : null,
    validateLesson,
  );
}

/**
 * Assembles a guided-tool deep link from a tool path, the tool's own
 * validated params, and a structured lesson return. The return is validated
 * through `createRouteTarget`; when valid it is appended as the single
 * `from` param (URL-encoded by `URLSearchParams`). When the return is
 * invalid the link is emitted *without* a `from` — the tool opens with no
 * return rather than a wrong one disguised as the intended lesson — and the
 * reason is surfaced on `returnResult` for the caller to react to.
 */
export function buildGuidedToolHref(
  toolPath: string,
  toolParams: URLSearchParams,
  returnInput: CreateRouteTargetInput,
): GuidedToolHref {
  const params = new URLSearchParams(toolParams);
  params.delete(GUIDED_RETURN_PARAM);
  const returnResult = createRouteTarget(returnInput);
  if (returnResult.valid) {
    params.set(GUIDED_RETURN_PARAM, serializeRouteTarget(returnResult.target));
  }
  const query = params.toString();
  return { href: query ? `${toolPath}?${query}` : toolPath, returnResult };
}
