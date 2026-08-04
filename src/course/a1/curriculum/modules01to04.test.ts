import { describe, expect, it } from "vitest";

import { A1_LESSON_MANIFEST } from "../manifest";
import { a1AllVariants, a1SemanticBuiltLessons } from "../catalog/catalog";
import { module1ItemsByLesson } from "../catalog/module01Sounds";
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
import { a1Modules01to04LessonContent } from "./modules01to04";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { A1PracticeActivity } from "./types";

const EXPECTED_LESSON_IDS = [
  "sounds-1",
  "sounds-2",
  "sounds-3",
  "sounds-4",
  "introductions-1",
  "introductions-2",
  "introductions-3",
  "introductions-4",
  "essential-questions-1",
  "essential-questions-2",
  "essential-questions-3",
  "essential-questions-4",
  "actions-1",
  "actions-2",
  "actions-3",
  "actions-4",
] as const;

type PhoneticLessonId = keyof typeof module1ItemsByLesson;

const PHONETIC_LESSON_IDS = new Set<string>(EXPECTED_LESSON_IDS.slice(0, 4));
const variantById = new Map(a1AllVariants.map((variant) => [variant.id, variant]));
const semanticLessonById = new Map(
  a1SemanticBuiltLessons.map((lesson) => [lesson.recipe.id, lesson]),
);
const sentenceFamilyById = new Map(
  a1SentenceFamilies.map((family) => [family.id, family]),
);
const realizeCatalogs = {
  contexts: a1Contexts,
  personRoles: a1PersonRoles,
  referents: a1Referents,
  semanticValues: a1SemanticValues,
  learningTargetSenses: a1LearningTargetSenses,
};

function phoneticItemForTarget(
  lessonId: PhoneticLessonId,
  targetRef: { readonly round: "one" | "two"; readonly index: number }
) {
  const offset = targetRef.round === "one" ? 0 : 3;
  return module1ItemsByLesson[lessonId]?.[targetRef.index + offset];
}

function isPhoneticLessonId(lessonId: string): lessonId is PhoneticLessonId {
  return PHONETIC_LESSON_IDS.has(lessonId);
}

