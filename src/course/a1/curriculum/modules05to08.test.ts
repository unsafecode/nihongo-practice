import { describe, expect, it } from "vitest";

import { A1_LESSON_MANIFEST } from "../manifest";
import { a1AllVariants, a1SemanticBuiltLessons } from "../catalog/catalog";
import {
  A1_CONCEPT_IDS,
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
} from "../catalog/a1SemanticCatalog";
import { a1LearningNoteById } from "./grammar";
import { a1LexemeById, a1LexemeByValueId } from "./lexicon";
import { semanticBlueprint } from "./lessonContentHelpers";
import { a1Modules01to04LessonContent } from "./modules01to04";
import { a1Modules05to08LessonContent } from "./modules05to08";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { A1PracticeActivity } from "./types";

const EXPECTED_LESSON_IDS = [
  "routines-1",
  "routines-2",
  "routines-3",
  "routines-4",
  "past-negative-1",
  "past-negative-2",
  "past-negative-3",
  "past-negative-4",
  "places-1",
  "places-2",
  "places-3",
  "places-4",
  "people-1",
  "people-2",
  "people-3",
  "people-4",
] as const;

const EXPECTED_NOTES: Readonly<Record<(typeof EXPECTED_LESSON_IDS)[number], string>> = {
  "routines-1": "a1-note-time-ni",
  "routines-2": "a1-note-time-ni",
  "routines-3": "a1-note-frequency",
  "routines-4": "a1-note-synthesis-recombine",
  "past-negative-1": "a1-note-mashita",
  "past-negative-2": "a1-note-masu-masen",
  "past-negative-3": "a1-note-mashita-masen-deshita",
  "past-negative-4": "a1-note-copula-tense-polarity",
  "places-1": "a1-note-particle-ni-destination",
  "places-2": "a1-note-particle-he-contrast",
  "places-3": "a1-note-source-limit",
  "places-4": "a1-note-synthesis-recombine",
  "people-1": "a1-note-personal-reference",
  "people-2": "a1-note-personal-reference",
  "people-3": "a1-note-companion-to",
  "people-4": "a1-note-synthesis-recombine",
};

const variantById = new Map(a1AllVariants.map((variant) => [variant.id, variant]));
const lessonById = new Map(
  a1SemanticBuiltLessons.map((lesson) => [lesson.recipe.id, lesson]),
);
const familyById = new Map(a1SentenceFamilies.map((family) => [family.id, family]));
const senseById = new Map(a1LearningTargetSenses.map((sense) => [sense.id, sense]));
const realizeCatalogs = {
  contexts: a1Contexts,
  personRoles: a1PersonRoles,
  referents: a1Referents,
  semanticValues: a1SemanticValues,
  learningTargetSenses: a1LearningTargetSenses,
};

function japanese(variantId: string): string {
  const variant = variantById.get(variantId);
  expect(variant, variantId).toBeDefined();
  const family = familyById.get(variant?.sentenceFamilyId ?? "");
  expect(family, `${variantId} family`).toBeDefined();
  const result = realizeVariant(family!, variant!, realizeCatalogs, {
    availableConceptIds: [...family!.requiredConceptIds],
  });
  if (!result.ok) {
    throw new Error(`Could not realize ${variantId}: ${JSON.stringify(result.errors)}`);
  }
  return result.sentence.canonicalJapanese;
}

function modelVariantIds(lessonId: string): ReadonlySet<string> {
  return new Set(lessonById.get(lessonId)?.recipe.modelVariantIds);
}

/**
 * Derives lesson vocabulary from the semantic values used by every authored
 * model, rather than trusting the lesson's declarative vocabulary list.
 */
