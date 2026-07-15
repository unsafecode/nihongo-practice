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

  it("requires genuine verb reuse across later modules and authored examples", () => {
    const result = validateCurriculum(
      input({
        modules: [
          { id: "module-1", phase: "orient", order: 1, prerequisiteIds: [], coverage: coverage("module-1") },
        ],
      }),
      localValidation,
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "insufficient-verb-reuse",
        id: "iku",
      }),
    );
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
