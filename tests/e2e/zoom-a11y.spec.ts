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
/**
 * Retained A1 lessons only (Tasks 16-18): the former Sounds/Foundations
 * modules are published by Base now and are covered at zoom by
 * `base-accessibility.spec.ts`, so asserting the A1 six-section learning
 * surface on them would measure a Base page.
 */
const A1_ZOOM_LESSONS = [
  { moduleId: "introductions", lessonId: "introductions-1", kind: "identity" },
  { moduleId: "actions", lessonId: "actions-2", kind: "actions" },
  { moduleId: "shopping", lessonId: "shopping-4", kind: "semantic" },
  { moduleId: "capstones", lessonId: "capstones-2", kind: "synthesis" },
] as const;
const A1_COURSE_URL = `${routeUrls.home}?livello=a1`;
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
    ).toBeLessThan(0.05);
  }
}

async function assertCourseMapZoomSurface(page: Page): Promise<void> {
  const areas = page.locator(".course-area");
  await expect(areas).toHaveCount(2);
  const areaShape = await areas.evaluateAll((nodes) =>
    nodes.map((area) => ({
      id: area.getAttribute("aria-labelledby")?.replace("course-area-", "") ?? "",
      modules: area.querySelectorAll(".module-card").length,
    })),
  );
  expect(areaShape).toEqual([
    { id: "situations", modules: 10 },
    { id: "synthesis", modules: 1 },
  ]);

  const situations = page.locator('.course-area[aria-labelledby="course-area-situations"]');
  const disclosures = situations.locator(".module-card__disclosure");
  for (let index = 0; index < await disclosures.count(); index += 1) {
    const disclosure = disclosures.nth(index);
    if ((await disclosure.getAttribute("aria-expanded")) === "false") {
      await disclosure.focus();
      await page.keyboard.press("Enter");
    }
  }
  await expect(
    situations.locator(".module-card__lesson-link").filter({ visible: true }),
  ).toHaveCount(40);
  await expect(page.locator('[role="status"]').first()).toBeVisible();

  let focus: { outlineStyle: string; outlineWidth: number } | null = null;
  for (let presses = 0; presses < 80 && focus === null; presses += 1) {
    await page.keyboard.press("Tab");
    focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || !element.classList.contains("module-card__disclosure")) {
        return null;
      }
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
  }
  expect(focus, "keyboard Tab reaches a Course Map disclosure").not.toBeNull();
  expect(focus!.outlineStyle).not.toBe("none");
  expect(focus!.outlineWidth).toBeGreaterThanOrEqual(2);

  const transitionSeconds = async (): Promise<number> =>
    disclosures.first().evaluate((element) =>
      Math.max(
        ...getComputedStyle(element)
          .transitionDuration.split(",")
          .map((part) => Number.parseFloat(part) || 0),
      ),
    );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const normalSeconds = await transitionSeconds();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedSeconds = await transitionSeconds();
  expect(normalSeconds).toBeGreaterThan(0);
  expect(reducedSeconds).toBeLessThan(0.05);
  expect(reducedSeconds).toBeLessThan(normalSeconds);

  expect(await auditTouchTargets(page)).toEqual([]);
  await assertNoHorizontalOverflow(page);
}

test.describe("A1 Course Map at real 200% zoom", () => {
  test("keeps the retained two-area hierarchy, focus, live status, and touch targets usable", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A1_COURSE_URL);

    const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
    assertZoomApplied(evidence);
    await assertCourseMapZoomSurface(page);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

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

test.describe("Base, A1 and A2 at the 320px reflow floor", () => {
  // Runs under both projects: the viewport is set explicitly below, so the
  // measurement is identical either way and nothing is conditionally skipped.
  test("keeps the Base map and lesson, the retained A1 areas and lessons, the A2 map, and an A2 lesson within the page viewport", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await page.setViewportSize({ width: 320, height: 640 });

    const screens = [
      routeUrls.home,
      routeUrls.lesson("sentence-foundations", "sentence-foundations-1"),
      routeUrls.lesson("time-movement", "time-movement-4"),
      A1_COURSE_URL,
      routeUrls.lesson("introductions", "introductions-1"),
      routeUrls.lesson("shopping", "shopping-4"),
      A2_COURSE_URL,
      routeUrls.lesson(A2_LESSON.moduleId, A2_LESSON.lessonId),
    ];
    for (const url of screens) {
      await gotoReady(page, url);
      if (url === routeUrls.home) {
        // A fresh learner lands on Base: a flat ten-module map, no areas.
        await expect(page.locator(".course-area")).toHaveCount(0);
        await expect(page.locator(".module-card")).toHaveCount(10);
      }
      if (url === A1_COURSE_URL) {
        await expect(page.locator(".course-area")).toHaveCount(2);
        await expect(page.locator(".module-card")).toHaveCount(11);
      }
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
