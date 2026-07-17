import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const foundationCssPath = fileURLToPath(
  new URL("./foundation.css", import.meta.url),
);
const courseCssPath = fileURLToPath(new URL("../course.css", import.meta.url));

function readFoundationCss(): string {
  return readFileSync(foundationCssPath, "utf8");
}

function findRule(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.#*]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`));
  return match?.[1];
}

function findMediaBlock(css: string, mediaQuery: string): string {
  const start = css.indexOf(mediaQuery);
  expect(start, `missing ${mediaQuery}`).toBeGreaterThan(-1);
  let depth = 0;
  let blockStart = -1;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") {
      if (depth === 0) blockStart = i + 1;
      depth++;
    } else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(blockStart, i);
    }
  }
  throw new Error(`unterminated ${mediaQuery}`);
}

const fixturePagePath = fileURLToPath(
  new URL("./FoundationFixturePage.tsx", import.meta.url),
);

describe("foundation harness styles ship only with the gated fixture chunk", () => {
  it("course.css never globally imports the foundation harness styles", () => {
    const css = readFileSync(courseCssPath, "utf8");
    expect(css).not.toMatch(
      /@import\s+["']\.\/foundations\/foundation\.css["']/,
    );
  });

  it("FoundationFixturePage imports foundation.css so it follows the dynamic chunk", () => {
    const source = readFileSync(fixturePagePath, "utf8");
    expect(source).toMatch(/import\s+["']\.\/foundation\.css["']/);
  });
});

describe("foundation harness CSS contract", () => {
  it("collapses the matrix and rounds to a single column on narrow screens", () => {
    const css = readFoundationCss();
    const block = findMediaBlock(css, "@media (max-width: 700px)");
    expect(block).toMatch(/grid-template-columns:\s*1fr|flex-direction:\s*column/);
  });

  it("never lets a row overflow horizontally", () => {
    const css = readFoundationCss();
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere|overflow-wrap:\s*break-word/);
  });

  it("keeps the disclosure control at the shared >=44px touch target", () => {
    const rule = findRule(readFoundationCss(), ".foundation-matrix__toggle");
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("gives interactive foundation controls a visible focus ring", () => {
    const css = readFoundationCss();
    expect(css).toMatch(/:focus-visible/);
  });

  it("conveys the transfer cue with text and shape, not colour alone", () => {
    const rule = findRule(readFoundationCss(), ".foundation-round__badge");
    expect(rule).toMatch(/border/);
  });

  it("respects reduced-motion preferences", () => {
    const css = readFoundationCss();
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
