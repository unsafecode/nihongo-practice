/**
 * The Syllabary's own validated deep-link target: a stable group id plus the
 * pure helpers that map it to DOM ids, parse/build guided links, and decide
 * (without any DOM) how a targeted group should be scrolled and focused
 * (design spec §5.8, §6.5-6.7, §8.3). The internal return route is *not*
 * parsed here — it is delegated to the shared `guidedToolLink` contract, so
 * there is a single return-validation path across every tool.
 */

import {
  buildGuidedToolHref,
  type GuidedToolHref,
} from "../routing/guidedToolLink";
import { routePaths } from "../routing/routePaths";
import type { CreateRouteTargetInput } from "../routing/routeTarget";

/**
 * The four authored Syllabary groups, in on-page order. `special-notes`
 * gathers the long-vowel / small-tsu / punctuation reading notes shown after
 * the yōon chart.
 */
export const SYLLABARY_GROUP_IDS = [
  "gojuon",
  "dakuten",
  "yoon",
  "special-notes",
] as const;

export type SyllabaryGroupId = (typeof SYLLABARY_GROUP_IDS)[number];

/** The single query parameter carrying the requested Syllabary group. */
export const SYLLABARY_GROUP_PARAM = "group";

/** Narrows an arbitrary string to a known group id. */
export function isSyllabaryGroupId(value: string): value is SyllabaryGroupId {
  return (SYLLABARY_GROUP_IDS as readonly string[]).includes(value);
}

/** Stable DOM id for a group's scroll landmark, e.g. `syllabary-group-yoon`. */
export function syllabaryGroupDomId(id: SyllabaryGroupId): string {
  return `syllabary-group-${id}`;
}

/** Stable id for a group's heading, so the landmark can be `aria-labelledby` it. */
export function syllabaryGroupHeadingId(id: SyllabaryGroupId): string {
  return `${syllabaryGroupDomId(id)}-heading`;
}

/**
 * The typed outcome of reading the requested group from a query string.
 * A duplicated `group` key is rejected outright rather than trusting one of
 * two conflicting values (mirroring the shared return contract).
 */
export type SyllabaryGroupSelection =
  | { readonly status: "absent" }
  | { readonly status: "valid"; readonly group: SyllabaryGroupId }
  | {
      readonly status: "invalid";
      readonly reason: "unknown-group" | "duplicate";
    };

/** Parses the requested group, if any, from a tool page's query string. */
export function parseSyllabaryGroup(
  params: URLSearchParams,
): SyllabaryGroupSelection {
  const all = params.getAll(SYLLABARY_GROUP_PARAM);
  if (all.length > 1) return { status: "invalid", reason: "duplicate" };
  const raw = all.length === 1 ? all[0] : "";
  if (raw === "") return { status: "absent" };
  if (!isSyllabaryGroupId(raw)) {
    return { status: "invalid", reason: "unknown-group" };
  }
  return { status: "valid", group: raw };
}

/**
 * Builds a guided Syllabary deep link for a group plus a structured lesson
 * return. Return validation is delegated to the shared contract, so an
 * invalid return omits `from` (never a wrong one) while the group is kept.
 */
export function buildSyllabaryDeepLink(
  group: SyllabaryGroupId,
  returnInput: CreateRouteTargetInput,
): GuidedToolHref {
  const params = new URLSearchParams();
  params.set(SYLLABARY_GROUP_PARAM, group);
  return buildGuidedToolHref(routePaths.syllabary, params, returnInput);
}

/**
 * The pure plan for scrolling to a requested group. Only a valid selection
 * produces a `target`; absent/invalid selections are `none`, so the full
 * chart simply renders at the top with no scroll side effect.
 */
export type SyllabaryScrollPlan =
  | { readonly kind: "none" }
  | {
      readonly kind: "target";
      readonly group: SyllabaryGroupId;
      readonly domId: string;
      readonly headingId: string;
    };

/** Decides, without a DOM, whether/where a group deep link should scroll. */
export function planSyllabaryScroll(
  selection: SyllabaryGroupSelection,
): SyllabaryScrollPlan {
  if (selection.status !== "valid") return { kind: "none" };
  return {
    kind: "target",
    group: selection.group,
    domId: syllabaryGroupDomId(selection.group),
    headingId: syllabaryGroupHeadingId(selection.group),
  };
}

/**
 * Resolves the final, testable outcome of executing a scroll plan. A target
 * plan whose landmark could not be found reports `target-missing` rather than
 * a success-shaped no-op, giving the component a clear failure path.
 */
export type SyllabaryScrollOutcome =
  | { readonly status: "idle" }
  | { readonly status: "focused"; readonly domId: string }
  | { readonly status: "target-missing"; readonly domId: string };

export function resolveSyllabaryScrollOutcome(
  plan: SyllabaryScrollPlan,
  targetElementExists: boolean,
): SyllabaryScrollOutcome {
  if (plan.kind === "none") return { status: "idle" };
  return targetElementExists
    ? { status: "focused", domId: plan.domId }
    : { status: "target-missing", domId: plan.domId };
}

/**
 * The minimal frame-scheduling surface the component injects (real
 * `requestAnimationFrame`/`cancelAnimationFrame`), kept abstract so the
 * schedule/cancel lifecycle is unit-testable without a DOM.
 */
export interface FrameScheduler {
  request(callback: () => void): number;
  cancel(handle: number): void;
}

/**
 * Schedules `run` on the next frame (so a deep-linked group is scrolled only
 * after layout has committed) and returns a cleanup that cancels the pending
 * frame if it has not fired yet. Cancelling stale work on re-navigation
 * prevents a scroll landing on an outdated group; a cleanup called after the
 * frame already fired is a harmless no-op.
 */
export function scheduleGroupScroll(
  scheduler: FrameScheduler,
  run: () => void,
): () => void {
  let handle: number | null = scheduler.request(() => {
    handle = null;
    run();
  });
  return () => {
    if (handle !== null) {
      scheduler.cancel(handle);
      handle = null;
    }
  };
}
