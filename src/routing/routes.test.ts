import { describe, expect, it } from "vitest";
import { lessonPath, routePaths } from "./routes";

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
});
