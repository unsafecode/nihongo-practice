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

  it(".reference-toggle (checkbox label, header + mobile drawer) meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".reference-toggle");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it(".reference-toggle (checkbox label, header + mobile drawer) meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".reference-toggle");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });

  it(".app-error button (unrecoverable-error recovery control) meets 44px minimum width", () => {
    const rule = findRule(readStyles(), ".app-error button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-width\s*:\s*var\(--action-target-min\)/);
  });

  it(".app-error button (unrecoverable-error recovery control) meets 44px minimum height", () => {
    const rule = findRule(readStyles(), ".app-error button");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height\s*:\s*var\(--action-target-min\)/);
  });
});

describe("settings trigger cascade: mobile-only button hidden on desktop", () => {
  it("desktop-hide rule uses .header__settings-trigger.action so it outranks .action (specificity 0,2,0 vs 0,1,0)", () => {
    const css = readStyles();
    // The base .action { display: inline-flex } has specificity (0,1,0).
    // A bare .header__settings-trigger { display: none } has equal specificity and
    // therefore loses when .action appears later in the source — the trigger becomes
    // visible on desktop. The fix: use a two-class compound selector so the hide rule
    // always wins at (0,2,0), regardless of Action source order.
    const compoundHide = findRule(css, ".header__settings-trigger.action");
    expect(
      compoundHide,
      "need .header__settings-trigger.action { display:none } (specificity 0,2,0) " +
        "to beat .action { display:inline-flex } (0,1,0) regardless of source order",
    ).toBeDefined();
    expect(compoundHide).toMatch(/display\s*:\s*none/);
  });

  it("max-width:980px media block restores the trigger to inline-flex for mobile", () => {
    const css = readStyles();
    const mediaStart = css.indexOf("@media (max-width: 980px)");
    expect(mediaStart, "missing @media (max-width: 980px) block").toBeGreaterThan(-1);
    // Extract the block by counting braces so nested rules don't confuse the regex.
    let depth = 0;
    let blockStart = -1;
    let blockEnd = -1;
    for (let i = mediaStart; i < css.length; i++) {
      if (css[i] === "{") {
        if (depth === 0) blockStart = i + 1;
        depth++;
      } else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          blockEnd = i;
          break;
        }
      }
    }
    const mobileBlock = css.slice(blockStart, blockEnd);
    // The restore rule may target .header__settings-trigger or .header__settings-trigger.action.
    expect(mobileBlock).toMatch(
      /\.header__settings-trigger[^{]*\{[^}]*display\s*:\s*inline-flex/,
    );
  });
});
