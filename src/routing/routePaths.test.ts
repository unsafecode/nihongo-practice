import { describe, expect, it } from "vitest";
import {
  baseReferencePath,
  courseLevelFromParam,
  courseLevelParam,
  coursePathForLevel,
  routePaths,
} from "./routePaths";
import { parseExplicitCourseLevel } from "../course/levels/selection";

/**
 * Task 5: the URL-reflected level dimension now carries explicit intent for
 * every selectable course option. The deprecated binary compatibility wrapper
 * below intentionally remains A1/A2-only until Task6 wires Base runtime data
 * through CourseHome.
 */
describe("coursePathForLevel / courseLevelParam", () => {
  it("names the level query param `livello`", () => {
    expect(courseLevelParam).toBe("livello");
  });

  it("builds explicit query-param URLs for Base, A1, and A2", () => {
    expect(coursePathForLevel("a0")).toBe("/percorso?livello=base");
    expect(coursePathForLevel("a1")).toBe("/percorso?livello=a1");
    expect(coursePathForLevel("a2")).toBe("/percorso?livello=a2");
  });

  it("round-trips explicit URL params through the pure parser", () => {
    for (const level of ["a0", "a1", "a2"] as const) {
      const url = new URL(coursePathForLevel(level), "https://example.test");
      expect(parseExplicitCourseLevel(url.searchParams.get(courseLevelParam))).toBe(level);
    }
  });

  it("uses a query param, never a new path segment that could shadow the lesson route", () => {
    // The lesson route is `/percorso/:moduleId/:lessonId`; a level path must
    // never introduce a third `/percorso/...` segment.
    for (const level of ["a0", "a1", "a2"] as const) {
      expect(coursePathForLevel(level).startsWith(`${routePaths.course}?`)).toBe(
        true,
      );
      expect(coursePathForLevel(level)).not.toContain("/percorso/");
    }
  });
});

describe("courseLevelFromParam", () => {
  /**
   * Deprecated compatibility wrapper for old CourseHome binary callers only.
   * Production new code must parse explicit intent with parseExplicitCourseLevel
   * and resolve defaults with resolveCourseLevel; Task6 owns Base map selection.
   */
  it("resolves a2 only for the exact value", () => {
    expect(courseLevelFromParam("a2")).toBe("a2");
  });

  it("keeps old binary callers on A1 for everything except exact a2, including base", () => {
    for (const value of [null, "", "base", "a1", "A2", "b2", "livello"]) {
      expect(courseLevelFromParam(value)).toBe("a1");
    }
  });

  it("remains typed and routable only for A1/A2 compatibility", () => {
    expect(courseLevelFromParam("a2")).toBe("a2");
    expect(coursePathForLevel(courseLevelFromParam("a2"))).toBe(
      "/percorso?livello=a2",
    );
    expect(coursePathForLevel(courseLevelFromParam(null))).toBe("/percorso?livello=a1");
  });
});

describe("routePaths: Base reference and diagnostic routes", () => {
  it("registers the reference route under its own top-level segment (never nested under a module)", () => {
    expect(routePaths.reference).toBe("/riferimenti/base/:referenceId");
  });

  it("registers the diagnostic as a single extra static segment, never colliding with the two-segment lesson route", () => {
    expect(routePaths.baseDiagnostic).toBe("/percorso/diagnostica-base");
    // The lesson route is `/percorso/:moduleId/:lessonId` (two segments after
    // `/percorso`); the diagnostic is exactly one, so react-router can never
    // confuse the two.
    expect(routePaths.baseDiagnostic.split("/")).toHaveLength(3);
    expect(routePaths.lesson.split("/")).toHaveLength(4);
  });
});

describe("routePaths: lesson-engine preview route", () => {
  it("registers the pilot preview under its own top-level segment, never nested under the course path", () => {
    expect(routePaths.pilotLesson).toBe("/anteprima/:pilotId");
    // `/percorso/...` is the live course tree, whose two-segment lesson route
    // would otherwise swallow a preview URL. Keeping the preview on its own
    // first segment is what lets Phase 0 ship alongside the current Base
    // experience without touching a single existing route.
    expect(routePaths.pilotLesson.startsWith("/percorso")).toBe(false);
    const [, firstSegment] = routePaths.pilotLesson.split("/");
    for (const live of [routePaths.lesson, routePaths.baseDiagnostic, routePaths.reference]) {
      expect(
        live.split("/")[1],
        `the preview segment "${firstSegment}" collides with the live route ${live}`,
      ).not.toBe(firstSegment);
    }
  });

  it("takes exactly one dynamic slug so it cannot shadow a two-segment route", () => {
    expect(routePaths.pilotLesson.split("/")).toHaveLength(3);
    expect(routePaths.pilotLesson.match(/:/g)).toHaveLength(1);
  });
});

describe("baseReferencePath", () => {
  it("builds a bare reference URL with no query when throughLessonId is omitted", () => {
    expect(baseReferencePath("particle-atlas")).toBe(
      "/riferimenti/base/particle-atlas",
    );
  });

  it("builds a reference URL carrying an explicit throughLessonId query param", () => {
    expect(baseReferencePath("particle-atlas", "topic-questions-2")).toBe(
      "/riferimenti/base/particle-atlas?throughLessonId=topic-questions-2",
    );
  });

  it("encodes an unsafe reference id", () => {
    expect(baseReferencePath("weird id/slash")).toBe(
      "/riferimenti/base/weird%20id%2Fslash",
    );
  });
});
