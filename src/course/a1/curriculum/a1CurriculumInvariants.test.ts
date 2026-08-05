import { describe, expect, it } from "vitest";

import { buildA1LessonViewModel } from "../a1LessonViewModel";
import { a1FoundationCatalogs } from "../catalog/catalog";
import {
  A1_CAPSTONE_LESSON_IDS,
  A1_LESSON_IDS,
  A1_LESSON_MANIFEST,
} from "../manifest";
import { buildA1PracticeModel } from "../../components/a1PracticeModel";
import {
  a1LessonContentById,
  a1LessonContents,
} from "./catalog";
import { buildA1CurriculumViewModel } from "./buildA1CurriculumViewModel";
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
  it("certifies all 64 canonical curriculum rows without an empty success", () => {
    const result = validateA1Curriculum();
    const declaredFirstUses = a1LessonContents.flatMap(
      (content) => content.newLexemeIds,
    );
    const reportedFirstUses = result.reports.byLesson.flatMap(
      (row) => row.introducedLexemeIds,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.reports.byLesson).toHaveLength(64);
    expect(result.reports.byLesson.map((row) => row.lessonId)).toEqual(A1_LESSON_IDS);
    expect(reportedFirstUses).toEqual(declaredFirstUses);
    expect(
      result.reports.byLesson.reduce(
        (total, row) => total + row.newLexemeCount,
        0,
      ),
    ).toBe(declaredFirstUses.length);
    expect(new Set(reportedFirstUses).size).toBe(declaredFirstUses.length);
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

  it("builds every canonical A1 learner view in both locales and every real practice model without partial success", () => {
    const capstones = new Set<string>(A1_CAPSTONE_LESSON_IDS);

    for (const lessonId of A1_LESSON_IDS) {
      const content = a1LessonContentById[lessonId];
      expect(content, lessonId).toBeDefined();
      if (!content) continue;

      for (const locale of ["en", "it"] as const) {
        const view = buildA1CurriculumViewModel(lessonId, locale);
        expect(view.ok, `${lessonId} ${locale}`).toBe(true);
        if (!view.ok) continue;

        const { model } = view;
        expect(model.lessonId).toBe(lessonId);
        expect(model.overview.canDo.trim(), `${lessonId} ${locale} Can-do`).not.toBe("");
        expect(model.overview.situation.trim(), `${lessonId} ${locale} situation`).not.toBe("");
        expect(model.note.id).toBe(content.learningNoteId);
        expect(model.note.title.trim(), `${lessonId} ${locale} note`).not.toBe("");
        expect(model.examples.map((example) => example.variantId)).toEqual(
          content.workedExampleVariantIds,
        );
        expect(model.examples.length, `${lessonId} ${locale} examples`).toBeGreaterThanOrEqual(2);
        expect(model.examples.length, `${lessonId} ${locale} examples`).toBeLessThanOrEqual(3);
        expect(model.practice.activities).toEqual(content.practiceBlueprint.activities);
        expect(model.practice.activities).toHaveLength(5);
        expect(model.practice.activities.slice(0, 4)).toHaveLength(4);
        expect(model.practice.activities[4]).toMatchObject({
          function: "listening-speaking",
          interactionKind: "spoken",
        });
        expect(model.recap.retrievalCue.trim(), `${lessonId} ${locale} recap`).not.toBe("");

        if (content.dialogue === undefined) {
          expect(model.dialogue).toBeNull();
        } else {
          expect(model.dialogue?.map((example) => example.variantId)).toEqual(
            content.dialogue.turnVariantIds,
          );
        }

        if (capstones.has(lessonId)) {
          expect(content.newLexemeIds).toEqual([]);
          expect(model.note.kind).toBe("synthesis");
          expect(model.vocabulary.length).toBeGreaterThanOrEqual(4);
          expect(model.vocabulary.length).toBeLessThanOrEqual(6);
          expect(model.vocabulary.every((entry) => entry.isReview === true)).toBe(true);
        } else {
          expect(model.vocabulary.map((entry) => entry.id)).toEqual(content.newLexemeIds);
          expect(model.vocabulary.length).toBeGreaterThanOrEqual(4);
          expect(model.vocabulary.length).toBeLessThanOrEqual(6);
          expect(model.vocabulary.every((entry) => entry.isReview !== true)).toBe(true);
          if (A1_LESSON_MANIFEST[lessonId]!.contract === "phonetic") {
            expect(model.note.kind).toBe("phonetic");
          } else {
            expect(model.note.kind).not.toBe("phonetic");
          }
        }
      }

      const practice = buildA1PracticeModel(lessonId);
      expect(practice.ok, `${lessonId} practice`).toBe(true);
      if (!practice.ok) continue;
      expect(practice.model.activities.map((activity) => activity.id)).toEqual(
        content.practiceBlueprint.activities.map((activity) => activity.id),
      );
      expect(practice.model.activities).toHaveLength(5);
      expect(
        practice.model.activities.filter(
          (activity) => activity.generatedExercise !== undefined,
        ),
      ).toHaveLength(4);
      expect(practice.model.activities[4]?.spokenVariantId).toBeDefined();
    }
  });
});
