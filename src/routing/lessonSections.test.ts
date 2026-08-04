import { describe, expect, it } from "vitest";
import * as sectionContract from "./lessonSections";
import {
  isLessonSectionId,
  LESSON_SECTION_ANCHOR_CLASS,
  LESSON_SECTION_IDS,
  lessonSectionAnchorId,
} from "./lessonSections";

describe("LessonSectionId contract", () => {
  it("declares the A1 six-section and A2 four-section contracts independently", () => {
    const contract = sectionContract as unknown as {
      readonly A1_LESSON_SECTION_IDS: readonly string[];
      readonly A2_LESSON_SECTION_IDS: readonly string[];
    };

    expect(contract.A1_LESSON_SECTION_IDS).toEqual([
      "rule",
      "vocabulary",
      "grammar",
      "comparison",
      "explore",
      "recap",
    ]);
    expect(contract.A2_LESSON_SECTION_IDS).toEqual([
      "rule",
      "comparison",
      "explore",
      "recap",
    ]);
    // Existing route helpers still use the A1 alias until their callers can
    // choose a level-specific section list.
    expect(LESSON_SECTION_IDS).toEqual(contract.A1_LESSON_SECTION_IDS);
  });

  it("accepts every declared A1 or A2 section id", () => {
    const valid = [
      "rule",
      "vocabulary",
      "grammar",
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
    expect(lessonSectionAnchorId("vocabulary")).toBe(
      "lesson-section-vocabulary",
    );
    expect(lessonSectionAnchorId("grammar")).toBe("lesson-section-grammar");
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
