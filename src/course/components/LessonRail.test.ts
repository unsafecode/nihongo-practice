import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import {
  A1_LESSON_SECTION_IDS,
  A2_LESSON_SECTION_IDS,
  type LessonSectionId,
} from "../../routing/lessonSections";
import type { CourseLevelId } from "../levels/types";
import { it as itCopy } from "../i18n/it";
import { LessonRail } from "./LessonRail";

function render(
  level: CourseLevelId,
  activeSectionId: LessonSectionId,
): string {
  const sixSection = level !== "a2";
  const sections = sixSection ? A1_LESSON_SECTION_IDS : A2_LESSON_SECTION_IDS;
  const moduleId =
    level === "a0" ? "sounds" : level === "a1" ? "introductions" : "sequencing-ongoing";
  const lessonId =
    level === "a0" ? "sounds-1" : level === "a1" ? "introductions-1" : "sequencing-ongoing-3";
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(LessonRail, {
          level,
          moduleId,
          lessonId,
          sections,
          activeSectionId,
        }),
      ),
    ),
  );
}

describe("LessonRail", () => {
  it("uses the six localized A1 steps and marks the active step", () => {
    const html = render("a1", "grammar");
    expect(html).toContain(itCopy.lesson.railLabel);
    for (const sectionId of A1_LESSON_SECTION_IDS) {
      expect(html).toContain(itCopy.a1Lesson.sections[sectionId]);
    }
    const active = html.match(/<a[^>]*aria-current="step"[^>]*>[\s\S]*?<\/a>/);
    expect(active).not.toBeNull();
    expect(active![0]).toContain(itCopy.a1Lesson.sections.grammar);
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(6);
  });

  it("looks up an A2 module outside the A1-only courseModules export", () => {
    const html = render("a2", "comparison");
    for (const sectionId of A2_LESSON_SECTION_IDS) {
      expect(html).toContain(itCopy.lesson.sections[sectionId]);
    }
    expect(html).toContain("<svg");
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(4);
    expect(html).toContain(
      "/percorso/sequencing-ongoing/sequencing-ongoing-3#comparison",
    );
  });

  it("uses the six localized Base steps (their own baseLesson copy, not A1's)", () => {
    const html = render("a0", "vocabulary");
    for (const sectionId of A1_LESSON_SECTION_IDS) {
      expect(html).toContain(itCopy.baseLesson.sections[sectionId]);
    }
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(6);
    const active = html.match(/<a[^>]*aria-current="step"[^>]*>[\s\S]*?<\/a>/);
    expect(active).not.toBeNull();
    expect(active![0]).toContain(itCopy.baseLesson.sections.vocabulary);
    expect(html).toContain("/percorso/sounds/sounds-1#vocabulary");
  });
});

