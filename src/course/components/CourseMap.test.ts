import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { it as itCopy } from "../i18n/it";
import { courseModules } from "../data/course";
import { buildCourseMapModel } from "./courseMapModel";
import { CourseMap } from "./CourseMap";

function renderMap(
  visitedLessonIds: string[],
  lastVisitedLessonId: string | null,
): string {
  const model = buildCourseMapModel(courseModules, visitedLessonIds, lastVisitedLessonId);
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(LocaleProvider, null, createElement(CourseMap, { model })),
    ),
  );
}

import { escapeHtmlText } from "./renderTestUtils";

/** All sixteen real module ids, in their authored (approved) order. */
const allModuleIdsInOrder = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
];

/** Every lesson id in the first `count` modules, in course order. */
function lessonsInFirstModules(count: number): string[] {
  return courseModules
    .slice(0, count)
    .flatMap((module) => module.lessons.map((lesson) => lesson.id));
}

describe("CourseMap: flat module order", () => {
  it("renders as a single vertical path, not a card grid", () => {
    const html = renderMap([], null);
    expect(html).toContain('class="course-map"');
  });

  it("renders every module title in approved course order", () => {
    const html = renderMap([], null);
    const titleIndices = allModuleIdsInOrder.map((moduleId) => {
      const title = itCopy.modules[moduleId as keyof typeof itCopy.modules].title;
      const index = html.indexOf(
        `<h3 class="module-card__title">${escapeHtmlText(title)}</h3>`,
      );
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    });
    for (let i = 1; i < titleIndices.length; i += 1) {
      expect(titleIndices[i]).toBeGreaterThan(titleIndices[i - 1]);
    }
  });

  it("never uses stale chapter/completion/mastery wording", () => {
    const html = renderMap(["sounds-1"], "sounds-1");
    expect(html.toLowerCase()).not.toMatch(/chapter|capitolo/);
    expect(html.toLowerCase()).not.toMatch(/mastery|padronanza|completat|mastered/);
  });
});

describe("CourseMap: initial expansion follows the recommendation", () => {
  it("expands exactly the recommended module when nothing is visited", () => {
    const html = renderMap([], null);
    expect(html).toContain('id="module-lessons-sounds" class="module-card__lessons">');
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(15);
  });

  it("moves the expanded module as the recommendation advances through met prerequisites", () => {
    // Fully visit the first three modules; with no recognized
    // last-visited lesson, §7.3 rule 2 advances to the first unvisited lesson
    // whose prerequisites are met: the first lesson of "polite-verbs" (module 4).
    const html = renderMap(lessonsInFirstModules(3), null);
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(15);
    expect(html).toContain('id="module-lessons-polite-verbs" class="module-card__lessons">');
  });

  it("resumes and expands the module of a recognized last-visited lesson, even past earlier skipped lessons", () => {
    // Only the very first lesson and a much later one are visited; the
    // recognized last-visited lesson is the later "places-1".
    const html = renderMap(["sounds-1", "places-1"], "places-1");
    // §7.3 rule 1: resume "places", not an earlier unvisited module.
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(15);
    expect(html).toContain('id="module-lessons-places" class="module-card__lessons">');
  });
});

describe("CourseMap: all-visited fallback", () => {
  it("shows a localized revisit notice and expands the recognized current module when everything is visited", () => {
    const allLessonIds = courseModules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const html = renderMap(allLessonIds, "capstones-4");
    expect(html).toContain(escapeHtmlText(itCopy.courseMap.revisitTitle));
    expect(html).toContain(escapeHtmlText(itCopy.courseMap.revisitBody));
    expect(html).toContain('id="module-lessons-capstones" class="module-card__lessons">');
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(15);
  });

  it("does not show the revisit notice while any lesson remains unvisited", () => {
    const html = renderMap([], null);
    expect(html).not.toContain(itCopy.courseMap.revisitTitle);
  });
});
