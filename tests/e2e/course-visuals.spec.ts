import { expect, test, type Page } from "@playwright/test";
import { PREVIEW_BASE_PATH, PREVIEW_ORIGIN } from "../../playwright.config";
import { A1_AREAS } from "../../src/course/a1/areas";
import {
  A1_LESSON_IDS,
  A1_LESSON_MANIFEST,
  A1_MODULE_IDS,
} from "../../src/course/a1/manifest";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import { getA1SpokenAttemptModel } from "../../src/course/components/a1SpokenAttemptModel";
import { CURRENT_COURSE_PROGRESS_CATALOG_VERSION } from "../../src/course/progress/progress";
import { reviewKeyFor } from "../../src/course/progress/reviewQueue";
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
  installSpeechFake,
  queueSpeechOutcome,
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
const A1_FOUNDATION_BASELINES = [
  {
    name: "introductions-1",
    url: routeUrls.lesson("introductions", "introductions-1"),
    snapshot: "a1-migrated-introductions-1.png",
    dialogue: true,
  },
  {
    name: "shopping-4",
    url: routeUrls.lesson("shopping", "shopping-4"),
    snapshot: "a1-migrated-scenario-shopping-4.png",
    dialogue: true,
  },
  {
    name: "sentence-foundations-1",
    url: routeUrls.lesson("sentence-foundations", "sentence-foundations-1"),
    snapshot: "a1-sentence-foundations-1.png",
    dialogue: false,
  },
  {
    name: "time-movement-4",
    url: routeUrls.lesson("time-movement", "time-movement-4"),
    snapshot: "a1-time-movement-4.png",
    dialogue: true,
  },
] as const;

/** The complete published A1 map: explicit semantic areas, 16 modules, and
 * 64 canonical routes. The hardcoded shape makes expansion regressions visible;
 * imports below independently prove the DOM follows the release manifest. */
const EXPECTED_AREA_IDS = ["sounds", "foundations", "situations", "synthesis"] as const;
const EXPECTED_AREA_MODULE_COUNTS = [1, 4, 10, 1] as const;
const EXPECTED_MODULE_ORDER = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
] as const;
const TOTAL_MODULE_COUNT = 16;
const TOTAL_LESSON_COUNT = 64;

/** The Module 1 "katakana bridge" lesson (design spec §7): the first lesson
 * that introduces authentic katakana loanwords, e.g. コーヒー. */
const KATAKANA_BRIDGE_LESSON_URL = routeUrls.lesson("sounds", "sounds-4");

/** Clicks every currently-collapsed module disclosure so all 64 lesson rows
 * become visible, letting a test prove the *complete* set of routes without
 * assuming DOM presence implies user-visible reachability. */
async function expandAllModules(page: Page): Promise<void> {
  const disclosures = page.locator(".module-card__disclosure");
  const count = await disclosures.count();
  for (let index = 0; index < count; index += 1) {
    const button = disclosures.nth(index);
    if ((await button.getAttribute("aria-expanded")) === "false") {
      await button.click();
    }
  }
}

