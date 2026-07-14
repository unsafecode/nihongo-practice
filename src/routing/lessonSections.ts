/**
 * Stable lesson section contract shared by LessonRail (later task), the
 * pure route/return helpers in ./routeTarget, and RouteScrollManager.
 * Exactly four sections exist, in this fixed order, for every lesson:
 * rule -> comparison -> explore -> recap (see design spec §4.3 / §6.2).
 */

export type LessonSectionId = "rule" | "comparison" | "explore" | "recap";

export const LESSON_SECTION_IDS: readonly LessonSectionId[] = [
  "rule",
  "comparison",
  "explore",
  "recap",
];

const LESSON_SECTION_ID_SET: ReadonlySet<string> = new Set(
  LESSON_SECTION_IDS,
);

export function isLessonSectionId(value: unknown): value is LessonSectionId {
  return typeof value === "string" && LESSON_SECTION_ID_SET.has(value);
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
