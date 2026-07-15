import { expect, test } from "@playwright/test";
import {
  assertNoRuntimeErrors,
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

const PLACES_LESSON = { moduleId: "places", lessonId: "places-action" } as const;
const PLACES_LESSON_URL = routeUrls.lesson(
  PLACES_LESSON.moduleId,
  PLACES_LESSON.lessonId,
);

test.describe("Lab preset reactivity while mounted", () => {
  test("changing the hash to a different guided Lab deep link updates the board and return link without reload", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);

    // Open the first guided Lab deep link (time-past: past tense, no place).
    await gotoReady(page, LESSON_URL);
    const firstLink = page.locator(".guided-board a.action--secondary");
    await expect(firstLink).toBeVisible();
    const firstHref = await firstLink.getAttribute("href");
    expect(firstHref, "first guided Lab link carries a preset").toMatch(
      /laboratorio\?[^"]*scenario=/,
    );

    await firstLink.click();
    await page.locator(".lab-page").waitFor({ state: "visible" });
    expect(page.url()).toContain("/pratica/laboratorio");
    await expect(page.locator(".notice--warning")).toHaveCount(0);

    // Confirm the first preset's board state: past-tense "eat", no place chip.
    await expect(page.locator(".sentence__main")).toContainText("ました");
    await expect(page.locator(".sentence__main")).not.toContainText("れすとらん");
    const firstReturn = page.locator(".guided-return");
    await expect(firstReturn).toBeVisible();
    await expect(firstReturn).toHaveAttribute(
      "href",
      new RegExp(
        `/percorso/${REPRESENTATIVE_LESSON.moduleId}/${REPRESENTATIVE_LESSON.lessonId}`,
      ),
    );

    // Fetch the second guided Lab deep link (places-action: present tense +
    // restaurant) from a separate page in the same context, so the mounted
    // Lab page under test is never navigated/reloaded to get it.
    const scratch = await page.context().newPage();
    await gotoReady(scratch, PLACES_LESSON_URL);
    const secondLink = scratch.locator(".guided-board a.action--secondary");
    await expect(secondLink).toBeVisible();
    const secondHref = await secondLink.getAttribute("href");
    expect(secondHref, "second guided Lab link carries a preset").toMatch(
      /laboratorio\?[^"]*scenario=/,
    );
    expect(secondHref, "the two deep links are different presets").not.toBe(
      firstHref,
    );
    await scratch.close();

    // Change window.location.hash in the SAME document to the second deep
    // link — no page.goto/reload — exactly the case where Lab stayed mounted.
    await page.evaluate((hash: string) => {
      window.location.hash = hash.startsWith("#") ? hash.slice(1) : hash;
    }, secondHref!);

    // Wait for the app's route update to actually re-render the board.
    await expect
      .poll(() => page.locator(".sentence__main").textContent(), {
        timeout: 2000,
      })
      .toContain("れすとらん");

    // The old preset's state must be gone, the new preset's state present.
    await expect(page.locator(".sentence__main")).not.toContainText("ました");
    await expect(page.locator(".sentence__main")).toContainText("れすとらん");
    await expect(page.locator(".notice--warning")).toHaveCount(0);

    // The guided-return control must now point at the second deep link's
    // originating lesson/section, not the stale first one.
    const secondReturn = page.locator(".guided-return");
    await expect(secondReturn).toBeVisible();
    await expect(secondReturn).toHaveAttribute(
      "href",
      new RegExp(
        `/percorso/${PLACES_LESSON.moduleId}/${PLACES_LESSON.lessonId}`,
      ),
    );

    await assertNoRuntimeErrors(page, observers);
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

    // Not focus alone: the targeted group's actual kana grid/notes content is
    // rendered with a real box (design spec §A4 — visible content, not an
    // empty focused shell).
    const contentSelector = `#${targetId} :is(.kana-grid, .kana-notes)`;
    await expect(
      page.locator(contentSelector).first(),
      "targeted group renders its kana grid/notes content",
    ).toBeVisible();
    const contentRect = await rectOf(page, contentSelector);
    expect(contentRect!.height, "grid/notes content has real rendered height").toBeGreaterThan(0);
    expect(
      contentRect!.top,
      "grid/notes content sits below the header, fully visible",
    ).toBeGreaterThanOrEqual(hb - 2);

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

test.describe("Syllabary reduced-motion in-page navigation", () => {
  test("group navigation scrolls with behavior auto (never smooth) under reduced motion", async ({
    page,
  }) => {
    await setupPageObservers(page);
    // gotoReady pins prefers-reduced-motion: reduce for the whole suite.
    await gotoReady(page, routeUrls.syllabary);

    // Observe the exact options the in-page group handler passes to
    // scrollIntoView. Installed after load, before the click — clicking a
    // group nav button is an in-page scroll (no navigation), so the patched
    // prototype survives until we read it back.
    await page.evaluate(() => {
      const store = window as unknown as { __scrollBehaviors__: string[] };
      store.__scrollBehaviors__ = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function patched(
        this: Element,
        arg?: boolean | ScrollIntoViewOptions,
      ): void {
        const behavior =
          typeof arg === "object" && arg !== null ? arg.behavior ?? "" : "";
        store.__scrollBehaviors__.push(String(behavior));
        return original.call(this, arg as ScrollIntoViewOptions);
      };
    });

    // Pick a later group so the jump is a genuine downward in-page scroll.
    const groupLink = page.locator(".kana-groupnav__link").nth(2);
    await expect(groupLink).toBeVisible();
    await groupLink.click();

    const behaviors = await page.evaluate(
      () => (window as unknown as { __scrollBehaviors__: string[] }).__scrollBehaviors__,
    );
    expect(
      behaviors.length,
      "clicking a group nav button triggers an in-page scrollIntoView",
    ).toBeGreaterThan(0);
    for (const behavior of behaviors) {
      expect(
        behavior,
        "reduced-motion in-page group scroll must be auto, not smooth",
      ).toBe("auto");
    }
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

test.describe("route-scroll missing anchor", () => {
  test("a valid lesson deep link whose section anchor vanishes shows a dismissible, non-overlapping warning", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);

    // Make the requested section anchor unreachable through the very lookup
    // the manager uses (getElementById), deterministically and before its
    // post-paint rAF, by shadowing that one id at document_start. The real
    // <section> node stays in the DOM (only the lookup is blinded), so the
    // lesson body still renders and is measurable for the overlap check, and
    // the manager takes its genuine "anchor-missing" branch instead of a
    // silent no-op. A MutationObserver installed via addInitScript proved
    // unreliable here (it can miss the initial commit), so this init hook
    // removes the timing race entirely.
    await page.addInitScript(() => {
      const hiddenId = "lesson-section-explore";
      const nativeGetById = Document.prototype.getElementById;
      Document.prototype.getElementById = function patched(
        this: Document,
        elementId: string,
      ): HTMLElement | null {
        if (elementId === hiddenId) return null;
        return nativeGetById.call(this, elementId);
      };
    });

    await gotoReady(page, `${LESSON_URL}#explore`);

    const notice = page.locator(".notice--warning").first();
    await expect(notice, "missing-anchor warning notice is visible").toBeVisible();

    // It must not visually collide with the header or the lesson body.
    const hb = await headerBottom(page);
    const noticeRect = await rectOf(page, ".notice--warning");
    expect(
      noticeRect!.top,
      `notice top (${noticeRect!.top}) sits at/below the header bottom (${hb})`,
    ).toBeGreaterThanOrEqual(hb - 2);

    const lessonRect = await rectOf(page, ".lesson-layout");
    expect(
      noticeRect!.bottom,
      `notice bottom (${noticeRect!.bottom}) must not overlap lesson content top (${lessonRect!.top})`,
    ).toBeLessThanOrEqual(lessonRect!.top + 1);

    // The lesson content itself is still present (id stripped, node intact).
    expect(lessonRect!.height, "lesson content is rendered").toBeGreaterThan(0);

    // It is dismissible.
    const dismiss = notice.locator(".notice__dismiss");
    await expect(dismiss).toBeVisible();
    await dismiss.click();
    await expect(page.locator(".notice--warning")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
  });
});
