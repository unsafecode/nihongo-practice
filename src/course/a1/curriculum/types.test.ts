import { describe, expect, it } from "vitest";

import {
  A1_PRACTICE_FUNCTIONS,
  A1_SEMANTIC_SECTION_ORDER,
  defineA1LessonContent,
  type A1LessonContent,
} from "./types";

const bilingual = (en: string, it: string) => ({ en, it });

function introductionsOneContent(): A1LessonContent {
  return {
    lessonId: "introductions-1",
    situation: bilingual("Meeting someone for the first time.", "Incontrare qualcuno per la prima volta."),
    prerequisiteLessonIds: [],
    prerequisiteConceptIds: [],
    newLexemeIds: ["a1-lexeme-watashi"],
    learningNoteId: "a1-note-introductions",
    workedExampleVariantIds: ["a1-variant-introduction-one", "a1-variant-introduction-two"],
    dialogue: {
      turnVariantIds: ["a1-variant-dialogue-one", "a1-variant-dialogue-two"],
    },
    practiceBlueprint: {
      activities: [
        {
          id: "introductions-1-meaning",
          function: "meaning-comprehension",
          interactionKind: "choice",
          targetRef: { round: "one", index: 0 },
        },
        {
          id: "introductions-1-form",
          function: "form-discrimination",
          interactionKind: "tile-ordering",
          targetRef: { round: "one", index: 1 },
        },
        {
          id: "introductions-1-production",
          function: "controlled-production",
          interactionKind: "completion",
          targetRef: { round: "one", index: 2 },
        },
        {
          id: "introductions-1-context",
          function: "contextual-response",
          interactionKind: "constrained-construction",
          targetRef: { round: "two", index: 0 },
        },
        {
          id: "introductions-1-speaking",
          function: "listening-speaking",
          interactionKind: "spoken",
          targetRef: { spokenVariantId: "a1-variant-spoken-introduction" },
        },
      ],
    },
    retrievalCue: bilingual("Introduce yourself.", "Presentati."),
  };
}

