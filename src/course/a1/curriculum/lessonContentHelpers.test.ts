import { describe, expect, it } from "vitest";

import { buildA1LessonViewModel } from "../a1LessonViewModel";
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
    const blueprint = semanticBlueprint(
      "introductions-1",
      "introductions-1-m4",
      "contextual-response",
    );
    const built = buildA1LessonViewModel("introductions-1", "en");
    if (!built.ok) throw new Error("production lesson should build");

    expect(blueprint.activities.map((activity) => activity.function)).toEqual([
      "meaning-comprehension",
      "form-discrimination",
      "controlled-production",
      "contextual-response",
      "listening-speaking",
    ]);
    for (const activity of blueprint.activities.slice(0, 4)) {
      if ("spokenVariantId" in activity.targetRef) continue;
      const round =
        activity.targetRef.round === "one"
          ? built.model.rounds[0]
          : built.model.rounds[1];
      expect(activity.interactionKind).toBe(
        round.targets[activity.targetRef.index]?.prompt.kind,
      );
    }
    expect(blueprint.activities[4]).toMatchObject({
      id: "introductions-1-spoken",
      function: "listening-speaking",
      interactionKind: "spoken",
      targetRef: { spokenVariantId: expect.any(String) },
    });
  });

  it("maps a transformation function to the selected production prompt kind", () => {
    const activity = semanticBlueprint(
      "introductions-2",
      "introductions-2-m4",
      "transformation",
    ).activities[3];
    const built = buildA1LessonViewModel("introductions-2", "en");
    if (!built.ok) throw new Error("production lesson should build");

    expect(activity).toMatchObject({
      id: "introductions-2-transfer",
      function: "transformation",
      targetRef: { round: "two", index: 1 },
    });
    expect(activity.interactionKind).toBe(built.model.rounds[1].targets[1]?.prompt.kind);
  });
});
