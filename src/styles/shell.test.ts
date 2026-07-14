import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesCssPath = fileURLToPath(new URL("../styles.css", import.meta.url));

function readStyles(): string {
  return readFileSync(stylesCssPath, "utf8");
}

function findRule(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.#]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`));
  return match?.[1];
}

describe("application shell width", () => {
  it("no longer constrains .app to a single global max-width", () => {
    const rule = findRule(readStyles(), ".app");
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/max-width/);
  });

  it("provides a shell wrapper using the shared shell-max token", () => {
    const css = readStyles();
    const rule = findRule(css, ".app__content");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/max-width:\s*var\(--shell-max\)/);
  });
});

describe("form control typography", () => {
  it("makes native controls and interactive summary inherit the app font", () => {
    const normalized = readStyles().replace(/\s+/g, " ");
    expect(normalized).toMatch(
      /button\s*,\s*input\s*,\s*select\s*,\s*textarea\s*,\s*summary\s*{[^}]*font:\s*inherit/,
    );
  });
});

describe("44 × 44 tap-target enforcement", () => {
  it("action--inline must not suppress the 44px min-width tap target", () => {
    const rule = findRule(readStyles(), ".action--inline");
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/min-width\s*:\s*0/);
  });

  it("action--inline must explicitly preserve 44px min-width via the shared token", () => {
    const rule = findRule(readStyles(), ".action--inline");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it("modenav__item meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".modenav__item");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it("modenav__item meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".modenav__item");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });

  it("scripttoggle button meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".scripttoggle button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it("scripttoggle button meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".scripttoggle button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });

  it("localetoggle button meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".localetoggle button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it("localetoggle button meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".localetoggle button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });

  it(".btn meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".btn");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it(".btn meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".btn");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });
});