async function showCompleteFoundationsArea(page: Page): Promise<void> {
  const areas = page.locator(".course-area");
  const count = await areas.count();
  for (let areaIndex = 0; areaIndex < count; areaIndex += 1) {
    const area = areas.nth(areaIndex);
    const isFoundations = await area.evaluate((element) =>
      element.classList.contains("course-area--foundations"),
    );
    const disclosures = area.locator(".module-card__disclosure");
    for (let index = 0; index < await disclosures.count(); index += 1) {
      const disclosure = disclosures.nth(index);
      const expanded = (await disclosure.getAttribute("aria-expanded")) === "true";
      if (expanded !== isFoundations) await disclosure.click();
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

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

test.describe("reviewed A1 desktop baselines", () => {
  test.skip(
    ({ viewport }) => !viewport || viewport.width < 700,
    "A1 full-page baselines are reviewed at the approved desktop viewport",
  );

  test("Course Map: complete Foundations area is expanded while other areas stay compact", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await showCompleteFoundationsArea(page);

    const foundations = page.locator(".course-area--foundations");
    await expect(foundations.locator(".module-card")).toHaveCount(4);
    await expect(foundations.locator(".module-card__lesson-link")).toHaveCount(16);
    await expect(
      foundations.locator(".module-card__lesson-link").filter({ visible: true }),
    ).toHaveCount(16);
    await expect(page).toHaveScreenshot("a1-course-map-foundations-expanded.png", {
      fullPage: true,
    });

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  for (const baseline of A1_FOUNDATION_BASELINES) {
    test(`${baseline.name}: Italian hiragana learning flow`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await installSpeechFake(page);
      await gotoReady(page, baseline.url);

      await expect(page.locator(".a1-vocabulary__meaning").first()).toContainText(/\S/);
      await expect(page.locator(".a1-worked-examples__pattern:not([open])")).toHaveCount(1);
      await expect(page.locator(".a1-worked-examples__dialogue")).toHaveCount(
        baseline.dialogue ? 1 : 0,
      );
      await expect(page.locator(".lesson-exercise")).toHaveCount(4);
      await expect(page.locator(".spoken-attempt")).toHaveCount(1);
      await expect(page).toHaveScreenshot(baseline.snapshot, { fullPage: true });

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  }
});

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
  test("primary body, action, learning-note, and worked-example states meet contrast", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    // Primary body copy — strict 4.5:1 normal-text minimum.
    const body = await resolveColors(page, ".a1-lesson-overview__details dd");
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

    // Learning-note labels are explanatory text, never decorative/color-only
    // hints, so they keep normal-text contrast.
    const note = await resolveColors(page, ".a1-learning-note__pattern-label");
    expect(
      contrastRatio(note.color, note.background),
      `learning-note label contrast ${note.color} on ${note.background}`,
    ).toBeGreaterThanOrEqual(4.5);

    // Worked examples pair Japanese, romaji, glosses and natural translations;
    // the natural translation is ordinary readable instructional copy.
    const translation = await resolveColors(page, ".a1-worked-examples__translation");
    expect(
      contrastRatio(translation.color, translation.background),
      `natural translation contrast ${translation.color} on ${translation.background}`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("lesson Japanese worked examples use the system stack and do not clip at desktop reading width", async ({ page, viewport }) => {
    await setupPageObservers(page);
    await gotoReady(page, LESSON_URL);

    const jp = page.locator(".a1-worked-examples__japanese").first();
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

    // The worked example must never be clipped horizontally at any viewport:
    // whatever wrapping happens stays inside the card's content box.
    expect(
      metrics.scrollWidth,
      `worked example clipped horizontally (scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth})`,
    ).toBeLessThanOrEqual(metrics.clientWidth + 1);

    if (viewport && !isMobile(viewport.width)) {
      // "Does not wrap *unnecessarily*": if the clause fits the card on one
      // line, it must render on one line. If it is genuinely wider than the
      // card, wrapping is necessary and acceptable (but still not clipped,
      // asserted above).
      if (metrics.naturalWidth <= metrics.clientWidth + 1) {
        expect(
          metrics.lines,
          `desktop worked example wraps despite fitting (natural ${metrics.naturalWidth}px <= available ${metrics.clientWidth}px, height ${metrics.height}px)`,
        ).toBe(1);
      } else {
        expect(
          metrics.lines,
          `desktop worked-example necessary-wrap line count (natural ${metrics.naturalWidth}px > available ${metrics.clientWidth}px)`,
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

test.describe("live complete A1 course composition", () => {
  test("exposes exactly four semantic areas, 16 module cards, and the canonical module order", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    expect(A1_AREAS.map((area) => area.id)).toEqual([...EXPECTED_AREA_IDS]);
    expect(A1_MODULE_IDS).toHaveLength(TOTAL_MODULE_COUNT);
    expect(A1_LESSON_IDS).toHaveLength(TOTAL_LESSON_COUNT);
    const totalModules = await page.locator(".module-card").count();
    expect(totalModules).toBe(TOTAL_MODULE_COUNT);

    const areaShape = await page.locator(".course-area").evaluateAll((areas) =>
      areas.map((area) => ({
        id: area.getAttribute("aria-labelledby")?.replace("course-area-", "") ?? "",
        modules: area.querySelectorAll(".module-card").length,
      })),
    );
    expect(areaShape).toEqual(
      EXPECTED_AREA_IDS.map((id, index) => ({
        id,
        modules: EXPECTED_AREA_MODULE_COUNTS[index],
      })),
    );

    await expandAllModules(page);
    const firstHrefs = await page.locator(".module-card").evaluateAll((cards) =>
      cards.map((card) => card.querySelector(".module-card__lesson-link")?.getAttribute("href") ?? ""),
    );
    const moduleIds = firstHrefs.map((href) => href.split("/")[2] ?? "");
    expect(moduleIds).toEqual([...EXPECTED_MODULE_ORDER]);
  });

  test("declares exactly 64 unique lesson links across every module", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await expandAllModules(page);

    const links = page.locator(".module-card__lesson-link");
    await expect(links).toHaveCount(TOTAL_LESSON_COUNT);

    const hrefs = await links.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("href")),
    );
    expect(hrefs).toHaveLength(TOTAL_LESSON_COUNT);
    expect(new Set(hrefs).size, "every lesson link href is unique").toBe(TOTAL_LESSON_COUNT);
    expect(hrefs.every((href) => !!href), "every lesson link has an href").toBe(true);
    expect(hrefs).toEqual(
      A1_LESSON_IDS.map((lessonId) => {
        const entry = A1_LESSON_MANIFEST[lessonId];
        return `#/percorso/${entry.moduleId}/${entry.lessonId}`;
      }),
    );
  });

  test("only the recommended module's lessons render by default — no raw dumped rows on the rest", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // Regression guard: `.module-card__lessons[hidden]` must actually render
    // with zero height. A CSS specificity tie with the UA `[hidden]` default
    // previously let every collapsed module's full lesson list render
    // anyway, dumping all 64 rows on first paint instead of only the
    // recommended module's (design spec §13.3).
    const panelMetrics = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".module-card__lessons")).map(
        (panel) => ({
          hidden: panel.hasAttribute("hidden"),
          height: panel.getBoundingClientRect().height,
        }),
      ),
    );
    expect(panelMetrics).toHaveLength(TOTAL_MODULE_COUNT);
    const collapsed = panelMetrics.filter((entry) => entry.hidden);
    const expanded = panelMetrics.filter((entry) => !entry.hidden);
    expect(expanded, "exactly one module starts expanded").toHaveLength(1);
    expect(collapsed, "every other module starts collapsed").toHaveLength(TOTAL_MODULE_COUNT - 1);
    for (const entry of collapsed) {
      expect(entry.height, "a collapsed module's lesson list renders no height").toBe(0);
    }
    expect(expanded[0].height, "the expanded module's lesson list has real height").toBeGreaterThan(0);
  });

  test("visible lesson rows are bounded/content-sized nested cards, never raw browser-default rows", async ({ page, viewport }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // Collapsed cards are content-sized, not forced to a uniform/giant
    // height matching the expanded module (design spec §13.3). The bound is
    // generous enough to absorb mobile's narrower text wrapping while still
    // being far below what a giant/equal-height forced card would measure.
    // Foundations cards carry a longer localized outcome plus their explicit
    // prerequisite. Their current desktop maximum is 323px, so 340px remains
    // a strict content-sized ceiling while allowing that authored area.
    const collapsedBound = viewport && isMobile(viewport.width) ? 620 : 340;
    const cardHeights = await page.locator(".module-card").evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().height),
    );
    const [expandedHeight, ...collapsedHeights] = cardHeights;
    for (const height of collapsedHeights) {
      expect(
        height,
        "a collapsed module card must not match the expanded card's height",
      ).toBeLessThan(expandedHeight);
      // No giant empty card: a collapsed module (icon, title, outcome,
      // prerequisites, coverage line, CTA) never needs anywhere near the
      // vertical space an expanded lesson list occupies.
      expect(height, "collapsed module card is content-sized, not a giant card").toBeLessThan(collapsedBound);
    }

    // The resting (non-hover) visible lesson rows in the expanded module are
    // real bounded nested cards: a visible border, a visible non-transparent
    // background, and a real >=44px target — never the raw, borderless,
    // transparent-background appearance the defect statement (§13.1)
    // describes.
    const rows = await page.locator(".module-card__lesson-link").evaluateAll((elements) =>
      elements
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            borderWidths: [
              style.borderTopWidth,
              style.borderRightWidth,
              style.borderBottomWidth,
              style.borderLeftWidth,
            ],
            borderStyle: style.borderTopStyle,
            background: style.backgroundColor,
            width: rect.width,
            height: rect.height,
          };
        }),
    );
    expect(rows.length, "the recommended module's rows are visible").toBeGreaterThan(0);
    for (const row of rows) {
      for (const width of row.borderWidths) {
        expect(Number.parseFloat(width), "resting lesson row has a real border").toBeGreaterThanOrEqual(1);
      }
      expect(row.borderStyle, "resting lesson row border is not none").not.toBe("none");
      expect(row.background, "resting lesson row background is not transparent").not.toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(row.width, `lesson row width ${row.width}`).toBeGreaterThanOrEqual(44);
      expect(row.height, `lesson row height ${row.height}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("keyboard Tab reaches a nested lesson row with a visible focus outline", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    let reachedLessonLink = false;
    let outline: { width: number; style: string } | null = null;
    for (let presses = 0; presses < 40 && !reachedLessonLink; presses += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          isLessonLink: el.classList.contains("module-card__lesson-link"),
          outlineWidth: Number.parseFloat(style.outlineWidth),
          outlineStyle: style.outlineStyle,
        };
      });
      if (info?.isLessonLink) {
        reachedLessonLink = true;
        outline = { width: info.outlineWidth, style: info.outlineStyle };
      }
    }
    expect(reachedLessonLink, "Tab order reaches a nested lesson row").toBe(true);
    expect(outline!.style, "focused lesson row outline style").not.toBe("none");
    expect(outline!.width, "focused lesson row outline width").toBeGreaterThanOrEqual(2);
  });

  test("no horizontal overflow even with every module expanded", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await expandAllModules(page);
    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("Module 1's katakana bridge lesson shows authentic コーヒー with adjacent romaji こーひー on first exposure", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, KATAKANA_BRIDGE_LESSON_URL);

    const coffee = page
      .locator(".a1-vocabulary__item")
      .filter({ has: page.locator(".a1-vocabulary__kana", { hasText: "コーヒー" }) });
    await expect(coffee).toHaveCount(1);
    await expect(coffee.locator(".a1-vocabulary__kana")).toHaveText("コーヒー");
    await expect(coffee.locator(".a1-vocabulary__romaji")).toContainText(/koohii/i);
    await expect(coffee.locator(".a1-vocabulary__meaning")).toContainText(/\S/);
  });

  test("serves under the GitHub Pages base path: routes and static assets resolve under /nihongo-practice/", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    expect(page.url(), "the app loads at the Pages base path").toBe(
      `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/percorso`,
    );
    const pathname = await page.evaluate(() => window.location.pathname);
    expect(pathname, "document location is served under /nihongo-practice/").toBe(
      PREVIEW_BASE_PATH,
    );

    const assetRequests = observers.requests.filter((url) =>
      url.includes(`${PREVIEW_BASE_PATH}assets/`),
    );
    expect(
      assetRequests.length,
      `at least one static asset request resolves under ${PREVIEW_BASE_PATH}assets/: ${JSON.stringify(observers.requests)}`,
    ).toBeGreaterThan(0);
    assertLocalOnlyNetwork(observers);

    // A representative deep hash link also resolves under the same base.
    await gotoReady(page, KATAKANA_BRIDGE_LESSON_URL);
    expect(page.url()).toBe(
      `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/percorso/sounds/sounds-4`,
    );
    await assertNoRuntimeErrors(page, observers);
  });
});

/**
 * Slice C — the deterministic in-lesson exercises and the `Da ripassare` review
 * surface (design spec §10, §14; Slice C plan Task 4). Runs under both the
 * desktop-1440 and mobile-390 projects, so every audit below (44px targets, no
 * horizontal overflow, no naked browser-default controls) is proven at both
 * approved reference widths.
 */
const EXERCISE_LESSON_URL = routeUrls.lesson("introductions", "introductions-1");

/** A valid v4 progress record carrying one active `Da ripassare` entry,
 * seeded directly in the current schema (not via V3 migration, which
 * unconditionally clears the whole review queue — see a1-depth.spec.ts). */
const REVIEW_SOURCE = (() => {
  const result = buildA1PracticeModel("introductions-1");
  if (!result.ok) {
    throw new Error(`Cannot build introductions-1 review fixture: ${result.error.code}`);
  }
  const source = result.model.activities.find(
    (activity) => activity.generatedExercise !== undefined,
  )?.generatedExercise;
  if (!source) throw new Error("introductions-1 has no generated review source");
  return source;
})();

const REVIEW_SEED = JSON.stringify({
  schemaVersion: 4,
  catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
  levels: {
    a1: {
      lessons: {},
      canDos: {},
      checkpointAttempts: [],
      lastVisitedLessonId: "introductions-1",
      reviewQueue: [
        {
          reviewKey: reviewKeyFor("introductions-1", REVIEW_SOURCE.definitionId),
          lessonId: "introductions-1",
          exerciseDefinitionId: REVIEW_SOURCE.definitionId,
          targetConceptIds: [...REVIEW_SOURCE.prompt.assessedConceptIds],
          targetLexemeIds: [...REVIEW_SOURCE.prompt.assessedLexemeIds],
          mistakeCount: 1,
          lastMistakeAt: "2026-01-01T00:00:00.000Z",
        },
      ],
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
});

test.describe("Slice C exercise + review surfaces", () => {
  test("the exercise-rich lesson renders every in-page control type within the audits", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, EXERCISE_LESSON_URL);

    await expect(page.locator(".lesson-exercise")).toHaveCount(4);
    await expect(page.locator(".spoken-attempt")).toHaveCount(1);
    await expect(page.locator(".a1-practice-ladder__list > li")).toHaveCount(5);
    const functions = await page
      .locator(".a1-practice-ladder__list > li")
      .evaluateAll((items) => items.map((item) => item.getAttribute("data-practice-function")));
    expect(new Set(functions).size).toBeGreaterThanOrEqual(4);
    expect(functions).toEqual(
      expect.arrayContaining([
        "meaning-comprehension",
        "form-discrimination",
        "controlled-production",
        "listening-speaking",
      ]),
    );
    // Every generated card announces its result in a polite live region.
    await expect(page.locator('.lesson-exercise__feedback[aria-live="polite"]')).toHaveCount(4);

    await assertNoHorizontalOverflow(page);
    expect(await auditTouchTargets(page)).toEqual([]);
    expect(await auditNakedActions(page)).toEqual([]);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("the Da ripassare surface renders a queued entry within the audits", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await page.addInitScript((seed: string) => {
      localStorage.setItem("nihongo.course.progress", seed);
    }, REVIEW_SEED);

    await gotoReady(page, routeUrls.practice);

    await expect(page.locator("#review-queue-heading")).toBeVisible();
    await expect(page.locator(".review-queue__item")).toHaveCount(1);
    await expect(page.locator(".review-queue__count")).toContainText("1");
    await expect(
      page.locator(".review-queue__item a[href*='introductions-1']"),
    ).toBeVisible();

    // Scope the 44px audit to the review-queue surface itself (Slice C owns
    // this region; the surrounding Practice Home cards are out of scope here).
    const smallReviewTargets = await page.evaluate(() => {
      const MIN = 44;
      const EPSILON = 0.5;
      const root = document.querySelector(".review-queue");
      if (!root) return ["no .review-queue"];
      const controls = Array.from(
        root.querySelectorAll<HTMLElement>(
          "button, a[href], input:not([type=radio]):not([type=checkbox])",
        ),
      );
      return controls
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            (r.width > 0 || r.height > 0) &&
            (r.width < MIN - EPSILON || r.height < MIN - EPSILON)
          );
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`);
    });
    expect(smallReviewTargets, JSON.stringify(smallReviewTargets)).toEqual([]);

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

/**
 * Slice D Task 4 — reviewed speech-block baselines. Two reviewed states of the
 * optional spoken attempt, captured as element screenshots so the reviewer can
 * judge hierarchy, target-Japanese legibility, privacy clarity, state clarity,
 * focus/touch ergonomics, and dead space without the rest of the long lesson.
 *
 * The states are driven entirely through the injected fake recognizer (the same
 * public contract production ships), never a microphone or real engine, so the
 * strict no-external-network guard holds with no speech/vendor allowlist. Across
 * the set both locales and both scripts appear: the consent state is captured in
 * the default Italian + hiragana, and the matched result in English + rōmaji.
 */
const SPEECH_VISUAL_LESSON_URL = routeUrls.lesson("introductions", "introductions-1");
const SPEECH_VISUAL_MODEL = getA1SpokenAttemptModel("introductions-1", "en");
if (!SPEECH_VISUAL_MODEL.ok) {
  throw new Error(
    `Cannot resolve the introductions-1 spoken visual fixture: ${SPEECH_VISUAL_MODEL.error.code}`,
  );
}
const SPEECH_VISUAL_TARGET = SPEECH_VISUAL_MODEL.model.targetJp;
const SPEECH_VISUAL_SEGMENT_COUNT = SPEECH_VISUAL_MODEL.model.segments.length;

/** During a focused component capture, drop the sticky app chrome to `static` so
 * the header and the mobile section rail cannot float over the block's heading.
 * This changes no document flow (sticky already occupies its flow position), so
 * the block's own layout is untouched — it only removes the scroll overlay. */
const NEUTRALIZE_STICKY_CHROME =
  ".header, .lesson-rail-mobile, .catnav { position: static !important; }";

function speechIsMobile(width: number): boolean {
  return width < 700;
}

test.describe("speech block reviewed baselines (Slice D Task 4)", () => {
  test("consent privacy notice — Italian, hiragana", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await installSpeechFake(page);
    await gotoReady(page, SPEECH_VISUAL_LESSON_URL);

    const block = page.locator(".spoken-attempt");
    await expect(block).toBeVisible();
    // Reveal the explicit privacy disclosure that always precedes the mic.
    await block.getByRole("button", { name: "Prova a parlare", exact: true }).click();
    await expect(block.locator(".spoken-attempt__consent")).toBeVisible();
    await block.scrollIntoViewIfNeeded();
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => r())),
    );

    await page.addStyleTag({ content: NEUTRALIZE_STICKY_CHROME });
    await expect(block).toHaveScreenshot("lesson-speech-consent.png");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("matched result — English, rōmaji", async ({ page, viewport }) => {
    const observers = await setupPageObservers(page);
    await installSpeechFake(page);
    await gotoReady(page, SPEECH_VISUAL_LESSON_URL);

    const block = page.locator(".spoken-attempt");
    await expect(block).toBeVisible();

    // Switch to English + rōmaji through the one visible settings surface.
    const mobile = viewport ? speechIsMobile(viewport.width) : false;
    let settings;
    if (mobile) {
      await page.locator(".header__settings-trigger").click();
      const panel = page.locator(".settings-drawer__panel");
      await expect(panel).toBeVisible();
      settings = panel;
    } else {
      settings = page.locator(".header__settings--desktop");
    }
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    if (mobile) {
      // Close the drawer so it cannot overlay the element capture.
      await page.keyboard.press("Escape");
      await expect(page.locator(".settings-drawer__panel")).toBeHidden();
    }

    // Consent, then a matched attempt via the injected fake.
    await block.getByRole("button", { name: "Try speaking", exact: true }).click();
    await block
      .getByRole("button", { name: "I understand, continue", exact: true })
      .click();
    await queueSpeechOutcome(page, { kind: "transcript", transcript: SPEECH_VISUAL_TARGET });
    await block.getByRole("button", { name: "Speak now", exact: true }).click();

    await expect(block.locator(".spoken-attempt__status-text")).toHaveText(
      "Your browser recognized the sentence.",
    );
    await expect(block.locator(".spoken-attempt__segment--matched")).toHaveCount(
      SPEECH_VISUAL_SEGMENT_COUNT,
    );
    await block.scrollIntoViewIfNeeded();
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => r())),
    );

    await page.addStyleTag({ content: NEUTRALIZE_STICKY_CHROME });
    await expect(block).toHaveScreenshot("lesson-speech-result.png");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// Task 26c — computed-style assertions that the taught kanji glyph is visually
// distinguishable from the surrounding characters of the word it lives in
// (e.g. 毎 within 毎日). jsdom has no layout engine, so only a real browser can
// confirm the CSS produces a visible difference; these assertions check
// independent computed visual properties (font weight and a baseline rule),
// not merely that a class name is present, so they fail if the CSS is removed.
//
// The distinction must survive greyscale and colour-vision deficiency
// (WCAG 1.4.1), so it is carried by two non-colour cues — a heavier font
// weight on the target and a border-bottom rule under it. The context
// characters are real content the learner reads, so this suite also pins the
// constraint that they are not dimmed below a 4.5:1 text-contrast ratio.
// ---------------------------------------------------------------------------
const A2_TEIRU_LESSON_URL_26C = routeUrls.lesson("sequencing-ongoing", "sequencing-ongoing-3");
// connected-conversation-4 is where 何 is at the REVEALABLE stage (verified from
// the catalog: 何 revealable=connected-conversation-4, assessed=plans-invitations-1).
// A revealable single-glyph word renders the target hook with furigana hidden
// behind the reveal toggle — the whole word IS the taught glyph, so there are no
// context spans.
const A2_REVEALABLE_SINGLE_GLYPH_LESSON_URL_26C = routeUrls.lesson(
  "connected-conversation",
  "connected-conversation-4",
);
// health-advice-4 genuinely ASSESSES single-glyph words 薬 (kusuri) and 体 (karada)
// (verified from the catalog by joining A2_KANJI_ROWS.assessed to the contextual
// word). The assessed stage is the riskier path: it shows no furigana, so the bare
// glyph has no other cue distinguishing it — the emphasis hook is the only signal.
const A2_ASSESSED_SINGLE_GLYPH_LESSON_URL_26C = routeUrls.lesson("health-advice", "health-advice-4");

// These tests deliberately run in BOTH the desktop-1440 and mobile-390 projects,
// even though the asserted values (font weight, border width, contrast) are
// viewport-independent. course.css already scopes some rules by context, so a
// future mobile-scoped media query that disabled or overrode this emphasis would
// be a real regression caught only by the mobile project. Do not "optimise" this
// down to a single project.
test.describe("kanji glyph emphasis (Task 26c)", () => {
  test("target glyph is emphasised by a heavier weight and a baseline rule", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_TEIRU_LESSON_URL_26C);

    const target = page.locator(".kanji-ruby__word-target").first();
    await expect(target).toBeVisible();

    const ctx = page.locator(".kanji-ruby__word-ctx").first();
    await expect(ctx).toBeVisible();

    const targetStyle = await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        weight: Number(s.fontWeight),
        borderWidth: Number.parseFloat(s.borderBottomWidth),
      };
    });
    const ctxStyle = await ctx.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        weight: Number(s.fontWeight),
        borderWidth: Number.parseFloat(s.borderBottomWidth),
      };
    });

    // Non-colour cue #1: the target is visibly heavier than its context.
    expect(targetStyle.weight).toBeGreaterThan(ctxStyle.weight);
    expect(targetStyle.weight).toBeGreaterThanOrEqual(700);

    // Non-colour cue #2: the target carries a baseline rule the context lacks.
    expect(targetStyle.borderWidth).toBeGreaterThan(0);
    expect(ctxStyle.borderWidth).toBe(0);
  });

  test("context characters stay legible (>= 4.5:1) and are not dimmed", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_TEIRU_LESSON_URL_26C);

    const ctx = page.locator(".kanji-ruby__word-ctx").first();
    await expect(ctx).toBeVisible();

    // The context is emphasis-relative de-prioritised, but must remain real,
    // readable content: full opacity and WCAG AA text contrast.
    const ctxOpacity = await ctx.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(ctxOpacity).toBe(1);

    const { color, background } = await resolveColors(page, ".kanji-ruby__word-ctx");
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(4.5);
  });

  test("a single-glyph word at the revealable stage still marks its taught glyph", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_REVEALABLE_SINGLE_GLYPH_LESSON_URL_26C);

    // At connected-conversation-4, 何 is at the REVEALABLE stage: the whole word
    // IS the single taught glyph, so it renders a target hook with no sibling
    // context span. Without the fix it rendered bare, so the taught glyph
    // appeared in the light/unruled vocabulary that means "context" — this
    // locates exactly that shape, scoped to the revealable panel, and asserts it
    // is emphasised.
    const singleGlyphWord = page
      .locator(".kanji-ruby--revealable .kanji-ruby__word")
      .filter({ has: page.locator(".kanji-ruby__word-target") })
      .filter({ hasNot: page.locator(".kanji-ruby__word-ctx") })
      .first();
    await expect(singleGlyphWord).toBeVisible();

    const target = singleGlyphWord.locator(".kanji-ruby__word-target");
    const style = await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        weight: Number(s.fontWeight),
        borderWidth: Number.parseFloat(s.borderBottomWidth),
      };
    });

    // Same emphasis vocabulary as a glyph that has context: heavy + ruled.
    expect(style.weight).toBeGreaterThanOrEqual(700);
    expect(style.borderWidth).toBeGreaterThan(0);
  });

  test("a single-glyph word at the assessed stage still marks its taught glyph", async ({ page }) => {
    await setupPageObservers(page);
    await gotoReady(page, A2_ASSESSED_SINGLE_GLYPH_LESSON_URL_26C);

    // At health-advice-4, 薬 and 体 are genuinely ASSESSED single-glyph words.
    // Assessed is the riskier path: no furigana is shown, so the bare glyph has
    // no other cue — if the emphasis hook were missing, a taught glyph would be
    // pixel-indistinguishable from a context character. Scope to the assessed
    // panel and assert the single-glyph target still carries heavy + ruled.
    const singleGlyphWord = page
      .locator(".kanji-ruby--assessed .kanji-ruby__word")
      .filter({ has: page.locator(".kanji-ruby__word-target") })
      .filter({ hasNot: page.locator(".kanji-ruby__word-ctx") })
      .first();
    await expect(singleGlyphWord).toBeVisible();

    const target = singleGlyphWord.locator(".kanji-ruby__word-target");
    const style = await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        weight: Number(s.fontWeight),
        borderWidth: Number.parseFloat(s.borderBottomWidth),
      };
    });

    // Same emphasis vocabulary, no furigana to lean on: heavy + ruled.
    expect(style.weight).toBeGreaterThanOrEqual(700);
    expect(style.borderWidth).toBeGreaterThan(0);
  });
});
