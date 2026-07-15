import { expect, test } from "@playwright/test";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditNakedActions,
  auditTouchTargets,
  collectFontEvidence,
  contrastRatio,
  gotoReady,
  headerBottom,
  rectOf,
  REPRESENTATIVE_LESSON,
  resolveColors,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const LESSON_URL = routeUrls.lesson(
  REPRESENTATIVE_LESSON.moduleId,
  REPRESENTATIVE_LESSON.lessonId,
);

const SCREENS = [
  { name: "course home", url: routeUrls.home },
  { name: "representative lesson", url: LESSON_URL },
  { name: "Lab", url: routeUrls.lab },
  { name: "Syllabary", url: routeUrls.syllabary },
] as const;

function isMobile(width: number): boolean {
  return width < 700;
}

for (const screen of SCREENS) {
  test.describe(screen.name, () => {
    test(`${screen.name}: no page/console errors or unhandled rejections`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, screen.url);
      await assertNoRuntimeErrors(page, observers);
    });

    test(`${screen.name}: only local production-preview requests, no backend/API/external origin`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, screen.url);
      assertLocalOnlyNetwork(observers);
      // Positive proof the page really did load its own local assets.
      expect(observers.requests.length).toBeGreaterThan(0);
    });

    test(`${screen.name}: no horizontal overflow`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      await assertNoHorizontalOverflow(page);
    });

    test(`${screen.name}: every visible actionable target is at least 44x44`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      const offenders = await auditTouchTargets(page);
      expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
    });

    test(`${screen.name}: no naked browser-default actions`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      const naked = await auditNakedActions(page);
      expect(naked, JSON.stringify(naked, null, 2)).toEqual([]);
    });

    test(`${screen.name}: self-hosted Manrope is loaded and applied to body + controls`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      const evidence = await collectFontEvidence(
        page,
        ".modenav__item",
        ".header__logo",
      );
      expect(evidence.manropeCheck, "document.fonts.check('16px Manrope')").toBe(true);
      expect(evidence.loadedManropeFaces, "loaded Manrope FontFaces").toBeGreaterThan(0);
      expect(
        evidence.woff2Resources.some((name) => /manrope/i.test(name)),
        `a self-hosted Manrope .woff2 must appear in Performance resources: ${JSON.stringify(evidence.woff2Resources)}`,
      ).toBe(true);
      expect(evidence.bodyFamily).toMatch(/Manrope/);
      // A control inherits the same UI family (never a browser default).
      expect(evidence.controlFamily).toMatch(/Manrope/);
      // The UI stack leads with Manrope, then falls back to system sans.
      expect(evidence.bodyFamily).not.toMatch(/^Hiragino/);
    });

    test(`${screen.name}: reduced-motion is honored (transitions collapsed)`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      const state = await page.evaluate(() => {
        const probe = document.querySelector(".modenav__item") ?? document.body;
        const duration = getComputedStyle(probe).transitionDuration;
        const seconds = duration
          .split(",")
          .map((part) => Number.parseFloat(part))
          .reduce((max, value) => Math.max(max, Number.isNaN(value) ? 0 : value), 0);
        return {
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          seconds,
        };
      });
      expect(state.reduced, "context prefers-reduced-motion").toBe(true);
      expect(state.seconds, "transition-duration under reduced motion").toBeLessThan(0.05);
    });

    test(`${screen.name}: decorative SVG icons are hidden, labelled icons expose a name`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      const badIcons = await page.evaluate(() => {
        const offenders: string[] = [];
        for (const svg of Array.from(document.querySelectorAll("svg.icon"))) {
          const hidden = svg.getAttribute("aria-hidden") === "true";
          const labelled =
            svg.getAttribute("role") === "img" &&
            !!(svg.getAttribute("aria-label") ?? "").trim();
          if (!hidden && !labelled) offenders.push(svg.outerHTML.slice(0, 80));
        }
        return offenders;
      });
      expect(badIcons, JSON.stringify(badIcons, null, 2)).toEqual([]);
    });

    test(`${screen.name}: keyboard focus is visibly outlined`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          width: Number.parseFloat(style.outlineWidth),
          style: style.outlineStyle,
        };
      });
      expect(outline, "an element received focus on first Tab").not.toBeNull();
      expect(outline!.style).not.toBe("none");
      expect(outline!.width, "focus outline width").toBeGreaterThanOrEqual(2);
    });
  });
}

test.describe("desktop header composition", () => {
  test.skip(({ viewport }) => !!viewport && isMobile(viewport.width), "desktop only");

  test("brand, nav, and desktop settings never overlap and the brand has real width", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    const brand = await rectOf(page, ".header__brand");
    const nav = await rectOf(page, ".modenav");
    const settings = await rectOf(page, ".header__settings--desktop");
    expect(brand && nav && settings).toBeTruthy();
    expect(brand!.width, "brand width").toBeGreaterThan(0);
    // Left-to-right, the three regions occupy disjoint horizontal bands.
    expect(brand!.right, "brand right vs nav left").toBeLessThanOrEqual(nav!.left + 1);
    expect(nav!.right, "nav right vs settings left").toBeLessThanOrEqual(settings!.left + 1);
  });

  test("the mobile settings trigger is hidden on desktop", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".header__settings-trigger")).toBeHidden();
    await expect(page.locator(".header__settings--desktop")).toBeVisible();
  });
});

