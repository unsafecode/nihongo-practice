import { describe, expect, it } from "vitest";

import { a1CanonicalFoundationLearningNoteById } from "./grammar";
import {
  a1AllStagedFoundationsCatalogs,
  a1AllStagedFoundationsCopy,
  a1FoundationsArea03to04BuiltLessons,
  a1FoundationsArea03to04LessonContent,
} from "./foundationsArea03to04";
import { a1FoundationsArea01to02LessonContent } from "./foundationsArea01to02";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import { validateReviewRetrievalPair } from "./validateA1Curriculum";
import { FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON } from "../catalog/foundationsShared";

const EXPECTED_LESSON_IDS = [
  "polite-verbs-1",
  "polite-verbs-2",
  "polite-verbs-3",
  "polite-verbs-4",
  "time-movement-1",
  "time-movement-2",
  "time-movement-3",
  "time-movement-4",
] as const;

const EXPECTED_NOTE_IDS = [
  "a1-note-dictionary-masu-classes",
  "a1-note-masu-object-o",
  "a1-note-masu-masen",
  "a1-note-location-ni-de-contrast",
  "a1-note-time-ni",
  "a1-note-mashita",
  "a1-note-mashita-masen-deshita",
  "a1-note-direction-transport-dialogue",
] as const;

const allStagedContent = [
  ...a1FoundationsArea01to02LessonContent,
  ...a1FoundationsArea03to04LessonContent,
];

function generatedTargets(
  lessonId: string,
  content: (typeof a1FoundationsArea03to04LessonContent)[number],
) {
  const built = buildLessonViewModel({
    catalogs: a1AllStagedFoundationsCatalogs,
    copy: a1AllStagedFoundationsCopy,
    lessonId,
    locale: "en",
    catalogVersion: "a1-foundations-staged-all",
    seed: "a1-foundations-staged-all",
  });
  expect(built.ok, lessonId).toBe(true);
  if (!built.ok) throw new Error(`Could not build ${lessonId}.`);

  return content.practiceBlueprint.activities.flatMap((activity) => {
    if ("spokenVariantId" in activity.targetRef) return [];
    const round = activity.targetRef.round === "one" ? 0 : 1;
    const target = built.model.rounds[round].targets[activity.targetRef.index];
    if (!target) return [];
    return [{
      id: activity.id,
      function: activity.function,
      visibleTargetKey: target.visibleTargetKey,
      assessedIds: [content.learningNoteId],
    }];
  });
}

describe("staged Foundations learner content 03–04", () => {
  it("keeps the exact last-eight lesson and note progression outside the published curriculum", () => {
    expect(a1FoundationsArea03to04LessonContent.map(({ lessonId }) => lessonId)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(
      a1FoundationsArea03to04LessonContent.map(({ learningNoteId }) => learningNoteId),
    ).toEqual(EXPECTED_NOTE_IDS);
    expect(
      EXPECTED_LESSON_IDS.map(
        (lessonId) => FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON[lessonId],
      ),
    ).toEqual(EXPECTED_NOTE_IDS);
  });

  it("uses complete composite notes instead of claiming a particle note teaches an unexplained form", () => {
    expect(a1CanonicalFoundationLearningNoteById["a1-note-masu-object-o"]).toMatchObject({
      kind: "grammar",
      explainedConceptIds: ["a1-concept-object-wo"],
      explainedVerbForms: [
        { polarity: "affirmative", tense: "present", formality: "polite" },
      ],
    });
    expect(
      a1CanonicalFoundationLearningNoteById["a1-note-direction-transport-dialogue"],
    ).toMatchObject({
      kind: "synthesis",
      explainedConceptIds: [
        "a1-concept-direction-he",
        "a1-concept-transport-de",
      ],
      requiredConceptIds: ["a1-concept-location-particle"],
    });
  });

  it("gives every lesson exact first-use vocabulary, natural bilingual copy, and five practice activities", () => {
    const recipes = new Map(
      a1FoundationsArea03to04BuiltLessons.map(({ recipe }) => [recipe.id, recipe]),
    );

    for (const content of a1FoundationsArea03to04LessonContent) {
      const expectedLexemeCount = content.lessonId === "polite-verbs-3" ? 5 : 4;
      expect(content.newLexemeIds).toHaveLength(expectedLexemeCount);
      expect(new Set(content.newLexemeIds).size).toBe(expectedLexemeCount);
      expect(content.situation.en).toMatch(/\S/);
      expect(content.situation.it).toMatch(/\S/);
      expect(content.retrievalCue.en).toMatch(/\S/);
      expect(content.retrievalCue.it).toMatch(/\S/);
      expect(JSON.stringify(content)).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
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

  it("uses exactly the two planned three-turn mini-dialogues", () => {
    const dialogueLessonIds = a1FoundationsArea03to04LessonContent
      .filter(({ dialogue }) => dialogue !== undefined)
      .map(({ lessonId }) => lessonId);
    expect(dialogueLessonIds).toEqual(["polite-verbs-4", "time-movement-4"]);

    for (const lessonId of dialogueLessonIds) {
      const dialogue = a1FoundationsArea03to04LessonContent.find(
        (content) => content.lessonId === lessonId,
      )?.dialogue;
      expect(dialogue?.turnVariantIds).toHaveLength(3);
    }
  });

  it("builds all sixteen staged lessons with two prompts per round, speech, and a safe retrieval alternate", () => {
    expect(a1AllStagedFoundationsCatalogs.modules).toHaveLength(4);
    expect(a1AllStagedFoundationsCatalogs.lessons).toHaveLength(16);
    expect(a1AllStagedFoundationsCatalogs.lessonPositions).toHaveLength(16);

    for (const content of allStagedContent) {
      const targets = generatedTargets(content.lessonId, content);
      expect(targets).toHaveLength(4);
      for (const source of targets) {
        expect(
          targets.some(
            (candidate) =>
              candidate.id !== source.id &&
              validateReviewRetrievalPair(source, candidate) === undefined,
          ),
          `${content.lessonId}:${source.id}`,
        ).toBe(true);
      }
    }
  });
});
