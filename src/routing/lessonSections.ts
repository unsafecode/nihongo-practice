/**
 * Stable lesson section contract shared by LessonRail (later task), the
 * pure route/return helpers in ./routeTarget, and RouteScrollManager.
 * A1 lessons use a vocabulary-first six-section learning flow. A2 keeps the
 * established four-section foundation flow. Route parsing accepts the union so
 * a published A1 deep link remains stable while the page selects the list that
 * belongs to its level.
 */

export type A1LessonSectionId =
  | "rule"
  | "vocabulary"
  | "grammar"
  | "comparison"
  | "explore"
  | "recap";

export type A2LessonSectionId = "rule" | "comparison" | "explore" | "recap";

export type LessonSectionId = A1LessonSectionId | A2LessonSectionId;

export const A1_LESSON_SECTION_IDS: readonly A1LessonSectionId[] = [
  "rule",
  "vocabulary",
  "grammar",
  "comparison",
  "explore",
  "recap",
];

export const A2_LESSON_SECTION_IDS: readonly A2LessonSectionId[] = [
  "rule",
  "comparison",
  "explore",
  "recap",
];

/** Backward-compatible A1 default for existing route helpers and callers. */
export const LESSON_SECTION_IDS = A1_LESSON_SECTION_IDS;

const LESSON_SECTION_ID_SET: ReadonlySet<string> = new Set(
  [...A1_LESSON_SECTION_IDS, ...A2_LESSON_SECTION_IDS],
);

export function isLessonSectionId(value: unknown): value is LessonSectionId {
  return typeof value === "string" && LESSON_SECTION_ID_SET.has(value);
}

export function isA1LessonSectionId(value: unknown): value is A1LessonSectionId {
  return (
    typeof value === "string" &&
    (A1_LESSON_SECTION_IDS as readonly string[]).includes(value)
  );
}

export function isA2LessonSectionId(value: unknown): value is A2LessonSectionId {
  return (
    typeof value === "string" &&
    (A2_LESSON_SECTION_IDS as readonly string[]).includes(value)
  );
}

/**
 * Deterministic DOM id for a lesson section's scroll anchor. Stable across
 * renders/locales so LessonRail scrollspy and guided-tool returns can both
 * target the same element without coordinating on markup structure.
 */
export function lessonSectionAnchorId(sectionId: LessonSectionId): string {
  return `lesson-section-${sectionId}`;
}

/**
 * Shared class applied to every section anchor element so the CSS offset
 * contract (scroll-margin-top driven by the shared header token) lives in
 * one place instead of being repeated per section id. See tokens.css.
 */
export const LESSON_SECTION_ANCHOR_CLASS = "lesson-section-anchor";
