import { expect, test } from "@playwright/test";
import {
  gotoReady,
  headerBottom,
  rectOf,
  REPRESENTATIVE_LESSON,
  routeUrls,
  setupPageObservers,
  SOUND_LESSON,
} from "./helpers";

const LESSON_URL = routeUrls.lesson(
  REPRESENTATIVE_LESSON.moduleId,
  REPRESENTATIVE_LESSON.lessonId,
);
const SOUND_LESSON_URL = routeUrls.lesson(
  SOUND_LESSON.moduleId,
  SOUND_LESSON.lessonId,
);

function isMobile(width: number): boolean {
  return width < 700;
}

async function activeElementInside(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate((sel: string) => {
    const active = document.activeElement;
    return !!active && !!active.closest(sel);
  }, selector);
}

test.describe("mobile settings drawer", () => {
  test.skip(({ viewport }) => !viewport || !isMobile(viewport.width), "mobile only");

  test("opens without shifting header flow, traps focus, and restores it on close", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const headerBefore = await rectOf(page, ".header");
    const trigger = page.locator(".header__settings-trigger");
    await trigger.click();

    const panel = page.locator(".settings-drawer__panel");
    await expect(panel).toBeVisible();

    // Header flow/height is unchanged by opening the overlay (it portals to body).
    const headerAfter = await rectOf(page, ".header");
    expect(Math.abs(headerAfter!.top - headerBefore!.top)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(headerAfter!.height - headerBefore!.height)).toBeLessThanOrEqual(0.5);

    // Background is inert while the modal is open.
    await expect(page.locator("#root")).toHaveAttribute("inert", "");

    // Focus moved inside the panel.
    expect(await activeElementInside(page, ".settings-drawer__panel")).toBe(true);

    // Tab and Shift+Tab both stay trapped within the panel.
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("Tab");
      expect(
        await activeElementInside(page, ".settings-drawer__panel"),
        `focus escaped the panel after ${i + 1} Tab presses`,
      ).toBe(true);
    }
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("Shift+Tab");
      expect(
        await activeElementInside(page, ".settings-drawer__panel"),
        `focus escaped the panel after ${i + 1} Shift+Tab presses`,
      ).toBe(true);
    }

    // Escape closes, clears inert, and restores focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
    const triggerId = await trigger.getAttribute("id");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(triggerId);
  });

  test("closes on backdrop click", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await page.locator(".header__settings-trigger").click();
    await expect(page.locator(".settings-drawer__panel")).toBeVisible();
    // The panel is a right sheet (min(22rem,88vw)); the backdrop is exposed on
    // the left edge, so a near-left click lands on the backdrop, not the panel.
    await page.locator(".settings-drawer__backdrop").click({ position: { x: 8, y: 420 } });
    await expect(page.locator(".settings-drawer__panel")).toBeHidden();
    await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  });

  test("closes on the explicit close control", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await page.locator(".header__settings-trigger").click();
    await expect(page.locator(".settings-drawer__panel")).toBeVisible();
    await page.locator(".settings-drawer__close").click();
    await expect(page.locator(".settings-drawer__panel")).toBeHidden();
  });
});

test.describe("deterministic scroll reset", () => {
  test("push, back, and forward all reset scroll to the top", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    await page.evaluate(() => window.scrollTo(0, 1400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    // Ordinary push navigation (hero primary → first lesson) resets to 0.
    await page.locator(".course-hero__actions a.action--primary").click();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBe(0);

    await page.evaluate(() => window.scrollTo(0, 1400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    // Back to a previously-scrolled page must NOT restore the old scroll.
    await page.goBack();
    await page.locator(".course-home").waitFor({ state: "visible" });
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBe(0);

    // Forward to a previously-scrolled lesson must also reset to 0.
    await page.goForward();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBe(0);
  });
});

test.describe("guided Lab round-trip", () => {
  test("lesson explore opens a preset Lab and returns to the exact #explore anchor", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    const labLink = page.locator(".guided-board a.action--secondary");
    await expect(labLink).toBeVisible();
    const labHref = await labLink.getAttribute("href");
    expect(labHref, "guided Lab link carries a scenario preset and encoded return").toMatch(
      /laboratorio\?[^"]*scenario=/,
    );
    expect(labHref).toMatch(/from=/);

    await labLink.click();
    await page.locator(".lab-page").waitFor({ state: "visible" });
    expect(page.url()).toContain("/pratica/laboratorio");

    // A styled return control is present (not a naked anchor) and no invalid notice.
    const ret = page.locator(".guided-return");
    await expect(ret).toBeVisible();
    await expect(ret).toHaveClass(/action/);
    await expect(page.locator(".notice--warning")).toHaveCount(0);

    // Center the return in the viewport before clicking: Playwright's default
    // auto-scroll can leave it flush under the sticky header, which would
    // intercept the click. This does not relax any assertion.
    await ret.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "auto" }));
    await ret.click();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    expect(page.url()).toContain(
      `/percorso/${REPRESENTATIVE_LESSON.moduleId}/${REPRESENTATIVE_LESSON.lessonId}#explore`,
    );

    // The explore section is scrolled into view *below* the sticky header.
    const hb = await headerBottom(page);
    await expect
      .poll(async () => {
        const rect = await rectOf(page, "#lesson-section-explore");
        return rect ? Math.round(rect.top) : null;
      }, { timeout: 2000 })
      .not.toBeNull();
    const target = await rectOf(page, "#lesson-section-explore");
    const viewportH = page.viewportSize()!.height;
    expect(target!.top, "explore target not hidden under the sticky header").toBeGreaterThanOrEqual(hb - 2);
    expect(target!.top, "explore target within the viewport").toBeLessThan(viewportH);
  });

  test("an invalid Lab preset and an invalid return are both visibly noticed", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(
      page,
      `${routeUrls.lab}?scenario=__bogus__&from=%2Fpercorso%2Fnot-a-real%2Flesson%23explore`,
    );
    const notices = page.locator(".notice--warning");
    await expect(notices.first()).toBeVisible();
    expect(await notices.count()).toBeGreaterThanOrEqual(1);
    // No valid styled return control should appear for an invalid return.
    await expect(page.locator(".guided-return")).toHaveCount(0);
  });
});

