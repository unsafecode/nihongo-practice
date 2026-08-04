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

  it("pins introductions-1's contextual learner path and collision-free spoken target", () => {
    expect(
      semanticBlueprint(
        "introductions-1",
        "introductions-1-m4",
        "contextual-response",
      ),
    ).toEqual({
      activities: [
        {
          id: "introductions-1-meaning",
          function: "meaning-comprehension",
          interactionKind: "tile-ordering",
          targetRef: { round: "one", index: 1 },
        },
        {
          id: "introductions-1-form",
          function: "form-discrimination",
          interactionKind: "constrained-construction",
          targetRef: { round: "two", index: 0 },
        },
        {
          id: "introductions-1-production",
          function: "controlled-production",
          interactionKind: "completion",
          targetRef: { round: "one", index: 0 },
        },
        {
          id: "introductions-1-transfer",
          function: "contextual-response",
          interactionKind: "tile-ordering",
          targetRef: { round: "two", index: 1 },
        },
        {
          id: "introductions-1-spoken",
          function: "listening-speaking",
          interactionKind: "spoken",
          targetRef: { spokenVariantId: "introductions-1-m4" },
        },
      ],
    });
  });

  it("pins introductions-2's transformation path and collision-free spoken target", () => {
    expect(
      semanticBlueprint(
        "introductions-2",
        "introductions-2-m7",
        "transformation",
      ),
    ).toEqual({
      activities: [
        {
          id: "introductions-2-meaning",
          function: "meaning-comprehension",
          interactionKind: "completion",
          targetRef: { round: "one", index: 1 },
        },
        {
          id: "introductions-2-form",
          function: "form-discrimination",
          interactionKind: "constrained-construction",
          targetRef: { round: "two", index: 0 },
        },
        {
          id: "introductions-2-production",
          function: "controlled-production",
          interactionKind: "tile-ordering",
          targetRef: { round: "one", index: 0 },
        },
        {
          id: "introductions-2-transfer",
          function: "transformation",
          interactionKind: "completion",
          targetRef: { round: "two", index: 1 },
        },
        {
          id: "introductions-2-spoken",
          function: "listening-speaking",
          interactionKind: "spoken",
          targetRef: { spokenVariantId: "introductions-2-m7" },
        },
      ],
    });
  });
});
