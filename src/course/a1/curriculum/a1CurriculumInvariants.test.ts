import { describe, expect, it } from "vitest";

import { buildA1LessonViewModel } from "../a1LessonViewModel";
import { a1FoundationCatalogs } from "../catalog/catalog";
import { A1_CAPSTONE_LESSON_IDS, A1_LESSON_IDS } from "../manifest";
import { a1LessonContents } from "./catalog";
import { a1LearningNotes } from "./grammar";
import { a1Lexemes } from "./lexicon";
import { validateA1Curriculum } from "./validateA1Curriculum";

const REQUIRED_FUNCTIONS = [
  "meaning-comprehension",
  "form-discrimination",
  "controlled-production",
  "listening-speaking",
] as const;

function expectBilingual(value: { readonly en: string; readonly it: string }): void {
  expect(value.en.trim()).not.toBe("");
  expect(value.it.trim()).not.toBe("");
}

describe("A1 learner curriculum invariants", () => {
  it("certifies all 48 canonical curriculum rows without an empty success", () => {
    const result = validateA1Curriculum();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.reports.byLesson).toHaveLength(48);
    expect(result.reports.byLesson.map((row) => row.lessonId)).toEqual(A1_LESSON_IDS);
    expect(result.reports.byLesson.reduce((total, row) => total + row.newLexemeCount, 0)).toBe(182);
  });

  it("keeps the 4–6 / capstone-zero introduction contract and first-use closure", () => {
    const result = validateA1Curriculum();
    const capstones = new Set<string>(A1_CAPSTONE_LESSON_IDS);

    for (const row of result.reports.byLesson) {
      if (capstones.has(row.lessonId)) {
        expect(row.newLexemeCount, row.lessonId).toBe(0);
        continue;
      }
      expect(row.newLexemeCount, row.lessonId).toBeGreaterThanOrEqual(4);
      expect(row.newLexemeCount, row.lessonId).toBeLessThanOrEqual(6);
    }
    expect(
      result.errors.filter((error) =>
        [
          "unintroduced-lexeme-use",
          "future-content-in-example",
          "future-content-in-dialogue",
        ].includes(error.code),
      ),
    ).toEqual([]);
  });

  it("keeps every five-activity blueprint diverse, resolvable, and visibly unique", () => {
    const reports = validateA1Curriculum().reports;

    for (const row of reports.byLesson) {
      expect(row.practiceFunctions, row.lessonId).toHaveLength(5);
      expect(new Set(row.practiceFunctions).size, row.lessonId).toBeGreaterThanOrEqual(4);
      expect(row.practiceFunctions).toEqual(expect.arrayContaining([...REQUIRED_FUNCTIONS]));
      for (let index = 1; index < row.practiceFunctions.length; index += 1) {
        expect(row.practiceFunctions[index]).not.toBe(row.practiceFunctions[index - 1]);
      }
      expect(new Set(row.visibleTargetKeys).size, row.lessonId).toBe(5);
    }
  });

  it("keeps all learner-facing EN/IT fields populated independently of translations", () => {
    for (const content of a1LessonContents) {
      expectBilingual(content.situation);
      expectBilingual(content.retrievalCue);
      if (content.vocabularyException) expectBilingual(content.vocabularyException.reason);
    }
    for (const lexeme of a1Lexemes) expectBilingual(lexeme.meaning);
    for (const note of a1LearningNotes) {
      expectBilingual(note.title);
      expectBilingual(note.meaning);
      expectBilingual(note.use);
      expectBilingual(note.construction);
      expectBilingual(note.typicalMistake);
      if (note.subjectOmissionNote) expectBilingual(note.subjectOmissionNote);
      for (const token of note.pattern) expectBilingual(token.label);
    }
  });

  it("builds every production semantic lesson rather than treating an empty model as success", () => {
    for (const lesson of a1FoundationCatalogs.lessons) {
      const built = buildA1LessonViewModel(lesson.id, "en");
      expect(built.ok, lesson.id).toBe(true);
      if (!built.ok) continue;
      expect(built.model.matrix.rows.length, lesson.id).toBeGreaterThan(0);
      expect(built.model.rounds.flatMap((round) => round.targets).length, lesson.id).toBe(4);
    }
  });
});
