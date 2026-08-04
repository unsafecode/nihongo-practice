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
import { it as itCopy } from "../i18n/it";
import { LessonRail } from "./LessonRail";

function render(
  level: "a1" | "a2",
  activeSectionId: LessonSectionId,
): string {
  const a1 = level === "a1";
  const sections = a1 ? A1_LESSON_SECTION_IDS : A2_LESSON_SECTION_IDS;
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(LessonRail, {
          level,
          moduleId: a1 ? "sounds" : "sequencing-ongoing",
          lessonId: a1 ? "sounds-1" : "sequencing-ongoing-3",
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
});
