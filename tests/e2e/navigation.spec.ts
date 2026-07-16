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
  // The complete A0→A1 curriculum's guided boards are fully authored from
  // curriculum examples (assembleCourse.ts's chooseExplorationEndpoints),
  // never backed by a live Lab selection — GuidedTransformation's `labLink`
  // requires an actual `LabSelection` (see its `isLabSelection` guard),
  // which this course never constructs, so no lesson offers an "open in the
  // guided Lab" deep-link. This replaces the old v2.1 round-trip test (which
  // exercised that now-removed deep-link) with a check that the board still
  // renders honest before/after content and that this omission is
  // deliberate, not a broken/dead link.
  test("the guided board renders authored content with no Lab deep-link", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    const board = page.locator(".guided-board");
    await expect(board).toBeVisible();
    await expect(board.locator(".guided-board__states")).toBeVisible();
    await expect(board.locator(".guided-board__gears")).toBeVisible();
    await expect(board.locator("a.action--secondary")).toHaveCount(0);

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
  const REPRESENTATIVE_NEW_MODULE_ROUTES = [
    { moduleId: "shopping", lessonId: "shopping-1", expectedHeading: "Quanti" },
    { moduleId: "descriptions", lessonId: "descriptions-1", expectedHeading: "Grande e piccolo" },
    { moduleId: "existence-needs", lessonId: "existence-needs-1", expectedHeading: "Cosa c'è e dove" },
  ] as const;

  const CAPSTONE_ROUTES = [
    { lessonId: "capstones-orientation", expectedHeading: "Prima delle prove finali" },
    { lessonId: "capstones-self-introduction", expectedHeading: "Prova finale: presentazione" },
    { lessonId: "capstones-everyday-outing", expectedHeading: "Prova finale: un'uscita quotidiana" },
    { lessonId: "capstones-travel-day", expectedHeading: "Prova finale: una giornata di viaggio" },
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
    await expect(page.locator(".notice--info")).toHaveCount(0);

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

    const notice = page.locator(".notice--info");
    await expect(notice).toBeVisible();
    expect(await notice.count()).toBeGreaterThanOrEqual(1);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const dismiss = notice.locator(".notice__dismiss");
    await expect(dismiss).toBeVisible();
    await dismiss.click();
    await expect(page.locator(".notice--info")).toHaveCount(0);

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
    await expect(shoppingHeading).toHaveText("Acquisti, quantità e richieste");

    const lessonLinksBefore = await page.locator(".module-card__lesson-link").count();

    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await expect(shoppingHeading).toHaveText("Shopping, quantities, and requests");
    // Switching locale never drops/adds routes: the structure stays identical.
    expect(await page.locator(".module-card__lesson-link").count()).toBe(lessonLinksBefore);

    await settings.locator(".localetoggle button", { hasText: "IT" }).click();
    await expect(shoppingHeading).toHaveText("Acquisti, quantità e richieste");

    await assertNoRuntimeErrors(page, observers);
  });

  test("hiragana/romaji script settings continue to work on Module 1's katakana bridge lesson", async ({ page, viewport }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson("sounds", "sounds-4"));
    const settings = await settingsContainer(page, viewport ?? null);

    const mainLine = page.locator(".lesson-comparison__jp").first();
    await expect(mainLine).toBeVisible();

    // Default script is hiragana-primary: the main line shows the authentic
    // Japanese (with its assisted-katakana ruby), not romaji.
    await expect(page.locator(".lesson-comparison__jp.is-romaji")).toHaveCount(0);
    await expect(page.locator("ruby.katakana-assist").first()).toBeVisible();

    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await expect(mainLine).toHaveClass(/is-romaji/);
    await expect(mainLine).toContainText("koohii");
    // Romaji is plain text: no ruby annotation while it is the main script.
    await expect(page.locator(".lesson-comparison__jp ruby")).toHaveCount(0);

    await settings.locator(".scripttoggle button", { hasText: "Hiragana" }).click();
    await expect(page.locator(".lesson-comparison__jp.is-romaji")).toHaveCount(0);
    await expect(mainLine.locator("ruby.katakana-assist")).toBeVisible();

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

/** The introductions-1 base sentence the lesson teaches: わたし は がくせい です. */
const INTRO_TILE_ORDER = ["わたし", "は", "がくせい", "です"] as const;

function tileCard(page: import("@playwright/test").Page) {
  return page.locator(".lesson-exercise", {
    has: page.locator(".lesson-exercise__bank"),
  });
}

function choiceCard(page: import("@playwright/test").Page) {
  return page.locator(".lesson-exercise", {
    has: page.locator(".lesson-exercise__radio"),
  });
}

test.describe("Slice C — deterministic exercises", () => {
  test("all five exercise kinds are reachable across two representative lessons", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);

    await gotoReady(page, EXERCISE_LESSON_URL);
    // introductions-1 covers tile ordering, choice, completion, construction.
    await expect(page.locator(".lesson-exercise__bank")).toHaveCount(1);
    await expect(page.locator(".lesson-exercise__radio").first()).toBeVisible();
    await expect(page.locator(".lesson-exercise__input").first()).toBeVisible();
    await expect(page.locator(".lesson-exercise__intent")).toHaveCount(1);

    await gotoReady(page, TRANSFORM_LESSON_URL);
    // past-negative-1 adds the tense transformation kind.
    await expect(page.locator(".lesson-exercise__source")).toHaveCount(1);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("keyboard tile ordering builds and accepts the sentence with no pointer drag", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = tileCard(page);
    await expect(card).toHaveCount(1);

    // Add each tile in the lesson's own sentence order using the keyboard only.
    for (const glyph of INTRO_TILE_ORDER) {
      const addButton = card
        .locator(".lesson-exercise__bank button", { hasText: glyph })
        .first();
      await addButton.focus();
      await page.keyboard.press("Enter");
    }

    // The answer now holds all four tiles; none remain in the bank.
    await expect(card.locator(".lesson-exercise__placed")).toHaveCount(4);
    await expect(card.locator(".lesson-exercise__bank button")).toHaveCount(0);

    const submit = card.locator("button[type=submit]");
    await submit.focus();
    await page.keyboard.press("Enter");

    const feedback = card.locator(".lesson-exercise__feedback");
    await expect(feedback).toHaveClass(/lesson-exercise__feedback--accepted/);
    await expect(feedback).toContainText("Corretto");
    // The result lives in a polite live region that does not steal focus.
    await expect(feedback).toHaveAttribute("aria-live", "polite");

    await assertNoRuntimeErrors(page, observers);
  });

  test("a wrong choice shows a text retry state (not colour alone) and enqueues review", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    const card = choiceCard(page);
    // The distractor particle for this lesson is の (introductions-1-say#p1).
    await card.locator('input[type=radio][value="introductions-1-say#p1"]').check();
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

    const instruction = page
      .locator(".lesson-exercise .lesson-exercise__instruction")
      .first();
    // Default locale is Italian (textContent assertions do not need visibility,
    // so the mobile settings overlay never has to be dismissed between steps).
    await expect(instruction).toContainText("Riordina");

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
    await expect(instruction).toContainText("Arrange the tiles");

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
    await card.locator('input[type=radio][value="introductions-1-say#p1"]').check();
    await card.locator("button[type=submit]").click();
    await expect(card.locator(".lesson-exercise__feedback--retry")).toBeVisible();
    // Correct it in lesson mode — this must NOT silently resolve the review.
    await card.locator('input[type=radio][value="introductions-1-base#p1"]').check();
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
    await page
      .locator('.review-queue__practice input[type=radio][value="introductions-1-base#p1"]')
      .check();
    await page.locator(".review-queue__practice button[type=submit]").click();

    await expect(page.locator(".review-queue__item")).toHaveCount(0);
    await expect(page.locator(".review-queue__empty")).toBeVisible();
    await expect(page.locator(".review-queue__announce")).toContainText("Ripassato");

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("Slice C — truthful lesson evidence states (no colour-only meaning)", () => {
  /** A valid v3 progress record with introductions-1 fully consolidated. */
  const CONSOLIDATED_SEED = {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: {
      "introductions-1": {
        visitedAt: "2026-01-01T00:00:00.000Z",
        practicedAt: "2026-01-01T00:00:00.000Z",
        consolidatedAt: "2026-01-01T00:00:00.000Z",
        attemptedExerciseIds: [
          "introductions-1-order-base",
          "introductions-1-particle-base",
          "introductions-1-complete-base",
          "introductions-1-construct-say",
        ],
        acceptedExerciseIds: [
          "introductions-1-order-base",
          "introductions-1-particle-base",
          "introductions-1-complete-base",
          "introductions-1-construct-say",
        ],
      },
    },
    lastVisitedLessonId: "introductions-1",
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
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