function authoredModelLexemeIds(
  lessonId: string,
  dialogueVariantIds: readonly string[] = [],
): ReadonlySet<string> {
  const lexemeIds = new Set<string>();
  const variantIds = new Set([...modelVariantIds(lessonId), ...dialogueVariantIds]);

  for (const variantId of variantIds) {
    const variant = variantById.get(variantId);
    if (variant === undefined) continue;
    for (const valueId of Object.values(variant.slotValues)) {
      const lexeme = a1LexemeByValueId[valueId];
      if (lexeme !== undefined) lexemeIds.add(lexeme.id);
    }
  }

  return lexemeIds;
}

function isSpokenTarget(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

describe("A1 modules 05–08 lesson content", () => {
  it("authors the canonical ordered sixteen-lesson sequence", () => {
    expect(a1Modules05to08LessonContent.map(({ lessonId }) => lessonId)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(new Set(a1Modules05to08LessonContent.map(({ lessonId }) => lessonId)).size).toBe(
      EXPECTED_LESSON_IDS.length,
    );
  });

  it("freezes and resolves all lesson, note, lexeme, prerequisite, and model references", () => {
    for (const content of a1Modules05to08LessonContent) {
      expect(Object.isFrozen(content), content.lessonId).toBe(true);
      expect(A1_LESSON_MANIFEST[content.lessonId]).toBeDefined();
      expect(a1LearningNoteById[content.learningNoteId]).toBeDefined();
      expect(content.learningNoteId).toBe(EXPECTED_NOTES[content.lessonId as keyof typeof EXPECTED_NOTES]);
      expect(content.situation.en.trim()).not.toHaveLength(0);
      expect(content.situation.it.trim()).not.toHaveLength(0);
      expect(content.retrievalCue.en.trim()).not.toHaveLength(0);
      expect(content.retrievalCue.it.trim()).not.toHaveLength(0);

      for (const lessonId of content.prerequisiteLessonIds) {
        expect(A1_LESSON_MANIFEST[lessonId]).toBeDefined();
      }
      for (const conceptId of content.prerequisiteConceptIds) {
        expect(A1_CONCEPT_IDS).toContain(conceptId);
      }
      for (const lexemeId of content.newLexemeIds) {
        expect(a1LexemeById[lexemeId], lexemeId).toBeDefined();
      }

      const modelIds = modelVariantIds(content.lessonId);
      expect(content.workedExampleVariantIds.length).toBeGreaterThanOrEqual(2);
      expect(content.workedExampleVariantIds.length).toBeLessThanOrEqual(3);
      for (const variantId of [
        ...content.workedExampleVariantIds,
        ...(content.dialogue?.turnVariantIds ?? []),
      ]) {
        expect(modelIds.has(variantId), `${content.lessonId} model ${variantId}`).toBe(true);
      }
    }
  });

  it("continues the exact lesson-by-lesson prerequisite chain from actions-4", () => {
    const expectedPrerequisites = ["actions-4", ...EXPECTED_LESSON_IDS.slice(0, -1)];
    expect(a1Modules05to08LessonContent.map(({ prerequisiteLessonIds }) => prerequisiteLessonIds)).toEqual(
      expectedPrerequisites.map((lessonId) => [lessonId]),
    );
  });

  it("introduces four to six non-repeated lexemes that are not relisted from modules 01–04", () => {
    const earlierLexemes = new Set(a1Modules01to04LessonContent.flatMap(({ newLexemeIds }) => newLexemeIds));
    const sliceLexemes = a1Modules05to08LessonContent.flatMap(({ newLexemeIds }) => newLexemeIds);

    for (const { lessonId, newLexemeIds } of a1Modules05to08LessonContent) {
      expect(newLexemeIds.length, lessonId).toBeGreaterThanOrEqual(4);
      expect(newLexemeIds.length, lessonId).toBeLessThanOrEqual(6);
      expect(new Set(newLexemeIds).size, lessonId).toBe(newLexemeIds.length);
      for (const lexemeId of newLexemeIds) {
        expect(earlierLexemes.has(lexemeId), `${lessonId} repeats ${lexemeId}`).toBe(false);
      }
    }
    expect(new Set(sliceLexemes).size).toBe(sliceLexemes.length);
  });

  it("declares only lexemes realized by each lesson's authored models or dialogue", () => {
    const violations = a1Modules05to08LessonContent.flatMap((content) => {
      const actualLexemeIds = authoredModelLexemeIds(
        content.lessonId,
        content.dialogue?.turnVariantIds,
      );
      const absentLexemeIds = content.newLexemeIds.filter(
        (lexemeId) => !actualLexemeIds.has(lexemeId),
      );
      if (absentLexemeIds.length === 0) return [];

      return [
        `${content.lessonId}: declared=[${content.newLexemeIds.join(", ")}]; ` +
          `actual=[${[...actualLexemeIds].sort().join(", ")}]; ` +
          `absent=[${absentLexemeIds.join(", ")}]`,
      ];
    });

    expect(violations).toEqual([]);
  });

  it("keeps worked examples and dialogue within cumulative lexical closure", () => {
    const availableLexemeIds = new Set(a1Modules01to04LessonContent.flatMap(({ newLexemeIds }) => newLexemeIds));

    for (const content of a1Modules05to08LessonContent) {
      for (const lexemeId of content.newLexemeIds) availableLexemeIds.add(lexemeId);
      for (const variantId of [
        ...content.workedExampleVariantIds,
        ...(content.dialogue?.turnVariantIds ?? []),
      ]) {
        const variant = variantById.get(variantId);
        expect(variant, variantId).toBeDefined();
        for (const valueId of Object.values(variant?.slotValues ?? {})) {
          const lexeme = a1LexemeByValueId[valueId];
          if (lexeme !== undefined) {
            expect(availableLexemeIds.has(lexeme.id), `${variantId} uses ${lexeme.id} too soon`).toBe(true);
          }
        }
      }
    }
  });

  it("uses the fixed five-activity semantic blueprint with alternating fourth functions", () => {
    for (let index = 0; index < a1Modules05to08LessonContent.length; index += 1) {
      const content = a1Modules05to08LessonContent[index];
      const activities = content.practiceBlueprint.activities;
      expect(activities).toHaveLength(5);
      expect(new Set(activities.map(({ function: fn }) => fn)).size).toBeGreaterThanOrEqual(4);
      expect(activities.map(({ function: fn }) => fn)).toEqual(
        expect.arrayContaining([
          "meaning-comprehension",
          "form-discrimination",
          "controlled-production",
          "listening-speaking",
        ]),
      );
      expect(activities).toEqual(
        semanticBlueprint(
          content.lessonId,
          content.workedExampleVariantIds.at(-1)!,
          index % 2 === 0 ? "contextual-response" : "transformation",
        ).activities,
      );

      const lesson = lessonById.get(content.lessonId);
      expect(lesson, content.lessonId).toBeDefined();
      const visibleTargets = new Set<string>();
      for (const activity of activities) {
        if (isSpokenTarget(activity.targetRef)) {
          expect(variantById.has(activity.targetRef.spokenVariantId)).toBe(true);
          visibleTargets.add(`spoken:${activity.targetRef.spokenVariantId}`);
          continue;
        }
        const round =
          activity.targetRef.round === "one"
            ? lesson?.recipe.practice.roundOne
            : lesson?.recipe.practice.roundTwo;
        const variantId = round?.candidateVariantIds[activity.targetRef.index];
        expect(variantById.has(variantId ?? "")).toBe(true);
        visibleTargets.add(`variant:${variantId}`);
      }
      expect(visibleTargets.size, content.lessonId).toBe(5);
    }
  });

  it("uses two or three same-lesson semantic models and complete lexicon metadata for their verbs", () => {
    for (const content of a1Modules05to08LessonContent) {
      const models = modelVariantIds(content.lessonId);
      for (const variantId of content.workedExampleVariantIds) {
        expect(models.has(variantId), variantId).toBe(true);
        const realized = realizeVariant(
          familyById.get(variantById.get(variantId)?.sentenceFamilyId ?? "")!,
          variantById.get(variantId)!,
          realizeCatalogs,
          { availableConceptIds: [...familyById.get(variantById.get(variantId)?.sentenceFamilyId ?? "")!.requiredConceptIds] },
        );
        if (!realized.ok) throw new Error(`Could not realize ${variantId}`);
        const sense = senseById.get(realized.sentence.predicateSenseId);
        const lexeme = a1LexemeById[sense?.lexemeId ?? ""];
        if (lexeme !== undefined) {
          expect(lexeme.category, `${variantId} verb category`).toBe("verb");
          expect(lexeme.verb, `${variantId} verb metadata`).toBeDefined();
        }
      }
    }
  });

  it("makes each lesson's focal form visible in a worked example or dialogue", () => {
    const visibleJapanese = (lessonId: string) => {
      const lesson = a1Modules05to08LessonContent.find((content) => content.lessonId === lessonId);
      return [
        ...(lesson?.workedExampleVariantIds ?? []),
        ...(lesson?.dialogue?.turnVariantIds ?? []),
      ].map(japanese);
    };

    expect(visibleJapanese("routines-1").some((line) => line.includes("に"))).toBe(true);
    expect(visibleJapanese("routines-2").some((line) => line.includes("ようびに"))).toBe(true);
    expect(visibleJapanese("routines-3").some((line) => /まいにち|よく|ときどき|いつも/.test(line))).toBe(true);
    expect(visibleJapanese("past-negative-1").every((line) => line.endsWith("ました"))).toBe(true);
    expect(visibleJapanese("past-negative-2").every((line) => line.endsWith("ません"))).toBe(true);
    expect(visibleJapanese("past-negative-3").every((line) => line.endsWith("ませんでした"))).toBe(true);
    expect(visibleJapanese("past-negative-4").some((line) => line.endsWith("でした"))).toBe(true);
    expect(visibleJapanese("past-negative-4").some((line) => line.includes("ではありません"))).toBe(true);
    expect(visibleJapanese("places-1").some((line) => line.includes("に"))).toBe(true);
    expect(visibleJapanese("places-2").some((line) => line.includes("へ"))).toBe(true);
    expect(visibleJapanese("places-3").some((line) => line.includes("から") && line.includes("まで"))).toBe(true);
    expect(visibleJapanese("places-4").some((line) => line.includes("で"))).toBe(true);
    expect(visibleJapanese("people-3").some((line) => line.includes("と"))).toBe(true);
    expect(visibleJapanese("people-3").some((line) => line.includes("に"))).toBe(true);
  });

  it("makes each places particle note visible in its worked examples", () => {
    const workedJapanese = (lessonId: string) => {
      const lesson = a1Modules05to08LessonContent.find((content) => content.lessonId === lessonId);
      return lesson?.workedExampleVariantIds.map(japanese) ?? [];
    };

    expect(workedJapanese("places-1").some((line) => line.includes("に"))).toBe(true);
    expect(workedJapanese("places-2").some((line) => line.includes("へ"))).toBe(true);
    expect(
      workedJapanese("places-3").some((line) => line.includes("から") && line.includes("まで")),
    ).toBe(true);
  });

  it("keeps dialogue and adjacent worked models natural by never repeating あなた", () => {
    for (const content of a1Modules05to08LessonContent) {
      for (const sequence of [
        content.workedExampleVariantIds.map(japanese),
        content.dialogue?.turnVariantIds.map(japanese) ?? [],
      ]) {
        for (let index = 1; index < sequence.length; index += 1) {
          expect(
            sequence[index - 1].includes("あなた") && sequence[index].includes("あなた"),
          ).toBe(false);
        }
      }
    }
  });
});
