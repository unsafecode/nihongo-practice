import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = fileURLToPath(new URL("./syllabary.css", import.meta.url));

function readCss(): string {
  return readFileSync(cssPath, "utf8");
}

function findRule(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.#]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`));
  return match?.[1];
}

describe("Syllabary group deep-link CSS contract", () => {
  it("offsets group scroll targets below the shared sticky header", () => {
    const rule = findRule(readCss(), ".kana-section");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/scroll-margin-top:\s*var\(--sticky-offset\)/);
  });

  it("visibly identifies the targeted group", () => {
    const rule = findRule(readCss(), ".kana-section.is-targeted");
    expect(rule, "missing .kana-section.is-targeted rule").toBeDefined();
    expect(rule).toMatch(/outline|box-shadow|background/);
  });

  it("keeps kana tap targets at the shared 44px minimum", () => {
    const rule = findRule(readCss(), ".kana");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("provides an accessible screen-reader-only utility for announcements", () => {
    const rule = findRule(readCss(), ".sr-only");
    expect(rule, "missing .sr-only utility").toBeDefined();
    expect(rule).toMatch(/position:\s*absolute/);
  });
});
