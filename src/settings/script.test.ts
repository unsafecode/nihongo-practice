import { describe, it, expect } from "vitest";
import { normalizeScript } from "./ScriptContext";

describe("normalizeScript", () => {
  it("default hiragana", () => {
    expect(normalizeScript(null)).toBe("hiragana");
    expect(normalizeScript("boh")).toBe("hiragana");
  });
  it("accetta romaji", () => {
    expect(normalizeScript("romaji")).toBe("romaji");
  });
});
