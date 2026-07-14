import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const courseCssPath = fileURLToPath(new URL("./course.css", import.meta.url));

function readCourseCss(): string {
  return readFileSync(courseCssPath, "utf8");
}

function findRule(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.#]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*{([^}]*)}`));
  return match?.[1];
}

/** Extracts every top-level @media block matching the given query by
 * brace-counting (so nested rules don't confuse a naive regex, mirroring
 * styles/shell.test.ts), and concatenates their bodies. A stylesheet may
 * declare the same breakpoint more than once, co-located with each
 * section's own rules, so this collects all of them rather than only
 * the first. */
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

describe("course map CSS contract: vertical phase path, never a card grid", () => {
  it("removes the obsolete uniform chapter-grid/chapter-card rules entirely", () => {
    const css = readCourseCss();
    expect(css).not.toMatch(/\.chapter-grid/);
    expect(css).not.toMatch(/\.chapter-card/);
  });

  it("lays out each phase's modules as a flex column, not a grid", () => {
    const rule = findRule(readCourseCss(), ".course-phase__modules");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/display:\s*flex/);
    expect(rule).toMatch(/flex-direction:\s*column/);
    expect(rule).not.toMatch(/display:\s*grid/);
  });

  it("never lays the top-level course map out as a multi-column grid", () => {
    const css = readCourseCss();
    const mapRule = findRule(css, ".course-map");
    if (mapRule) {
      expect(mapRule).not.toMatch(/grid-template-columns/);
    }
    expect(css).not.toMatch(/\.course-map\s*{[^}]*grid-template-columns/);
  });
});

describe("course map CSS contract: bounded editorial hero title", () => {
  it("bounds the hero title between the shared 42px and 54px type tokens", () => {
    const rule = findRule(readCourseCss(), ".course-hero__title");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/font-size:\s*clamp\(\s*var\(--text-5\)\s*,[^)]*var\(--text-7\)\s*\)/);
  });

  it("never reintroduces an oversized (84px-class) hero title", () => {
    const css = readCourseCss().replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/5\.3rem|84(\.\d+)?px/);
  });
});

describe("course map CSS contract: 44px interactive targets", () => {
  it("gives every lesson row link an explicit 44px minimum height", () => {
    const rule = findRule(readCourseCss(), ".module-card__lesson-link");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("does not shrink the module disclosure control below its inherited 44px action square", () => {
    const rule = findRule(readCourseCss(), ".module-card__disclosure");
    if (rule) {
      expect(rule).not.toMatch(/\bwidth\s*:/);
      expect(rule).not.toMatch(/\bheight\s*:/);
    }
  });
});

describe("course map CSS contract: state communicated beyond color alone", () => {
  it("gives each of the current/recommended/visited tags a distinct non-color glyph", () => {
    const css = readCourseCss();
    const current = findRule(css, ".module-card__tag--current::before");
    const recommended = findRule(css, ".module-card__tag--recommended::before");
    const visited = findRule(css, ".module-card__tag--visited::before");
    expect(current).toBeDefined();
    expect(recommended).toBeDefined();
    expect(visited).toBeDefined();
    const contents = [current, recommended, visited].map((rule) => {
      const match = rule?.match(/content:\s*"([^"]*)"/);
      return match?.[1];
    });
    expect(new Set(contents).size).toBe(3);
    for (const value of contents) {
      expect(value).toBeTruthy();
    }
  });
});

describe("course map CSS contract: mobile action stacking, no horizontal overflow", () => {
  it("stacks the hero actions to a single column under the shared mobile breakpoint", () => {
    const block = findMediaBlock(readCourseCss(), "@media (max-width: 720px)");
    expect(block).toMatch(/\.course-hero__actions\s*{[^}]*flex-direction:\s*column/);
  });

  it("stacks each module card's action row to a single column under the shared mobile breakpoint", () => {
    const block = findMediaBlock(readCourseCss(), "@media (max-width: 720px)");
    expect(block).toMatch(/\.module-card__actions\s*{[^}]*flex-direction:\s*column/);
  });

  it("lets module meta/tag rows wrap instead of forcing horizontal overflow", () => {
    const css = readCourseCss();
    const meta = findRule(css, ".module-card__meta");
    const tags = findRule(css, ".module-card__tags");
    expect(meta).toMatch(/flex-wrap:\s*wrap/);
    expect(tags).toMatch(/flex-wrap:\s*wrap/);
  });
});
