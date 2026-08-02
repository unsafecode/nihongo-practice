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

// Phase 3 Task 9 — reviewed A2 release baselines. The A2 course map (level
// selector + module grid + per-level evidence surfaces), a representative
// deep A2 lesson (the ている "ongoing" module, `sequencing-ongoing-3`, whose
// rule section shows the staged contextual-kanji UI), and focused element
// baselines for the two A2-only kanji states: the revealable glyph after its
// reading is revealed, and the assessed contextual word (taught glyph
// emphasised) with its why-caption. Each
// is captured at both approved reference viewports and reviewed before commit.
const A2_MAP_URL = `${routeUrls.home}?livello=a2`;
const A2_TEIRU_LESSON_URL = routeUrls.lesson("sequencing-ongoing", "sequencing-ongoing-3");
const A2_ASSESSED_LESSON_URL = routeUrls.lesson("connected-conversation", "connected-conversation-4");

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

test.describe("reviewed A2 release baselines", () => {
  test("A2 course map", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_MAP_URL);
    await expect(page).toHaveScreenshot("a2-course-map.png", { fullPage: true });
  });

  test("A2 representative teiru lesson", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_TEIRU_LESSON_URL);
    await expect(page).toHaveScreenshot("a2-lesson-teiru.png", { fullPage: true });
  });

  test("A2 revealable kanji (revealed)", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_TEIRU_LESSON_URL);
    const kanji = page.locator(".a2-kanji");
    await kanji.scrollIntoViewIfNeeded();
    // Reveal the revealable glyph's reading so the baseline documents the
    // revealed (ruby + rt) state alongside the supported ruby states.
    const reveal = page.locator('.a2-kanji__item[data-stage="revealable"] .kanji-reveal').first();
    await reveal.click();
    await expect(page.locator('.a2-kanji__item[data-stage="revealable"] rt')).toHaveCount(1);
    await expect(kanji).toHaveScreenshot("a2-kanji-revealable.png");
  });

  test("A2 assessed kanji", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_ASSESSED_LESSON_URL);
    const kanji = page.locator(".a2-kanji");
    await kanji.scrollIntoViewIfNeeded();
    await expect(kanji.locator('.a2-kanji__item[data-stage="assessed"]').first()).toBeVisible();
    await expect(kanji).toHaveScreenshot("a2-kanji-assessed.png");
  });
});
