import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { visualTokens } from "./tokens";

const tokensCssPath = fileURLToPath(new URL("./tokens.css", import.meta.url));

function readCssCustomProperties(): Record<string, string> {
  const css = readFileSync(tokensCssPath, "utf8");
  const props: Record<string, string> = {};
  for (const match of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    props[match[1]] = match[2].trim();
  }
  return props;
}

describe("visualTokens", () => {
  it("declares the finite spacing scale", () => {
    expect(visualTokens.spacingPx).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });

  it("declares the finite UI type scale", () => {
    expect(visualTokens.typePx).toEqual([14, 16, 20, 28, 42, 50, 54]);
  });

  it("declares the shared geometry contract", () => {
    expect(visualTokens.layout).toEqual({
      shellMaxPx: 1320,
      readingMinPx: 760,
      readingMaxPx: 860,
      actionTargetMinPx: 44,
      mobileHeaderMaxPx: 112,
    });
  });

  it("declares every palette role required by the design", () => {
    expect(Object.keys(visualTokens.colors).sort()).toEqual(
      [
        "paper",
        "surface",
        "ink",
        "muted",
        "coral",
        "teal",
        "amber",
        "board",
        "danger",
      ].sort(),
    );
  });

  it("keeps danger visually distinct from coral", () => {
    expect(visualTokens.colors.danger.toLowerCase()).not.toBe(
      visualTokens.colors.coral.toLowerCase(),
    );
  });

  it("stays in sync with the CSS custom properties (single token source)", () => {
    const cssProps = readCssCustomProperties();
    for (const [role, hex] of Object.entries(visualTokens.colors)) {
      expect(cssProps[`--color-${role}`]?.toLowerCase()).toBe(
        hex.toLowerCase(),
      );
    }
    visualTokens.spacingPx.forEach((px, index) => {
      expect(cssProps[`--space-${index + 1}`]).toBe(`${px}px`);
    });
    visualTokens.typePx.forEach((px, index) => {
      expect(cssProps[`--text-${index + 1}`]).toBe(`${px}px`);
    });
    expect(cssProps["--shell-max"]).toBe(`${visualTokens.layout.shellMaxPx}px`);
    expect(cssProps["--reading-min"]).toBe(
      `${visualTokens.layout.readingMinPx}px`,
    );
    expect(cssProps["--reading-max"]).toBe(
      `${visualTokens.layout.readingMaxPx}px`,
    );
    expect(cssProps["--action-target-min"]).toBe(
      `${visualTokens.layout.actionTargetMinPx}px`,
    );
    expect(cssProps["--header-mobile-max"]).toBe(
      `${visualTokens.layout.mobileHeaderMaxPx}px`,
    );
  });
});
