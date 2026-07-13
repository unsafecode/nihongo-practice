import { describe, expect, it } from "vitest";
import { concepts } from "../content/concepts";
import { scenarios } from "../content/scenarios";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import { validateLocalePack } from "./validate";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("locale $locale", (pack) => {
  it("covers all concepts, scenarios, forms and times", () => {
    expect(validateLocalePack(pack, concepts, scenarios)).toEqual([]);
  });

  it("contains no blank visible copy", () => {
    const visibleCopy = collectStrings({
      ui: pack.ui,
      forms: pack.forms,
      times: Object.fromEntries(
        Object.entries(pack.times).filter(([id]) => id !== "none"),
      ),
      concepts: pack.concepts,
      scenarios: pack.scenarios,
    });
    expect(visibleCopy.length).toBeGreaterThan(0);
    expect(visibleCopy.every((value) => value.trim().length > 0)).toBe(true);
  });
});

it("uses clean display labels instead of sentence fragments", () => {
  expect(itCopy.concepts.restaurant.label).toBe("ristorante");
  expect(itCopy.concepts.restaurant.realizations.actionPlace).toBe("al ristorante");
  expect(enCopy.concepts.restaurant.label).toBe("restaurant");
  expect(enCopy.concepts.restaurant.realizations.actionPlace).toBe("at the restaurant");
});

it("uses practical form labels first", () => {
  expect(
    Object.fromEntries(
      Object.entries(itCopy.forms).map(([id, copy]) => [id, copy.label]),
    ),
  ).toEqual({
    pres: "Ora / abitudine / futuro",
    past: "È successo",
    neg: "Non succede / non succederà",
    pastneg: "Non è successo",
    vol: "Facciamo…?",
    des: "Voglio…",
  });
  expect(itCopy.forms.pres.grammar).toBe(
    "non-passato affermativo · 〜ます",
  );
  expect(itCopy.scenarios.wait.slots.target).toEqual({
    prompt: "Chi o che cosa?",
    grammar: "oggetto diretto",
  });
  expect(enCopy.forms.vol.label).toBe("Shall we…?");
});
