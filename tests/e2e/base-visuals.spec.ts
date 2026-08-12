import { expect, test, type Page } from "@playwright/test";
import {
  installSpeechSynthesisFake,
  queueSpeechSynthesisOutcome,
} from "./helpers";
import {
  applyScreenshotState,
  gotoReady,
  seedFreshLearner,
  seedV4Progress,
} from "./baseFixtures";

/**
 * Task 18 — the reviewed Base visual baselines. Every image below was
 * generated from the built production preview at one of the two approved
 * reference viewports (both Playwright projects), then opened and inspected
 * before being committed: hierarchy, density, wrapping, clipping, overflow,
 * table/card equivalence, focus visibility, status clarity, and whether the
 * surface visibly teaches the system it promises.
 *
 * Locale variants exist wherever the learner-visible copy is the thing under
 * review; script-mode (hiragana/rōmaji) variants exist only where the Japanese
 * text flow actually changes, i.e. the generated reference grids and the
 * dialogue/worked-example cards.
 */

const BASE_MAP_ROUTE = "/percorso";
const DIALOGUE_LESSON_ROUTE = "/percorso/existence-location/existence-location-4";
const SYNTHESIS_LESSON_ROUTE = "/percorso/base-synthesis/base-synthesis-1";
const A1_UNCHANGED_LESSON_ROUTE = "/percorso/introductions/introductions-1";
const A2_UNCHANGED_LESSON_ROUTE = "/percorso/sequencing-ongoing/sequencing-ongoing-3";
const reference = (id: string) => `/riferimenti/base/${id}`;

/**
 * Installs a synthesis surface that exposes no Japanese voice, so no canonical
 * playback source resolves. The control must then report `unavailable`
 * honestly — never silently substitute a different (non-Japanese) voice.
 */
async function installNoJapaneseVoice(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const synth = {
      getVoices: () => [{ lang: "en-US", name: "E2E English voice" }],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      cancel: () => undefined,
      speak: () => undefined,
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synth,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        lang = "";
        rate = 1;
        voice: unknown = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((event: { readonly error: string }) => void) | null = null;
        constructor(readonly text: string) {}
      },
    });
  });
}

test.describe("Base level selector and map", () => {
  test("three-level selector and Base map (IT)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, BASE_MAP_ROUTE);
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    await expect(page.locator('[data-level="a0"]')).toHaveAttribute("aria-current", "true");
    await expect(page).toHaveScreenshot("base-map-it.png", { fullPage: true });
  });

  test("three-level selector and Base map (EN)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, BASE_MAP_ROUTE);
    await applyScreenshotState(page, { locale: "en", script: "hiragana" });
    await expect(page).toHaveScreenshot("base-map-en.png", { fullPage: true });
  });

  test("three-level selector, focused", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, BASE_MAP_ROUTE);
    await applyScreenshotState(page, { locale: "it" });
    const selector = page.locator(".level-selector");
    await page.locator('[data-level="a1"]').focus();
    await expect(selector).toHaveScreenshot("base-level-selector-focused.png");
  });
});

test.describe("Base progressive references", () => {
  test("sentence anatomy (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("sentence-anatomy"));
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-sentence-anatomy-it.png", { fullPage: true });
  });

  test("complete particle atlas (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("particle-atlas"));
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-particle-atlas-it.png", { fullPage: true });
  });

  test("complete particle atlas (EN, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("particle-atlas"));
    await applyScreenshotState(page, { locale: "en", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-particle-atlas-en.png", { fullPage: true });
  });

  test("verb classes and conjugation (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("verb-classes-conjugation"));
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-verb-classes-it.png", { fullPage: true });
  });

  test("tense and polarity (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("tense-polarity"));
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-tense-polarity-it.png", { fullPage: true });
  });

  test("adjectives and copula (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, reference("adjective-copula"));
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Captured as a full page: an element-scoped shot scrolls the grid under
    // the sticky header, which would hide the column headers in the baseline.
    await expect(page).toHaveScreenshot("base-reference-adjective-copula-it.png", { fullPage: true });
  });
});

