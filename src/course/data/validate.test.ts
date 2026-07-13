import { describe, expect, it } from "vitest";
import { chapters } from "./course";
import { examples } from "./examples";
import { validateCourse } from "./validate";

describe("course structure", () => {
  it("contains 8 chapters and 16 lessons", () => {
    expect(chapters).toHaveLength(8);
    expect(chapters.flatMap((chapter) => chapter.lessons)).toHaveLength(16);
  });

  it("has unique IDs and valid references", () => {
    expect(validateCourse(chapters, examples)).toEqual([]);
  });

  it("keeps every chapter open and ordered", () => {
    expect(chapters.map((chapter) => chapter.order)).toEqual([1,2,3,4,5,6,7,8]);
    expect(chapters.every((chapter) => chapter.locked === false)).toBe(true);
  });

  it("gives every chapter at least one guided tool", () => {
    expect(chapters.every((chapter) =>
      chapter.lessons.some((lesson) =>
        lesson.blocks.some((block) => block.type === "guidedTool"),
      ),
    )).toBe(true);
  });
});
