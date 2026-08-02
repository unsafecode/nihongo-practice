import { expect, test } from "@playwright/test";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
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

test.describe("guided board Lab reachability", () => {
  // The A1 release's semantic lessons render their before/after comparison
  // via `FamilyGuidedConstruction` (Phase 2 Tasks 1-6), not the legacy,
  // fully-dead `GuidedTransformation`/`TransformComparison` components (zero
  // live imports anywhere in `src` — confirmed by search). Its guided pair is
  // fully authored from the release catalog's family fixtures, never backed
  // by a live Lab selection, so no lesson offers an "open in the guided Lab"
  // deep-link. This replaces the old v2.1 round-trip test (which exercised
  // that now-removed deep-link) with a check that the board still renders
  // honest before/after content and that this omission is deliberate, not a
  // broken/dead link.
  test("the guided board renders authored content with no Lab deep-link", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    const board = page.locator(".foundation-guided");
    await expect(board).toBeVisible();
    await expect(board.locator('.foundation-guided__row[data-role="initial"]')).toBeVisible();
    await expect(board.locator('.foundation-guided__row[data-role="target"]')).toBeVisible();
    await expect(board.locator(".foundation-guided__axes-list li").first()).toBeVisible();
    await expect(board.locator("a")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
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
  // `GuidedToolLink` (the component that used to render `a.lesson-tool__action`
  // deep-linking a phonetic lesson's "Esplora" section into a focused
  // Syllabary group) is dead code in the current A1 release: it is never
  // imported by any live page component (confirmed by search), because its
  // `GuidedToolExploration` content kind belongs to the legacy, no-longer-used
  // `assembleCourse` lesson pipeline. No phonetic lesson (sounds-1..4) offers
  // this deep-link today. The underlying Syllabary group-focus/return
  // mechanism it used to drive is still real and independently reachable
  // (e.g. a bookmarked/shared link), so this test now verifies both: the
  // deliberate absence of the in-lesson link, and that the standalone
  // Syllabary route still honours a valid `group`/`from` deep link end to end.
  test("no phonetic lesson offers an in-lesson Syllabary deep-link (GuidedToolLink is dead code)", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SOUND_LESSON_URL);
    await expect(page.locator("a.lesson-tool__action")).toHaveCount(0);
    await expect(page.locator(".lesson-tool")).toHaveCount(0);
    await assertNoRuntimeErrors(page, observers);
  });

  test("a valid Syllabary deep link focuses the relevant group and returns to the requesting route", async ({
    page,
  }) => {
    await setupPageObservers(page);
    const group = "gojuon";
    const fromPath = `/percorso/${SOUND_LESSON.moduleId}/${SOUND_LESSON.lessonId}#explore`;
    await gotoReady(
      page,
      `${routeUrls.syllabary}?group=${group}&from=${encodeURIComponent(fromPath)}`,
    );

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

test.describe("checkpoint evidence link is an in-page target, not a route", () => {
  // Regression for the Phase 4 defect (commit a033a8c): the checkpoint
  // "See your Can-do evidence" link rendered a bare `<a href="#can-do-summary">`.
  // Under the app's HashRouter the fragment IS the route, so clicking it set
  // path `/can-do-summary`, matched nothing, fell to the `*` catch-all, and
  // redirected the learner to the home with a false amber "page does not
  // exist" warning — about `#can-do-summary`, a section rendered on that very
  // page. The fix renders the control as a `<button>` (no href for the router
  // to see) whose handler scrolls the section into view and moves focus to it.
  test("clicking it reveals #can-do-summary and never shows the false 'page not found' warning", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // Baseline: the learner is at the top of a clean home — no warning banner.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator(".notice--warning")).toHaveCount(0);

    // The control must be a real, focusable, keyboard-operable button with an
    // accessible name — not a div with a click handler, and (per the owner's
    // ruling) not an anchor: this in-page section has no URL under HashRouter,
    // so it must not advertise one. Assert it is a <button> and that it carries
    // no fragment href for a modified click / copy-link / restore to detonate.
    const link = page.locator(".checkpoint-state__link");
    await expect(link).toBeVisible();
    await expect(link).toHaveJSProperty("tagName", "BUTTON");
    await expect(link).toHaveJSProperty("type", "button");
    expect(await link.getAttribute("href")).toBeNull();
    expect((await link.innerText()).trim().length).toBeGreaterThan(0);

    await link.click();

    // Settle race-free before the specific assertions run. Resolve as soon as
    // the click has produced ANY observable completion, then let each assertion
    // below accuse its own cause. The disjunction covers every way the click
    // can finish:
    //   - focus landed on the section (a correct fix), OR
    //   - the section scrolled into view (a mouse-only fix that forgot focus), OR
    //   - the router detonated and rendered the banner (the original regression).
    // Two properties this must preserve:
    //   * Race-protection: it still resolves on the banner, so the original
    //     regression cannot slip through the broken build's brief pre-redirect
    //     window (URL momentarily "#can-do-summary", banner not yet committed)
    //     and read as "absent".
    //   * Diagnosability: it must NOT hinge only on focus, or a mouse-only
    //     regression (focus never moves, no banner) would hang here for the full
    //     timeout and report at this settle helper — a failure message that
    //     accuses the wait condition instead of the missing focus, tempting a
    //     future reader to loosen the gate and ship the regression green. With
    //     the viewport arm the gate resolves under that mutation, and
    //     toBeFocused() below fails naming focus and the section.
    await page.waitForFunction(() => {
      if (document.activeElement?.id === "can-do-summary") return true;
      if (document.querySelector(".notice--warning") !== null) return true;
      const section = document.getElementById("can-do-summary");
      if (!section) return false;
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });

    // (1) The sharpest, learner-facing assertion: the invalid-route warning
    //     banner must be ABSENT. Assert on the CLASS and the COPY — never on
    //     role="alert" (this Notice is tone="warning" => role="status" per
    //     src/components/Notice.tsx:27: warning-styled but *politely* announced,
    //     so it would match nothing) and never on the role alone (role="status"
    //     is shared by other non-error notices and by .checkpoint-state__body).
    //     The copy check is IT-locale-gated (documentElement.lang, App.tsx) so a
    //     wrong-locale empty match can't read as "absent".
    expect(await page.evaluate(() => document.documentElement.lang)).toMatch(/^it/);
    await expect(page.locator(".notice--warning")).toHaveCount(0);
    await expect(page.getByText("Pagina non trovata")).toHaveCount(0);

    // (2) Focus — not just the viewport — must land on the section. A native
    //     fragment link moves both; a preventDefault+scrollIntoView that forgot
    //     focus would scroll the page for a mouse user yet strand a keyboard/AT
    //     user's focus and reading position on this link. document.activeElement
    //     being the section is a plain DOM fact (no screen reader needed) and is
    //     the assertion that distinguishes a genuine fix from a mouse-only one.
    await expect(page.locator("#can-do-summary")).toBeFocused();

    // (3) The section must be scrolled to the TOP of the viewport — the
    //     `scrollIntoView({ block: "start" })` contract our handler owns — not
    //     merely intersecting it. A plain `toBeInViewport()` is DECORATIVE here,
    //     and it took a mutation probe to see why: Playwright auto-scrolls the
    //     link into view before clicking it, and `.checkpoint-state__link` sits
    //     just *below* #can-do-summary (the summary "renders above" the
    //     checkpoint). So the click itself drags the section partly into view
    //     regardless of our scroll code — with the scrollIntoView call removed,
    //     the section's top sits ~393px ABOVE the viewport top yet still
    //     intersects, so `toBeInViewport()` (any-pixel) passes while the scroll
    //     is broken. Asserting the top edge is aligned to the viewport top
    //     instead is discriminating: it lands at ~0 only when our
    //     scrollIntoView({ block: "start" }) actually ran (measured 0.4px
    //     desktop / 0.2px mobile on the fix; -393px with it removed).
    const sectionTop = await page
      .locator("#can-do-summary")
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(sectionTop).toBeGreaterThanOrEqual(-16);
    expect(sectionTop).toBeLessThanOrEqual(16);

    await assertNoRuntimeErrors(page, observers);
  });

  test("activating it with the keyboard (Enter) reveals #can-do-summary and moves focus to it", async ({ page }) => {
    // The component comment claims the keyboard path is covered because a
    // <button> dispatches its click handler on Enter/Space. Exercise it rather
    // than merely asserting it: a native button routes Enter and Space through
    // the same synthetic click, so Enter is representative of both. This is the
    // path a keyboard/AT user actually takes, and it must land focus on the
    // section (not just scroll) and never show the false banner.
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const link = page.locator(".checkpoint-state__link");
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");

    await page.waitForFunction(() => {
      if (document.activeElement?.id === "can-do-summary") return true;
      if (document.querySelector(".notice--warning") !== null) return true;
      const section = document.getElementById("can-do-summary");
      if (!section) return false;
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });

    expect(await page.evaluate(() => document.documentElement.lang)).toMatch(/^it/);
    await expect(page.locator(".notice--warning")).toHaveCount(0);
    await expect(page.getByText("Pagina non trovata")).toHaveCount(0);
    await expect(page.locator("#can-do-summary")).toBeFocused();

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("route-scroll missing anchor", () => {
  // Uses a direct canonical lesson id (not the shared REPRESENTATIVE_LESSON
  // fixture, which is a retired v2.1 alias — see helpers.ts): a legacy-id
  // redirect does not carry the request's `#explore` fragment, which would
  // make this test exercise the unrelated redirect path instead of the
  // missing-anchor behavior it actually targets.
  const ANCHOR_TEST_LESSON_URL = routeUrls.lesson("past-negative", "past-negative-1");

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

    await gotoReady(page, `${ANCHOR_TEST_LESSON_URL}#explore`);

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

test.describe("complete A0→A1 course routes (Slice B Task 5)", () => {
  // Lesson titles are never hand-authored per lesson: `runtimeCopy.ts`
  // mechanically derives every lesson title as `"${moduleTitle} ${position}"`
  // (confirmed via source + live verification), so these expectations follow
  // that same rule rather than an editorial guess.
  const REPRESENTATIVE_NEW_MODULE_ROUTES = [
    { moduleId: "shopping", lessonId: "shopping-1", expectedHeading: "Acquisti 1" },
    { moduleId: "descriptions", lessonId: "descriptions-1", expectedHeading: "Descrizioni 1" },
    { moduleId: "existence-needs", lessonId: "existence-needs-1", expectedHeading: "Esistenza e bisogni 1" },
  ] as const;

  // The v3 named capstones (`capstones-orientation`/`-self-introduction`/
  // `-everyday-outing`/`-travel-day`) never existed as v4 lesson routes; the
  // capstones module now ships the four numbered v4 lessons `capstones-1..4`
  // (see `A1_V3_LESSON_ID_MAP` in `progress.ts` for the historical alias).
  const CAPSTONE_ROUTES = [
    { lessonId: "capstones-1", expectedHeading: "Mettere tutto insieme 1" },
    { lessonId: "capstones-2", expectedHeading: "Mettere tutto insieme 2" },
    { lessonId: "capstones-3", expectedHeading: "Mettere tutto insieme 3" },
    { lessonId: "capstones-4", expectedHeading: "Mettere tutto insieme 4" },
  ] as const;

  for (const route of REPRESENTATIVE_NEW_MODULE_ROUTES) {
    test(`the "${route.moduleId}" module's first lesson is directly reachable`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(route.moduleId, route.lessonId));
      await expect(page.locator(".lesson-layout")).toBeVisible();
      await expect(page.locator("h1")).toHaveText(route.expectedHeading);
      expect(page.url()).toContain(`/percorso/${route.moduleId}/${route.lessonId}`);
      await assertNoRuntimeErrors(page, observers);
    });
  }

  for (const capstone of CAPSTONE_ROUTES) {
    test(`the capstones module's "${capstone.lessonId}" is directly reachable`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson("capstones", capstone.lessonId));
      await expect(page.locator(".lesson-layout")).toBeVisible();
      await expect(page.locator("h1")).toHaveText(capstone.expectedHeading);
      expect(page.url()).toContain(`/percorso/capstones/${capstone.lessonId}`);
      await assertNoRuntimeErrors(page, observers);
    });
  }

  // The capstone lessons carry the course's longest multi-clause sentences, so
  // their comparison cards and guided boards receive the longest unbroken
  // rōmaji readings. Those readings must wrap rather than force the page wider
  // than the viewport (design spec §9.3 — no horizontal overflow at either
  // reference width, especially the 390px mobile width).
  for (const capstone of CAPSTONE_ROUTES) {
    test(`the capstones module's "${capstone.lessonId}" never overflows horizontally`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson("capstones", capstone.lessonId));
      await expect(page.locator(".lesson-layout")).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
    });
  }
});

test.describe("legacy v2.1 lesson id redirects (Slice B Task 5)", () => {
  test("a same-module legacy lesson id redirects to its current lesson without a cross-module notice, landing at the top", async ({ page }) => {
    const observers = await setupPageObservers(page);
    // "sounds-core" was the published v2.1 id for the sounds module's first
    // lesson; it is retired in favor of "sounds-1" but the module is
    // unchanged (design spec §9.2/lessonRouteResolution.ts).
    await gotoReady(page, routeUrls.lesson("sounds", "sounds-core"));

    await expect(page.locator(".lesson-layout")).toBeVisible();
    expect(page.url()).toBe(routeUrls.lesson("sounds", "sounds-1"));
    // Two always-on, never-dismissible `.notice--info` elements render on
    // essentially every lesson page in this headless environment — the
    // "missing Japanese TTS voice" SpeechNotice and the recap's "returns to
    // review" notice (neither has a `.notice__dismiss` control) — so a
    // same-module redirect (no legacy notice) is verified by the absence of
    // any *dismissible* info notice, not a blind `.notice--info` count.
    await expect(page.locator(".notice--info:has(.notice__dismiss)")).toHaveCount(0);

    // Deterministic scroll: a redirected legacy route is an ordinary route
    // entry (no section anchor), so it lands at the very top every time.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await assertNoRuntimeErrors(page, observers);
  });

  test("a cross-module legacy lesson id redirects to its new module with a dismissible, visible notice, landing at the top", async ({ page }) => {
    const observers = await setupPageObservers(page);
    // "sentence-map/sentence-order" was retired and moved into the
    // "introductions" module by the complete rebuild.
    await gotoReady(page, routeUrls.lesson("sentence-map", "sentence-order"));

    await expect(page.locator(".lesson-layout")).toBeVisible();
    expect(page.url()).toBe(routeUrls.lesson("introductions", "introductions-1"));

    // Scope to the dismissible notice specifically: ambient, never-dismissible
    // `.notice--info` elements (missing-voice SpeechNotice, recap's "returns
    // to review" notice) also render here and must not be confused with the
    // genuine legacy-redirect notice.
    const notice = page.locator(".notice--info:has(.notice__dismiss)");
    await expect(notice).toBeVisible();
    expect(await notice.count()).toBe(1);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const dismiss = notice.locator(".notice__dismiss");
    await expect(dismiss).toBeVisible();
    await dismiss.click();
    await expect(page.locator(".notice--info:has(.notice__dismiss)")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("locale and script settings on the complete course (Slice B Task 5)", () => {
  // On mobile the settings controls exist twice — once inertly inside the
  // CSS-hidden `.header__settings--desktop` row and once inside the drawer
  // overlay once opened — so a bare `.localetoggle`/`.scripttoggle` locator
  // is ambiguous there. This resolves the one *visible* settings container
  // for the current viewport, opening the mobile drawer first when needed.
  async function settingsContainer(
    page: import("@playwright/test").Page,
    viewport: { width: number; height: number } | null,
  ) {
    if (viewport && isMobile(viewport.width)) {
      await page.locator(".header__settings-trigger").click();
      const panel = page.locator(".settings-drawer__panel");
      await expect(panel).toBeVisible();
      return panel;
    }
    return page.locator(".header__settings--desktop");
  }

  test("IT/EN locale switching updates a representative new module's title on the live course map without breaking navigation", async ({ page, viewport }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    const settings = await settingsContainer(page, viewport ?? null);

    const shoppingHeading = page
      .locator(".module-card__title")
      .filter({ hasText: /Acquisti|Shopping/ });
    await expect(shoppingHeading).toHaveText("Acquisti");

    const lessonLinksBefore = await page.locator(".module-card__lesson-link").count();

    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await expect(shoppingHeading).toHaveText("Shopping");
    // Switching locale never drops/adds routes: the structure stays identical.
    expect(await page.locator(".module-card__lesson-link").count()).toBe(lessonLinksBefore);

    await settings.locator(".localetoggle button", { hasText: "IT" }).click();
    await expect(shoppingHeading).toHaveText("Acquisti");

    await assertNoRuntimeErrors(page, observers);
  });

  test("hiragana/romaji script settings continue to work on Module 1's katakana bridge lesson", async ({ page, viewport }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson("sounds", "sounds-4"));
    const settings = await settingsContainer(page, viewport ?? null);

    // `ItemGlyph` (A1LessonPage.tsx) only renders `.a1-phonetic-item__jp` when
    // the active script is hiragana; it never passes a `reading` prop to
    // `JapaneseSegmentText`, so no `ruby.katakana-assist` ever renders for a
    // phonetic item, in either script — a confirmed, permanent behaviour of
    // the current A1 release, not a stale assumption to relax.
    const item = page.locator('.a1-phonetic-roster__item[data-item-id="snd4-koohii"]');
    const jp = item.locator(".a1-phonetic-item__jp");
    const glyph = item.locator(".a1-phonetic-item__glyph");

    // Default script is hiragana-primary: the authentic Japanese glyph shows,
    // immediately followed by its bare romaji text, and there is no ruby.
    await expect(jp).toHaveText("コーヒー");
    await expect(glyph).toContainText("koohii");
    await expect(page.locator(".a1-phonetic-item__jp ruby")).toHaveCount(0);
    await expect(page.locator("ruby.katakana-assist")).toHaveCount(0);

    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    // Romaji script: the `.a1-phonetic-item__jp` span is omitted entirely —
    // not merely re-styled — leaving only the bare romaji text.
    await expect(jp).toHaveCount(0);
    await expect(glyph).toHaveText("koohii");
    await expect(page.locator("ruby.katakana-assist")).toHaveCount(0);

    await settings.locator(".scripttoggle button", { hasText: "Hiragana" }).click();
    await expect(jp).toHaveText("コーヒー");
    await expect(page.locator("ruby.katakana-assist")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
  });
});

/**
 * Slice C — deterministic in-lesson exercises and the `Da ripassare` review
 * queue (design spec §10, §11.1, §14; Slice C plan Task 4). These drive the
 * real published catalog through a built preview: no answer literal is planted
 * in the test beyond the sentence the lesson itself teaches, and every mistake,
 * review, and resolution goes through the live progress store.
 */
const EXERCISE_LESSON_URL = routeUrls.lesson("introductions", "introductions-1");
const TRANSFORM_LESSON_URL = routeUrls.lesson("past-negative", "past-negative-1");

/** The introductions-1-m2 tile-bank exercise's taught sentence, in its
 * correct order: けん は いしゃ です ("Ken is a doctor").
 * introductions-1 samples 4 tile-ordering + 2 choice exercises in round 1,
 * so a bare class-based locator matches more than one exercise on this
 * lesson. Both `tileCard` and `choiceCard` therefore pin one specific
 * variant via its heading id — m2 for the tile bank, m1 for the choice. */
const INTRO_TILE_ORDER = ["けん", "は", "いしゃ", "です"] as const;

function tileCard(page: import("@playwright/test").Page) {
  return page.locator('.lesson-exercise[aria-labelledby*="introductions-1-m2"]');
}

function choiceCard(page: import("@playwright/test").Page) {
  return page.locator('.lesson-exercise[aria-labelledby*="introductions-1-m1"]');
}

/** The choice exercise's radio `value` attributes are `"{sourceVariantId}#
 * {ruleKeyPath}"`; the correct option's value is always prefixed by the
 * exercise's own variant id (confirmed live across multiple exercises), so
 * the correct/distractor option is located by that prefix, never a literal
 * hard-coded value (the exact rule-key suffixes are non-obvious generated
 * fingerprints, not stable authored ids). */
function correctRadio(card: ReturnType<typeof choiceCard>, ownVariantId: string) {
  return card.locator(`input[type=radio][value^="${ownVariantId}#"]`);
}
function distractorRadio(card: ReturnType<typeof choiceCard>, otherVariantId: string) {
  return card.locator(`input[type=radio][value^="${otherVariantId}#"]`);
}

test.describe("Slice C — deterministic exercises", () => {
  test("all four live exercise kinds are reachable across two representative lessons", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);

    await gotoReady(page, EXERCISE_LESSON_URL);
    // introductions-1 now samples 4 tile-ordering + 2 choice + 1
    // constrained-construction + 3 plain-completion exercises (10 total,
    // confirmed live) — covering all four exercise kinds the current A1
    // release's `selectVariants` eligibility ever actually produces.
    await expect(page.locator(".lesson-exercise__bank")).toHaveCount(4);
    await expect(page.locator(".lesson-exercise__radio").first()).toBeVisible();
    await expect(page.locator(".lesson-exercise__input").first()).toBeVisible();
    await expect(page.locator(".lesson-exercise__intent")).toHaveCount(1);

    // A fifth declared prompt kind, "transformation" (`.lesson-exercise__source`,
    // ExerciseView.tsx), is defined in the exercise engine but is never
    // actually selected anywhere in the published 48-lesson A1 catalog: its
    // eligibility requires a compatible transformation source in the
    // fingerprinted sentence pool (`selectVariants.ts`'s `findTransformationSource`),
    // which no lesson's sampled variants satisfy today (confirmed by
    // enumerating every lesson's real generated exercise kinds). This is
    // asserted explicitly, not silently dropped, so a future catalog change
    // that finally makes it reachable is caught here rather than passing an
    // assertion that no longer means anything.
    await expect(page.locator(".lesson-exercise__source")).toHaveCount(0);

    await gotoReady(page, TRANSFORM_LESSON_URL);
    await expect(page.locator(".lesson-exercise__source")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("keyboard tile ordering keeps focus neutral after a wrong first selection", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = tileCard(page);
    await expect(card).toHaveCount(1);

    const canonicalFirst = card
      .locator(".lesson-exercise__bank button", { hasText: INTRO_TILE_ORDER[0] })
      .first();
    const wrongFirst = card
      .locator(".lesson-exercise__bank button", { hasText: INTRO_TILE_ORDER[1] })
      .first();
    const canonicalFirstId = await canonicalFirst.getAttribute("id");

    // Choosing a wrong first tile must not reveal the canonical next answer.
    await wrongFirst.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(":focus")).not.toHaveAttribute("id", canonicalFirstId);

    // Focus follows the first remaining button in the rendered bank order.
    const nextRenderedBankTile = card.locator(".lesson-exercise__bank button").first();
    await expect(page.locator(":focus")).toHaveAttribute(
      "id",
      `${await nextRenderedBankTile.getAttribute("id")}`,
    );

    // Removing the tile keeps the keyboard flow in the bank.
    const placedWrongTile = card
      .locator(".lesson-exercise__placed")
      .filter({ hasText: INTRO_TILE_ORDER[1] })
      .first();
    const remove = placedWrongTile.locator(".lesson-exercise__tile-btn").last();
    await remove.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(":focus")).toHaveAttribute(
      "id",
      `${await card
        .locator(".lesson-exercise__bank button", { hasText: INTRO_TILE_ORDER[1] })
        .getAttribute("id")}`,
    );

    await assertNoRuntimeErrors(page, observers);
  });

  test("keyboard tile ordering remains solvable through add, reorder, and submit", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = tileCard(page);
    const firstAdd = card.locator(".lesson-exercise__bank button").first();
    await firstAdd.focus();
    for (let index = 0; index < INTRO_TILE_ORDER.length; index += 1) {
      await page.keyboard.press("Enter");
    }

    // The final Add has no bank successor, so focus remains on its stable Remove.
    const lastPlaced = card.locator(".lesson-exercise__placed").last();
    await expect(page.locator(":focus")).toHaveAttribute(
      "id",
      `${await lastPlaced.locator(".lesson-exercise__tile-btn").last().getAttribute("id")}`,
    );

    // Use only keyboard actions to reorder the rendered-bank sequence into the
    // taught sentence. Focus must follow the moved tile while it is repositioned.
    for (let targetIndex = 0; targetIndex < INTRO_TILE_ORDER.length; targetIndex += 1) {
      const glyph = INTRO_TILE_ORDER[targetIndex];
      const tile = card.locator(".lesson-exercise__placed").filter({ hasText: glyph }).first();
      let currentIndex = await tile.evaluate((element) => {
        const placed = [...element.parentElement!.children];
        return placed.indexOf(element);
      });
      while (currentIndex > targetIndex) {
        const moveBack = tile.locator(".lesson-exercise__move-back");
        await moveBack.focus();
        await page.keyboard.press("Enter");
        currentIndex -= 1;
      }
      while (currentIndex < targetIndex) {
        const moveForward = tile.locator(".lesson-exercise__move-forward");
        await moveForward.focus();
        await page.keyboard.press("Enter");
        currentIndex += 1;
      }
    }

    const submit = card.locator("button[type=submit]");
    await submit.focus();
    await page.keyboard.press("Enter");

    const feedback = card.locator(".lesson-exercise__feedback");
    await expect(feedback).toHaveClass(/lesson-exercise__feedback--accepted/);
    await expect(feedback).toContainText("Corretto");
    await expect(feedback).toHaveAttribute("aria-live", "polite");

    await assertNoRuntimeErrors(page, observers);
  });

  test("keyboard tile moves follow the moved tile at sequence boundaries", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = tileCard(page);
    const firstAdd = card.locator(".lesson-exercise__bank button").first();
    await firstAdd.focus();
    for (let index = 0; index < INTRO_TILE_ORDER.length; index += 1) {
      await page.keyboard.press("Enter");
    }
    await expect(card.locator(".lesson-exercise__placed")).toHaveCount(4);

    const secondLast = card.locator(".lesson-exercise__placed").nth(2);
    const movedTile = secondLast.locator(".lesson-exercise__move-forward");
    await movedTile.focus();
    await page.keyboard.press("Enter");

    const movedTileBack = card
      .locator(".lesson-exercise__placed")
      .nth(3)
      .locator(".lesson-exercise__move-back");
    await expect(movedTileBack).toBeEnabled();
    await expect(page.locator(":focus")).toHaveAttribute(
      "id",
      `${await movedTileBack.getAttribute("id")}`,
    );

    await page.keyboard.press("Enter");
    await expect(page.locator(":focus")).toHaveAttribute(
      "id",
      `${await card
        .locator(".lesson-exercise__placed")
        .nth(2)
        .locator(".lesson-exercise__move-forward")
        .getAttribute("id")}`,
    );

    await assertNoRuntimeErrors(page, observers);
  });

  test("a wrong choice shows a text retry state (not colour alone) and enqueues review", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = choiceCard(page);
    // The correct option for introductions-1-m1 is prefixed by its own
    // variant id ("introductions-1-m1#…"); any distractor from another
    // variant (e.g. "introductions-1-m2#…") is a genuine wrong choice.
    await distractorRadio(card, "introductions-1-m2").check();
    await card.locator("button[type=submit]").click();

    const feedback = card.locator(".lesson-exercise__feedback");
    await expect(feedback).toHaveClass(/lesson-exercise__feedback--retry/);
    // State is conveyed by text, never colour alone.
    await expect(feedback).toContainText("Non ancora");

    // The mistake reached the Da ripassare queue on Practice Home.
    await gotoReady(page, routeUrls.practice);
    await expect(page.locator(".review-queue__count")).toContainText("1");
    await expect(page.locator(".review-queue__item")).toHaveCount(1);

    await assertNoRuntimeErrors(page, observers);
  });

  test("every exercise control meets the 44px target on the exercise-rich lesson", async ({
    page,
  }) => {
    await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);
    const offenders = await auditTouchTargets(page);
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
    await assertNoHorizontalOverflow(page);
  });

  test("exercises honour IT/EN locale and hiragana/romaji script settings", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const instruction = tileCard(page).locator(".lesson-exercise__instruction");
    // Default locale is Italian (textContent assertions do not need visibility,
    // so the mobile settings overlay never has to be dismissed between steps).
    await expect(instruction).toContainText("Metti le parole nell'ordine giusto.");

    const openSettings = async () => {
      if (viewport && isMobile(viewport.width)) {
        await page.locator(".header__settings-trigger").click();
        const panel = page.locator(".settings-drawer__panel");
        await expect(panel).toBeVisible();
        return panel;
      }
      return page.locator(".header__settings--desktop");
    };

    const settings = await openSettings();
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await expect(instruction).toContainText("Put the words in the right order.");

    // Romaji script setting flips a tile's primary glyph to romaji.
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    const firstTilePrimary = page
      .locator(".lesson-exercise__bank .lesson-exercise__glyph-primary")
      .first();
    await expect(firstTilePrimary).toHaveText(/[a-z]/);

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("Slice C — Da ripassare review resolution semantics", () => {
  test("reviewing a queued mistake correctly resolves it; an in-lesson correction does not", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);

    // 1) Make a wrong choice, then immediately correct it inside the lesson.
    await gotoReady(page, EXERCISE_LESSON_URL);
    const card = choiceCard(page);
    await distractorRadio(card, "introductions-1-m2").check();
    await card.locator("button[type=submit]").click();
    await expect(card.locator(".lesson-exercise__feedback--retry")).toBeVisible();
    // Correct it in lesson mode — this must NOT silently resolve the review.
    await correctRadio(card, "introductions-1-m1").check();
    await card.locator("button[type=submit]").click();
    await expect(card.locator(".lesson-exercise__feedback--accepted")).toBeVisible();

    await gotoReady(page, routeUrls.practice);
    // The review entry persists despite the same-lesson correction (spec §10.4).
    await expect(page.locator(".review-queue__item")).toHaveCount(1);

    // 2) Now resolve it in review mode: open, answer correctly, it disappears.
    await page
      .locator(".review-queue__item button", { hasText: "Ripassa ora" })
      .first()
      .click();
    // The review-mode practice section re-renders the same exercise variant
    // (confirmed live: identical radio values as the in-lesson card), so the
    // same own-variantId-prefix pattern locates the correct option here too.
    await page
      .locator('.review-queue__practice input[type=radio][value^="introductions-1-m1#"]')
      .check();
    await page.locator(".review-queue__practice button[type=submit]").click();

    await expect(page.locator(".review-queue__item")).toHaveCount(0);
    await expect(page.locator(".review-queue__empty")).toBeVisible();
    await expect(page.locator(".review-queue__announce")).toContainText("Ripassato");

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("Slice C — truthful lesson evidence states (no colour-only meaning)", () => {
  /** A valid, native v4 progress record (schemaVersion 4) with
   * introductions-1 fully consolidated in the A1 level; A2 stays empty and
   * `migrationNotice` stays null, matching a learner who has always been on
   * v4 (never migrated) — see `emptyProgressV4()`/`LevelProgress` in
   * `progress.ts` for the authoritative shape this mirrors. */
  const CONSOLIDATED_SEED = {
    schemaVersion: 4,
    catalogVersion: "a1-a2-v1",
    levels: {
      a1: {
        lessons: {
          "introductions-1": {
            visitedAt: "2026-01-01T00:00:00.000Z",
            practicedAt: "2026-01-01T00:00:00.000Z",
            consolidatedAt: "2026-01-01T00:00:00.000Z",
            attemptedExerciseIds: [
              "introductions-1-round-1::introductions-1-m3",
              "introductions-1-round-1::introductions-1-m2",
            ],
            acceptedExerciseIds: [
              "introductions-1-round-1::introductions-1-m3",
              "introductions-1-round-1::introductions-1-m2",
            ],
          },
        },
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: "introductions-1",
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: [],
      },
      a2: {
        lessons: {},
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: null,
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: [],
      },
    },
    migrationNotice: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  test("a consolidated lesson shows a text 'Consolidata' state, not merely a colour", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    // Seed AFTER the observers' storage-clearing init script so this wins.
    await page.addInitScript((seed: string) => {
      localStorage.setItem("nihongo.course.progress", seed);
    }, JSON.stringify(CONSOLIDATED_SEED));

    await gotoReady(page, EXERCISE_LESSON_URL);
    const status = page.locator('.lesson-exercises__status[data-state="consolidated"]');
    await expect(status).toBeVisible();
    // The meaning is carried by a text label, never colour alone (spec §14).
    await expect(status).toContainText("Consolidata");

    await assertNoRuntimeErrors(page, observers);
  });
});

/**
 * Semantic romaji boundaries across every composed learner-facing surface
 * (Phase 0 Task 5; master spec §13.3, §21). `RomajiSequence` is the single
 * shared renderer that turns assembled tokens into readable, humane romaji —
 * a space between words, an attached suffix exactly where the semantic
 * model says so, never a component-local join. Unit tests already cover
 * synthetic boundary positions in isolation; these tests inspect the real
 * built markup for the actual published catalog, on both configured
 * viewports, to prove the renderer's boundaries survive all the way to the
 * DOM a learner actually sees.
 */
const ESSENTIAL_QUESTIONS_URL = routeUrls.lesson(
  "essential-questions",
  "essential-questions-1",
);
const ACTIONS_LESSON_URL = routeUrls.lesson("actions", "actions-1");

/**
 * Opens the one currently *visible* settings surface for the given viewport
 * and switches the script toggle, explicitly closing the mobile drawer
 * afterward (it does not auto-close, and `#root` stays `inert` while it is
 * open). This is distinct from the `settingsContainer`/`openSettings`
 * helpers defined earlier in this file: neither of those closes the drawer,
 * because neither needs to interact with the page again afterward — this
 * block does (placing tiles, reading marks underneath), so it needs its own.
 */
async function switchScript(
  page: import("@playwright/test").Page,
  viewport: { width: number; height: number } | null,
  script: "Hiragana" | "Rōmaji",
): Promise<void> {
  if (viewport && isMobile(viewport.width)) {
    await page.locator(".header__settings-trigger").click();
    const panel = page.locator(".settings-drawer__panel");
    await expect(panel).toBeVisible();
    await panel.locator(".scripttoggle button", { hasText: script }).click();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    return;
  }
  await page
    .locator(".header__settings--desktop .scripttoggle button", { hasText: script })
    .click();
}

test.describe("semantic romaji boundaries (Phase 0 Task 5)", () => {
  test("FamilyGuidedConstruction renders one readable romaji target line with a clean, whitespace-safe delta mark", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, ESSENTIAL_QUESTIONS_URL);
    await switchScript(page, viewport ?? null, "Rōmaji");

    const targetLine = page.locator(
      '.foundation-guided__row[data-role="target"] .foundation-guided__romaji',
    );
    await expect(targetLine).toHaveText("sore wa nan desu ka");
    // The exact-text assertion above already forbids this, but Task 5 calls
    // out the run-on failure mode by name, so assert it explicitly too.
    await expect(targetLine).not.toContainText("sorewanandesuka");

    const deltaMark = targetLine.locator("mark.foundation-guided__changed");
    await expect(deltaMark).toHaveCount(1);
    const deltaText = await deltaMark.innerText();
    expect(deltaText).toBe("sore");
    expect(deltaText).toBe(deltaText.trim());

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("FamilyGuidedConstruction attaches the polite verb ending without a stray internal space", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, ACTIONS_LESSON_URL);
    await switchScript(page, viewport ?? null, "Rōmaji");

    const targetLine = page.locator(
      '.foundation-guided__row[data-role="target"] .foundation-guided__romaji',
    );
    await expect(targetLine).toContainText("tabemasu");
    const lineText = await targetLine.innerText();
    expect(lineText).not.toContain("tabe masu");
    expect(lineText).toBe("raamen o tabemasu");

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("FamilyGuidedConstruction highlight marks never carry leading or trailing whitespace, whether attached to a joining boundary or sentence-initial", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);

    // No single published lesson's guided-construction target has marks at
    // beginning, middle, AND end simultaneously (confirmed live across the
    // catalog), so this collects real marks from three representative
    // lessons instead of asserting an unverified single-lesson layout:
    // essential-questions-1 (a sentence-initial, space-attached mark),
    // actions-1 (a sentence-initial mark with no trailing boundary noise),
    // and past-negative-2 (two marks — one space-separated, one directly
    // attached to the following suffix with no separator at all).
    const collected: string[] = [];
    for (const url of [ESSENTIAL_QUESTIONS_URL, ACTIONS_LESSON_URL, LESSON_URL]) {
      await gotoReady(page, url);
      await switchScript(page, viewport ?? null, "Rōmaji");
      const marks = page.locator(
        '.foundation-guided__row[data-role="target"] .foundation-guided__romaji mark.foundation-guided__changed',
      );
      const texts = await marks.allTextContents();
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) {
        expect(text.length).toBeGreaterThan(0);
        expect(text).toBe(text.trim());
        collected.push(text);
      }
      await assertNoHorizontalOverflow(page);
    }
    expect(collected).toContain("sore");
    expect(collected).toContain("raamen");
    expect(collected).toContain("eiga");
    expect(collected).toContain("mi");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("lesson exercises render readable spaced romaji for a choice sentence and its options, and a placed tile answer", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);

    await gotoReady(page, EXERCISE_LESSON_URL);
    await switchScript(page, viewport ?? null, "Rōmaji");

    const choiceSentence = choiceCard(page).locator(
      ".lesson-exercise__sentence:not(.lesson-exercise__sentence--secondary)",
    );
    await expect(choiceSentence).toHaveText("yuki ____ gakusei desu");

    // A "transformation" prompt (the only other kind with its own distinct
    // romaji surface, `.lesson-exercise__source-romaji`) is never actually
    // selected for any lesson in the published 48-lesson A1 catalog
    // (confirmed by enumerating every real lesson's generated exercise
    // kinds via `getLessonExercises`), so the choice exercise's own
    // radio-option glyphs are checked instead — a second, genuinely-live
    // romaji surface on this very page.
    const optionPrimaries = choiceCard(page).locator(".lesson-exercise__glyph-primary");
    const optionTexts = await optionPrimaries.allTextContents();
    expect(optionTexts.length).toBeGreaterThan(0);
    for (const text of optionTexts) {
      expect(text.length).toBeGreaterThan(0);
      expect(text).toBe(text.trim());
    }

    const bank = tileCard(page);
    for (const glyph of INTRO_TILE_ORDER) {
      await bank
        .locator(".lesson-exercise__bank button", { hasText: glyph })
        .first()
        .click();
    }
    const placed = bank.locator(".lesson-exercise__answer .lesson-exercise__placed");
    await expect(placed).toHaveCount(INTRO_TILE_ORDER.length);
    // The first placed tile has nothing to its left, so it must never carry
    // a leading isolated-whitespace run separator.
    await expect(placed.first().locator(".lesson-exercise__run-separator")).toHaveCount(0);
    const separators = await placed
      .locator(".lesson-exercise__run-separator")
      .allTextContents();
    expect(separators).toEqual([" ", " ", " "]);
    const placedGlyphs = await placed
      .locator(".lesson-exercise__glyph-primary")
      .allTextContents();
    expect(placedGlyphs.join(" ")).toBe("ken wa isha desu");

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("SpokenAttempt assembles the full readable target sentence from its primary romaji glyphs", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);
    await switchScript(page, viewport ?? null, "Rōmaji");

    // The primary/secondary glyph pair for each token is stacked with no
    // separating character in raw textContent, so the full sentence is
    // reassembled from the individually-readable primary glyphs, never a
    // substring check against the interleaved container text.
    const primaries = page.locator(
      ".spoken-attempt__sentence .spoken-attempt__glyph-primary",
    );
    await expect(primaries).toHaveCount(4);
    const glyphs = await primaries.allTextContents();
    for (const glyph of glyphs) {
      expect(glyph.length).toBeGreaterThan(0);
      expect(glyph).toBe(glyph.trim());
    }
    expect(glyphs.join(" ")).toBe("ken wa isha desu");

    const sentenceSeparators = await page.locator(".spoken-attempt__sentence").evaluate((el) =>
      Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent),
    );
    expect(sentenceSeparators).toEqual([" ", " ", " "]);

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("the Lab board's default scenario attaches the polite verb ending without splitting tabemasu", async ({
    page,
    viewport,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lab);
    await switchScript(page, viewport ?? null, "Rōmaji");

    const boardSentence = page.locator(".board .sentence__main");
    await expect(boardSentence).toContainText(/ o tabemasu\b/);
    const sentenceText = await boardSentence.innerText();
    expect(sentenceText).not.toContain("tabe masu");

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
