import { describe, expect, it } from "vitest";
import { concepts } from "./concepts";
import { scenarios } from "./scenarios";
import { times } from "./times";
import type { ConceptId, Scenario, TimeOption } from "./types";
import { validateContent } from "./validate";

type Content = Parameters<typeof validateContent>[0];
type Slot = Scenario["slots"][number];

function slot(overrides: Partial<Slot> = {}): Slot {
  return {
    id: "food",
    semanticRole: "object",
    particle: { jp: "を", romaji: "o" },
    optionIds: ["ramen"],
    defaultOptionId: "ramen",
    optional: false,
    ...overrides,
  };
}

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "eat",
    emoji: "🍜",
    verb: { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
    slots: [slot()],
    ...overrides,
  };
}

function contentWith(overrides: Partial<Content>): Content {
  return { concepts, scenarios: [scenario()], times, ...overrides };
}

describe("semantic content", () => {
  it("contains all 31 concepts, 12 scenarios, and six time options", () => {
    expect(Object.keys(concepts)).toHaveLength(31);
    expect(scenarios).toHaveLength(12);
    expect(times).toHaveLength(6);
  });

  it("has unique IDs and valid concept references", () => {
    expect(validateContent({ concepts, scenarios, times })).toEqual([]);
  });

  it("reports slots with no options", () => {
    const badScenarios: Scenario[] = [
      {
        id: "eat",
        emoji: "🍜",
        verb: { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
        slots: [
          {
            id: "food",
            semanticRole: "object",
            particle: { jp: "を", romaji: "o" },
            optionIds: [],
            defaultOptionId: null,
            optional: true,
          },
        ],
      },
    ];

    expect(
      validateContent({ concepts, scenarios: badScenarios, times }).some((error) =>
        error.startsWith("empty options:eat:food"),
      ),
    ).toBe(true);
  });

  it("reports duplicate scenario IDs", () => {
    const badScenarios: Scenario[] = [
      scenario(),
      scenario({ emoji: "🍣" }),
    ];

    expect(validateContent(contentWith({ scenarios: badScenarios }))).toContain(
      "duplicate scenario:eat",
    );
  });

  it("reports duplicate slot IDs within a scenario", () => {
    const badScenarios: Scenario[] = [
      scenario({ slots: [slot(), slot({ optionIds: ["sushi"], defaultOptionId: "sushi" })] }),
    ];

    expect(validateContent(contentWith({ scenarios: badScenarios }))).toContain(
      "duplicate slot:eat:food",
    );
  });

  it("reports required slots without a default option", () => {
    const badScenarios: Scenario[] = [
      scenario({ slots: [slot({ defaultOptionId: null, optional: false })] }),
    ];

    expect(validateContent(contentWith({ scenarios: badScenarios }))).toContain(
      "required default missing:eat:food",
    );
  });

  it("reports unknown concept references", () => {
    const unknownConceptId = "missingConcept" as ConceptId; // Runtime guard coverage.
    const badScenarios: Scenario[] = [
      scenario({
        slots: [
          slot({
            optionIds: [unknownConceptId],
            defaultOptionId: null,
            optional: true,
          }),
        ],
      }),
    ];

    expect(validateContent(contentWith({ scenarios: badScenarios }))).toContain(
      "unknown concept:eat:food:missingConcept",
    );
  });

  it("reports default options that are not available choices", () => {
    const badScenarios: Scenario[] = [
      scenario({ slots: [slot({ optionIds: ["ramen"], defaultOptionId: "sushi" })] }),
    ];

    expect(validateContent(contentWith({ scenarios: badScenarios }))).toContain(
      "invalid default:eat:food",
    );
  });

  it("reports duplicate time IDs", () => {
    const badTimes: TimeOption[] = [
      { id: "today", jp: "きょう", romaji: "kyō" },
      { id: "today", jp: "きょう", romaji: "kyō" },
    ];

    expect(validateContent(contentWith({ times: badTimes }))).toContain(
      "duplicate time:today",
    );
  });

  it("models boarding separately from a destination", () => {
    const board = scenarios.find((scenario) => scenario.id === "board");
    expect(board?.slots[0]).toMatchObject({
      semanticRole: "vehicleBoarded",
      particle: { jp: "に", romaji: "ni" },
    });
  });

  it("preserves the v2 defaults while allowing optional slots to be cleared", () => {
    const eating = scenarios.find((scenario) => scenario.id === "eat");
    const going = scenarios.find((scenario) => scenario.id === "go");
    expect(eating?.slots.find((slot) => slot.id === "place")).toMatchObject({
      optional: true,
      defaultOptionId: "restaurant",
    });
    expect(going?.slots.find((slot) => slot.id === "transport")).toMatchObject({
      optional: true,
      defaultOptionId: "train",
    });
  });

  it("keeps かえる as godan", () => {
    const returning = scenarios.find((scenario) => scenario.id === "return");
    expect(returning?.verb).toMatchObject({
      dict: "かえる",
      group: "godan",
      stemRomaji: "kaeri",
    });
  });
});
