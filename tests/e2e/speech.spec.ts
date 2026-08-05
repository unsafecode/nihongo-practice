import { expect, test, type Locator, type Page } from "@playwright/test";
import { getA1SpokenAttemptModel } from "../../src/course/components/a1SpokenAttemptModel";
import { getCourseCopy } from "../../src/course/i18n/catalog";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
  gotoReady,
  holdNextRecognition,
  installSpeechFake,
  queueSpeechOutcome,
  resolvePendingRecognition,
  routeUrls,
  setupPageObservers,
  speechStats,
  speechStatusLog,
  type SpeechFakeFailure,
} from "./helpers";

const SPEECH_LESSON = { moduleId: "introductions", lessonId: "introductions-1" } as const;
const SPEECH_URL = routeUrls.lesson(SPEECH_LESSON.moduleId, SPEECH_LESSON.lessonId);
const EN = getCourseCopy("en").spokenAttempt;
const IT = getCourseCopy("it").spokenAttempt;
const spokenResult = getA1SpokenAttemptModel(SPEECH_LESSON.lessonId, "en");
if (!spokenResult.ok) {
  throw new Error(`Cannot resolve A1 speech fixture: ${spokenResult.error.code}`);
}
const SPOKEN = spokenResult.model;

function isMobile(width: number): boolean {
  return width < 700;
}

async function boot(
  page: Page,
  options: { readonly supported?: boolean; readonly url?: string } = {},
) {
  const observers = await setupPageObservers(page);
  await installSpeechFake(page, { supported: options.supported ?? true });
  await gotoReady(page, options.url ?? SPEECH_URL);
  const block = page.locator(".spoken-attempt");
  await expect(block).toBeVisible();
  return {
    observers,
    block,
    status: block.locator(".spoken-attempt__status-text"),
  };
}

function control(block: Locator, name: string): Locator {
  return block.getByRole("button", { name, exact: true });
}

async function acknowledge(block: Locator, copy: typeof IT | typeof EN): Promise<void> {
  await control(block, copy.tryButton).click();
  await expect(block.locator(".spoken-attempt__consent")).toBeVisible();
  await control(block, copy.consentAcknowledge).click();
  await expect(control(block, copy.micStart)).toBeVisible();
}

async function visibleSettings(page: Page): Promise<Locator> {
  const desktop = page.locator(".header__settings--desktop");
  if (await desktop.isVisible()) return desktop;
  await page.locator(".header__settings-trigger").click();
  const drawer = page.locator(".settings-drawer__panel");
  await expect(drawer).toBeVisible();
  return drawer;
}

async function closeSettings(page: Page): Promise<void> {
  const drawer = page.locator(".settings-drawer__panel");
  if (await drawer.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  }
}