function isSpokenTargetRef(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function assertVariantLexemesAreAvailable(
  variantId: string,
  availableLexemeIds: ReadonlySet<string>,
) {
  const variant = variantById.get(variantId);
  expect(variant, `variant ${variantId}`).toBeDefined();

  for (const valueId of Object.values(variant?.slotValues ?? {})) {
    const lexeme = a1LexemeByValueId[valueId];
    if (lexeme !== undefined) {
      expect(
        availableLexemeIds.has(lexeme.id),
        `${variantId} uses ${lexeme.id} before it is introduced`,
      ).toBe(true);
    }
  }
}

function realizedJapanese(variantId: string): string {
  const variant = variantById.get(variantId);
  expect(variant, `variant ${variantId}`).toBeDefined();
  const family = sentenceFamilyById.get(variant?.sentenceFamilyId ?? "");
  expect(family, `family for ${variantId}`).toBeDefined();
  const result = realizeVariant(family!, variant!, realizeCatalogs, {
    availableConceptIds: [...family!.requiredConceptIds],
  });
  if (!result.ok) {
    throw new Error(`Could not realize ${variantId}: ${JSON.stringify(result.errors)}`);
  }
  return result.sentence.canonicalJapanese;
}

describe("A1 modules 01–04 lesson content", () => {
  it("authors the canonical ordered sixteen-lesson foundations sequence", () => {
    expect(a1Modules01to04LessonContent.map(({ lessonId }) => lessonId)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(new Set(a1Modules01to04LessonContent.map(({ lessonId }) => lessonId)).size).toBe(
      EXPECTED_LESSON_IDS.length,
    );
  });

  it("freezes and resolves every catalog, manifest, and practice reference", () => {
    for (const content of a1Modules01to04LessonContent) {
      const manifest = A1_LESSON_MANIFEST[content.lessonId];
      expect(Object.isFrozen(content), content.lessonId).toBe(true);
      expect(manifest, `${content.lessonId} manifest`).toBeDefined();
      expect(a1LearningNoteById[content.learningNoteId]).toBeDefined();
      expect(content.situation.en.trim()).not.toHaveLength(0);
      expect(content.situation.it.trim()).not.toHaveLength(0);
      expect(content.retrievalCue.en.trim()).not.toHaveLength(0);
      expect(content.retrievalCue.it.trim()).not.toHaveLength(0);

      for (const prerequisiteLessonId of content.prerequisiteLessonIds) {
        expect(A1_LESSON_MANIFEST[prerequisiteLessonId]).toBeDefined();
      }
      for (const prerequisiteConceptId of content.prerequisiteConceptIds) {
        expect(A1_CONCEPT_IDS).toContain(prerequisiteConceptId);
      }
      for (const lexemeId of content.newLexemeIds) {
        expect(a1LexemeById[lexemeId]).toBeDefined();
      }

      if (isPhoneticLessonId(content.lessonId)) {
        const itemIds = new Set(
          module1ItemsByLesson[content.lessonId]?.map(({ id }) => id),
        );
        for (const itemId of content.workedExampleVariantIds) {
          expect(itemIds.has(itemId), `${content.lessonId} worked item ${itemId}`).toBe(
            true,
          );
        }
        expect(content.dialogue).toBeUndefined();
      } else {
        const builtLesson = semanticLessonById.get(content.lessonId);
        expect(builtLesson).toBeDefined();
        const modelIds = new Set(builtLesson?.recipe.modelVariantIds);
        for (const variantId of content.workedExampleVariantIds) {
          expect(modelIds.has(variantId), `${content.lessonId} worked model ${variantId}`).toBe(
            true,
          );
        }
        for (const variantId of content.dialogue?.turnVariantIds ?? []) {
          expect(modelIds.has(variantId), `${content.lessonId} dialogue model ${variantId}`).toBe(
            true,
          );
        }
      }
      expect(content.workedExampleVariantIds.length).toBeGreaterThanOrEqual(2);
      expect(content.workedExampleVariantIds.length).toBeLessThanOrEqual(3);

      const visibleTargets = new Set<string>();
      for (const activity of content.practiceBlueprint.activities) {
        const targetRef = activity.targetRef;
        if (isSpokenTargetRef(targetRef)) {
          if (isPhoneticLessonId(content.lessonId)) {
            expect(
              module1ItemsByLesson[content.lessonId]?.some(
                ({ id }) => id === targetRef.spokenVariantId,
              ),
            ).toBe(true);
          } else {
            expect(variantById.has(targetRef.spokenVariantId)).toBe(true);
          }
          visibleTargets.add(`spoken:${targetRef.spokenVariantId}`);
        } else if (isPhoneticLessonId(content.lessonId)) {
          const item = phoneticItemForTarget(content.lessonId, targetRef);
          expect(item, `${content.lessonId} phonetic practice target`).toBeDefined();
          visibleTargets.add(`item:${item?.id}`);
        } else {
          const lesson = semanticLessonById.get(content.lessonId);
          const round =
            targetRef.round === "one"
              ? lesson?.recipe.practice.roundOne
              : lesson?.recipe.practice.roundTwo;
          const variantId = round?.candidateVariantIds[targetRef.index];
          expect(variantById.has(variantId ?? "")).toBe(true);
          visibleTargets.add(`variant:${variantId}`);
        }
      }
      expect(visibleTargets.size).toBe(5);
    }
  });

  it("introduces four to six unique lexemes per lesson without repetition", () => {
    const allNewLexemeIds = a1Modules01to04LessonContent.flatMap(
      ({ newLexemeIds }) => newLexemeIds,
    );

    for (const { lessonId, newLexemeIds } of a1Modules01to04LessonContent) {
      expect(newLexemeIds.length, lessonId).toBeGreaterThanOrEqual(4);
      expect(newLexemeIds.length, lessonId).toBeLessThanOrEqual(6);
      expect(new Set(newLexemeIds).size, lessonId).toBe(newLexemeIds.length);
    }
    expect(new Set(allNewLexemeIds).size).toBe(allNewLexemeIds.length);
  });

  it("uses the five-activity learner sequence with unique visible targets", () => {
    for (const content of a1Modules01to04LessonContent) {
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
      for (let index = 1; index < activities.length; index += 1) {
        expect(activities[index].function).not.toBe(activities[index - 1].function);
      }

      if (!isPhoneticLessonId(content.lessonId)) {
        expect(activities).toEqual([
          expect.objectContaining({
            id: `${content.lessonId}-meaning`,
            function: "meaning-comprehension",
            interactionKind: "choice",
            targetRef: { round: "one", index: 1 },
          }),
          expect.objectContaining({
            id: `${content.lessonId}-form`,
            function: "form-discrimination",
            interactionKind: "completion",
            targetRef: { round: "two", index: 0 },
          }),
          expect.objectContaining({
            id: `${content.lessonId}-production`,
            function: "controlled-production",
            interactionKind: "tile-ordering",
            targetRef: { round: "one", index: 0 },
          }),
          expect.objectContaining({
            id: `${content.lessonId}-transfer`,
            targetRef: { round: "two", index: 1 },
          }),
          expect.objectContaining({
            id: `${content.lessonId}-spoken`,
            function: "listening-speaking",
            interactionKind: "spoken",
          }),
        ]);
      }
    }
  });

  it("keeps worked examples and dialogue within cumulative lexeme availability", () => {
    const availableLexemeIds = new Set<string>();

    for (const content of a1Modules01to04LessonContent) {
      for (const lexemeId of content.newLexemeIds) {
        availableLexemeIds.add(lexemeId);
      }
      if (!isPhoneticLessonId(content.lessonId)) {
        for (const variantId of [
          ...content.workedExampleVariantIds,
          ...(content.dialogue?.turnVariantIds ?? []),
        ]) {
          assertVariantLexemesAreAvailable(variantId, availableLexemeIds);
        }
      }
    }
  });

  it("follows the planned introductions, question, and action progression", () => {
    const byLessonId = new Map(
      a1Modules01to04LessonContent.map((content) => [content.lessonId, content]),
    );

    expect(byLessonId.get("introductions-1")).toMatchObject({
      situation: {
        en: "You meet a classmate and say who you are.",
        it: "Conosci un compagno di classe e dici chi sei.",
      },
      prerequisiteLessonIds: ["sounds-4"],
      learningNoteId: "a1-note-sentence-shape-omission",
      newLexemeIds: expect.arrayContaining([
        "a1-lexeme-watashi",
        "a1-lexeme-gakusei",
        "a1-lexeme-sensei",
      ]),
    });
    expect(byLessonId.get("introductions-1")?.newLexemeIds.slice(0, 4)).toEqual([
      "a1-lexeme-watashi",
      "a1-lexeme-gakusei",
      "a1-lexeme-sensei",
      expect.any(String),
    ]);
    expect(byLessonId.get("introductions-2")?.learningNoteId).toBe(
      "a1-note-topic-wa-copula-desu",
    );
    expect(byLessonId.get("introductions-3")?.learningNoteId).toBe(
      "a1-note-dictionary-masu-classes",
    );
    expect(byLessonId.get("introductions-4")).toMatchObject({
      learningNoteId: "a1-note-personal-reference",
      dialogue: { turnVariantIds: expect.any(Array) },
    });
    expect(byLessonId.get("introductions-4")?.dialogue?.turnVariantIds).toHaveLength(3);

    expect(byLessonId.get("essential-questions-1")?.learningNoteId).toBe(
      "a1-note-question-ka-words",
    );
    expect(byLessonId.get("essential-questions-1")?.newLexemeIds).toEqual(
      expect.arrayContaining(["a1-lexeme-nan", "a1-lexeme-nani"]),
    );
    expect(byLessonId.get("essential-questions-2")?.learningNoteId).toBe(
      "a1-note-question-ka-words",
    );
    expect(byLessonId.get("essential-questions-2")?.newLexemeIds).toEqual(
      expect.arrayContaining(["a1-lexeme-dare", "a1-lexeme-doko"]),
    );
    expect(byLessonId.get("essential-questions-3")?.learningNoteId).toBe(
      "a1-note-question-ka-words",
    );
    expect(byLessonId.get("essential-questions-4")?.learningNoteId).toBe(
      "a1-note-particle-ga",
    );

    expect(byLessonId.get("actions-1")?.learningNoteId).toBe("a1-note-particle-o");
    expect(byLessonId.get("actions-2")?.learningNoteId).toBe(
      "a1-note-location-ni-de-contrast",
    );
    expect(byLessonId.get("actions-2")?.workedExampleVariantIds).toEqual([
      "actions-2-m1",
      "actions-2-m3",
      "actions-2-m8",
    ]);
    expect(
      byLessonId.get("actions-2")?.practiceBlueprint.activities.at(-1)?.targetRef,
    ).toEqual({ spokenVariantId: "actions-2-m8" });
    expect(byLessonId.get("actions-3")?.learningNoteId).toBe("a1-note-particle-ni");
    expect(byLessonId.get("actions-4")?.learningNoteId).not.toBe("a1-note-particle-ni");

    const particleConcepts = new Set([
      "a1-concept-object-wo",
      "a1-concept-location-particle",
      "a1-concept-recipient-ni",
    ]);
    for (const lessonId of ["actions-1", "actions-2", "actions-3", "actions-4"]) {
      const note = a1LearningNoteById[byLessonId.get(lessonId)?.learningNoteId ?? ""];
      expect(
        [...particleConcepts].every((conceptId) =>
          note?.explainedConceptIds.includes(conceptId),
        ),
        `${lessonId} claims every action particle at once`,
      ).toBe(false);
    }
  });

  it("models every new actions-2 lexeme while contrasting destination に and action-place で", () => {
    const content = a1Modules01to04LessonContent.find(
      ({ lessonId }) => lessonId === "actions-2",
    );
    expect(content).toBeDefined();

    const workedValueIds = new Set(
      content?.workedExampleVariantIds.flatMap(
        (variantId) => Object.values(variantById.get(variantId)?.slotValues ?? {}),
      ),
    );
    for (const lexemeId of content?.newLexemeIds ?? []) {
      const lexeme = a1LexemeById[lexemeId];
      expect(lexeme, lexemeId).toBeDefined();
      expect(
        lexeme?.valueIds.some((valueId) => workedValueIds.has(valueId)),
        `${lexemeId} must appear in an actions-2 worked example`,
      ).toBe(true);
    }

    const workedJapanese = content?.workedExampleVariantIds.map(realizedJapanese) ?? [];
    expect(workedJapanese.some((sentence) => sentence.includes("に"))).toBe(true);
    expect(workedJapanese.some((sentence) => sentence.includes("で"))).toBe(true);
  });
});
