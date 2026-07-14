/**
 * Pure, locale-independent route/return-target helpers.
 *
 * These helpers recognize only the application's own internal routes and
 * turn a raw string (e.g. a query value, a stored return path, or a link
 * built for a guided tool) into a validated, safe `RouteTarget`. They never
 * throw and never silently accept an unsafe or unrecognized value: an
 * invalid input always produces `{ valid: false, reason, target }`, where
 * `target` is a safe fallback a caller can navigate to immediately while a
 * component surfaces `reason` as a styled Notice.
 *
 * A `RouteTarget` optionally carries a `LessonSectionId` anchor. Anchors are
 * only meaningful (and only accepted) on course lesson routes, matching the
 * lesson contract in the design spec (§4.3, §6.1, §7.1-7.2).
 *
 * Encoding choice: the section anchor rides in the string's own `#fragment`
 * (e.g. `/percorso/sounds/sounds-core?ref=lab#explore`). Under HashRouter,
 * react-router already parses everything after the router's own leading
 * `#` as a nested pathname/search/hash triple (see react-router's
 * `parsePath`), so this fragment survives as `location.hash` and is never
 * consumed by the router itself. This keeps query and hash information
 * intact end to end, and keeps a plain pathname (no `?`, no `#`) parsing
 * exactly like it always has for existing Lab/Syllabary `from` values.
 */

import { isLessonSectionId, type LessonSectionId } from "./lessonSections";
import { routePaths } from "./routePaths";

export interface RouteTarget {
  pathname: string;
  /** "" or a string starting with "?". */
  search: string;
  sectionId: LessonSectionId | null;
}

export type RouteTargetInvalidReason =
  | "unsafe-path"
  | "unknown-route"
  | "malformed-lesson-path"
  | "section-not-allowed"
  | "invalid-section";

export interface RouteTargetResult {
  valid: boolean;
  reason: RouteTargetInvalidReason | null;
  /** Always a safe, navigable target: the parsed value when valid, or the fallback when not. */
  target: RouteTarget;
}

export interface CreateRouteTargetInput {
  pathname: string;
  search?: string;
  sectionId?: LessonSectionId | null;
}

/** Safe fallback target used whenever validation fails. */
export const FALLBACK_ROUTE_TARGET: RouteTarget = {
  pathname: routePaths.course,
  search: "",
  sectionId: null,
};

const STATIC_ROUTE_PATHNAMES: readonly string[] = [
  routePaths.course,
  routePaths.practice,
  routePaths.lab,
  routePaths.syllabary,
  routePaths.phrasebook,
];

const COURSE_LESSON_PATTERN = /^\/percorso\/[a-z0-9-]+\/[a-z0-9-]+$/;
const COURSE_LESSON_PREFIX = "/percorso/";

const CONTROL_CHAR_PATTERN = /[\x00-\x1f]/;

export function isCourseLessonPathname(pathname: string): boolean {
  return COURSE_LESSON_PATTERN.test(pathname);
}

export function isKnownRoutePathname(pathname: string): boolean {
  return (
    STATIC_ROUTE_PATHNAMES.includes(pathname) ||
    isCourseLessonPathname(pathname)
  );
}

function looksLikeCourseLessonPathname(pathname: string): boolean {
  return pathname.startsWith(COURSE_LESSON_PREFIX);
}

/**
 * Rejects absolute URLs, bare protocols, protocol-relative paths,
 * backslash bypasses, and percent-encoded variants of any of the above.
 * Only a plain, single-leading-slash internal path is considered safe.
 */
function isSafeInternalPathname(raw: string): boolean {
  if (typeof raw !== "string" || raw.length === 0) return false;
  if (!raw.startsWith("/")) return false; // rejects bare protocols, relative paths, absolute URLs
  if (raw.startsWith("//")) return false; // protocol-relative
  if (raw.includes("\\")) return false; // raw backslash bypass
  if (CONTROL_CHAR_PATTERN.test(raw)) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return false; // malformed percent-encoding
  }
  if (decoded.startsWith("//")) return false; // encoded protocol-relative
  if (decoded.includes("\\")) return false; // encoded backslash
  if (CONTROL_CHAR_PATTERN.test(decoded)) return false;

  return true;
}

