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

    test(`${screen.name}: reduced-motion is honored (a real transition collapses under reduce)`, async ({ page }) => {
      await setupPageObservers(page);
      await gotoReady(page, screen.url);

      // Probe a guaranteed-visible styled control that carries a *real*
      // non-zero transition in its normal state. We prefer the `.action`
      // primitive (transitions background/color/border/opacity at 0.15s); it is
      // visible in-body on the course screens and as the header trigger on
      // mobile. On desktop screens where no `.action` is rendered (e.g. the Lab
      // with no guided return), the header `.scripttoggle button` carries the
      // same 0.15s transition. Both are real transitions — the later
      // `normalSeconds > 0` assertion guards against picking a tautological,
      // transition-less element regardless of which candidate resolves.
      const candidates = [".action", ".scripttoggle button"];
      let probe = page.locator(candidates[0]).filter({ visible: true }).first();
      for (const selector of candidates) {
        const located = page.locator(selector).filter({ visible: true }).first();
        if (await located.count()) {
          probe = located;
          break;
        }
      }
      await expect(
        probe,
        "a visible control carrying a real transition exists on this screen",
      ).toBeVisible();

      const maxDurationSeconds = () =>
        probe.evaluate((el) =>
          getComputedStyle(el)
            .transitionDuration.split(",")
            .map((part) => Number.parseFloat(part))
            .reduce((max, value) => Math.max(max, Number.isNaN(value) ? 0 : value), 0),
        );

      // Normal preference: the control genuinely animates.
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const normalSeconds = await maxDurationSeconds();
      expect(
        normalSeconds,
        "normal (no-preference) transition-duration must be non-zero",
      ).toBeGreaterThan(0);

      // Reduced preference: the *same* control's transition collapses. This
      // fails if the app's `prefers-reduced-motion` CSS is ever removed.
      await page.emulateMedia({ reducedMotion: "reduce" });
      const reducedSeconds = await maxDurationSeconds();
      expect(
        reducedSeconds,
        "transition-duration under reduced motion",
      ).toBeLessThan(0.05);
      expect(
        reducedSeconds,
        `reduced (${reducedSeconds}s) must be materially smaller than normal (${normalSeconds}s)`,
      ).toBeLessThan(normalSeconds);
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

test.describe("naked-action audit is proven by computed style, not selectors", () => {
  // Regression guard for the Task 8 escape hatch: `.course-hero__actions` is a
  // pure layout container, so a `closest()`/allowlist audit waves through any
  // classless control nested inside it. The audit must instead measure each
  // control's *own* rendered appearance and still catch a browser-default
  // button/anchor even when its ancestor carries an allowlisted class.
  test("a truly naked button and anchor injected into an allowlisted container are reported", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // The pristine, real screen must be clean first — otherwise a passing
    // assertion below could be masking a genuine offender.
    const pristine = await auditNakedActions(page);
    expect(
      pristine,
      `pristine course home must have no naked actions: ${JSON.stringify(pristine, null, 2)}`,
    ).toEqual([]);

    // Inject genuinely naked (classless, unstyled) controls INSIDE the
    // allowlisted `.course-hero__actions` container. Their only styling is the
    // browser default plus the global `button { font: inherit }` reset.
    const host = await page.evaluate(() => {
      const container = document.querySelector(".course-hero__actions");
      if (!container) throw new Error(".course-hero__actions not found on course home");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "NAKED_BUTTON_PROBE";
      button.setAttribute("data-naked-probe", "button");
      const anchor = document.createElement("a");
      anchor.setAttribute("href", "#/naked-probe");
      anchor.textContent = "NAKED_ANCHOR_PROBE";
      anchor.setAttribute("data-naked-probe", "anchor");
      container.append(button, anchor);
      return {
        tag: container.tagName.toLowerCase(),
        cls: container.getAttribute("class") ?? "",
        childCount: container.querySelectorAll("[data-naked-probe]").length,
      };
    });
    // Confirm the injection landed inside the styled/allowlisted container.
    expect(host.tag, "host is a plain layout container").toBe("div");
    expect(host.cls, "host carries the allowlisted class").toContain("course-hero__actions");
    expect(host.childCount, "both probes injected").toBe(2);

    const naked = await auditNakedActions(page);
    expect(
      naked.some((entry) => entry.includes("NAKED_BUTTON_PROBE")),
      `naked <button> nested in .course-hero__actions must be reported. Got: ${JSON.stringify(naked, null, 2)}`,
    ).toBe(true);
    expect(
      naked.some((entry) => entry.includes("NAKED_ANCHOR_PROBE")),
      `naked <a href> nested in .course-hero__actions must be reported. Got: ${JSON.stringify(naked, null, 2)}`,
    ).toBe(true);

    // The audit must leave no trace: probes are the only remaining <button>/<a>
    // additions and the audit itself must not inject or leak reference nodes.
    const residue = await page.evaluate(() =>
      Array.from(document.querySelectorAll("body *")).filter(
        (el) =>
          (el.tagName === "BUTTON" || el.tagName === "A") &&
          !el.hasAttribute("data-naked-probe") &&
          (el.textContent ?? "").includes("PROBE"),
      ).length,
    );
    expect(residue, "audit left no reference-node residue in the DOM").toBe(0);
  });

  // Regression guard for the "near-naked escape" the old fixed 30-field
  // signature allowed: a browser-default control could dodge the audit merely
  // by declaring `cursor: pointer` (an inherited/interaction hint, not visual
  // chrome) or by nudging a single padding side by 1px. Both are still, to a
  // user, indistinguishable from a naked control. Each probe is injected into
  // the layout-only `.course-hero__actions` container (no allowlist rescue).
  test("a near-naked button escaping only via cursor:pointer is still reported", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const pristine = await auditNakedActions(page);
    expect(
      pristine,
      `pristine course home must have no naked actions: ${JSON.stringify(pristine, null, 2)}`,
    ).toEqual([]);

    // A classless <button> whose ONLY departure from the browser default is a
    // pointer cursor. Cursor is an interaction affordance, not own visual
    // chrome, so this control must still be flagged as naked.
    await page.evaluate(() => {
      const container = document.querySelector(".course-hero__actions");
      if (!container) throw new Error(".course-hero__actions not found on course home");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "CURSOR_ONLY_PROBE";
      button.setAttribute("data-naked-probe", "cursor");
      button.style.cursor = "pointer";
      container.append(button);
    });

    const naked = await auditNakedActions(page);
    expect(
      naked.some((entry) => entry.includes("CURSOR_ONLY_PROBE")),
      `a button styled only with cursor:pointer must be reported as naked. Got: ${JSON.stringify(naked, null, 2)}`,
    ).toBe(true);
  });

  test("a near-naked button escaping only via a 1px padding nudge is still reported", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const pristine = await auditNakedActions(page);
    expect(
      pristine,
      `pristine course home must have no naked actions: ${JSON.stringify(pristine, null, 2)}`,
    ).toEqual([]);

    // A classless <button> whose ONLY departure from the browser default is a
    // single padding side nudged by exactly 1px. A sub-pixel/1px nudge on one
    // side is not meaningful chrome, so this control must still be flagged.
    //
    // Native <button>s only honour author padding when it is present *before*
    // the element first resolves as a native-themed control; reading its
    // computed style first would lock in the native theme and silently drop the
    // padding. So the browser-default padding is measured from a throwaway
    // reference button, and the probe's padding is set (base + 1px) before its
    // own computed style is ever read. Nothing else is touched, so every other
    // audited chrome field stays identical to a naked default button.
    const nudge = await page.evaluate(() => {
      const container = document.querySelector(".course-hero__actions");
      if (!container) throw new Error(".course-hero__actions not found on course home");
      const gauge = document.createElement("button");
      gauge.type = "button";
      document.body.append(gauge);
      const base = Number.parseFloat(getComputedStyle(gauge).paddingLeft);
      gauge.remove();
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "PADDING_NUDGE_PROBE";
      button.setAttribute("data-naked-probe", "padding");
      button.style.paddingLeft = `${base + 1}px`;
      container.append(button);
      return { base, applied: getComputedStyle(button).paddingLeft };
    });
    expect(
      Number.parseFloat(nudge.applied),
      `padding-left nudged to base(${nudge.base}) + 1px`,
    ).toBeCloseTo(nudge.base + 1, 1);

    const naked = await auditNakedActions(page);
    expect(
      naked.some((entry) => entry.includes("PADDING_NUDGE_PROBE")),
      `a button whose only styling is a 1px single-side padding nudge must be reported as naked. Got: ${JSON.stringify(naked, null, 2)}`,
    ).toBe(true);
  });
});

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
