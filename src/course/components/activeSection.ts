import type { LessonSectionId } from "../../routing/lessonSections";

/** A lesson section's id paired with its resolved scroll offset (px). */
export interface SectionOffset {
  readonly id: LessonSectionId;
  readonly top: number;
}

/**
 * Pure scrollspy selector (design spec §5.4 / Task D.2). Chooses the last
 * section whose top is at or above `scrollPosition`, so the choice is
 * deterministic exactly at a section boundary (inclusive `<=`) and defaults to
 * the first section when scrolled above all of them. Kept free of the DOM so it
 * is unit-testable in node; the hook feeds it measured offsets and re-runs it
 * on scroll/resize/observer changes.
 */
export function pickActiveSection(
  sections: readonly SectionOffset[],
  scrollPosition: number,
): LessonSectionId {
  if (sections.length === 0) {
    throw new Error("pickActiveSection requires at least one section");
  }
  let active = sections[0].id;
  for (const section of sections) {
    if (section.top <= scrollPosition) {
      active = section.id;
    }
  }
  return active;
}