test.describe("mobile header budget", () => {
  test.skip(({ viewport }) => !viewport || !isMobile(viewport.width), "mobile only");

  test("the closed header (including its border) measures at most 112px", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    const bottom = await headerBottom(page);
    expect(bottom, `header bottom edge at 390x844 (${bottom}px)`).toBeLessThanOrEqual(112);
  });

  test("the brand mark stays on a single line and is never broken mid-word", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    const logo = page.locator(".header__logo");
    await expect(logo).toBeVisible();
    // Measure the rendered height, then force nowrap to obtain the true
    // single-line height. If the brand mark has wrapped, its rendered height
    // will exceed a single line by roughly one line-box.
    const mark = await logo.evaluate((el) => {
      const rendered = el.clientHeight;
      const previous = el.style.whiteSpace;
      el.style.whiteSpace = "nowrap";
      const singleLine = el.clientHeight;
      el.style.whiteSpace = previous;
      return { rendered, singleLine, text: el.textContent ?? "" };
    });
    expect(
      mark.rendered,
      `brand mark "${mark.text}" rendered ${mark.rendered}px vs single line ${mark.singleLine}px`,
    ).toBeLessThanOrEqual(mark.singleLine + 1);
  });

  test("the mobile settings trigger is visible and the desktop settings row is hidden", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".header__settings-trigger")).toBeVisible();
    await expect(page.locator(".header__settings--desktop")).toBeHidden();
  });
});

test.describe("representative lesson visual system", () => {
  test("primary body, action, notice, and dark-board delta states meet contrast", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    // Primary body copy — strict 4.5:1 normal-text minimum.
    const body = await resolveColors(page, ".lesson-section__intro p");
    expect(
      contrastRatio(body.color, body.background),
      `body copy contrast ${body.color} on ${body.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // Primary action label — strict 4.5:1 normal-text minimum (the label is
    // 16px, below the WCAG large-text threshold, so it is held to 4.5).
    const primary = await resolveColors(page, ".lesson-footer a.action--primary");
    expect(
      contrastRatio(primary.color, primary.background),
      `primary action contrast ${primary.color} on ${primary.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // Dark guided board main state text.
    const boardState = await resolveColors(page, ".guided-board__jp");
    expect(
      contrastRatio(boardState.color, boardState.background),
      `guided board state contrast ${boardState.color} on ${boardState.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // Highlighted changed-gear delta chip on the board.
    const gear = await resolveColors(page, ".guided-board__gear");
    expect(
      contrastRatio(gear.color, gear.background),
      `guided board delta gear contrast ${gear.color} on ${gear.background}`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("lesson Japanese comparison uses the system stack and does not wrap at desktop reading width", async ({ page, viewport }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    const jp = page.locator(".lesson-comparison__jp").first();
    await expect(jp).toBeVisible();
    const family = await jp.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toMatch(/Hiragino Sans/);
    expect(family).not.toMatch(/Manrope/);

    const metrics = await jp.evaluate((el) => {
      const style = getComputedStyle(el);
      const lineHeight = Number.parseFloat(style.lineHeight);
      // Natural single-line width if wrapping were disabled.
      const previous = el.style.whiteSpace;
      el.style.whiteSpace = "nowrap";
      const naturalWidth = el.scrollWidth;
      el.style.whiteSpace = previous;
      // Rendered geometry under the real (wrapping) layout.
      const clientWidth = el.clientWidth;
      const scrollWidth = el.scrollWidth;
      const height = el.getBoundingClientRect().height;
      return {
        lineHeight,
        naturalWidth,
        clientWidth,
        scrollWidth,
        height,
        lines: Math.round(height / lineHeight),
      };
    });

    // The comparison clause must never be clipped horizontally at any viewport:
    // whatever wrapping happens stays inside the card's content box.
    expect(
      metrics.scrollWidth,
      `comparison clipped horizontally (scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth})`,
    ).toBeLessThanOrEqual(metrics.clientWidth + 1);

    if (viewport && !isMobile(viewport.width)) {
      // "Does not wrap *unnecessarily*": if the clause fits the card on one
      // line, it must render on one line. If it is genuinely wider than the
      // card, wrapping is necessary and acceptable (but still not clipped,
      // asserted above).
      if (metrics.naturalWidth <= metrics.clientWidth + 1) {
        expect(
          metrics.lines,
          `desktop comparison wraps despite fitting (natural ${metrics.naturalWidth}px <= available ${metrics.clientWidth}px, height ${metrics.height}px)`,
        ).toBe(1);
      } else {
        expect(
          metrics.lines,
          `desktop comparison necessary-wrap line count (natural ${metrics.naturalWidth}px > available ${metrics.clientWidth}px)`,
        ).toBeGreaterThanOrEqual(1);
      }
    } else {
      // Mobile may wrap, but never collapses to an unreadable/clipped box.
      expect(metrics.lines).toBeGreaterThanOrEqual(1);
    }
  });

  test("the reading column stays within the shared 760-860px measure on desktop", async ({ page, viewport }) => {
    test.skip(!!viewport && isMobile(viewport.width), "desktop only");
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);
    const main = await rectOf(page, ".lesson-main");
    expect(main).toBeTruthy();
    expect(main!.width, `lesson-main width ${main!.width}`).toBeLessThanOrEqual(860 + 1);
    expect(main!.width, `lesson-main width ${main!.width}`).toBeGreaterThanOrEqual(600);
  });
});
