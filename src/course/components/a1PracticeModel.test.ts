import { describe, expect, it } from "vitest";
import {
  a1LearningNoteById,
  a1LessonContentById,
  a1LessonContents,
  a1LexemeById,
} from "../a1/curriculum/catalog";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";
import { module1ItemsByLesson, module1Lessons } from "../a1/catalog/module01Sounds";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import {
  buildA1PracticeModel,
  type A1PracticeModel,
} from "./a1PracticeModel";
import { getLessonExercises } from "./lessonExerciseModel";

function expectOk(lessonId: string): A1PracticeModel {
  const result = buildA1PracticeModel(lessonId);
  expect(result.ok, lessonId).toBe(true);
  if (!result.ok) throw new Error(`${lessonId}: ${result.error.code}`);
  return result.model;
}

describe("buildA1PracticeModel — selected semantic targets", () => {
  it("orders introductions-1's four generated targets by its blueprint, then appends spoken", () => {
    const content = a1LessonContentById["introductions-1"]!;
    const foundation = buildA1LessonViewModel("introductions-1", "en");
    if (!foundation.ok) throw new Error("introductions-1 foundation model unavailable");
    const spokenBlueprint = content.practiceBlueprint.activities[4];
    if (!("spokenVariantId" in spokenBlueprint.targetRef)) {
      throw new Error("introductions-1 spoken blueprint missing");
    }

    const model = expectOk("introductions-1");
    expect(model.activities.map((activity) => activity.id)).toEqual(
      content.practiceBlueprint.activities.map((activity) => activity.id),
    );
    expect(model.activities).toHaveLength(5);

    const generated = model.activities.slice(0, 4);
    const expectedDefinitionIds = content.practiceBlueprint.activities
      .filter((activity) => activity.interactionKind !== "spoken")
      .map((activity) => {
        if ("spokenVariantId" in activity.targetRef) throw new Error("unexpected spoken ref");
        const round =
          activity.targetRef.round === "one"
            ? foundation.model.rounds[0]
            : foundation.model.rounds[1];
        return round.targets[activity.targetRef.index]?.targetId;
      });
    expect(generated.map((activity) => activity.generatedExercise?.definitionId)).toEqual(
      expectedDefinitionIds,
    );
    for (const activity of generated) {
      expect(activity.generatedExercise).toBeDefined();
      expect(activity.generatedExercise?.practiceFunction).toBe(activity.function);
      expect(activity.generatedExercise?.prompt.kind).toBe(activity.interactionKind);
      expect(activity.spokenVariantId).toBeUndefined();
    }
    expect(model.activities[4]).toMatchObject({
      id: "introductions-1-spoken",
      function: "listening-speaking",
      interactionKind: "spoken",
      spokenVariantId: spokenBlueprint.targetRef.spokenVariantId,
    });
    expect(model.activities[4]?.generatedExercise).toBeUndefined();
  });

  it("exposes non-empty localized, answer-safe feedback for every selected A1 exercise", () => {
    for (const content of a1LessonContents) {
      const model = expectOk(content.lessonId);
      for (const activity of model.activities) {
        const exercise = activity.generatedExercise;
        if (!exercise) continue;
        expect(exercise.practiceFunction).toBe(activity.function);
        const note = a1LearningNoteById[content.learningNoteId]!;
        const sense = a1FoundationCatalogs.learningTargetSenses.find((candidate) =>
          exercise.prompt.assessedLexemeIds.includes(candidate.id),
        );
        const lexeme =
          (sense ? a1LexemeById[sense.lexemeId] : undefined) ??
          content.newLexemeIds
            .map((id) => a1LexemeById[id])
            .find((candidate) => candidate !== undefined);
        for (const locale of ["en", "it"] as const) {
          const feedback = exercise.feedback[locale];
          expect(feedback.accepted.trim(), `${content.lessonId} accepted ${locale}`).not.toBe("");
          expect(feedback.retry.trim(), `${content.lessonId} retry ${locale}`).not.toBe("");
          expect(feedback.accepted).toContain(note.title[locale]);
          expect(feedback.retry).toContain(note.title[locale]);
          if (lexeme) {
            expect(feedback.accepted).toContain(lexeme.meaning[locale]);
            expect(feedback.retry).toContain(lexeme.meaning[locale]);
          }
          expect(feedback.accepted).not.toContain(exercise.visibleTargetKey);
          expect(feedback.retry).not.toContain(exercise.visibleTargetKey);
        }
      }
    }
  });
});

