import { describe, expect, it } from "vitest";
import { validateCurriculum } from "./validateCurriculum";
import type {
  AssembledCurriculumCatalogs,
  CurriculumLessonEntry,
  ModuleCoverage,
} from "./types";

const coverage = (moduleId: string): ModuleCoverage => ({
  moduleId,
  lessonIds: ["lesson-1"],
  introducedConceptIds: ["topic-wa"],
  introducedLexemeIds: ["iku"],
  introducedVerbIds: ["iku"],
  practicedVerbIds: ["iku"],
  assessedConceptIds: ["topic-wa"],
  assessedLexemeIds: ["iku"],
  firstKatakanaExposureIds: [],
});

const lesson = (
  overrides: Partial<CurriculumLessonEntry> = {},
): CurriculumLessonEntry => ({
  id: "lesson-1",
  moduleId: "module-1",
  order: 1,
  estimatedMinutes: 8,
  introducedConceptIds: ["topic-wa"],
  practicedConceptIds: ["topic-wa"],
  assessedConceptIds: ["topic-wa"],
  introducedLexemeIds: ["iku"],
  practicedLexemeIds: ["iku"],
  assessedLexemeIds: ["iku"],
  exampleIds: ["example-1"],
  speechPromptId: "speech-1",
  capstone: false,
  assistedKatakanaLexemeIds: [],
  ...overrides,
});

const input = (
  overrides: Partial<AssembledCurriculumCatalogs> = {},
): AssembledCurriculumCatalogs => ({
  concepts: [{ id: "topic-wa", prerequisiteIds: [], surfaceGears: ["は"] }],
  lexemes: [
    {
      id: "iku",
      japanese: "いく",
      reading: "いく",
      category: "verb",
      script: "hiragana",
    },
  ],
  examples: [
    { id: "example-1", lexemeIds: ["iku"], conceptIds: ["topic-wa"] },
  ],
  exercises: [
    {
      id: "exercise-1",
      targetExampleId: "example-1",
      assessedConceptIds: ["topic-wa"],
      assessedLexemeIds: ["iku"],
    },
  ],
  speechPrompts: [{ id: "speech-1", targetExampleId: "example-1" }],
  personas: [],
  modules: [
    {
      id: "module-1",
      phase: "orient",
      order: 1,
      prerequisiteIds: [],
      coverage: coverage("module-1"),
    },
  ],
  lessons: [lesson()],
  copy: { it: { "lesson-1": "Lezione" }, en: { "lesson-1": "Lesson" } },
  ...overrides,
});

const localValidation = { enforceReleaseTargets: false };

const aggregateReuseCatalog = (
  genuinelyReusedVerbCount: number,
): AssembledCurriculumCatalogs => {
  const verbIds = Array.from({ length: 42 }, (_, index) => `verb-${index + 1}`);
  const modules = [1, 2, 3].map((order) => ({
    id: `module-${order}`,
    phase: "orient" as const,
    order,
    prerequisiteIds: [],
    coverage: {
      moduleId: `module-${order}`,
      lessonIds: [`lesson-${order}`],
      introducedConceptIds: [],
      introducedLexemeIds: order === 1 ? verbIds : [],
      introducedVerbIds: order === 1 ? verbIds : [],
      practicedVerbIds: order === 1 ? [] : verbIds,
      assessedConceptIds: [],
      assessedLexemeIds: [],
      firstKatakanaExposureIds: [],
    },
  }));
  const examples = verbIds.flatMap((verbId) =>
    [1, 2, 3, 4].map((exampleNumber) => ({
      id: `example-${verbId}-${exampleNumber}`,
      lexemeIds: [verbId],
      conceptIds: [],
    })),
  );
  const lessons = [1, 2, 3, 4].map((order) => ({
    id: `lesson-${order}`,
    moduleId: `module-${Math.min(order, 3)}`,
    order,
    estimatedMinutes: 8,
    introducedConceptIds: [],
    practicedConceptIds: [],
    assessedConceptIds: [],
    introducedLexemeIds: order === 1 ? verbIds : [],
    practicedLexemeIds:
      order > 1
        ? verbIds.filter(
            (_, index) => index < genuinelyReusedVerbCount || order === 2,
          )
        : [],
    assessedLexemeIds: [],
    exampleIds: verbIds.flatMap((verbId, index) =>
      order <= 2 || index < genuinelyReusedVerbCount
        ? [`example-${verbId}-${order}`]
        : [],
    ),
    speechPromptId: `speech-${order}`,
    capstone: false,
    assistedKatakanaLexemeIds: [],
  }));

  return {
    concepts: [],
    lexemes: verbIds.map((id) => ({
      id,
      japanese: id,
      reading: id,
      category: "verb" as const,
      script: "hiragana" as const,
    })),
    examples,
    exercises: [],
    speechPrompts: lessons.map((entry) => ({
      id: entry.speechPromptId,
      targetExampleId: entry.exampleIds[0],
    })),
    personas: [],
    modules,
    lessons,
    copy: {
      it: Object.fromEntries(lessons.map((entry) => [entry.id, entry.id])),
      en: Object.fromEntries(lessons.map((entry) => [entry.id, entry.id])),
    },
  };
};

