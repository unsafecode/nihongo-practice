import { describe, expect, it } from "vitest";

import { A1_LESSON_MANIFEST, A1_RETAINED_LESSON_IDS } from "../manifest";
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
import { a1Modules09to12LessonContent } from "./modules09to12";
import { a1LessonContents } from "./catalog";
import { inheritedBaseLexemeIds } from "./inheritedBase";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { A1LessonContent, A1PracticeActivity } from "./types";

const EXPECTED_LESSON_IDS = [
  "descriptions-1",
  "descriptions-2",
  "descriptions-3",
  "descriptions-4",
  "shopping-1",
  "shopping-2",
  "shopping-3",
  "shopping-4",
  "existence-needs-1",
  "existence-needs-2",
  "existence-needs-3",
  "existence-needs-4",
  "capstones-1",
  "capstones-2",
  "capstones-3",
  "capstones-4",
] as const;

const EXPECTED_NOTES: Readonly<Record<(typeof EXPECTED_LESSON_IDS)[number], string>> = {
  "descriptions-1": "a1-note-adjectives",
  "descriptions-2": "a1-note-preference-ga",
  "descriptions-3": "a1-note-comparison-yori",
  "descriptions-4": "a1-note-synthesis-recombine",
  "shopping-1": "a1-note-quantity",
  "shopping-2": "a1-note-quantity",
  "shopping-3": "a1-note-request-kudasai",
  "shopping-4": "a1-note-synthesis-recombine",
  "existence-needs-1": "a1-note-existence-aru-iru",
  "existence-needs-2": "a1-note-location-relations",
  "existence-needs-3": "a1-note-needs-wants",
  "existence-needs-4": "a1-note-synthesis-recombine",
  "capstones-1": "a1-note-synthesis-recombine",
  "capstones-2": "a1-note-synthesis-recombine",
  "capstones-3": "a1-note-synthesis-recombine",
  "capstones-4": "a1-note-synthesis-recombine",
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

function isSpokenTarget(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function variantsFor(content: A1LessonContent): readonly string[] {
  return [
    ...content.workedExampleVariantIds,
    ...(content.dialogue?.turnVariantIds ?? []),
  ];
}

function modelLexemeIds(content: A1LessonContent): ReadonlySet<string> {
  const modelIds = lessonById.get(content.lessonId)?.recipe.modelVariantIds ?? [];
  const lexemeIds = new Set<string>();
  for (const modelId of modelIds) {
    for (const valueId of Object.values(variantById.get(modelId)?.slotValues ?? {})) {
      const lexeme = a1LexemeByValueId[valueId];
      if (lexeme !== undefined) lexemeIds.add(lexeme.id);
    }
  }
  return lexemeIds;
}

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

function assertLexicalClosure(
  content: A1LessonContent,
  availableLexemeIds: ReadonlySet<string>,
): void {
  for (const variantId of variantsFor(content)) {
    const variant = variantById.get(variantId);
    expect(variant, variantId).toBeDefined();
    for (const valueId of Object.values(variant?.slotValues ?? {})) {
      const lexeme = a1LexemeByValueId[valueId];
      if (lexeme !== undefined) {
        expect(
          availableLexemeIds.has(lexeme.id),
          `${variantId} uses ${lexeme.id} before it is available`,
        ).toBe(true);
      }
    }
  }
}

describe("A1 modules 09–12 lesson content", () => {
  it("authors the exact ordered scenario and synthesis sequence", () => {
    expect(a1Modules09to12LessonContent.map(({ lessonId }) => lessonId)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(new Set(a1Modules09to12LessonContent.map(({ lessonId }) => lessonId)).size).toBe(
      EXPECTED_LESSON_IDS.length,
    );
  });

  it("freezes and resolves every reference", () => {
    for (const content of a1Modules09to12LessonContent) {
      expect(Object.isFrozen(content), content.lessonId).toBe(true);
      expect(A1_LESSON_MANIFEST[content.lessonId]).toBeDefined();
      expect(a1LearningNoteById[content.learningNoteId]).toBeDefined();
      expect(content.learningNoteId).toBe(
        EXPECTED_NOTES[content.lessonId as keyof typeof EXPECTED_NOTES],
      );
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
        expect(a1LexemeById[lexemeId], lexemeId).toBeDefined();
      }

      const modelIds = new Set(lessonById.get(content.lessonId)?.recipe.modelVariantIds);
      expect(content.workedExampleVariantIds.length).toBeGreaterThanOrEqual(2);
      expect(content.workedExampleVariantIds.length).toBeLessThanOrEqual(3);
      for (const variantId of variantsFor(content)) {
        expect(modelIds.has(variantId), `${content.lessonId} model ${variantId}`).toBe(true);
      }
    }
  });

  it("continues the exact prerequisite chain after people-4", () => {
    const expectedPrerequisites = ["people-4", ...EXPECTED_LESSON_IDS.slice(0, -1)];
    expect(
      a1Modules09to12LessonContent.map(({ prerequisiteLessonIds }) => prerequisiteLessonIds),
    ).toEqual(expectedPrerequisites.map((lessonId) => [lessonId]));
  });

  it("introduces lexemes only once in canonical A1 lesson order", () => {
    const firstLessonByLexemeId = new Map<string, string>();
    const duplicateIntroductions: string[] = [];
    const canonicalLessons = a1LessonContents;
    expect(canonicalLessons.map(({ lessonId }) => lessonId)).toEqual(A1_RETAINED_LESSON_IDS);

    for (const content of canonicalLessons) {
      const isCapstone = content.lessonId.startsWith("capstones-");
      if (isCapstone) {
        expect(content.newLexemeIds, content.lessonId).toEqual([]);
        expect(content.vocabularyException?.kind, content.lessonId).toBe("synthesis");
        continue;
      }

      expect(content.newLexemeIds.length, content.lessonId).toBeGreaterThanOrEqual(4);
      expect(content.newLexemeIds.length, content.lessonId).toBeLessThanOrEqual(6);
      expect(new Set(content.newLexemeIds).size, content.lessonId).toBe(
        content.newLexemeIds.length,
      );

      for (const lexemeId of content.newLexemeIds) {
        const firstLessonId = firstLessonByLexemeId.get(lexemeId);
        if (firstLessonId === undefined) {
          firstLessonByLexemeId.set(lexemeId, content.lessonId);
        } else {
          duplicateIntroductions.push(
            `${content.lessonId} reintroduces ${lexemeId}; first introduced in ${firstLessonId}`,
          );
        }
      }
    }

    expect(duplicateIntroductions).toEqual([]);
  });

  it("uses declared scenario vocabulary in its own models", () => {
    for (const content of a1Modules09to12LessonContent.slice(0, 12)) {
      const ownModelLexemes = modelLexemeIds(content);
      for (const lexemeId of content.newLexemeIds) {
        expect(
          ownModelLexemes.has(lexemeId),
          `${content.lessonId} declares dead vocabulary ${lexemeId}`,
        ).toBe(true);
      }
    }
  });

  it("keeps worked examples and dialogue within cumulative lexical closure", () => {
    // The five modules Base rehomed teach their vocabulary before retained A1
    // begins (Task 16 containment); it is reviewed here, never reintroduced.
    const availableLexemeIds = new Set<string>([
      ...inheritedBaseLexemeIds(),
      ...a1LessonContents
        .slice(0, a1LessonContents.findIndex(({ lessonId }) => lessonId === "descriptions-1"))
        .flatMap(({ newLexemeIds }) => newLexemeIds),
    ]);

    for (const content of a1Modules09to12LessonContent) {
      for (const lexemeId of content.newLexemeIds) availableLexemeIds.add(lexemeId);
      assertLexicalClosure(content, availableLexemeIds);
    }
  });

  it("uses the fixed five-activity semantic blueprint with alternating fourth functions", () => {
    for (let index = 0; index < a1Modules09to12LessonContent.length; index += 1) {
      const content = a1Modules09to12LessonContent[index];
      const activities = content.practiceBlueprint.activities;
      expect(activities).toEqual(
        semanticBlueprint(
          content.lessonId,
          content.workedExampleVariantIds.at(-1)!,
          index % 2 === 0 ? "contextual-response" : "transformation",
        ).activities,
      );
      expect(activities).toHaveLength(5);

      const visibleTargets = new Set<string>();
      const lesson = lessonById.get(content.lessonId);
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

  it("makes each lesson's focal form visible and gives verbs complete metadata", () => {
    const visible = (lessonId: string) =>
      variantsFor(
        a1Modules09to12LessonContent.find((content) => content.lessonId === lessonId)!,
      ).map(japanese);

    expect(visible("descriptions-1").some((line) => line.includes("あついです"))).toBe(true);
    expect(visible("descriptions-1").some((line) => line.includes("しずかです"))).toBe(true);
    expect(visible("descriptions-2").some((line) => line.includes("がすきです") || line.includes("がきらいです"))).toBe(true);
    expect(visible("descriptions-3").some((line) => line.includes("より"))).toBe(true);
    expect(visible("shopping-1").some((line) => line.includes("えん"))).toBe(true);
    expect(visible("shopping-2").some((line) => /ひとつ|ふたつ|みっつ|よっつ|いつつ/.test(line))).toBe(true);
    expect(visible("shopping-3").some((line) => line.endsWith("ください"))).toBe(true);
    expect(visible("existence-needs-1").some((line) => line.endsWith("あります"))).toBe(true);
    expect(visible("existence-needs-1").some((line) => line.endsWith("います"))).toBe(true);
    expect(visible("existence-needs-2").some((line) => line.includes("に"))).toBe(true);
    expect(visible("existence-needs-3").some((line) => line.includes("ほしいです"))).toBe(true);

    for (const content of a1Modules09to12LessonContent) {
      for (const variantId of variantsFor(content)) {
        const variant = variantById.get(variantId);
        const family = familyById.get(variant?.sentenceFamilyId ?? "");
        if (variant === undefined || family === undefined) continue;
        const realized = realizeVariant(family, variant, realizeCatalogs, {
          availableConceptIds: [...family.requiredConceptIds],
        });
        if (!realized.ok) throw new Error(`Could not realize ${variantId}`);
        const lexeme = a1LexemeById[
          senseById.get(realized.sentence.predicateSenseId)?.lexemeId ?? ""
        ];
        if (lexeme?.category === "verb") {
          expect(lexeme.verb, `${variantId} verb metadata`).toBeDefined();
          expect(lexeme.verb?.dictionary.kana).not.toHaveLength(0);
          expect(lexeme.verb?.polite.kana).not.toHaveLength(0);
        }
      }
    }
  });

  it("keeps capstones as vocabulary-free three-turn synthesis scenarios", () => {
    const instructionalLexemes = new Set(
      a1Modules09to12LessonContent.slice(0, 12).flatMap(({ newLexemeIds }) => newLexemeIds),
    );
    const priorLexemes = new Set([
      ...inheritedBaseLexemeIds(),
      ...a1LessonContents
        .slice(0, a1LessonContents.findIndex(({ lessonId }) => lessonId === "capstones-1"))
        .flatMap(({ newLexemeIds }) => newLexemeIds),
      ...instructionalLexemes,
    ]);

    for (const content of a1Modules09to12LessonContent.slice(12)) {
      expect(content.newLexemeIds).toEqual([]);
      expect(content.vocabularyException?.kind).toBe("synthesis");
      expect(content.vocabularyException?.reason.en.trim()).not.toHaveLength(0);
      expect(content.vocabularyException?.reason.it.trim()).not.toHaveLength(0);
      expect(content.learningNoteId).toBe("a1-note-synthesis-recombine");
      expect(content.dialogue?.turnVariantIds).toHaveLength(3);
      assertLexicalClosure(content, priorLexemes);
    }
  });
});
