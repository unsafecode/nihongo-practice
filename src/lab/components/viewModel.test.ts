import { describe, expect, it } from "vitest";
import { buildLabViewModel } from "./viewModel";

describe("buildLabViewModel", () => {
  it("separates labels from sentence realizations", () => {
    const vm = buildLabViewModel(
      {
        scenarioId: "eat",
        form: "pres",
        timeId: "today",
        options: { object: "ramen", place: "restaurant" },
      },
      "it",
      "en",
    );
    expect(vm.scenarioTitle).toBe("Mangiare qualcosa");
    expect(vm.slots[1].options[0]).toMatchObject({
      label: "ristorante",
      jp: "れすとらん",
    });
    expect(vm.sentence.primary).toBe("Oggi mangio il ramen al ristorante.");
    expect(vm.sentence.reference).toBe(
      "Today, I'm eating ramen at the restaurant.",
    );
    expect(vm.naturalness).toBe("natural");
  });

  it("marks incompatible combinations", () => {
    const vm = buildLabViewModel(
      {
        scenarioId: "eat",
        form: "past",
        timeId: "tomorrow",
        options: { object: "ramen", place: null },
      },
      "it",
      "en",
    );
    expect(vm.naturalness).toBe("incompatible");
  });
});