test.describe("A1 spoken attempt — public recognizer acceptance", () => {
  test("shows consent before the microphone and recognizes only after the explicit mic action", async ({
    page,
  }) => {
    const { observers, block, status } = await boot(page);
    await expect(control(block, IT.tryButton)).toBeVisible();
    await expect(control(block, IT.micStart)).toHaveCount(0);
    expect((await speechStats(page)).recognizeCount).toBe(0);

    await control(block, IT.tryButton).click();
    await expect(block.getByText(IT.consentTitle)).toBeVisible();
    await expect(control(block, IT.micStart)).toHaveCount(0);
    await control(block, IT.consentAcknowledge).click();
    expect((await speechStats(page)).recognizeCount).toBe(0);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: SPOKEN.targetJp });
    await control(block, IT.micStart).click();
    await expect(status).toHaveText(IT.resultMatched);
    expect(await speechStats(page)).toMatchObject({
      recognizeCount: 1,
      calls: [{ lang: "ja-JP" }],
    });
    await expect(block.locator(".spoken-attempt__segment--matched")).toHaveCount(
      SPOKEN.segments.length,
    );

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("matched, close, and retry outcomes expose truthful text and never claim a score", async ({
    page,
  }) => {
    const { observers, block, status } = await boot(page);
    await acknowledge(block, IT);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: SPOKEN.targetJp });
    await control(block, IT.micStart).click();
    await expect(status).toHaveText(IT.resultMatched);
    await expect(block.locator(".spoken-attempt__heard-text")).toHaveText(SPOKEN.targetJp);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: `${SPOKEN.targetJp}ね` });
    await control(block, IT.tryAgain).click();
    await expect(status).toHaveText(IT.resultClose);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: "ちがいます" });
    await control(block, IT.tryAgain).click();
    await expect(status).toHaveText(IT.resultRetry);
    await expect(block.locator(".spoken-attempt__segment--missing")).toHaveCount(
      SPOKEN.segments.length,
    );
    const text = (await block.innerText()).toLowerCase();
    for (const forbidden of ["%", "punteggio", "pronuncia", "score", "pronunciation", "grade"]) {
      expect(text).not.toContain(forbidden);
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("all mapped recognition failures remain localized, retryable, and nonblocking", async ({
    page,
  }) => {
    const failureCopy: ReadonlyArray<readonly [SpeechFakeFailure, string]> = [
      ["denied", IT.errorDenied],
      ["no-speech", IT.errorNoSpeech],
      ["aborted", IT.errorAborted],
      ["network-error", IT.errorNetwork],
      ["service-error", IT.errorService],
    ];
    const { observers, block, status } = await boot(page);
    await acknowledge(block, IT);

    for (const [index, [failure, expected]] of failureCopy.entries()) {
      await queueSpeechOutcome(page, { kind: "failure", failure });
      await control(block, index === 0 ? IT.micStart : IT.tryAgain).click();
      await expect(status).toHaveText(expected);
      await expect(control(block, IT.tryAgain)).toBeVisible();
    }
    await expect(page.locator(".lesson-exercise")).toHaveCount(4);
    await expect(page.locator(".a1-vocabulary__meaning").first()).toContainText(/\S/);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("supports abort/retry, polite progress announcements, and stale-result isolation", async ({
    page,
  }) => {
    const { observers, block, status } = await boot(page);
    await acknowledge(block, IT);

    await holdNextRecognition(page);
    await control(block, IT.micStart).click();
    await expect(status).toHaveText(IT.statusListening);
    await control(block, IT.micStop).focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText(IT.errorAborted);
    expect((await speechStats(page)).abortCount).toBe(1);

    const announcements = await speechStatusLog(page);
    expect(announcements).toContain(IT.statusListening);
    await queueSpeechOutcome(page, { kind: "transcript", transcript: SPOKEN.targetJp });
    await control(block, IT.tryAgain).click();
    await expect(status).toHaveText(IT.resultMatched);

    // A pending recognizer result is the state that must never leak through a
    // lesson transition; a completed result is session evidence, not a stale
    // asynchronous callback.
    await holdNextRecognition(page);
    await control(block, IT.tryAgain).click();
    await expect(status).toHaveText(IT.statusListening);
    await page.evaluate(() => {
      window.location.hash = "#/percorso/introductions/introductions-2";
    });
    await page.waitForFunction(() => window.location.hash.includes("introductions-2"));
    const nextBlock = page.locator(".spoken-attempt");
    await expect(nextBlock).toBeVisible();
    await resolvePendingRecognition(page, { kind: "transcript", transcript: SPOKEN.targetJp });
    await expect(nextBlock.locator(".spoken-attempt__heard")).toHaveCount(0);
    await expect(nextBlock.locator(".spoken-attempt__segments")).toHaveCount(0);
    expect(
      await nextBlock.locator(".spoken-attempt__status-text").allTextContents(),
      "a prior lesson's transcript can never produce a matched result on the next lesson",
    ).not.toContain(IT.resultMatched);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("unsupported recognition remains graceful and all lesson navigation stays usable", async ({
    page,
  }) => {
    const { observers, block, status } = await boot(page, { supported: false });
    await expect(status).toHaveCount(0);
    await expect(control(block, IT.tryButton)).toHaveCount(0);
    await expect(control(block, IT.micStart)).toHaveCount(0);
    await expect(block.locator(".spoken-attempt__fallback")).toContainText(IT.errorUnsupported);
    await expect(page.locator(".lesson-exercise")).toHaveCount(4);

    const rail = page.locator(".lesson-rail__step:visible, .lesson-rail-mobile__step:visible");
    await expect(rail).toHaveCount(6);
    await rail.last().click();
    await expect(page.locator("#lesson-section-recap")).toBeVisible();
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("locale, script, and reload keep copy readable while recognition state remains session-only", async ({
    page,
    viewport,
  }) => {
    const { observers, block } = await boot(page);
    const settings = await visibleSettings(page);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await closeSettings(page);
    await expect(block.locator(".spoken-attempt__heading")).toHaveText(EN.heading);
    await expect(block.locator(".spoken-attempt__meaning")).toContainText(/\S/);
    await expect(block.locator(".spoken-attempt__glyph-primary").first()).toContainText(/[a-z]/);

    await acknowledge(block, EN);
    await queueSpeechOutcome(page, { kind: "transcript", transcript: SPOKEN.targetJp });
    await control(block, EN.micStart).click();
    await expect(block.locator(".spoken-attempt__status-text")).toHaveText(EN.resultMatched);
    const beforeReload = await page.evaluate(() => localStorage.getItem("nihongo.course.progress"));
    if (beforeReload) {
      await page.addInitScript((stored: string) => localStorage.setItem("nihongo.course.progress", stored), beforeReload);
    }
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    await expect(page.locator(".spoken-attempt__status-text")).toHaveCount(0);
    expect(await page.locator(".spoken-attempt__heard-text").count()).toBe(0);
    if (viewport && isMobile(viewport.width)) {
      await expect(page.locator(".lesson-rail-mobile")).toBeVisible();
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("spoken controls meet touch/focus/reflow requirements with no external requests", async ({
    page,
  }) => {
    const { observers, block } = await boot(page);
    await control(block, IT.tryButton).click();
    const targets = await auditTouchTargets(page);
    expect(targets, JSON.stringify(targets, null, 2)).toEqual([]);
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(focus).not.toBeNull();
    expect(focus!.style).not.toBe("none");
    expect(focus!.width).toBeGreaterThanOrEqual(2);
    await assertNoHorizontalOverflow(page);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
