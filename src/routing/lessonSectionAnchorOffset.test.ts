import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LESSON_SECTION_ANCHOR_CLASS } from "./lessonSections";

const tokensCssPath = fileURLToPath(
  new URL("../styles/tokens.css", import.meta.url),
);

function findRuleBody(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : null;
}

describe("lesson section anchor scroll-offset CSS contract", () => {
  it("applies scroll-margin-top from the shared sticky-offset token to the anchor class", () => {
    const css = readFileSync(tokensCssPath, "utf8");
    const ruleBody = findRuleBody(css, `.${LESSON_SECTION_ANCHOR_CLASS}`);
    expect(ruleBody).not.toBeNull();
    expect(ruleBody).toMatch(/scroll-margin-top:\s*var\(--sticky-offset\)/);
  });
});