test.describe("script mode", () => {
  /**
   * Measured, not assumed: every Base surface renders the kana and the rōmaji
   * together (the reference grids pair `__cell-japanese` with `__cell-romaji`;
   * worked examples pair `__japanese` with `__romaji`), so the script toggle
   * changes no Base text flow at all. That is why this spec carries no
   * script-mode baseline variants for Base — a rōmaji PNG would be a
   * byte-identical duplicate rather than evidence.
   */
  test("the script toggle changes no Base text flow", async ({ page }) => {
    await seedFreshLearner(page);
    for (const [route, selector] of [
      [reference("particle-atlas"), ".base-reference-grid"],
      [reference("verb-classes-conjugation"), ".base-reference-grid"],
      [DIALOGUE_LESSON_ROUTE, ".lesson-main"],
    ] as const) {
      await gotoReady(page, route);
      await applyScreenshotState(page, { locale: "it", script: "hiragana" });
      const target = page.locator(selector);
      const hiragana = await target.innerHTML();
      const hiraganaBox = await target.boundingBox();
      await applyScreenshotState(page, { script: "romaji" });
      const romaji = await target.innerHTML();
      const romajiBox = await target.boundingBox();
      expect(romaji, `${route} renders identically in rōmaji mode`).toBe(hiragana);
      expect(romajiBox, `${route} keeps its geometry in rōmaji mode`).toEqual(hiraganaBox);
      // Both scripts really are present side by side, which is *why* the
      // toggle is a no-op here.
      expect(hiragana).toMatch(/romaji/);
    }
  });
});

test.describe("Base lessons", () => {
  test("dialogue lesson (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, DIALOGUE_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    await expect(page).toHaveScreenshot("base-lesson-dialogue-it.png", { fullPage: true });
  });

  test("dialogue lesson (EN, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, DIALOGUE_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "en", script: "hiragana" });
    // Full page: an element-scoped shot of a mid-page block scrolls it under
    // the sticky mobile lesson rail, which would bake an occluded first turn
    // into the baseline.
    await expect(page).toHaveScreenshot("base-lesson-dialogue-en.png", { fullPage: true });
  });

  test("synthesis lesson (IT, hiragana)", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, SYNTHESIS_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    await expect(page).toHaveScreenshot("base-lesson-synthesis-it.png", { fullPage: true });
  });
});

test.describe("unchanged A1 and A2 lessons", () => {
  test("retained A1 lesson is unchanged", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, A1_UNCHANGED_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    // Full page: an element-scoped shot scrolls the lesson under the sticky
    // header and would bake a clipped title into the baseline.
    await expect(page).toHaveScreenshot("unchanged-a1-introductions-1.png", {
      fullPage: true,
    });
  });

  test("A2 lesson is unchanged", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, A2_UNCHANGED_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it", script: "hiragana" });
    await expect(page).toHaveScreenshot("unchanged-a2-sequencing-ongoing-3.png", {
      fullPage: true,
    });
  });
});

test.describe("Base canonical audio states", () => {
  test("audio unavailable", async ({ page }) => {
    await seedFreshLearner(page);
    await installNoJapaneseVoice(page);
    await gotoReady(page, DIALOGUE_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it" });
    const listening = page.locator(".base-listening-activity");
    await listening.scrollIntoViewIfNeeded();
    await expect(listening.locator(".base-audio-button")).toHaveAttribute(
      "data-audio-status",
      "unavailable",
    );
    await expect(listening).toHaveScreenshot("base-audio-unavailable.png");
  });

  test("audio failure with retry", async ({ page }) => {
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await gotoReady(page, DIALOGUE_LESSON_ROUTE);
    await applyScreenshotState(page, { locale: "it" });
    const listening = page.locator(".base-listening-activity");
    await listening.scrollIntoViewIfNeeded();
    await queueSpeechSynthesisOutcome(page, { kind: "failure", error: "synthesis-failed" });
    await listening.locator(".base-audio-button__control").click();
    await expect(listening.locator(".base-audio-button")).toHaveAttribute(
      "data-audio-status",
      "failed",
    );
    await expect(listening).toHaveScreenshot("base-audio-failed.png");
  });
});

test.describe("Base migration notice", () => {
  test("migration notice and its historical help", async ({ page }) => {
    await seedV4Progress(page);
    await gotoReady(page, BASE_MAP_ROUTE);
    await applyScreenshotState(page, { locale: "it" });
    await expect(page.locator(".notice--info")).toBeVisible();
    await expect(page.locator(".progress-migration-help")).toBeVisible();
    await expect(page).toHaveScreenshot("base-migration-notice-it.png", { fullPage: true });
  });
});