test.describe("guided Syllabary round-trip", () => {
  test("sound lesson explore focuses the relevant group and returns to #explore", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, SOUND_LESSON_URL);

    const toolLink = page.locator("a.lesson-tool__action");
    await expect(toolLink).toBeVisible();
    const href = await toolLink.getAttribute("href");
    const group = href?.match(/group=([a-z-]+)/)?.[1];
    expect(group, `syllabary deep link declares a target group: ${href}`).toBeTruthy();

    await toolLink.click();
    await page.locator(".syllabary").waitFor({ state: "visible" });
    expect(page.url()).toContain(`group=${group}`);

    // The targeted group section is focused and sits below the header.
    const targetId = `syllabary-group-${group}`;
    await expect
      .poll(() => page.evaluate((id: string) => document.activeElement?.id === id, targetId), {
        timeout: 2000,
      })
      .toBe(true);
    const hb = await headerBottom(page);
    const groupRect = await rectOf(page, `#${targetId}`);
    expect(groupRect!.top, "focused group below the header").toBeGreaterThanOrEqual(hb - 2);

    const ret = page.locator(".syllabary__return");
    await expect(ret).toBeVisible();
    await expect(ret).toHaveClass(/action/);
    await ret.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "auto" }));
    await ret.click();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    expect(page.url()).toContain(
      `/percorso/${SOUND_LESSON.moduleId}/${SOUND_LESSON.lessonId}#explore`,
    );
  });

  test("an invalid Syllabary group and return are visibly noticed", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(
      page,
      `${routeUrls.syllabary}?group=__bogus__&from=%2Fnot-a-real-route`,
    );
    await expect(page.locator(".notice--warning").first()).toBeVisible();
    await expect(page.locator(".syllabary__return")).toHaveCount(0);
  });
});

test.describe("Lab sticky board behavior", () => {
  test("desktop sticky board never overlaps the header while scrolling; mobile board is non-sticky", async ({ page, viewport }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.lab);

    const board = page.locator(".board");
    await expect(board).toBeVisible();

    if (viewport && isMobile(viewport.width)) {
      const position = await board.evaluate((el) => getComputedStyle(el).position);
      expect(position, "mobile board must not be sticky").toBe("static");
      return;
    }

    const position = await board.evaluate((el) => getComputedStyle(el).position);
    expect(position, "desktop board is sticky").toBe("sticky");

    const scrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 40,
    );
    const positions = scrollable ? [200, 600, 1200] : [0];
    for (const y of positions) {
      await page.evaluate((value: number) => window.scrollTo(0, value), y);
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );
      const hb = await headerBottom(page);
      const rect = await rectOf(page, ".board");
      expect(
        rect!.top,
        `sticky board top (${rect!.top}) must stay at/below header bottom (${hb}) at scrollY=${y}`,
      ).toBeGreaterThanOrEqual(hb - 2);
    }
  });
});

test.describe("unknown route", () => {
  test("redirects to the course home with a styled, visible warning notice", async ({ page }) => {
    await setupPageObservers(page);
    await page.goto(`${routeUrls.home.replace("#/percorso", "#/definitely-not-a-route")}`, {
      waitUntil: "load",
    });
    await page.locator(".course-home").waitFor({ state: "visible" });
    await expect(page.locator(".notice--warning").first()).toBeVisible();
  });
});
