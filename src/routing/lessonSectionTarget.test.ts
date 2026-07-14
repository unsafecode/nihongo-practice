import { describe, expect, it } from "vitest";
import { LESSON_SECTION_IDS } from "./lessonSections";
import { lessonSectionTarget } from "./lessonSectionTarget";
import { parseRouteTarget } from "./routeTarget";

describe("lessonSectionTarget", () => {
  it("builds a router `to` string that preserves the lesson path and sets the section hash", () => {
    const target = lessonSectionTarget("sounds", "sounds-core", "explore");
    expect(target.valid).toBe(true);
    expect(target.to).toBe("/percorso/sounds/sounds-core#explore");
    expect(target.anchorId).toBe("lesson-section-explore");
  });

  it("produces, for every section, a `to` that RouteScrollManager can parse back to the same anchor", () => {
    for (const sectionId of LESSON_SECTION_IDS) {
      const target = lessonSectionTarget("verbs", "actions-masu", sectionId);
      expect(target.valid).toBe(true);
      const parsed = parseRouteTarget(target.to);
      expect(parsed.valid).toBe(true);
      expect(parsed.target.pathname).toBe("/percorso/verbs/actions-masu");
      expect(parsed.target.sectionId).toBe(sectionId);
    }
  });

  it("does not append a query and keeps the current lesson path intact", () => {
    const target = lessonSectionTarget("sounds", "sounds-core", "rule");
    expect(target.to.includes("?")).toBe(false);
    expect(target.to.startsWith("/percorso/sounds/sounds-core")).toBe(true);
  });

  it("reports invalid and yields a safe non-throwing fallback for a non-lesson path", () => {
    const target = lessonSectionTarget("", "", "explore");
    expect(target.valid).toBe(false);
    expect(typeof target.to).toBe("string");
    expect(target.to.length).toBeGreaterThan(0);
  });
});
