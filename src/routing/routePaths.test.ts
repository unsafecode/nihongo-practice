import { describe, expect, it } from "vitest";
import {
  courseLevelFromParam,
  courseLevelParam,
  coursePathForLevel,
  routePaths,
} from "./routePaths";

/**
 * Phase 3 Task 8: the URL-reflected level dimension. A1 renders at the bare
 * existing `/percorso` (byte-for-byte stable, so every published A1 URL keeps
 * working); A2 adds a `livello` query param, never a new path segment, so it
 * never collides with the `/percorso/:moduleId/:lessonId` lesson route and
 * still yields distinct browser-history entries for back/forward.
 */
describe("coursePathForLevel / courseLevelParam", () => {
  it("names the level query param `livello`", () => {
    expect(courseLevelParam).toBe("livello");
  });

  it("keeps A1 at the bare, unchanged /percorso (no query param)", () => {
    expect(coursePathForLevel("a1")).toBe(routePaths.course);
    expect(coursePathForLevel("a1")).toBe("/percorso");
  });

  it("selects A2 via the livello query param", () => {
    expect(coursePathForLevel("a2")).toBe("/percorso?livello=a2");
  });

  it("uses a query param, never a new path segment that could shadow the lesson route", () => {
    // The lesson route is `/percorso/:moduleId/:lessonId`; a level path must
    // never introduce a third `/percorso/...` segment.
    expect(coursePathForLevel("a2").startsWith(`${routePaths.course}?`)).toBe(
      true,
    );
    expect(coursePathForLevel("a2")).not.toContain("/percorso/");
  });
});

describe("courseLevelFromParam", () => {
  it("resolves a2 only for the exact value", () => {
    expect(courseLevelFromParam("a2")).toBe("a2");
  });

  it("defaults to a1 for a missing or unrecognized value (invalid never hard-fails)", () => {
    for (const value of [null, "", "a1", "A2", "b2", "livello"]) {
      expect(courseLevelFromParam(value)).toBe("a1");
    }
  });

  it("round-trips coursePathForLevel through its own param value", () => {
    expect(courseLevelFromParam("a2")).toBe("a2");
    expect(coursePathForLevel(courseLevelFromParam("a2"))).toBe(
      "/percorso?livello=a2",
    );
    expect(coursePathForLevel(courseLevelFromParam(null))).toBe("/percorso");
  });
});
