import { describe, expect, it } from "vitest";
import {
  isLessonSectionId,
  LESSON_SECTION_ANCHOR_CLASS,
  LESSON_SECTION_IDS,
  lessonSectionAnchorId,
  type LessonSectionId,
} from "./lessonSections";

describe("LessonSectionId contract", () => {
  it("declares exactly the four stable section ids in lesson order", () => {
    expect(LESSON_SECTION_IDS).toEqual([
      "rule",
      "comparison",
      "explore",
      "recap",
    ]);
  });

  it("accepts only the four declared section ids", () => {
    const valid: LessonSectionId[] = [
      "rule",
      "comparison",
      "explore",
      "recap",
    ];
    for (const id of valid) {
      expect(isLessonSectionId(id)).toBe(true);
    }
  });

  it("rejects unknown, empty, and non-string section ids", () => {
    expect(isLessonSectionId("recapitulate")).toBe(false);
    expect(isLessonSectionId("Rule")).toBe(false);
    expect(isLessonSectionId("")).toBe(false);
    expect(isLessonSectionId(null)).toBe(false);
    expect(isLessonSectionId(undefined)).toBe(false);
    expect(isLessonSectionId(42)).toBe(false);
  });

  it("builds a deterministic, collision-free DOM anchor id per section", () => {
    expect(lessonSectionAnchorId("rule")).toBe("lesson-section-rule");
    expect(lessonSectionAnchorId("comparison")).toBe(
      "lesson-section-comparison",
    );
    expect(lessonSectionAnchorId("explore")).toBe("lesson-section-explore");
    expect(lessonSectionAnchorId("recap")).toBe("lesson-section-recap");

    const ids = new Set(LESSON_SECTION_IDS.map(lessonSectionAnchorId));
    expect(ids.size).toBe(LESSON_SECTION_IDS.length);
  });

  it("exposes a shared anchor class name for the CSS scroll-offset contract", () => {
    expect(LESSON_SECTION_ANCHOR_CLASS).toBe("lesson-section-anchor");
  });
});
