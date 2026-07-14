import { describe, expect, it } from "vitest";
import type { LabSelection } from "../content/types";
import { lessonPath } from "../routing/routePaths";
import { readGuidedReturn } from "../routing/guidedToolLink";
import {
  buildLabDeepLink,
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
  it("round trips a valid selection without touching the return param", () => {
    const params = serializeLabPreset(selection);
    expect(params.has("from")).toBe(false);
    expect(parseLabPreset(params)).toEqual({ selection });
    expect(hasLabPreset(params)).toBe(true);
  });

  it("builds a Lab deep link that carries the exact lesson explore return", () => {
    const { href, returnResult } = buildLabDeepLink(selection, {
      pathname: lessonPath("time", "time-past"),
      sectionId: "explore",
    });
    expect(returnResult.valid).toBe(true);
    expect(href).toContain("/pratica/laboratorio?");
    expect(href).toContain("scenario=eat");
    expect(href).toContain("from=%2Fpercorso%2Ftime%2Ftime-past%23explore");

    const query = href.slice(href.indexOf("?") + 1);
    const params = new URLSearchParams(query);
    expect(parseLabPreset(params)).toEqual({ selection });
    const back = readGuidedReturn(params);
    expect(back.status).toBe("valid");
    if (back.status === "valid") {
      expect(back.href).toBe("/percorso/time/time-past#explore");
    }
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
    // A return-only URL is a direct visit as far as the preset is concerned.
    const returnOnly = new URLSearchParams("from=%2Fpercorso%2Ftime%2Ftime-past%23explore");
    expect(hasLabPreset(returnOnly)).toBe(false);
    expect(parseLabPreset(returnOnly)).toBeNull();
  });

  it("rejects duplicate and unknown preset parameters", () => {
    const unknownOnly = new URLSearchParams("extra=1");
    expect(hasLabPreset(unknownOnly)).toBe(true);
    expect(parseLabPreset(unknownOnly)).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&scenario=go&form=pres&time=today&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&extra=1",
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

  it("parses a valid preset and its return independently (invalid return never voids a valid preset)", () => {
    const external = new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=https://example.com",
    );
    expect(parseLabPreset(external)).not.toBeNull();
    expect(readGuidedReturn(external).status).toBe("invalid");

    const traversal = new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=/percorso/../../frasario",
    );
    expect(parseLabPreset(traversal)).not.toBeNull();
    expect(readGuidedReturn(traversal).status).toBe("invalid");

    const duplicateReturn = new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=/percorso/time/time-past&from=/frasario",
    );
    expect(parseLabPreset(duplicateReturn)).not.toBeNull();
    expect(readGuidedReturn(duplicateReturn).status).toBe("invalid");
  });
});
