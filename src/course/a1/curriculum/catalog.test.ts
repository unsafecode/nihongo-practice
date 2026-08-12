import { describe, expect, it } from "vitest";

import { A1_RETAINED_LESSON_IDS } from "../manifest";
import { a1LearningNoteById } from "./grammar";
import {
  a1LessonContentById,
  a1LessonContents,
  a1LearningNoteById as catalogLearningNoteById,
  a1LexemeById as catalogLexemeById,
} from "./catalog";
import { a1LexemeById } from "./lexicon";

describe("A1 curriculum catalog", () => {
  it("assembles all 44 retained lessons in exact canonical order", () => {
    expect(a1LessonContents).toHaveLength(44);
    expect(a1LessonContents.map(({ lessonId }) => lessonId)).toEqual(
      A1_RETAINED_LESSON_IDS,
    );
  });

  it("exports deeply frozen mutation-safe plain-record indexes", () => {
    expect(Object.isFrozen(a1LessonContents)).toBe(true);
    expect(Object.isFrozen(a1LessonContentById)).toBe(true);
    expect(Object.isFrozen(catalogLexemeById)).toBe(true);
    expect(Object.isFrozen(catalogLearningNoteById)).toBe(true);
    expect(a1LessonContentById["introductions-1"]).toBe(a1LessonContents[0]);
    expect(catalogLexemeById["a1-lexeme-watashi"]).toBe(
      a1LexemeById["a1-lexeme-watashi"],
    );
    expect(catalogLearningNoteById["a1-note-synthesis-recombine"]).toBe(
      a1LearningNoteById["a1-note-synthesis-recombine"],
    );
    expect(a1LessonContentById["not-a-lesson"]).toBeUndefined();
    expect(catalogLexemeById["not-a-lexeme"]).toBeUndefined();
    expect(catalogLearningNoteById["not-a-note"]).toBeUndefined();
  });
});
