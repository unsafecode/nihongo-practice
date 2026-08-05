import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  applyBrowserZoom,
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  assertZoomApplied,
  auditTouchTargets,
  gotoReady,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const ZOOM_FACTOR = 2;
const A1_ZOOM_LESSONS = [
  { moduleId: "shopping", lessonId: "shopping-4", kind: "semantic" },
  { moduleId: "sounds", lessonId: "sounds-1", kind: "phonetic" },
] as const;
const A2_COURSE_URL = `${routeUrls.home}?livello=a2`;
const A2_LESSON = {
  moduleId: "sequencing-ongoing",
  lessonId: "sequencing-ongoing-3",
} as const;

async function activate(locator: Locator): Promise<void> {
  await locator.focus();
  await locator.page().keyboard.press("Enter");
}

async function visibleRail(page: Page): Promise<Locator> {
  const desktop = page.locator(".lesson-rail");
  if (await desktop.isVisible()) return desktop;
  const mobile = page.locator(".lesson-rail-mobile");
  await expect(mobile).toBeVisible();
  return mobile;
}

async function assertA1ZoomSurface(page: Page): Promise<void> {
  const rail = await visibleRail(page);
  await expect(rail.locator("a")).toHaveCount(6);
  const railMetrics = await rail.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    };
  });
  expect(
    [railMetrics.overflowX, railMetrics.overflowY],
    "the sticky rail owns a scroll axis instead of expanding the page",
  ).toEqual(expect.arrayContaining(["auto"]));

  await expect(page.locator(".a1-vocabulary__item").first()).toBeVisible();
  await expect(page.locator(".a1-vocabulary__meaning").first()).toContainText(/\S/);
  await expect(page.locator(".a1-learning-note__pattern li").first()).toBeVisible();
  await expect(page.locator(".a1-learning-note__pattern-label").first()).toContainText(/\S/);
  await expect(page.locator(".a1-worked-examples__glosses").first()).toBeVisible();
  await expect(page.locator(".a1-worked-examples__translation").first()).toContainText(/\S/);
  await expect(page.locator(".a1-worked-examples__card .a1-audio-button__control").first()).toBeVisible();
  await expect(page.locator(".lesson-exercise")).toHaveCount(4);
  await expect(page.locator(".lesson-exercise__form").first()).toBeVisible();
  await expect(page.locator(".spoken-attempt")).toHaveCount(1);
  await expect(page.locator(".spoken-attempt__heading")).toBeVisible();

  await expect(page.locator('.lesson-exercise__feedback[aria-live="polite"]')).toHaveCount(4);
  expect(
    await page.locator('.a1-audio-button__status[role="status"][aria-live="polite"]').count(),
    "every visible word/example playback control carries a polite status",
  ).toBeGreaterThanOrEqual(6);

  const targets = await auditTouchTargets(page);
  expect(targets, JSON.stringify(targets, null, 2)).toEqual([]);
  await assertNoHorizontalOverflow(page);
}

async function assertFocusAndReducedMotion(page: Page): Promise<void> {
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focused, "a keyboard focus target exists").not.toBeNull();
  expect(focused!.outlineStyle).not.toBe("none");
  expect(focused!.outlineWidth).toBeGreaterThanOrEqual(2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const transitions = await page.evaluate(() =>
    [
      ".a1-vocabulary",
      ".a1-learning-note",
      ".a1-worked-examples",
      ".a1-practice-ladder",
      ".a1-audio-button__control",
    ].flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => ({
        selector,
        duration: getComputedStyle(element).transitionDuration,
      })),
    ),
  );
  for (const transition of transitions) {
    const maximum = Math.max(
      ...transition.duration
        .split(",")
        .map((part) => Number.parseFloat(part) || 0),
    );
    expect(
      maximum,
      `${transition.selector} has no motion transition under reduced-motion`,
    ).toBe(0);
  }
}

for (const lesson of A1_ZOOM_LESSONS) {
  test.describe(`${lesson.kind} A1 lesson ${lesson.lessonId} at real 200% zoom`, () => {
    test("reflows or pinch-zooms the complete six-section learning surface without page overflow", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));

      const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
      assertZoomApplied(evidence);
      await assertA1ZoomSurface(page);
      await assertFocusAndReducedMotion(page);

      const rail = await visibleRail(page);
      const recap = rail.locator("a").last();
      await activate(recap);
      await expect(recap).toBeFocused();
      await expect
        .poll(() =>
          page.evaluate(() => {
            const section = document.getElementById("lesson-section-recap");
            return section?.getBoundingClientRect().top ?? Number.NaN;
          }),
        )
        .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  });
}

test.describe("A1 and A2 at the 320px reflow floor", () => {
  test("keeps an early A1 lesson, migrated shopping scenario, A2 map, and A2 lesson within the page viewport", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "the explicit 320px floor runs once");
    const observers = await setupPageObservers(page);
    await page.setViewportSize({ width: 320, height: 640 });

    const screens = [
      routeUrls.lesson("introductions", "introductions-1"),
      routeUrls.lesson("shopping", "shopping-4"),
      A2_COURSE_URL,
      routeUrls.lesson(A2_LESSON.moduleId, A2_LESSON.lessonId),
    ];
    for (const url of screens) {
      await gotoReady(page, url);
      await assertNoHorizontalOverflow(page);
      const targets = await auditTouchTargets(page);
      expect(targets, `${url} targets: ${JSON.stringify(targets)}`).toEqual([]);
    }

    await expect(page.locator(".a2-lesson-rule")).toBeVisible();
    await expect(page.locator(".a2-kanji")).toBeVisible();
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
