import { describe, expect, it } from "vitest";

import { FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON } from "../catalog/foundationsShared";
import {
  a1FoundationsArea01to02BuiltLessons,
  a1FoundationsArea01to02LessonContent,
} from "./foundationsArea01to02";

const EXPECTED_LESSON_IDS = [
  "sentence-foundations-1",
  "sentence-foundations-2",
  "sentence-foundations-3",
  "sentence-foundations-4",
  "topic-questions-1",
  "topic-questions-2",
  "topic-questions-3",
  "topic-questions-4",
] as const;

const EXPECTED_NOTE_IDS = [
  "a1-note-sentence-chunks",
  "a1-note-recoverable-omission",
  "a1-note-anata-limited",
  "a1-note-identity-dialogue",
  "a1-note-topic-wa-copula-desu",
  "a1-note-particle-ga",
  "a1-note-question-ka-words",
  "a1-note-question-dialogue",
] as const;

describe("staged Foundations learner content 01–02", () => {
  it("keeps the exact lesson and note progression outside the published curriculum", () => {
    expect(a1FoundationsArea01to02LessonContent.map(({ lessonId }) => lessonId)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(a1FoundationsArea01to02LessonContent.map(({ learningNoteId }) => learningNoteId)).toEqual(
      EXPECTED_NOTE_IDS,
    );
    expect(
      EXPECTED_LESSON_IDS.map(
        (lessonId) => FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON[lessonId],
      ),
    ).toEqual(EXPECTED_NOTE_IDS);
  });

  it("gives every lesson exact first-use vocabulary, complete bilingual copy, and five practice activities", () => {
    const recipes = new Map(
      a1FoundationsArea01to02BuiltLessons.map(({ recipe }) => [recipe.id, recipe]),
    );

    for (const content of a1FoundationsArea01to02LessonContent) {
      expect(content.newLexemeIds.length).toBeGreaterThanOrEqual(4);
      expect(content.newLexemeIds.length).toBeLessThanOrEqual(6);
      expect(new Set(content.newLexemeIds).size).toBe(content.newLexemeIds.length);
      expect(content.situation.en).toMatch(/\S/);
      expect(content.situation.it).toMatch(/\S/);
      expect(content.retrievalCue.en).toMatch(/\S/);
      expect(content.retrievalCue.it).toMatch(/\S/);
      expect(content.workedExampleVariantIds.length).toBeGreaterThanOrEqual(2);
      expect(content.workedExampleVariantIds.length).toBeLessThanOrEqual(3);
      expect(content.practiceBlueprint.activities).toHaveLength(5);
      expect(
        content.practiceBlueprint.activities.map(({ function: practiceFunction }) => practiceFunction),
      ).toEqual(
        expect.arrayContaining([
          "meaning-comprehension",
          "form-discrimination",
          "controlled-production",
          "listening-speaking",
        ]),
      );

      const modelIds = new Set(recipes.get(content.lessonId)?.modelVariantIds);
      for (const id of content.workedExampleVariantIds) {
        expect(modelIds.has(id), `${content.lessonId} worked example ${id}`).toBe(true);
      }
      for (const id of content.dialogue?.turnVariantIds ?? []) {
        expect(modelIds.has(id), `${content.lessonId} dialogue turn ${id}`).toBe(true);
      }
    }
  });

  it("uses three-turn mini-dialogues only at the two planned synthesis points", () => {
    const dialogueLessonIds = a1FoundationsArea01to02LessonContent
      .filter(({ dialogue }) => dialogue !== undefined)
      .map(({ lessonId }) => lessonId);
    expect(dialogueLessonIds).toEqual(["sentence-foundations-4", "topic-questions-4"]);

    for (const lessonId of dialogueLessonIds) {
      const dialogue = a1FoundationsArea01to02LessonContent.find(
        (content) => content.lessonId === lessonId,
      )?.dialogue;
      expect(dialogue?.turnVariantIds).toHaveLength(3);
    }
  });
});
