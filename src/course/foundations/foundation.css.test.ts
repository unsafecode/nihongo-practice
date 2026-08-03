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

const a1LessonPagePath = fileURLToPath(
  new URL("../components/A1LessonPage.tsx", import.meta.url),
);

describe("foundation.css shipping contract", () => {
  it("course.css never globally imports the foundation harness styles", () => {
    const css = readFileSync(courseCssPath, "utf8");
    expect(css).not.toMatch(
      /@import\s+["']\.\/foundations\/foundation\.css["']/,
    );
  });

  // `foundation.css` styles `SentenceMatrix`/`FamilyGuidedConstruction`,
  // which render on every real semantic A1 lesson via `A1LessonPage`, not
  // just the gated fixture harness — so this import must be unconditional
  // (a plain top-level `import`, never behind the
  // `VITE_FOUNDATION_FIXTURES` flag or a dynamic `import()`) for the real
  // production runtime to be styled. Regression test for a prior bug where
  // this stylesheet shipped only as a side effect of the fixture harness's
  // own gated import and tree-shook out of every normal/Pages build.
  it("A1LessonPage imports foundation.css unconditionally for production runtime", () => {
    const source = readFileSync(a1LessonPagePath, "utf8");
    expect(source).toMatch(/^import\s+["']\.\.\/foundations\/foundation\.css["'];?\s*$/m);
  });

  // The fixture harness's *own* import stays behind the compile-time flag
  // (via `routes.tsx`'s conditional `import()` of the whole
  // `FoundationFixturePage` module, not a guard in this file) — it does not
  // need to import the stylesheet unconditionally itself now that
  // `A1LessonPage` already guarantees it ships, but it still imports it
  // directly (rather than relying on load-order luck from another module)
  // so the fixture route is self-contained and stays correctly styled if
  // ever rendered standalone.
  it("FoundationFixturePage still imports foundation.css directly, independent of A1LessonPage", () => {
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

  it("draws one unnumbered coral rail with shape-based row markers", () => {
    const css = readFoundationCss();
    const rows = findRule(css, ".foundation-matrix__rows");
    const rail = findRule(css, ".foundation-matrix__rows::before");
    const marker = findRule(css, ".foundation-matrix__row::before");

    expect(rows).toMatch(/position:\s*relative/);
    expect(rows).toMatch(/padding-inline-start:\s*var\(--space-6\)/);
    expect(rail).toMatch(/content:\s*""/);
    expect(rail).toMatch(/width:\s*3px/);
    expect(rail).toMatch(/background:\s*var\(--course-coral\)/);
    expect(marker).toMatch(/width:\s*0\.75rem/);
    expect(marker).toMatch(/height:\s*0\.75rem/);
    expect(marker).toMatch(/border:\s*3px solid var\(--course-coral\)/);
    expect(marker).toMatch(/border-radius:\s*999px/);
    // The marker is centered on the rail: its inline inset must compensate
    // for the row's own 2px border, or the marker renders 2px off-center.
    expect(marker).toMatch(
      /inset-inline-start:\s*calc\(-1 \* var\(--space-6\) - 2px\)/,
    );
    // The global `*` border-box reset does not select pseudo-elements, so
    // the marker must declare its own border-box sizing: otherwise its
    // width/height are the content box and the 3px border adds 6px to the
    // rendered diameter, throwing the marker off-center from the rail.
    expect(marker).toMatch(/box-sizing:\s*border-box/);
  });

  it("gives rows strong token-based surfaces and a phrase-first vertical hierarchy", () => {
    const css = readFoundationCss();
    const row = findRule(css, ".foundation-matrix__row");
    const sentence = findRule(css, ".foundation-matrix__sentence");
    const romajiOnly = findRule(css, ".foundation-matrix--romaji .foundation-matrix__romaji");

    expect(row).toMatch(/padding:\s*var\(--space-5\)/);
    expect(row).toMatch(/border:\s*2px solid var\(--course-line\)/);
    expect(row).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(row).toMatch(/background:\s*var\(--course-surface\)/);
    expect(row).toMatch(/box-shadow:\s*var\(--shadow-sm\)/);
    expect(sentence).toMatch(/flex-direction:\s*column/);
    expect(romajiOnly).toMatch(/font-size:\s*var\(--text-3\)/);
    expect(romajiOnly).toMatch(/font-weight:\s*700/);
  });

  it("styles metadata as wrapping secondary badges and omission as tertiary copy", () => {
    const css = readFoundationCss();
    const pair = findRule(css, ".foundation-matrix__meta-pair");
    const omitted = findRule(css, ".foundation-matrix__omitted");

    expect(pair).toMatch(/display:\s*inline-flex/);
    expect(pair).toMatch(/border:\s*1px solid var\(--course-line\)/);
    expect(pair).toMatch(/border-radius:\s*999px/);
    expect(pair).toMatch(/padding:\s*var\(--space-1\) var\(--space-3\)/);
    expect(omitted).toMatch(/font-size:\s*var\(--text-1\)/);
    expect(omitted).toMatch(/color:\s*var\(--course-muted\)/);
  });

  it("uses background, weight, and underline for comparison emphasis", () => {
    const mark = findRule(readFoundationCss(), ".foundation-matrix__comparison-token");
    expect(mark).toMatch(/background:\s*var\(--course-coral-soft\)/);
    expect(mark).toMatch(/font-weight:\s*800/);
    expect(mark).toMatch(/text-decoration-line:\s*underline/);
    expect(mark).toMatch(/text-decoration-thickness:\s*0\.15em/);
    expect(mark).toMatch(/text-underline-offset:\s*0\.12em/);
  });

  it("reduces the rail inset and stacks metadata at the existing narrow breakpoint", () => {
    const block = findMediaBlock(readFoundationCss(), "@media (max-width: 700px)");
    expect(block).toMatch(/\.foundation-matrix__rows[\s\S]*padding-inline-start:\s*var\(--space-5\)/);
    expect(block).toMatch(/\.foundation-matrix__row[\s\S]*padding:\s*var\(--space-4\)/);
    expect(block).toMatch(/\.foundation-matrix__meta[\s\S]*flex-direction:\s*column/);
    // The narrow-breakpoint marker override must also compensate for the
    // row's 2px border, matching the base rule's compensation.
    expect(block).toMatch(
      /\.foundation-matrix__row::before[\s\S]*inset-inline-start:\s*calc\(-1 \* var\(--space-5\) - 2px\)/,
    );
  });
});
