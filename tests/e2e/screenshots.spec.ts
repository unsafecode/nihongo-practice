import { expect, test } from "@playwright/test";
import {
  gotoReady,
  REPRESENTATIVE_LESSON,
  routeUrls,
  setupPageObservers,
} from "./helpers";

/**
 * Task B — the reviewed screenshot gate. Full-page baselines for the course
 * home and the representative content-rich lesson at both approved reference
 * viewports (four baselines total across the two projects). Baselines are
 * committed under tests/e2e/screenshots.spec.ts-snapshots/ and were generated
 * only after every functional/style assertion in the other specs passed, then
 * visually reviewed against the "Editoriale mnemonico" direction (design spec
 * §9.5). Animations are disabled and the caret hidden via the shared config so
 * the images are deterministic on the same toolchain.
 */

const LESSON_URL = routeUrls.lesson(
  REPRESENTATIVE_LESSON.moduleId,
  REPRESENTATIVE_LESSON.lessonId,
);

test.describe("reviewed full-page baselines", () => {
  test("course home", async ({ page }) => {
    // Reuse the storage-clearing observers so the hero renders its fresh,
    // deterministic "start" state independent of any prior run.
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await expect(page).toHaveScreenshot("course-home.png", { fullPage: true });
  });

  test("representative lesson", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);
    await expect(page).toHaveScreenshot("lesson-time-past.png", { fullPage: true });
  });
});