describe("buildA1PracticeModel — phonetic targets", () => {
  it("does not build a semantic foundation for phonetic lessons", () => {
    let semanticBuilds = 0;
    const countingBuilder = (
      ...args: Parameters<typeof buildA1LessonViewModel>
    ) => {
      semanticBuilds += 1;
      return buildA1LessonViewModel(...args);
    };

    const result = buildA1PracticeModel(module1Lessons[0]!.id, {
      buildA1LessonViewModel: countingBuilder,
    });

    expect(result.ok).toBe(true);
    expect(semanticBuilds).toBe(0);
  });

  it("uses exactly the four selected practice refs and a separate fifth spoken item", () => {
    for (const lesson of module1Lessons) {
      const content = a1LessonContentById[lesson.id]!;
      const items = module1ItemsByLesson[lesson.id]!;
      const model = expectOk(lesson.id);
      const generated = model.activities.filter((activity) => activity.generatedExercise !== undefined);
      const spoken = model.activities.at(-1)!;

      expect(lesson.practiceTargetRefs).toHaveLength(4);
      expect(generated.map((activity) => activity.generatedExercise?.definitionId)).toEqual(
        lesson.practiceTargetRefs,
      );
      expect(generated.map((activity) => activity.generatedExercise?.prompt.assessedConceptIds[0])).toEqual(
        items.slice(0, 4).map((item) => item.id),
      );
      expect(spoken).toMatchObject({
        function: "listening-speaking",
        interactionKind: "spoken",
        spokenVariantId: items[4]?.id,
      });
      expect(content.practiceBlueprint.activities).toHaveLength(5);
    }
  });
});

describe("buildA1PracticeModel — fail-closed target matching", () => {
  it("builds one semantic foundation while preserving the realized activities", () => {
    let semanticBuilds = 0;
    const countingBuilder = (
      ...args: Parameters<typeof buildA1LessonViewModel>
    ) => {
      semanticBuilds += 1;
      return buildA1LessonViewModel(...args);
    };

    const result = buildA1PracticeModel("introductions-1", {
      buildA1LessonViewModel: countingBuilder,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.activities.map((activity) => activity.id)).toEqual(
      a1LessonContentById["introductions-1"]!.practiceBlueprint.activities.map(
        (activity) => activity.id,
      ),
    );
    expect(semanticBuilds).toBe(1);
  });

  it("returns an explicit unknown-lesson error rather than an empty practice model", () => {
    const result = buildA1PracticeModel("not-a-real-lesson");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "unknown-lesson",
      referenceId: "not-a-real-lesson",
    });
    expect("model" in result).toBe(false);
  });

  it("does not return a partial model when one blueprint target has no generated exercise", () => {
    const existing = getLessonExercises("introductions-1")!;
    const result = buildA1PracticeModel("introductions-1", {
      getLessonExercises: (lessonId) =>
        lessonId === "introductions-1"
          ? {
              ...existing,
              exercises: existing.exercises.slice(1),
            }
          : getLessonExercises(lessonId),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unresolved-exercise");
    expect("model" in result).toBe(false);
  });

  it("does not return a partial model when a target resolves more than once", () => {
    const existing = getLessonExercises("introductions-1")!;
    const duplicate = existing.exercises[0]!;
    const result = buildA1PracticeModel("introductions-1", {
      getLessonExercises: (lessonId) =>
        lessonId === "introductions-1"
          ? {
              ...existing,
              exercises: [...existing.exercises, duplicate],
            }
          : getLessonExercises(lessonId),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("duplicate-target");
    expect("model" in result).toBe(false);
  });
});
