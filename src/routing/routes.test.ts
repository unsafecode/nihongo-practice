import { describe, expect, it } from "vitest";
import {
  foundationFixturesEnabledFor,
  lessonPath,
  routePaths,
} from "./routes";

describe("routePaths", () => {
  it("defines all public locations", () => {
    expect(routePaths).toEqual({
      course: "/percorso",
      lesson: "/percorso/:moduleId/:lessonId",
      practice: "/pratica",
      lab: "/pratica/laboratorio",
      syllabary: "/pratica/sillabario",
      phrasebook: "/frasario",
    });
  });

  it("builds an encoded lesson URL", () => {
    expect(lessonPath("sentence map", "topic/omission"))
      .toBe("/percorso/sentence%20map/topic%2Fomission");
  });

  it("keeps the compile-time foundation fixture route out of public paths", () => {
    expect(Object.values(routePaths)).not.toContain(
      "/__fixtures__/foundation/:fixtureId",
    );
  });
});

describe("foundationFixturesEnabledFor", () => {
  it("enables the harness only for the exact string \"true\"", () => {
    expect(foundationFixturesEnabledFor("true")).toBe(true);
  });

  it("stays disabled for every other value", () => {
    for (const value of ["false", "TRUE", "1", "", undefined]) {
      expect(foundationFixturesEnabledFor(value)).toBe(false);
    }
  });

  it("is disabled by default in the normal build environment", () => {
    expect(
      foundationFixturesEnabledFor(import.meta.env.VITE_FOUNDATION_FIXTURES),
    ).toBe(false);
  });
});
