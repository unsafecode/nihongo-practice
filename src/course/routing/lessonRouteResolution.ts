/**
 * Pure module+lesson route resolution for course lesson URLs
 * (`/percorso/:moduleId/:lessonId`).
 *
 * `LessonPage` must never accept a lesson by `lessonId` alone. A URL resolves
 * one of three ways:
 *
 * - **match** — `lessonId` is a current lesson and `moduleId` is exactly its
 *   real module. This stays strict: a current lesson paired with the wrong (or
 *   an unknown) module is invalid, never silently rendered under the wrong
 *   module.
 * - **redirect** — `lessonId` is a *retired* lesson id from the published v2.1
 *   course (`LEGACY_LESSON_ALIASES`). The complete A0→A1 rebuild renamed every
 *   lesson and removed several modules, so an old bookmarked URL such as
 *   `/percorso/sentence-map/sentence-order` must still land the learner on the
 *   closest current lesson rather than a dead route. Because the old module id
 *   may no longer exist, a legacy lesson id resolves to its canonical current
 *   module/lesson regardless of the URL's module segment — the alias itself
 *   uniquely names the destination.
 * - **invalid** — anything else (unknown lesson, or a current lesson under the
 *   wrong module) — the caller falls back to the existing invalid-route
 *   behavior (see routing/routes.tsx's `InvalidRoute`).
 *
 * Aliases are declared explicitly here, never inferred from localized titles
 * (spec §9.2). Stored progress is unaffected: an unknown retired id migrates to
 * an orphan (progress.ts), while the route layer owns the navigation aliasing.
 */

import type { CourseModule, Lesson, ModuleId } from "../data/types";

/**
 * One retired v2.1 lesson id and the current lesson it now maps to.
 * `legacyModuleId` records the module that published it (documentation +
 * tests); resolution keys on the globally-unique `legacyLessonId` so every
 * historical URL form is preserved even when the old module id is gone.
 */
export interface LegacyLessonAlias {
  readonly legacyModuleId: string;
  readonly legacyLessonId: string;
  readonly moduleId: ModuleId;
  readonly lessonId: string;
  /**
   * True when the destination lesson absorbed the retired lesson's content
   * rather than merely being renamed (Phase 2 Task 6): today this is only
   * `sounds-5`, whose katakana breadth `sounds-4` now covers (see
   * `catalog/module01Sounds.ts`'s doc comment). The redirect still lands on a
   * real current lesson either way, but the caller shows a distinct,
   * informational "content moved here" notice for a consolidation instead of
   * the generic legacy-module notice, since no module actually changed.
   */
  readonly consolidated?: boolean;
}

/**
 * Every published v2.1 lesson id retired by the complete A0→A1 rebuild, mapped
 * to the closest current lesson. Exhaustive and explicit: adding or removing a
 * published lesson id requires editing this list (and its tests), so a route
 * can never silently break.
 */
export const LEGACY_LESSON_ALIASES: readonly LegacyLessonAlias[] = [
  { legacyModuleId: "sounds", legacyLessonId: "sounds-core", moduleId: "sounds", lessonId: "sounds-1" },
  { legacyModuleId: "sounds", legacyLessonId: "sounds-special", moduleId: "sounds", lessonId: "sounds-2" },
  // The A1 release retired the fifth sounds lesson and consolidated its
  // katakana breadth into `sounds-4` (see `catalog/module01Sounds.ts`) rather
  // than renaming it — a genuine content merge, not a like-for-like rename.
  { legacyModuleId: "sounds", legacyLessonId: "sounds-5", moduleId: "sounds", lessonId: "sounds-4", consolidated: true },
  { legacyModuleId: "sentence-map", legacyLessonId: "sentence-order", moduleId: "introductions", lessonId: "introductions-1" },
  { legacyModuleId: "sentence-map", legacyLessonId: "sentence-omission", moduleId: "introductions", lessonId: "introductions-2" },
  { legacyModuleId: "actions", legacyLessonId: "actions-object", moduleId: "actions", lessonId: "actions-1" },
  { legacyModuleId: "actions", legacyLessonId: "actions-masu", moduleId: "actions", lessonId: "actions-2" },
  { legacyModuleId: "time", legacyLessonId: "time-past", moduleId: "past-negative", lessonId: "past-negative-1" },
  { legacyModuleId: "time", legacyLessonId: "time-negative", moduleId: "past-negative", lessonId: "past-negative-2" },
  { legacyModuleId: "places", legacyLessonId: "places-action", moduleId: "places", lessonId: "places-1" },
  { legacyModuleId: "places", legacyLessonId: "places-movement", moduleId: "places", lessonId: "places-2" },
  { legacyModuleId: "people", legacyLessonId: "people-particles", moduleId: "people", lessonId: "people-1" },
  { legacyModuleId: "people", legacyLessonId: "people-desire", moduleId: "people", lessonId: "people-2" },
  { legacyModuleId: "questions-existence", legacyLessonId: "travel-questions", moduleId: "essential-questions", lessonId: "essential-questions-1" },
  { legacyModuleId: "questions-existence", legacyLessonId: "travel-existence", moduleId: "existence-needs", lessonId: "existence-needs-1" },
  { legacyModuleId: "questions-existence", legacyLessonId: "traps-particles", moduleId: "existence-needs", lessonId: "existence-needs-2" },
  // Phase 2 Task 6 renumbered the named v3 capstones to `capstones-1..4`
  // (see progress.ts's `A1_V3_LESSON_ID_MAP` doc comment); this legacy v2.1
  // alias's destination follows that rename so the redirect still lands on
  // a real current lesson instead of a retired id.
  { legacyModuleId: "capstone", legacyLessonId: "traps-verbs", moduleId: "capstones", lessonId: "capstones-3" },
];