describe("validateCurriculum", () => {
  it("reports duplicate IDs and missing references as structured errors", () => {
    const result = validateCurriculum(
      input({
        lexemes: [
          {
            id: "iku",
            japanese: "いく",
            reading: "いく",
            category: "verb",
            script: "hiragana",
          },
          {
            id: "iku",
            japanese: "いく",
            reading: "いく",
            category: "verb",
            script: "hiragana",
          },
        ],
        lessons: [lesson({ exampleIds: ["missing-example"] })],
      }),
      localValidation,
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-lexeme-id", id: "iku" }),
        expect.objectContaining({
          code: "missing-example-reference",
          id: "missing-example",
        }),
      ]),
    );
  });

  it("rejects lesson durations outside six to ten minutes", () => {
    const result = validateCurriculum(
      input({ lessons: [lesson({ estimatedMinutes: 11 })] }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "lesson-duration-out-of-range",
        lessonId: "lesson-1",
      }),
    );
  });

  it("rejects assessment before introduction", () => {
    const result = validateCurriculum(
      input({
        lessons: [
          lesson({
            introducedConceptIds: [],
            introducedLexemeIds: [],
            assessedConceptIds: ["topic-wa"],
            assessedLexemeIds: ["iku"],
          }),
        ],
      }),
      localValidation,
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "assessment-before-introduction",
          id: "topic-wa",
        }),
        expect.objectContaining({
          code: "assessment-before-introduction",
          id: "iku",
        }),
      ]),
    );
  });

  it("rejects a concept or lexeme practiced before it is introduced (regression finding 2)", () => {
    const result = validateCurriculum(
      input({
        lessons: [
          lesson({
            introducedConceptIds: [],
            introducedLexemeIds: [],
            practicedConceptIds: ["topic-wa"],
            practicedLexemeIds: ["iku"],
            assessedConceptIds: [],
            assessedLexemeIds: [],
          }),
        ],
      }),
      localValidation,
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "practice-before-introduction",
          id: "topic-wa",
        }),
        expect.objectContaining({
          code: "practice-before-introduction",
          id: "iku",
        }),
      ]),
    );
  });

  it("does not flag a concept practiced by an earlier lesson than it is claimed in", () => {
    const result = validateCurriculum(
      input({
        modules: [
          {
            id: "module-1",
            phase: "orient",
            order: 1,
            prerequisiteIds: [],
            coverage: coverage("module-1"),
          },
        ],
        lessons: [
          lesson({
            practicedConceptIds: [],
            practicedLexemeIds: [],
          }),
          lesson({
            id: "lesson-2",
            order: 2,
            introducedConceptIds: [],
            introducedLexemeIds: [],
            practicedConceptIds: ["topic-wa"],
            practicedLexemeIds: ["iku"],
            assessedConceptIds: [],
            assessedLexemeIds: [],
          }),
        ],
      }),
      localValidation,
    );

    expect(
      result.errors.filter((error) => error.code === "practice-before-introduction"),
    ).toHaveLength(0);
  });

  it("reports exercise assessment-before-introduction once", () => {
    const result = validateCurriculum(
      input({
        modules: [
          {
            id: "module-1",
            phase: "orient",
            order: 1,
            prerequisiteIds: [],
            coverage: coverage("module-1"),
          },
        ],
        lessons: [
          lesson({
            introducedConceptIds: [],
            introducedLexemeIds: [],
            assessedConceptIds: [],
            assessedLexemeIds: [],
          }),
          lesson({
            id: "lesson-2",
            order: 2,
            introducedConceptIds: [],
            introducedLexemeIds: [],
            practicedConceptIds: [],
            assessedConceptIds: [],
            practicedLexemeIds: [],
            assessedLexemeIds: [],
            exampleIds: [],
          }),
        ],
      }),
      localValidation,
    );

    expect(
      result.errors.filter(
        (error) =>
          error.code === "assessment-before-introduction" &&
          error.id === "topic-wa",
      ),
    ).toHaveLength(1);
  });

  it("rejects capstone introductions", () => {
    const result = validateCurriculum(
      input({
        lessons: [lesson({ capstone: true })],
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "capstone-introduces-content",
        lessonId: "lesson-1",
      }),
    );
  });

  it("rejects required kanji output", () => {
    const result = validateCurriculum(
      input({
        lessons: [lesson({ requiredAnswerScript: "kanji" })],
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "required-kanji-output",
        lessonId: "lesson-1",
      }),
    );
  });

  it("requires assisted first exposure for katakana lexemes", () => {
    const result = validateCurriculum(
      input({
        lexemes: [
          {
            id: "iku",
            japanese: "ホテル",
            reading: "ほてる",
            category: "noun",
            script: "katakana",
          },
        ],
        lessons: [
          lesson({
            introducedLexemeIds: ["iku"],
            assistedKatakanaLexemeIds: [],
          }),
        ],
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "missing-assisted-katakana-exposure",
        id: "iku",
      }),
    );
  });

  it("only records assisted katakana exposure when the lesson introduces it", () => {
    const result = validateCurriculum(
      input({
        lexemes: [
          {
            id: "iku",
            japanese: "ホテル",
            reading: "ほてる",
            category: "noun",
            script: "katakana",
          },
        ],
        lessons: [
          lesson({
            introducedLexemeIds: [],
            practicedLexemeIds: [],
            assessedLexemeIds: [],
            assistedKatakanaLexemeIds: ["iku"],
          }),
          lesson({
            id: "lesson-2",
            order: 2,
            introducedLexemeIds: ["iku"],
            practicedLexemeIds: [],
            assessedLexemeIds: [],
            assistedKatakanaLexemeIds: [],
          }),
        ],
      }),
      localValidation,
    );

    expect(
      result.errors.filter(
        (error) => error.code === "missing-assisted-katakana-exposure",
      ),
    ).toEqual([
      expect.objectContaining({
        code: "missing-assisted-katakana-exposure",
        id: "iku",
        lessonId: "lesson-2",
      }),
    ]);
  });

  it("rejects mismatched IT and EN copy keys", () => {
    const result = validateCurriculum(
      input({
        copy: { it: { "lesson-1": "Lezione", extra: "Extra" }, en: { "lesson-1": "Lesson" } },
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "locale-key-mismatch", id: "extra" }),
    );
  });

  it("rejects authored coverage that differs from computed coverage", () => {
    const result = validateCurriculum(
      input({
        modules: [
          {
            id: "module-1",
            phase: "orient",
            order: 1,
            prerequisiteIds: [],
            coverage: { ...coverage("module-1"), introducedVerbIds: [] },
          },
        ],
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "authored-computed-coverage-mismatch",
        moduleId: "module-1",
      }),
    );
  });

  it("compares authored and computed coverage IDs as sets", () => {
    const result = validateCurriculum(
      input({
        lexemes: [
          {
            id: "one",
            japanese: "いち",
            reading: "いち",
            category: "noun",
            script: "hiragana",
          },
          {
            id: "two",
            japanese: "に",
            reading: "に",
            category: "noun",
            script: "hiragana",
          },
        ],
        examples: [],
        exercises: [],
        lessons: [
          lesson({
            introducedConceptIds: [],
            introducedLexemeIds: ["one"],
            practicedConceptIds: [],
            practicedLexemeIds: [],
            assessedConceptIds: [],
            assessedLexemeIds: [],
            exampleIds: [],
          }),
          lesson({
            id: "lesson-2",
            order: 2,
            introducedLexemeIds: ["two"],
            introducedConceptIds: [],
            practicedConceptIds: [],
            practicedLexemeIds: [],
            assessedConceptIds: [],
            assessedLexemeIds: [],
            exampleIds: [],
          }),
        ],
        modules: [
          {
            id: "module-1",
            phase: "orient",
            order: 1,
            prerequisiteIds: [],
            coverage: {
              ...coverage("module-1"),
              lessonIds: ["lesson-2", "lesson-1"],
              introducedConceptIds: [],
              introducedLexemeIds: ["two", "one"],
              introducedVerbIds: [],
              practicedVerbIds: [],
              assessedConceptIds: [],
              assessedLexemeIds: [],
            },
          },
        ],
        copy: {
          it: { "lesson-1": "Lezione", "lesson-2": "Lezione 2" },
          en: { "lesson-1": "Lesson", "lesson-2": "Lesson 2" },
        },
      }),
      localValidation,
    );

    expect(result.errors).not.toContainEqual(
      expect.objectContaining({
        code: "authored-computed-coverage-mismatch",
        moduleId: "module-1",
      }),
    );
  });

  it("requires aggregate genuine verb reuse at release level", () => {
    const result = validateCurriculum(
      input({
        modules: [
          { id: "module-1", phase: "orient", order: 1, prerequisiteIds: [], coverage: coverage("module-1") },
        ],
      }),
    );

    expect(result.errors).toContainEqual({
      code: "insufficient-verb-reuse",
      actual: 0,
      expected: 35,
    });
  });

  it("accepts the aggregate genuine-reuse target when 36 of 42 verbs qualify", () => {
    const result = validateCurriculum(aggregateReuseCatalog(36));

    expect(
      result.errors.filter((error) => error.code === "insufficient-verb-reuse"),
    ).toHaveLength(0);
  });

  it("reports one aggregate genuine-reuse error when only 34 verbs qualify", () => {
    const result = validateCurriculum(aggregateReuseCatalog(34));
    const errors = result.errors.filter(
      (error) => error.code === "insufficient-verb-reuse",
    );

    expect(errors).toEqual([
      expect.objectContaining({
        code: "insufficient-verb-reuse",
        actual: 34,
        expected: 35,
      }),
    ]);
  });

  it("does not mutate input and computes stable coverage", () => {
    const originalInput = input();
    const original = JSON.stringify(originalInput);
    const result = validateCurriculum(originalInput, localValidation);

    expect(result.valid).toBe(false);
    expect(JSON.stringify(originalInput)).toBe(original);
    expect(result.coverage.vocabularyIds).toEqual(["iku"]);
    expect(result.coverage.introducedVerbIds).toEqual(["iku"]);
    expect(result.coverage.laterReuseModules.iku).toEqual([]);
    expect(result.coverage.authoredExampleCounts.iku).toBe(2);
    expect(result.coverage.moduleCoverage["module-1"].lessonIds).toEqual([
      "lesson-1",
    ]);
  });
});
