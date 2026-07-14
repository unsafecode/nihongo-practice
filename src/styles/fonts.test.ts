import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fontsCssPath = fileURLToPath(new URL("./fonts.css", import.meta.url));
const stylesCssPath = fileURLToPath(new URL("../styles.css", import.meta.url));

function readCss(path: string): string {
  return readFileSync(path, "utf8");
}

describe("self-hosted Manrope font faces", () => {
  it("declares a local @font-face for every required weight", () => {
    const css = readCss(fontsCssPath);
    const blocks = css.match(/@font-face\s*{[^}]*}/g) ?? [];
    const manropeBlocks = blocks.filter((block) =>
      block.includes('font-family: "Manrope"'),
    );
    const weights = manropeBlocks
      .map((block) => block.match(/font-weight:\s*(\d+)/)?.[1])
      .filter((value): value is string => Boolean(value))
      .sort();
    expect(weights).toEqual(["400", "500", "700", "800"]);
  });

  it("only references local woff2 assets, never an external origin", () => {
    const css = readCss(fontsCssPath);
    const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
      (match) => match[1],
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/\.woff2$/);
      expect(url).not.toMatch(/^https?:\/\//);
      expect(url).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });

  it("is imported by the application stylesheet", () => {
    const css = readCss(stylesCssPath);
    expect(css).toMatch(/@import\s+["']\.\/styles\/fonts\.css["'];/);
  });

  it("routes UI/body text through the self-hosted Manrope family", () => {
    const css = readCss(stylesCssPath);
    const fontUiDeclaration = css.match(/--font-ui:\s*([^;]+);/)?.[1] ?? "";
    expect(fontUiDeclaration).toMatch(/^"Manrope"/);
  });
});
