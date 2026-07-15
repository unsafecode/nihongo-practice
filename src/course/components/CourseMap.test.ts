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

/**
 * React's static-markup renderer HTML-escapes text content (including
 * apostrophes as `&#x27;`), so free-form prose copy must be escaped the
 * same way before being compared against rendered output.
 */
function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** All eight real module ids, in their authored (approved) order. */
const allModuleIdsInOrder = [
  "sounds",
  "sentence-map",
  "actions",
  "time",
  "places",
  "people",
  "questions-existence",
  "capstone",
];

describe("CourseMap: phase grouping and order", () => {
  it("renders as a single vertical path, not a card grid", () => {
    const html = renderMap([], null);
    expect(html).toContain('class="course-map"');
  });

  it("renders the four phase headings and purposes in orient, build, navigate, synthesize order", () => {
    const html = renderMap([], null);
    const phaseOrder = ["orient", "build", "navigate", "synthesize"] as const;
    const indices = phaseOrder.map((phaseId) => {
      const heading = itCopy.courseMap.phases[phaseId].title;
      expect(html).toContain(heading);
      expect(html).toContain(itCopy.courseMap.phases[phaseId].purpose);
      return html.indexOf(heading);
    });
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it("renders every module title in approved course order", () => {
    const html = renderMap([], null);
    const titleIndices = allModuleIdsInOrder.map((moduleId) => {
      const title = itCopy.modules[moduleId as keyof typeof itCopy.modules].title;
      const index = html.indexOf(title);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    });
    for (let i = 1; i < titleIndices.length; i += 1) {
      expect(titleIndices[i]).toBeGreaterThan(titleIndices[i - 1]);
    }
  });

  it("never uses stale chapter/completion/mastery wording", () => {
    const html = renderMap(["sounds-core"], "sounds-core");
    expect(html.toLowerCase()).not.toMatch(/chapter|capitolo/);
    expect(html.toLowerCase()).not.toMatch(/mastery|padronanza|completat|mastered/);
  });
});

describe("CourseMap: initial expansion follows the recommendation", () => {
  it("expands exactly the recommended module when nothing is visited", () => {
    const html = renderMap([], null);
    expect(html).toContain('id="module-lessons-sounds" class="module-card__lessons">');
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(7);
  });

  it("moves the expanded module as the recommendation advances through met prerequisites", () => {
    const html = renderMap(
      ["sounds-core", "sounds-special", "sentence-order", "sentence-omission"],
      null,
    );
    // With no recognized last-visited lesson, §7.3 rule 2 advances to the first
    // unvisited lesson whose prerequisites are met: the first lesson of "actions".
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(7);
    expect(html).toContain('id="module-lessons-actions" class="module-card__lessons">');
  });

  it("resumes and expands the module of a recognized last-visited lesson, even past earlier skipped lessons", () => {
    // Only the very first lesson and a much later one are visited; the
    // recognized last-visited lesson is the later "places-action".
    const html = renderMap(["sounds-core", "places-action"], "places-action");
    // §7.3 rule 1: resume "places", not an earlier unvisited module.
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(7);
    expect(html).toContain('id="module-lessons-places" class="module-card__lessons">');
  });
});

describe("CourseMap: all-visited fallback", () => {
  it("shows a localized revisit notice and expands the recognized current module when everything is visited", () => {
    const allLessonIds = courseModules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const html = renderMap(allLessonIds, "traps-verbs");
    expect(html).toContain(escapeHtmlText(itCopy.courseMap.revisitTitle));
    expect(html).toContain(escapeHtmlText(itCopy.courseMap.revisitBody));
    expect(html).toContain('id="module-lessons-capstone" class="module-card__lessons">');
    const hiddenCount = (html.match(/ hidden=""/g) ?? []).length;
    expect(hiddenCount).toBe(7);
  });

  it("does not show the revisit notice while any lesson remains unvisited", () => {
    const html = renderMap([], null);
    expect(html).not.toContain(itCopy.courseMap.revisitTitle);
  });
});
