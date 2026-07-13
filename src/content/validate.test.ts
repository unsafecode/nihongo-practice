import { describe, expect, it } from "vitest";
import { concepts } from "./concepts";
import { scenarios } from "./scenarios";
import { times } from "./times";
import { validateContent } from "./validate";

describe("semantic content", () => {
  it("contains all 31 concepts, 12 scenarios, and six time options", () => {
    expect(Object.keys(concepts)).toHaveLength(31);
    expect(scenarios).toHaveLength(12);
    expect(times).toHaveLength(6);
  });

  it("has unique IDs and valid concept references", () => {
    expect(validateContent({ concepts, scenarios, times })).toEqual([]);
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
