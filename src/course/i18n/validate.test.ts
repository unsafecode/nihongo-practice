import { describe, expect, it } from "vitest";
import { chapters } from "../data/course";
import { examples } from "../data/examples";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";

function collectStaticStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStaticStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStaticStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("course locale", (copy) => {
  it("covers every chapter, lesson, block and example", () => {
    for (const chapter of chapters) {
      expect(copy.chapters[chapter.id]).toBeTruthy();
      for (const lesson of chapter.lessons) {
        expect(copy.lessons[lesson.id]).toBeTruthy();
        for (const block of lesson.blocks) {
          const blockCopy = copy.blocks[block.copyId];
          expect(blockCopy).toBeTruthy();
          if (block.type === "summary") {
            expect(blockCopy.bullets?.length).toBeGreaterThan(0);
          }
          if ("exampleIds" in block) {
            for (const exampleId of block.exampleIds) {
              expect(examples[exampleId]).toBeTruthy();
              expect(copy.examples[exampleId]).toBeTruthy();
            }
          }
        }
      }
    }
  });

  it("contains no blank visible copy", () => {
    const staticCopy = collectStaticStrings({
      home: copy.home,
      lesson: copy.lesson,
      practice: copy.practice,
      chapters: copy.chapters,
      lessons: copy.lessons,
      blocks: copy.blocks,
      examples: copy.examples,
    });
    expect(staticCopy.length).toBeGreaterThan(0);
    expect(staticCopy.every((value) => value.trim().length > 0)).toBe(true);
    expect(copy.home.invalidRoute("/missing").trim().length).toBeGreaterThan(0);
    expect(copy.home.lessonsProgress(1, 16).trim().length).toBeGreaterThan(0);
    expect(copy.lesson.chapterPosition(1, 8).trim().length).toBeGreaterThan(0);
  });
});
