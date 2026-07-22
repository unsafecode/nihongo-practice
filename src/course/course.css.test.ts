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

  describe("course map CSS contract: visibly bounded expanded lesson rows", () => {
    it("gives lesson rows a visible resting border and surface background", () => {
      const rule = findRule(readCourseCss(), ".module-card__lesson-link");
      expect(rule).toBeDefined();
      expect(rule).toMatch(/border:\s*1px solid var\(--course-line\)/);
      expect(rule).toMatch(/background:\s*var\(--course-surface\)/);
      expect(rule).not.toMatch(/border:\s*1px solid transparent/);
    });

    it("keeps module cards content-sized without fixed or minimum heights", () => {
      const rule = findRule(readCourseCss(), ".module-card");
      expect(rule).toBeDefined();
      expect(rule).not.toMatch(/(?:^|;)\s*(?:min-)?height\s*:/);
    });
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

describe("lesson page CSS contract: reading width separated from shell width", () => {
  it("bounds the outer lesson shell with the shared shell-max token, not a bespoke rem width", () => {
    const rule = findRule(readCourseCss(), ".lesson-layout");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/var\(--shell-max\)/);
    expect(rule).not.toMatch(/86rem/);
  });

  it("constrains the reading column to the shared 760-860px reading tokens, never the old 589px/64rem column or 86.4px padding", () => {
    const rule = findRule(readCourseCss(), ".lesson-main");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/var\(--reading-max\)/);
    expect(rule).not.toMatch(/64rem|589px|86\.4px|5\.5rem/);
  });
});

describe("lesson page CSS contract: bounded editorial heading", () => {
  it("caps the lesson H1 at the shared 50px heading token", () => {
    const rule = findRule(readCourseCss(), ".lesson-header h1");
    expect(rule).toBeDefined();
    expect(rule).toMatch(
      /font-size:\s*clamp\(\s*var\(--text-4\)\s*,[^)]*var\(--text-6\)\s*\)/,
    );
    expect(rule).not.toMatch(/\b4rem\b/);
  });
});

describe("lesson page CSS contract: shared sticky offset, no magic pixels", () => {
  it("sticks the desktop rail with the shared sticky-offset token", () => {
    const rule = findRule(readCourseCss(), ".lesson-rail");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/position:\s*sticky/);
    expect(rule).toMatch(/top:\s*var\(--sticky-offset\)/);
  });

  it("never hard-codes the old 18px/88px sticky offsets", () => {
    const css = readCourseCss().replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/\b88px\b/);
    expect(css).not.toMatch(/\b18px\b/);
  });

  it("removes the obsolete LessonSidebar styles entirely", () => {
    const css = readCourseCss();
    expect(css).not.toMatch(/\.lesson-sidebar/);
    expect(css).not.toMatch(/\.lesson-blocks/);
  });
});

describe("lesson page CSS contract: real before/after comparison", () => {
  it("lays the two comparison cards out as two columns at reading width", () => {
    const rule = findRule(readCourseCss(), ".lesson-comparison__cards");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/grid-template-columns:\s*repeat\(2/);
  });

  it("collapses the comparison to a single column under the shared mobile breakpoint", () => {
    const block = findMediaBlock(readCourseCss(), "@media (max-width: 720px)");
    expect(block).toMatch(
      /\.lesson-comparison__cards\s*{[^}]*grid-template-columns:\s*1fr/,
    );
  });

  it("sizes comparison Japanese with container units, never viewport vw", () => {
    const css = readCourseCss();
    const container = findRule(css, ".lesson-comparison");
    expect(container).toMatch(/container-type:\s*inline-size/);
    const jp = findRule(css, ".lesson-comparison__jp");
    expect(jp).toBeDefined();
    expect(jp).toMatch(/cqi/);
    expect(jp).not.toMatch(/vw/);
  });

  it("uses the shared system font stack (not a bespoke inline family) for comparison Japanese", () => {
    const jp = findRule(readCourseCss(), ".lesson-comparison__jp");
    expect(jp).toMatch(/font-family:\s*var\(--font-jp\)/);
  });
});

describe("lesson page CSS contract: honest dark guided board", () => {
  it("keeps the guided board on the shared dark board token", () => {
    const rule = findRule(readCourseCss(), ".guided-board");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/background:\s*var\(--course-board\)/);
  });

  it("sizes guided board Japanese with container units, never viewport vw", () => {
    const css = readCourseCss();
    const board = findRule(css, ".guided-board");
    expect(board).toMatch(/container-type:\s*inline-size/);
    const jp = findRule(css, ".guided-board__jp");
    expect(jp).toBeDefined();
    expect(jp).toMatch(/cqi/);
    expect(jp).not.toMatch(/vw/);
  });
});

describe("lesson page CSS contract: 44px rail + footer targets, mobile stacking", () => {
  it("gives each desktop rail step the shared 44px minimum target", () => {
    const rule = findRule(readCourseCss(), ".lesson-rail__step");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("gives each mobile rail step the shared 44px minimum target", () => {
    const rule = findRule(readCourseCss(), ".lesson-rail-mobile__step");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("stacks the lesson footer actions into a single column under the shared mobile breakpoint", () => {
    const block = findMediaBlock(readCourseCss(), "@media (max-width: 720px)");
    expect(block).toMatch(/\.lesson-footer\s*{[^}]*flex-direction:\s*column/);
  });
});

describe("A2 level selector + kanji CSS contract (Phase 3 Task 8)", () => {
  it("gives each level-selector option the shared 44px minimum touch target", () => {
    const rule = findRule(readCourseCss(), ".level-selector__option");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/min-height:\s*var\(--action-target-min\)/);
  });

  it("wraps the level-selector options so they never overflow horizontally", () => {
    const rule = findRule(readCourseCss(), ".level-selector__options");
    expect(rule).toMatch(/flex-wrap:\s*wrap/);
  });

  it("gives the focusable level heading a visible focus ring", () => {
    const rule = findRule(readCourseCss(), ".course-level-heading:focus-visible");
    expect(rule).toBeDefined();
    expect(rule).toMatch(/outline:/);
  });

  it("gives the kanji reveal control a visible focus ring and wraps the kanji list", () => {
    expect(findRule(readCourseCss(), ".kanji-reveal:focus-visible")).toMatch(/outline:/);
    expect(findRule(readCourseCss(), ".a2-kanji__list")).toMatch(/flex-wrap:\s*wrap/);
  });
});
