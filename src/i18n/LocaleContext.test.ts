import { describe, expect, it } from "vitest";
import { normalizeLocale, normalizeReference } from "./LocaleContext";

describe("locale settings", () => {
  it("defaults to Italian", () => {
    expect(normalizeLocale(null)).toBe("it");
    expect(normalizeLocale("fr")).toBe("it");
  });

  it("accepts English", () => {
    expect(normalizeLocale("en")).toBe("en");
  });

  it("normalizes the reference toggle", () => {
    expect(normalizeReference("true")).toBe(true);
    expect(normalizeReference("false")).toBe(false);
    expect(normalizeReference(null)).toBe(false);
  });
});