const legacyAliasByLessonId = new Map<string, LegacyLessonAlias>(
  LEGACY_LESSON_ALIASES.map((alias) => [alias.legacyLessonId, alias]),
);

export type LessonRouteResolution =
  | { kind: "match"; courseModule: CourseModule; lesson: Lesson }
  | {
      kind: "redirect";
      courseModule: CourseModule;
      lesson: Lesson;
      moduleChanged: boolean;
      /** True when the alias is a content consolidation (see `LegacyLessonAlias.consolidated`). */
      consolidated: boolean;
    }
  | { kind: "invalid" };

const INVALID_RESOLUTION: LessonRouteResolution = { kind: "invalid" };

interface LessonEntry {
  courseModule: CourseModule;
  lesson: Lesson;
}

function findLessonEntry(
  lessonId: string,
  modules: readonly CourseModule[],
): LessonEntry | null {
  for (const courseModule of modules) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) return { courseModule, lesson };
  }
  return null;
}

/**
 * Resolves a `(moduleId, lessonId)` URL pair against `modules`.
 *
 * - `"match"`: `moduleId` is `lessonId`'s real current module.
 * - `"redirect"`: `lessonId` is a retired v2.1 lesson id; the caller should
 *   replace-redirect to `lessonPath(courseModule.id, lesson.id)` for the
 *   canonical current lesson the alias names. `moduleChanged` distinguishes
 *   aliases that moved to another module from same-module renames.
 * - `"invalid"`: unknown lesson, or a current lesson paired with the wrong
 *   module — the caller falls back to the invalid-route behavior.
 */
export function resolveLessonRoute(
  moduleId: string | undefined,
  lessonId: string | undefined,
  modules: readonly CourseModule[],
): LessonRouteResolution {
  if (!moduleId || !lessonId) return INVALID_RESOLUTION;

  const entry = findLessonEntry(lessonId, modules);
  if (entry) {
    return moduleId === entry.courseModule.id
      ? { kind: "match", ...entry }
      : INVALID_RESOLUTION;
  }

  // Not a current lesson: a retired v2.1 lesson id redirects to its canonical
  // current lesson regardless of the (possibly removed) URL module segment.
  const alias = legacyAliasByLessonId.get(lessonId);
  if (alias) {
    const target = findLessonEntry(alias.lessonId, modules);
    if (target && target.courseModule.id === alias.moduleId) {
      return {
        kind: "redirect",
        ...target,
        moduleChanged: alias.legacyModuleId !== target.courseModule.id,
        consolidated: alias.consolidated ?? false,
      };
    }
  }

  return INVALID_RESOLUTION;
}

/** Router `location.state` shape carried on a one-time legacy-module redirect. */
export interface LegacyModuleRedirectState {
  legacyModuleRedirect: true;
}

/** Shared state value the redirect navigation attaches; never persisted. */
export const LEGACY_MODULE_REDIRECT_STATE: LegacyModuleRedirectState = {
  legacyModuleRedirect: true,
};

/** Narrows an arbitrary `location.state` value to the redirect marker. */
export function isLegacyModuleRedirectState(
  state: unknown,
): state is LegacyModuleRedirectState {
  return (
    typeof state === "object" &&
    state !== null &&
    "legacyModuleRedirect" in state &&
    (state as { legacyModuleRedirect?: unknown }).legacyModuleRedirect ===
      true
  );
}

/**
 * Router `location.state` shape carried on a one-time content-consolidation
 * redirect (`sounds-5` → `sounds-4`). Distinct from
 * {@link LegacyModuleRedirectState}: the module never changed here, so the
 * generic "updated module link" notice would be misleading — the learner
 * needs to know the old lesson's content now lives inside this one, not that
 * a link moved.
 */
export interface LegacyConsolidatedRedirectState {
  legacyLessonConsolidated: true;
}

/** Shared state value the consolidation redirect navigation attaches; never persisted. */
export const LEGACY_CONSOLIDATED_REDIRECT_STATE: LegacyConsolidatedRedirectState =
  {
    legacyLessonConsolidated: true,
  };

/** Narrows an arbitrary `location.state` value to the consolidation marker. */
export function isLegacyConsolidatedRedirectState(
  state: unknown,
): state is LegacyConsolidatedRedirectState {
  return (
    typeof state === "object" &&
    state !== null &&
    "legacyLessonConsolidated" in state &&
    (state as { legacyLessonConsolidated?: unknown })
      .legacyLessonConsolidated === true
  );
}
