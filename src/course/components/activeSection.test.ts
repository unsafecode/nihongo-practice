import { describe, expect, it } from "vitest";
import { pickActiveSection } from "./activeSection";

const OFFSETS = [
  { id: "rule", top: 0 },
  { id: "comparison", top: 100 },
  { id: "explore", top: 200 },
  { id: "recap", top: 300 },
] as const;

describe("pickActiveSection", () => {
  it("defaults to the first section when scrolled above every section top", () => {
    expect(pickActiveSection(OFFSETS, -50)).toBe("rule");
  });

  it("treats a section as active exactly at its boundary (inclusive top)", () => {
    expect(pickActiveSection(OFFSETS, 100)).toBe("comparison");
    expect(pickActiveSection(OFFSETS, 200)).toBe("explore");
  });

  it("picks the last section whose top is at or above the scroll position", () => {
    expect(pickActiveSection(OFFSETS, 150)).toBe("comparison");
    expect(pickActiveSection(OFFSETS, 299)).toBe("explore");
  });

  it("stays on the final section once scrolled past its top", () => {
    expect(pickActiveSection(OFFSETS, 5000)).toBe("recap");
  });

  it("is deterministic when two sections share a top (last in order wins)", () => {
    const tied = [
      { id: "rule", top: 0 },
      { id: "comparison", top: 100 },
      { id: "explore", top: 100 },
      { id: "recap", top: 300 },
    ] as const;
    expect(pickActiveSection(tied, 100)).toBe("explore");
  });

  it("throws on an empty section list rather than guessing", () => {
    expect(() => pickActiveSection([], 0)).toThrow();
  });
});
