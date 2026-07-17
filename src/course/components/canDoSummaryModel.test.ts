import { describe, expect, it } from "vitest";
import { buildCanDoSummaryModel, type CanDoSummaryOutline } from "./canDoSummaryModel";
import type { CanDoEvidence } from "../progress/progress";

/**
 * Minimal synthetic Can-do catalog fixtures (mirrors the `ModuleOutline`
 * convention used elsewhere in the model layer): only the fields the pure
 * summary model inspects. `a1CanDosAuthored` (see ../a1/catalog/canDos)
 * satisfies the same shape with no cast.
 */
function canDoFixture(id: string, descriptorCopyId = `${id}-descriptor`): CanDoSummaryOutline {
  return { id, descriptorCopyId };
}

function evidence(overrides: Partial<CanDoEvidence> = {}): CanDoEvidence {
  return {
    canDoId: "x",
    visitedLessonIds: [],
    practicedLessonIds: [],
    acceptedTransferExerciseIds: [],
    checkpointAttemptIds: [],
    lastUpdatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildCanDoSummaryModel: honest evidence tiers (design spec §8/§17, Phase 2 Task 6)", () => {
  it("reports 'not-started' for a Can-do with no recorded evidence at all", () => {
    const model = buildCanDoSummaryModel([canDoFixture("a1-can-do-sounds")], {});

    expect(model.items).toEqual([
      { canDoId: "a1-can-do-sounds", descriptorCopyId: "a1-can-do-sounds-descriptor", tier: "not-started" },
    ]);
    expect(model.totalCount).toBe(1);
    expect(model.demonstratedCount).toBe(0);
  });

  it("reports 'visited' once a lesson contributing to the Can-do was visited, and nothing stronger", () => {
    const model = buildCanDoSummaryModel([canDoFixture("a1-can-do-identity")], {
      "a1-can-do-identity": evidence({ visitedLessonIds: ["introductions-1"] }),
    });

    expect(model.items[0].tier).toBe("visited");
  });

  it("reports 'practiced' once a lesson's required exercises were fully attempted, outranking 'visited'", () => {
    const model = buildCanDoSummaryModel([canDoFixture("a1-can-do-identity")], {
      "a1-can-do-identity": evidence({
        visitedLessonIds: ["introductions-1"],
        practicedLessonIds: ["introductions-1"],
      }),
    });

    expect(model.items[0].tier).toBe("practiced");
  });

  it("reports 'demonstrated' once a transfer exercise was accepted, outranking 'practiced'", () => {
    const model = buildCanDoSummaryModel([canDoFixture("a1-can-do-identity")], {
      "a1-can-do-identity": evidence({
        visitedLessonIds: ["introductions-1"],
        practicedLessonIds: ["introductions-1"],
        acceptedTransferExerciseIds: ["introductions-1-round2-ex1"],
      }),
    });

    expect(model.items[0].tier).toBe("demonstrated");
    expect(model.demonstratedCount).toBe(1);
  });

  it("reports 'demonstrated' once the Can-do carries any checkpoint-attempt evidence, even with no transfer acceptance recorded", () => {
    const model = buildCanDoSummaryModel([canDoFixture("a1-can-do-scenario-1")], {
      "a1-can-do-scenario-1": evidence({ checkpointAttemptIds: ["a1-checkpoint-attempt-1"] }),
    });

    expect(model.items[0].tier).toBe("demonstrated");
  });

  it("preserves the given Can-do order and counts totalCount/demonstratedCount across many entries", () => {
    const model = buildCanDoSummaryModel(
      [
        canDoFixture("a1-can-do-sounds"),
        canDoFixture("a1-can-do-identity"),
        canDoFixture("a1-can-do-origins"),
      ],
      {
        "a1-can-do-sounds": evidence({
          acceptedTransferExerciseIds: ["sounds-1-round2-ex1"],
        }),
        "a1-can-do-identity": evidence({ visitedLessonIds: ["introductions-1"] }),
      },
    );

    expect(model.items.map((item) => item.canDoId)).toEqual([
      "a1-can-do-sounds",
      "a1-can-do-identity",
      "a1-can-do-origins",
    ]);
    expect(model.items.map((item) => item.tier)).toEqual([
      "demonstrated",
      "visited",
      "not-started",
    ]);
    expect(model.totalCount).toBe(3);
    expect(model.demonstratedCount).toBe(1);
  });
});
