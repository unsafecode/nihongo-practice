import { describe, expect, it } from "vitest";

import { buildA1LessonViewModel } from "../a1LessonViewModel";
import { a1FoundationCatalogs, a1FoundationCopy } from "../catalog/catalog";
import { a1LessonContents } from "./catalog";
import { a1LearningNotes, type A1LearningNote } from "./grammar";
import { a1Lexemes } from "./lexicon";
import type { A1LessonContent } from "./types";
import {
  A1_CURRICULUM_ERROR_CODES,
  validateA1Curriculum,
  validateReviewRetrievalPair,
} from "./validateA1Curriculum";

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

const clone = <T>(value: T): T => structuredClone(value);

function contentsFixture(
  mutate: (contents: A1LessonContent[]) => void,
) {
  const contents = clone(a1LessonContents) as A1LessonContent[];
  mutate(contents);
  return validateA1Curriculum({ lessonContents: contents });
}

function mutableLesson(
  contents: A1LessonContent[],
  lessonId: string,
): Mutable<A1LessonContent> {
  const lesson = contents.find((content) => content.lessonId === lessonId);
  if (!lesson) throw new Error(`missing fixture lesson ${lessonId}`);
  return lesson as Mutable<A1LessonContent>;
}

function expectAttributed(
  result: ReturnType<typeof validateA1Curriculum>,
  code: (typeof A1_CURRICULUM_ERROR_CODES)[number],
  expected: Partial<{ lessonId: string; id: string; referenceId: string; stage: string }> = {},
): void {
  expect(result.valid).toBe(false);
  expect(result.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code,
        stage: expect.any(String),
        ...expected,
      }),
    ]),
  );
}

describe("validateA1Curriculum", () => {
  it("validates the frozen production curriculum with every required error code declared", () => {
    expect(A1_CURRICULUM_ERROR_CODES).toEqual([
      "missing-instructional-content",
      "missing-locale-copy",
      "invalid-new-word-count",
      "invalid-vocabulary-exception",
      "duplicate-lexeme-introduction",
      "unintroduced-lexeme-use",
      "unglossed-lexeme-use",
      "verb-form-unexplained",
      "grammar-prerequisite-order",
      "grammar-explanation-missing",
      "future-content-in-example",
      "future-content-in-dialogue",
      "invalid-practice-count",
      "insufficient-practice-functions",
      "missing-practice-function",
      "consecutive-practice-function",
      "duplicate-practice-target",
      "practice-kind-mismatch",
      "invalid-worked-example-count",
      "worked-example-unresolvable",
      "invalid-section-order",
      "review-retrieval-clone",
    ]);

    const result = validateA1Curriculum();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a review candidate that clones its source target", () => {
    const result = validateReviewRetrievalPair(
      {
        id: "source",
        function: "meaning-comprehension",
        visibleTargetKey: "source",
        assessedIds: ["a1-lexeme-watashi"],
      },
      {
        id: "candidate",
        function: "form-discrimination",
        visibleTargetKey: "source",
        assessedIds: ["a1-lexeme-watashi"],
      },
    );

    expect(result).toMatchObject({
      code: "review-retrieval-clone",
      stage: "review",
      id: "candidate",
      referenceId: "source",
      dimension: "same-visible-target",
    });
  });

  it.each([
    [
      "reuses the same function",
      {
        function: "meaning-comprehension" as const,
        visibleTargetKey: "candidate",
        assessedIds: ["a1-concept-topic-wa"],
      },
      "same-function",
    ],
    [
      "has no assessed semantic overlap",
      {
        function: "form-discrimination" as const,
        visibleTargetKey: "candidate",
        assessedIds: ["a1-concept-object-wo"],
      },
      "no-assessed-overlap",
    ],
  ])("rejects a review candidate that %s", (_description, candidate, dimension) => {
    expect(
      validateReviewRetrievalPair(
        {
          function: "meaning-comprehension",
          visibleTargetKey: "source",
          assessedIds: ["a1-concept-topic-wa"],
        },
        candidate,
      ),
    ).toMatchObject({ code: "review-retrieval-clone", dimension });
  });
});

