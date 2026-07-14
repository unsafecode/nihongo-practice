import { describe, expect, it } from "vitest";
import {
  isDismissKey,
  nextTrappedFocusIndex,
  resolveTrapFocusIndex,
} from "./focusTrap";

describe("isDismissKey", () => {
  it("treats only Escape as a dismiss key", () => {
    expect(isDismissKey("Escape")).toBe(true);
    expect(isDismissKey("Tab")).toBe(false);
    expect(isDismissKey("Enter")).toBe(false);
    expect(isDismissKey("")).toBe(false);
  });
});

describe("nextTrappedFocusIndex", () => {
  it("moves forward and wraps past the last focusable", () => {
    expect(nextTrappedFocusIndex(0, 3, "forward")).toBe(1);
    expect(nextTrappedFocusIndex(2, 3, "forward")).toBe(0);
  });

  it("moves backward and wraps past the first focusable", () => {
    expect(nextTrappedFocusIndex(1, 3, "backward")).toBe(0);
    expect(nextTrappedFocusIndex(0, 3, "backward")).toBe(2);
  });

  it("guards against an empty focusable set", () => {
    expect(nextTrappedFocusIndex(0, 0, "forward")).toBe(0);
    expect(nextTrappedFocusIndex(0, 0, "backward")).toBe(0);
  });
});

describe("resolveTrapFocusIndex", () => {
  const focusables = ["close", "locale-it", "locale-en", "reference"];

  it("advances to the next element on Tab", () => {
    expect(resolveTrapFocusIndex(focusables, "locale-it", false)).toBe(2);
  });

  it("goes to the previous element on Shift+Tab", () => {
    expect(resolveTrapFocusIndex(focusables, "locale-it", true)).toBe(0);
  });

  it("wraps from the last focusable back to the first on Tab", () => {
    expect(resolveTrapFocusIndex(focusables, "reference", false)).toBe(0);
  });

  it("wraps from the first focusable back to the last on Shift+Tab", () => {
    expect(resolveTrapFocusIndex(focusables, "close", true)).toBe(3);
  });

  it("falls back to the first focusable when active element isn't tracked", () => {
    expect(resolveTrapFocusIndex(focusables, "unknown", false)).toBe(1);
  });

  it("returns -1 when there is nothing focusable to trap into", () => {
    expect(resolveTrapFocusIndex([], "anything", false)).toBe(-1);
  });
});
