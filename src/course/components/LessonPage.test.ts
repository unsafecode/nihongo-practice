import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regression coverage for the LessonPage infinite-update-loop bug: the
 * visited-marking effect must depend only on a stable primitive derived
 * from `resolution` (plus the stable `markVisited` callback), never on the
 * `resolution` object itself - `resolveLessonRoute` returns a fresh object
 * every render, so depending on it directly makes the effect (and its
 * `markVisited` call, and the progress-context rerender that follows) run
 * on every render, forever.
 *
 * There is no React test harness in this repo that actually executes
 * effects: the existing component tests use `renderToStaticMarkup`
 * (react-dom/server), which never runs `useEffect` at all, and no
 * `@testing-library/react`-style DOM harness with `act()` is installed.
 * Introducing one purely for this single regression would be a heavyweight
 * dependency add for one bug. So, consistent with this repo's existing
 * "source contract" test pattern (see
 * routing/lessonSectionAnchorOffset.test.ts), this asserts the dependency
 * array directly against the component source.
 */

const lessonPagePath = fileURLToPath(new URL("./LessonPage.tsx", import.meta.url));

function readSource(): string {
  return readFileSync(lessonPagePath, "utf8");
}

function extractVisitedEffect(source: string): string {
  const match = source.match(
    /useEffect\(\(\) => \{[\s\S]*?markVisited\([\s\S]*?\}, \[[^\]]*\]\);/,
  );
  if (!match) {
    throw new Error("Could not find the visited-marking useEffect in LessonPage.tsx");
  }
  return match[0];
}

describe("LessonPage visited-marking effect dependency contract", () => {
  it("derives a primitive matched lesson id instead of depending on the resolution object", () => {
    const source = readSource();
    expect(source).toMatch(
      /const matchedLessonId = resolution\.kind === "match" \? resolution\.lesson\.id : null;/,
    );
  });

  it("depends only on the primitive matchedLessonId and the stable markVisited callback", () => {
    const effect = extractVisitedEffect(readSource());
    const depsMatch = effect.match(/\[([^\]]*)\]\);$/);
    expect(depsMatch).not.toBeNull();
    const deps = depsMatch![1].split(",").map((dep) => dep.trim()).filter(Boolean);
    expect(deps).toEqual(["matchedLessonId", "markVisited"]);
  });

  it("never lists the fresh-every-render resolution object as an effect dependency", () => {
    const effect = extractVisitedEffect(readSource());
    const depsMatch = effect.match(/\[([^\]]*)\]\);$/);
    const deps = depsMatch![1].split(",").map((dep) => dep.trim());
    expect(deps).not.toContain("resolution");
  });

  it("guards the markVisited call with the primitive id, not resolution.kind", () => {
    const effect = extractVisitedEffect(readSource());
    expect(effect).toMatch(/if \(matchedLessonId !== null\) markVisited\(matchedLessonId\);/);
  });
});
