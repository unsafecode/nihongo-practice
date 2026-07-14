import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const labCssPath = fileURLToPath(new URL("./lab.css", import.meta.url));

function readLabCss(): string {
  return readFileSync(labCssPath, "utf8");
}

function findRule(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.#]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`));
  return match?.[1];
}

function findMediaBlock(css: string, mediaQuery: string): string {
  const bodies: string[] = [];
  let searchFrom = 0;
  for (;;) {
    const start = css.indexOf(mediaQuery, searchFrom);
    if (start === -1) break;
    let depth = 0;
    let blockStart = -1;
    let blockEnd = -1;
    for (let i = start; i < css.length; i++) {
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
    bodies.push(css.slice(blockStart, blockEnd));
    searchFrom = blockEnd + 1;
  }
  expect(bodies.length, `missing any ${mediaQuery} block`).toBeGreaterThan(0);
  return bodies.join("\n");
}

describe("Lab sticky board CSS contract", () => {
  it("pins the sticky board to the shared sticky offset token, not a magic pixel", () => {
    const rule = findRule(readLabCss(), ".board");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/position:\s*sticky/);
    expect(rule).toMatch(/top:\s*var\(--sticky-offset\)/);
  });

  it("never hardcodes the old 18px sticky offset on the board", () => {
    const rule = findRule(readLabCss(), ".board");
    expect(rule).not.toMatch(/top:\s*18px/);
  });

  it("drops the sticky board at the mobile breakpoint so it never sits under the header", () => {
    const mobile = findMediaBlock(readLabCss(), "@media (max-width: 880px)");
    const boardRule = mobile.match(/\.board\s*{([^}]*)}/)?.[1];
    expect(boardRule, "missing mobile .board override").toBeDefined();
    expect(boardRule).toMatch(/position:\s*static/);
  });

  it("removes the obsolete bespoke preset-notice rule in favor of the shared Notice", () => {
    expect(readLabCss()).not.toMatch(/\.preset-notice/);
  });
});
