import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LESSON_SECTION_ANCHOR_CLASS } from "./lessonSections";

const tokensCssPath = fileURLToPath(
  new URL("../styles/tokens.css", import.meta.url),
);

/**
 * Mobile breakpoint at which the desktop `.lesson-rail` hides and the
 * sticky `.lesson-rail-mobile` context rail takes over (see
 * src/course/course.css). The anchor offset contract has to match this
 * breakpoint or the override never applies on the viewport where the
 * rail actually overlaps the section heading.
 */
const MOBILE_RAIL_BREAKPOINT = "max-width: 720px";

/**
 * Extracts the bodies of every top-level `@media (<query>) { ... }` block
 * in a CSS source string, matching braces so nested rule blocks inside the
 * media query don't truncate the match early.
 */
function findMediaBlockBodies(css: string, query: string): string[] {
  const bodies: string[] = [];
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mediaStart = new RegExp(`@media\\s*\\(${escapedQuery}\\)\\s*\\{`, "g");
  for (const match of css.matchAll(mediaStart)) {
    const bodyStart = match.index! + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    bodies.push(css.slice(bodyStart, i - 1));
  }
  return bodies;
}

function findRuleBody(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : null;
}

describe("mobile lesson section anchor scroll-offset CSS contract", () => {
  it("keeps the base anchor rule on the shared sticky-offset token (desktop unchanged)", () => {
    const css = readFileSync(tokensCssPath, "utf8");
    const ruleBody = findRuleBody(css, `.${LESSON_SECTION_ANCHOR_CLASS}`);
    expect(ruleBody).not.toBeNull();
    expect(ruleBody!.trim()).toBe("scroll-margin-top: var(--sticky-offset);");
  });

  it("overrides the anchor scroll-margin inside the mobile rail breakpoint to clear the sticky context rail", () => {
    const css = readFileSync(tokensCssPath, "utf8");
    const mobileBlocks = findMediaBlockBodies(css, MOBILE_RAIL_BREAKPOINT);
    const mobileAnchorBody = mobileBlocks
      .map((block) => findRuleBody(block, `.${LESSON_SECTION_ANCHOR_CLASS}`))
      .find((body) => body !== null);

    expect(mobileAnchorBody).toBeDefined();
    // Must be a calc() built from the existing finite tokens: the shared
    // sticky header offset plus the mobile rail's height driver
    // (--action-target-min, the rail's min tap-target height) — not a
    // bespoke magic-number pixel value.
    expect(mobileAnchorBody).toMatch(/scroll-margin-top:\s*calc\(/);
    expect(mobileAnchorBody).toMatch(/var\(--sticky-offset\)/);
    expect(mobileAnchorBody).toMatch(/var\(--action-target-min\)/);
    expect(mobileAnchorBody).not.toMatch(/\b(64|124|188)px\b/);
  });
});