describe("validateA1Curriculum — attributed broken fixtures", () => {
  it("reports missing-instructional-content for a missing manifest lesson", () => {
    const result = contentsFixture((contents) => {
      contents.splice(
        contents.findIndex((content) => content.lessonId === "introductions-1"),
        1,
      );
    });

    expectAttributed(result, "missing-instructional-content", {
      lessonId: "introductions-1",
      stage: "catalog",
    });
  });

  it("reports missing-locale-copy for an empty natural translation", () => {
    const copy = clone(a1FoundationCopy) as { en: Record<string, string>; it: Record<string, string> };
    copy.en["introductions-1-m1-translation"] = "";

    const result = validateA1Curriculum({ foundationCopy: copy });

    expectAttributed(result, "missing-locale-copy", {
      lessonId: "introductions-1",
      id: "introductions-1-m1",
      stage: "locale",
    });
  });

  it("reports invalid-new-word-count for fewer than four instructional words", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      lesson.newLexemeIds = lesson.newLexemeIds.slice(0, 3);
    });

    expectAttributed(result, "invalid-new-word-count", {
      lessonId: "introductions-1",
      stage: "lexical",
    });
  });

  it("reports invalid-vocabulary-exception on a non-capstone lesson", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      lesson.vocabularyException = {
        kind: "synthesis",
        reason: { en: "Incorrect exception.", it: "Eccezione non corretta." },
      };
    });

    expectAttributed(result, "invalid-vocabulary-exception", {
      lessonId: "introductions-1",
      stage: "lexical",
    });
  });

  it("reports duplicate-lexeme-introduction with the first lesson reference", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-2");
      lesson.newLexemeIds = [
        "a1-lexeme-watashi",
        ...lesson.newLexemeIds.slice(1),
      ];
    });

    expectAttributed(result, "duplicate-lexeme-introduction", {
      lessonId: "introductions-2",
      id: "a1-lexeme-watashi",
      referenceId: "sentence-foundations-1",
      stage: "lexical",
    });
  });

  it("reports unintroduced-lexeme-use when an early model takes a real later value", () => {
    const catalogs = clone(a1FoundationCatalogs);
    const variant = catalogs.sentenceVariants.find((entry) => entry.id === "introductions-1-m7")!;
    (variant.slotValues as Record<string, string>).object = "a1-value-obj-tea";

    const result = validateA1Curriculum({ foundationCatalogs: catalogs });

    expectAttributed(result, "unintroduced-lexeme-use", {
      lessonId: "introductions-1",
      id: "introductions-1-m7",
      referenceId: "a1-lexeme-ocha",
      stage: "lexical",
    });
  });

  it("reports unglossed-lexeme-use when a real token loses its English gloss", () => {
    const lexemes = clone(a1Lexemes);
    const yuki = lexemes.find((lexeme) => lexeme.id === "a1-lexeme-yuki")!;
    (yuki.meaning as { en: string; it: string }).en = "";

    const result = validateA1Curriculum({ lexemes });

    expectAttributed(result, "unglossed-lexeme-use", {
      lessonId: "introductions-1",
      referenceId: "a1-lexeme-yuki",
      stage: "lexical",
    });
  });

  it("reports verb-form-unexplained when the past explanation is removed", () => {
    const notes = clone(a1LearningNotes);
    const note = notes.find((entry) => entry.id === "a1-note-mashita")! as Mutable<A1LearningNote>;
    note.explainedVerbForms = [];

    const result = validateA1Curriculum({ learningNotes: notes });

    expectAttributed(result, "verb-form-unexplained", {
      lessonId: "past-negative-1",
      id: "past-negative-1-m1",
      stage: "grammar",
    });
  });

  it("reports grammar-prerequisite-order for a note requiring a future concept", () => {
    const notes = clone(a1LearningNotes);
    const note = notes.find((entry) => entry.id === "a1-note-particle-ga")! as Mutable<A1LearningNote>;
    note.requiredConceptIds = ["a1-concept-transport-de"];

    const result = validateA1Curriculum({ learningNotes: notes });

    expectAttributed(result, "grammar-prerequisite-order", {
      lessonId: "topic-questions-2",
      id: "a1-note-particle-ga",
      referenceId: "a1-concept-transport-de",
      stage: "grammar",
    });
  });

  it("reports grammar-explanation-missing when a first-use concept is no longer explained", () => {
    const notes = clone(a1LearningNotes);
    const note = notes.find((entry) => entry.id === "a1-note-sentence-chunks")! as Mutable<A1LearningNote>;
    note.explainedConceptIds = note.explainedConceptIds.filter(
      (conceptId) => conceptId !== "a1-concept-topic-wa",
    );

    const result = validateA1Curriculum({ learningNotes: notes });

    expectAttributed(result, "grammar-explanation-missing", {
      lessonId: "sentence-foundations-1",
      referenceId: "a1-concept-topic-wa",
      stage: "grammar",
    });
  });

  it("does not let an incidental early object explanation unlock use before polite-verbs-2", () => {
    const notes = clone(a1LearningNotes);
    const note = notes.find(
      (entry) => entry.id === "a1-note-sentence-chunks",
    )! as Mutable<A1LearningNote>;
    note.explainedConceptIds = [...note.explainedConceptIds, "a1-concept-object-wo"];
    const catalogs = clone(a1FoundationCatalogs);
    const earlyObjectVariant = catalogs.sentenceVariants.find(
      (entry) => entry.id === "topic-questions-4-m7",
    ) as unknown as {
      sentenceFamilyId: string;
      slotValues: Record<string, string>;
    };
    earlyObjectVariant.sentenceFamilyId = "a1-family-object-action";
    earlyObjectVariant.slotValues = {
      subject: "a1-value-kore",
      predicate: "a1-value-eat",
      object: "a1-value-obj-bread",
    };

    const result = validateA1Curriculum({
      learningNotes: notes,
      foundationCatalogs: catalogs,
    });

    expectAttributed(result, "grammar-explanation-missing", {
      lessonId: "topic-questions-4",
      id: "topic-questions-4-m7",
      referenceId: "a1-concept-object-wo",
      stage: "grammar",
    });
  });

  it("reports future-content-in-example for a real owned example changed to a later value", () => {
    const catalogs = clone(a1FoundationCatalogs);
    const variant = catalogs.sentenceVariants.find((entry) => entry.id === "introductions-1-m1")!;
    (variant.slotValues as Record<string, string>).object = "a1-value-obj-tea";

    const result = validateA1Curriculum({ foundationCatalogs: catalogs });

    expectAttributed(result, "future-content-in-example", {
      lessonId: "introductions-1",
      id: "introductions-1-m1",
      referenceId: "a1-lexeme-ocha",
      stage: "lexical",
    });
  });

  it("reports future-content-in-dialogue for a real dialogue-only owned model changed to a later value", () => {
    const catalogs = clone(a1FoundationCatalogs);
    const variant = catalogs.sentenceVariants.find((entry) => entry.id === "introductions-1-m2")!;
    (variant.slotValues as Record<string, string>).object = "a1-value-obj-tea";

    const result = validateA1Curriculum({ foundationCatalogs: catalogs });

    expectAttributed(result, "future-content-in-dialogue", {
      lessonId: "introductions-1",
      id: "introductions-1-m2",
      referenceId: "a1-lexeme-ocha",
      stage: "lexical",
    });
  });

  it("reports invalid-practice-count for a four-activity blueprint", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      const activities = [...lesson.practiceBlueprint.activities];
      activities.pop();
      lesson.practiceBlueprint = { activities: activities as never };
    });

    expectAttributed(result, "invalid-practice-count", {
      lessonId: "introductions-1",
      stage: "practice",
    });
  });

  it("reports insufficient-practice-functions when only two functions remain", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      lesson.practiceBlueprint = {
        activities: lesson.practiceBlueprint.activities.map((activity, index) => ({
          ...activity,
          function: index === 4 ? "listening-speaking" : "meaning-comprehension",
        })) as never,
      };
    });

    expectAttributed(result, "insufficient-practice-functions", {
      lessonId: "introductions-1",
      stage: "practice",
    });
  });

  it("reports missing-practice-function for a replaced required function", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      const activities = [...lesson.practiceBlueprint.activities];
      activities[1] = { ...activities[1], function: "contextual-response" };
      lesson.practiceBlueprint = { activities: activities as never };
    });

    expectAttributed(result, "missing-practice-function", {
      lessonId: "introductions-1",
      referenceId: "form-discrimination",
      stage: "practice",
    });
  });

  it("reports consecutive-practice-function for adjacent repeated functions", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      const activities = [...lesson.practiceBlueprint.activities];
      activities[1] = { ...activities[1], function: activities[0].function };
      lesson.practiceBlueprint = { activities: activities as never };
    });

    expectAttributed(result, "consecutive-practice-function", {
      lessonId: "introductions-1",
      id: "introductions-1-form",
      stage: "practice",
    });
  });

  it("reports duplicate-practice-target for a spoken clone of a selected production target", () => {
    const built = buildA1LessonViewModel("introductions-1", "en");
    if (!built.ok) throw new Error("production lesson should build");
    const selectedVariantId = built.model.rounds[0].targets[0].variantId;
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      const activities = [...lesson.practiceBlueprint.activities];
      activities[4] = {
        ...activities[4],
        targetRef: { spokenVariantId: selectedVariantId },
      };
      lesson.practiceBlueprint = { activities: activities as never };
    });

    expectAttributed(result, "duplicate-practice-target", {
      lessonId: "introductions-1",
      id: "introductions-1-spoken",
      stage: "practice",
    });
  });

  it("reports practice-kind-mismatch for a non-spoken kind on the spoken activity", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      const activities = [...lesson.practiceBlueprint.activities];
      activities[4] = { ...activities[4], interactionKind: "choice" };
      lesson.practiceBlueprint = { activities: activities as never };
    });

    expectAttributed(result, "practice-kind-mismatch", {
      lessonId: "introductions-1",
      id: "introductions-1-spoken",
      stage: "practice",
    });
  });

  it("reports invalid-worked-example-count for one example", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      lesson.workedExampleVariantIds = ["introductions-1-m1"] as never;
    });

    expectAttributed(result, "invalid-worked-example-count", {
      lessonId: "introductions-1",
      stage: "realization",
    });
  });

  it("reports worked-example-unresolvable for an unknown owned-example reference", () => {
    const result = contentsFixture((contents) => {
      const lesson = mutableLesson(contents, "introductions-1");
      lesson.workedExampleVariantIds = [
        "does-not-exist",
        "introductions-1-m4",
      ] as never;
    });

    expectAttributed(result, "worked-example-unresolvable", {
      lessonId: "introductions-1",
      id: "does-not-exist",
      stage: "realization",
    });
  });

  it("reports invalid-section-order for a reordered semantic contract", () => {
    const result = validateA1Curriculum({
      semanticSectionOrder: [
        "rule",
        "grammar",
        "vocabulary",
        "comparison",
        "explore",
        "recap",
      ],
    });

    expectAttributed(result, "invalid-section-order", { stage: "sections" });
  });
});
