import { describe, expect, it } from "vitest";

import { phoneticBlueprint, semanticBlueprint } from "./lessonContentHelpers";

describe("A1 lesson content blueprints", () => {
  it("uses five distinct phonetic items for the visible practice targets", () => {
    expect(() =>
      phoneticBlueprint("sounds-1", [
        "snd1-a",
        "snd1-i",
        "snd1-u",
        "snd1-e",
        "snd1-e",
      ]),
    ).toThrow(/unique phonetic item ids/i);
  });

  it("uses the semantic learner order and contextual fourth activity", () => {
    expect(semanticBlueprint("introductions-1", "introductions-1-m4", true)).toEqual({
      activities: [
        expect.objectContaining({
          id: "introductions-1-meaning",
          function: "meaning-comprehension",
          interactionKind: "choice",
          targetRef: { round: "one", index: 1 },
        }),
        expect.objectContaining({
          id: "introductions-1-form",
          function: "form-discrimination",
          interactionKind: "completion",
          targetRef: { round: "two", index: 0 },
        }),
        expect.objectContaining({
          id: "introductions-1-production",
          function: "controlled-production",
          interactionKind: "tile-ordering",
          targetRef: { round: "one", index: 0 },
        }),
        expect.objectContaining({
          id: "introductions-1-transfer",
          function: "contextual-response",
          interactionKind: "constrained-construction",
          targetRef: { round: "two", index: 1 },
        }),
        expect.objectContaining({
          id: "introductions-1-spoken",
          function: "listening-speaking",
          interactionKind: "spoken",
          targetRef: { spokenVariantId: "introductions-1-m4" },
        }),
      ],
    });
  });
});