describe("A1 instructional curriculum contracts", () => {
  it("defines the semantic section order", () => {
    expect(A1_SEMANTIC_SECTION_ORDER).toEqual([
      "rule",
      "vocabulary",
      "grammar",
      "comparison",
      "explore",
      "recap",
    ]);
  });

  it("defines the practice functions", () => {
    expect(A1_PRACTICE_FUNCTIONS).toEqual([
      "meaning-comprehension",
      "form-discrimination",
      "controlled-production",
      "transformation",
      "contextual-response",
      "listening-speaking",
    ]);
  });

  it("rejects consecutive duplicate functions in introductions-1's five activities", () => {
    const content = introductionsOneContent();
    const activities = [...content.practiceBlueprint.activities];
    activities[1] = { ...activities[1], function: "meaning-comprehension" };

    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: {
          activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ).toThrow(/consecutive.*function/i);
  });

  it("exposes new lexeme ids as readonly", () => {
    const content = introductionsOneContent();
    if (false) {
      // @ts-expect-error A1 learner-facing content cannot mutate its lexeme references.
      content.newLexemeIds.push("a1-lexeme-anata");
    }
    expect(content.newLexemeIds).toEqual(["a1-lexeme-watashi"]);
  });

  it.each([
    ["lesson id", (content: A1LessonContent) => ({ ...content, lessonId: "" })],
    [
      "English situation",
      (content: A1LessonContent) => ({ ...content, situation: bilingual("", content.situation.it) }),
    ],
    [
      "Italian situation",
      (content: A1LessonContent) => ({ ...content, situation: bilingual(content.situation.en, "") }),
    ],
    [
      "prerequisite lesson id",
      (content: A1LessonContent) => ({ ...content, prerequisiteLessonIds: [""] }),
    ],
    [
      "prerequisite concept id",
      (content: A1LessonContent) => ({ ...content, prerequisiteConceptIds: [""] }),
    ],
    [
      "new lexeme id",
      (content: A1LessonContent) => ({ ...content, newLexemeIds: [""] }),
    ],
    ["learning note id", (content: A1LessonContent) => ({ ...content, learningNoteId: "" })],
    [
      "worked example id",
      (content: A1LessonContent) => ({ ...content, workedExampleVariantIds: ["", "a1-variant-two"] as const }),
    ],
    [
      "dialogue turn id",
      (content: A1LessonContent) => ({
        ...content,
        dialogue: { turnVariantIds: ["", "a1-variant-dialogue-two"] as const },
      }),
    ],
    [
      "activity id",
      (content: A1LessonContent) => ({
        ...content,
        practiceBlueprint: {
          activities: content.practiceBlueprint.activities.map((activity, index) =>
            index === 0 ? { ...activity, id: "" } : activity,
          ) as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ],
    [
      "spoken target id",
      (content: A1LessonContent) => ({
        ...content,
        practiceBlueprint: {
          activities: content.practiceBlueprint.activities.map((activity, index) =>
            index === 4 ? { ...activity, targetRef: { spokenVariantId: "" } } : activity,
          ) as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ],
    [
      "English retrieval cue",
      (content: A1LessonContent) => ({ ...content, retrievalCue: bilingual("", content.retrievalCue.it) }),
    ],
    [
      "Italian retrieval cue",
      (content: A1LessonContent) => ({ ...content, retrievalCue: bilingual(content.retrievalCue.en, "") }),
    ],
    [
      "vocabulary exception reason",
      (content: A1LessonContent) => ({
        ...content,
        newLexemeIds: [],
        vocabularyException: { kind: "synthesis" as const, reason: bilingual("", "Riepilogo.") },
      }),
    ],
  ])("rejects an empty required %s", (_field, change) => {
    expect(() => defineA1LessonContent(change(introductionsOneContent()))).toThrow(/empty|required/i);
  });

  it.each([
    ["fewer than five", (activities: A1LessonContent["practiceBlueprint"]["activities"]) => activities.slice(0, 4)],
    [
      "more than five",
      (activities: A1LessonContent["practiceBlueprint"]["activities"]) => [
        ...activities,
        {
          id: "introductions-1-extra",
          function: "transformation" as const,
          interactionKind: "transformation" as const,
          targetRef: { round: "two" as const, index: 4 },
        },
      ],
    ],
  ])("rejects an activity list with %s", (_description, change) => {
    const content = introductionsOneContent();
    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: { activities: change(content.practiceBlueprint.activities) as never },
      }),
    ).toThrow(/exactly five/i);
  });

  it("rejects duplicate activity ids", () => {
    const content = introductionsOneContent();
    const activities = [...content.practiceBlueprint.activities];
    activities[1] = { ...activities[1], id: activities[0].id };

    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: {
          activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ).toThrow(/duplicate.*activity id/i);
  });

  it("rejects duplicate non-spoken target references", () => {
    const content = introductionsOneContent();
    const activities = [...content.practiceBlueprint.activities];
    activities[1] = { ...activities[1], targetRef: { round: "one", index: 0 } };

    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: {
          activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ).toThrow(/duplicate.*target/i);
  });

  it.each(["meaning-comprehension", "form-discrimination", "controlled-production", "listening-speaking"] as const)(
    "requires a %s activity",
    (requiredFunction) => {
      const content = introductionsOneContent();
      const activities = content.practiceBlueprint.activities.map((activity) =>
        activity.function === requiredFunction
          ? {
              ...activity,
              function: "transformation" as const,
              interactionKind: "transformation" as const,
              targetRef: { round: "two" as const, index: 2 },
            }
          : activity,
      );

      expect(() =>
        defineA1LessonContent({
          ...content,
          practiceBlueprint: {
            activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
          },
        }),
      ).toThrow(new RegExp(`missing.*${requiredFunction}`, "i"));
    },
  );

  it.each([
    [
      "non-spoken interaction",
      (activity: A1LessonContent["practiceBlueprint"]["activities"][number]) => ({
        ...activity,
        interactionKind: "choice" as const,
      }),
    ],
    [
      "non-spoken target",
      (activity: A1LessonContent["practiceBlueprint"]["activities"][number]) => ({
        ...activity,
        targetRef: { round: "two" as const, index: 3 },
      }),
    ],
  ])("requires listening-speaking to reject a %s", (_description, change) => {
    const content = introductionsOneContent();
    const activities = [...content.practiceBlueprint.activities];
    activities[4] = change(activities[4]);

    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: {
          activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ).toThrow(/listening-speaking.*spoken/i);
  });

  it.each([
    [
      "spoken interaction",
      (activity: A1LessonContent["practiceBlueprint"]["activities"][number]) => ({
        ...activity,
        interactionKind: "spoken" as const,
      }),
    ],
    [
      "spoken target",
      (activity: A1LessonContent["practiceBlueprint"]["activities"][number]) => ({
        ...activity,
        targetRef: { spokenVariantId: "a1-variant-wrongly-spoken" },
      }),
    ],
  ])("rejects %s on a non-listening activity", (_description, change) => {
    const content = introductionsOneContent();
    const activities = [...content.practiceBlueprint.activities];
    activities[0] = change(activities[0]);

    expect(() =>
      defineA1LessonContent({
        ...content,
        practiceBlueprint: {
          activities: activities as unknown as A1LessonContent["practiceBlueprint"]["activities"],
        },
      }),
    ).toThrow(/non-listening.*spoken/i);
  });

  it("rejects a vocabulary exception alongside new lexemes", () => {
    expect(() =>
      defineA1LessonContent({
        ...introductionsOneContent(),
        vocabularyException: {
          kind: "synthesis",
          reason: bilingual("This lesson synthesizes prior vocabulary.", "Questa lezione sintetizza il vocabolario precedente."),
        },
      }),
    ).toThrow(/vocabulary exception.*new lexeme/i);
  });

  it("requires a vocabulary exception when no new lexemes are introduced", () => {
    expect(() =>
      defineA1LessonContent({
        ...introductionsOneContent(),
        newLexemeIds: [],
      }),
    ).toThrow(/no new lexemes.*vocabulary exception/i);
  });

  it("rejects duplicate new lexeme ids", () => {
    expect(() =>
      defineA1LessonContent({
        ...introductionsOneContent(),
        newLexemeIds: ["a1-lexeme-watashi", "a1-lexeme-watashi"],
      }),
    ).toThrow(/duplicate.*lexeme/i);
  });

  it.each([
    ["fewer than two", ["a1-variant-one"]],
    ["more than three", ["a1-variant-one", "a1-variant-two", "a1-variant-three", "a1-variant-four"]],
    ["duplicates", ["a1-variant-one", "a1-variant-one"]],
  ])("rejects worked examples that are %s", (_description, workedExampleVariantIds) => {
    expect(() =>
      defineA1LessonContent({
        ...introductionsOneContent(),
        workedExampleVariantIds:
          workedExampleVariantIds as unknown as A1LessonContent["workedExampleVariantIds"],
      }),
    ).toThrow(/(worked example.*(two|three)|duplicate.*worked example)/i);
  });

  it.each([
    ["fewer than two", ["a1-variant-one"]],
    ["more than three", ["a1-variant-one", "a1-variant-two", "a1-variant-three", "a1-variant-four"]],
    ["duplicates", ["a1-variant-one", "a1-variant-one"]],
  ])("rejects dialogue turns that are %s", (_description, turnVariantIds) => {
    expect(() =>
      defineA1LessonContent({
        ...introductionsOneContent(),
        dialogue: {
          turnVariantIds:
            turnVariantIds as unknown as NonNullable<A1LessonContent["dialogue"]>["turnVariantIds"],
        },
      }),
    ).toThrow(/(dialogue.*(two|three)|duplicate.*dialogue)/i);
  });

  it("returns the original values deeply frozen", () => {
    const content = introductionsOneContent();
    const defined = defineA1LessonContent(content);

    expect(defined).toBe(content);
    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(defined.practiceBlueprint.activities[0].targetRef)).toBe(true);
  });
});