function invalidResult(reason: RouteTargetInvalidReason): RouteTargetResult {
  return { valid: false, reason, target: FALLBACK_ROUTE_TARGET };
}

function validResult(target: RouteTarget): RouteTargetResult {
  return { valid: true, reason: null, target };
}

function routeReasonFor(pathname: string): RouteTargetInvalidReason {
  return looksLikeCourseLessonPathname(pathname)
    ? "malformed-lesson-path"
    : "unknown-route";
}

/** Splits a raw string the same way react-router's HashRouter will: hash first, then search. */
function splitRaw(raw: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  let rest = raw;
  let hash = "";
  const hashIndex = rest.indexOf("#");
  if (hashIndex >= 0) {
    hash = rest.slice(hashIndex);
    rest = rest.slice(0, hashIndex);
  }
  let search = "";
  const searchIndex = rest.indexOf("?");
  if (searchIndex >= 0) {
    search = rest.slice(searchIndex);
    rest = rest.slice(0, searchIndex);
  }
  return { pathname: rest, search, hash };
}

/**
 * Parses a raw route/return string from an external boundary (a stored
 * value, a query parameter, a crafted link) into a validated `RouteTarget`.
 * Never throws; always returns a safe, navigable `target`.
 */
export function parseRouteTarget(raw: string): RouteTargetResult {
  if (typeof raw !== "string" || raw.length === 0) {
    return invalidResult("unsafe-path");
  }

  const { pathname, search, hash } = splitRaw(raw);

  if (!isSafeInternalPathname(pathname)) return invalidResult("unsafe-path");
  if (!isKnownRoutePathname(pathname)) {
    return invalidResult(routeReasonFor(pathname));
  }

  if (hash === "" || hash === "#") {
    return validResult({ pathname, search, sectionId: null });
  }

  const rawSectionId = hash.slice(1);
  if (!isCourseLessonPathname(pathname)) {
    return invalidResult("section-not-allowed");
  }
  if (!isLessonSectionId(rawSectionId)) {
    return invalidResult("invalid-section");
  }

  return validResult({ pathname, search, sectionId: rawSectionId });
}

/**
 * Builds a validated `RouteTarget` from structured input (as opposed to a
 * raw string boundary value). Used when application code constructs a
 * return target programmatically, e.g. a guided tool's `returnTarget`.
 */
export function createRouteTarget(
  input: CreateRouteTargetInput,
): RouteTargetResult {
  const search = input.search ?? "";
  const sectionId = input.sectionId ?? null;

  if (!isSafeInternalPathname(input.pathname)) {
    return invalidResult("unsafe-path");
  }
  if (!isKnownRoutePathname(input.pathname)) {
    return invalidResult(routeReasonFor(input.pathname));
  }
  if (sectionId !== null) {
    if (!isCourseLessonPathname(input.pathname)) {
      return invalidResult("section-not-allowed");
    }
    if (!isLessonSectionId(sectionId)) {
      return invalidResult("invalid-section");
    }
  }

  return validResult({ pathname: input.pathname, search, sectionId });
}

/**
 * Serializes a validated `RouteTarget` back into a string suitable for a
 * router `to` value. A target with no search and no section serializes to
 * a plain pathname, identical to existing Lab/Syllabary `from` values.
 */
export function serializeRouteTarget(target: RouteTarget): string {
  const search = target.search
    ? target.search.startsWith("?")
      ? target.search
      : `?${target.search}`
    : "";
  const hash = target.sectionId ? `#${target.sectionId}` : "";
  return `${target.pathname}${search}${hash}`;
}
