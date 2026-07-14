import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { it as itCopy } from "../i18n/it";
import { LessonRail } from "./LessonRail";

function render(activeSectionId: (typeof LESSON_SECTION_IDS)[number]): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(LessonRail, {
          moduleId: "sounds",
          lessonId: "sounds-core",
          sections: LESSON_SECTION_IDS,
          activeSectionId,
        }),
      ),
    ),
  );
}

describe("LessonRail", () => {
  it("labels the rail landmark and lists all four section steps", () => {
    const html = render("rule");
    expect(html).toContain(itCopy.lesson.railLabel);
    for (const sectionId of LESSON_SECTION_IDS) {
      expect(html).toContain(itCopy.lesson.sections[sectionId]);
    }
  });

  it("marks the active section with aria-current=step", () => {
    const html = render("explore");
    const active = html.match(/<a[^>]*aria-current="step"[^>]*>[\s\S]*?<\/a>/);
    expect(active).not.toBeNull();
    expect(active![0]).toContain(itCopy.lesson.sections.explore);
  });

  it("links every step to the current lesson path with its section hash", () => {
    const html = render("rule");
    for (const sectionId of LESSON_SECTION_IDS) {
      expect(html).toContain(`/percorso/sounds/sounds-core#${sectionId}`);
    }
  });

  it("shows the module's semantic icon", () => {
    expect(render("rule")).toContain("<svg");
  });

  it("renders a mobile context bar alongside the desktop rail", () => {
    const html = render("comparison");
    expect(html).toContain("lesson-rail");
    expect(html).toContain("lesson-rail-mobile");
  });
});
