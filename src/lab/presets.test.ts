import { describe, expect, it } from "vitest";
import type { LabSelection } from "../content/types";
import {
  hasLabPreset,
  parseLabPreset,
  serializeLabPreset,
} from "./presets";

const selection = {
  scenarioId: "eat",
  form: "past",
  timeId: "yesterday",
  options: { object: "ramen", place: null },
} satisfies LabSelection;

describe("Lab presets", () => {
  it("round trips a valid selection", () => {
    const params = serializeLabPreset(
      selection,
      "/percorso/actions/actions-object",
    );
    expect(parseLabPreset(params)).toEqual({
      selection,
      from: "/percorso/actions/actions-object",
    });
    expect(hasLabPreset(params)).toBe(true);
  });

  it("rejects invalid scenario/form/time/concepts", () => {
    expect(parseLabPreset(new URLSearchParams("scenario=bad"))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=bad&time=today&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=bad&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=train&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen",
    ))).toBeNull();
  });

  it("distinguishes direct Lab visits from malformed preset links", () => {
    const empty = new URLSearchParams();
    expect(hasLabPreset(empty)).toBe(false);
    expect(parseLabPreset(empty)).toBeNull();
  });

  it("rejects duplicate, unknown, and external return parameters", () => {
    const unknownOnly = new URLSearchParams("extra=1");
    expect(hasLabPreset(unknownOnly)).toBe(true);
    expect(parseLabPreset(unknownOnly)).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&scenario=go&form=pres&time=today&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&extra=1",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=https://example.com",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=/percorso/../../frasario",
    ))).toBeNull();
    expect(() => serializeLabPreset({
      ...selection,
      options: { ...selection.options, extra: "ramen" },
    })).toThrow("Unknown slot: extra");
    expect(() => serializeLabPreset({
      ...selection,
      options: { object: "ramen" },
    })).toThrow("Missing slot: place");
  });
});
