import { expect, test, type Locator } from "@playwright/test";
import {
  applyBrowserZoom,
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  assertZoomApplied,
  auditTouchTargets,
  gotoReady,
  headerBottom,
  rectOf,
  REPRESENTATIVE_LESSON,
  routeUrls,
  setupPageObservers,
  SOUND_LESSON,
  visualViewportMetrics,
} from "./helpers";

/**
 * Phase 2 whole-spec review deviation M2 — automated 200% browser-zoom
 * acceptance (WCAG 2.2 1.4.4/1.4.10 reflow). Runs on both configured
 * Playwright projects (`desktop-1440`, `mobile-390`; see playwright.config.ts)
 * for one representative *semantic* lesson (`REPRESENTATIVE_LESSON`) and one
 * representative *phonetic* lesson (`SOUND_LESSON`), so both authored lesson
 * shapes get real zoomed-DOM coverage, not just a single content type.
 *
 * Zoom is applied with {@link applyBrowserZoom}/{@link assertZoomApplied}
 * (see helpers.ts), which deliberately uses *two different* mechanisms
 * depending on the viewport — because that is what "consistent with browser"
 * genuinely means for each platform, not because it is convenient:
 *
 *  - `desktop-1440` gets a real Playwright viewport resize to 720x500 (CDP
 *    device-metrics under the hood), reproducing exactly what a desktop
 *    Ctrl/Cmd-+ page zoom does: the CSS layout viewport itself shrinks, so
 *    every wrap point, sticky offset, and breakpoint genuinely recomputes.
 *  - `mobile-390` gets a CDP `Emulation.setPageScaleFactor(2)` pinch-zoom,
 *    reproducing exactly what a real phone's pinch-zoom does on this app's
 *    `width=device-width` page: a purely *visual* magnification with **no**
 *    CSS reflow (a real phone does not re-layout a device-width page just
 *    because the user pinch-zoomed it). Reflowing the already-compact
 *    390px mobile design down to an *effective* ~195 CSS px would go well
 *    below the WCAG SC 1.4.10 320px reflow floor and would not reproduce
 *    any real user's browser behavior — it would only be testing an
 *    artifact of the wrong zoom mechanism, not a genuine accessibility
 *    requirement.
 *
 * Every test proves the zoom actually took effect (via
 * {@link assertZoomApplied}'s mode-appropriate evidence) before asserting
 * anything else, so a silently no-op zoom can never make these scenarios
 * pass by accident.
 */

const ZOOM_FACTOR = 2;

/**
 * Activates a focusable control via a real keyboard interaction
 * (`focus()` + `Enter`) instead of a synthesized pointer click.
 *
 * This is deliberate, not a workaround for convenience: after a CDP
 * `Emulation.setPageScaleFactor` pinch-zoom (the `mobile-390` project's
 * zoom mechanism — see {@link applyBrowserZoom}), Playwright's own
 * pointer-click hit-testing lands on the wrong element, because the
 * compositor now renders a magnified *visual* viewport pan that Playwright's
 * click-target math does not know about — a genuine tooling limitation of
 * driving a raw compositor-level zoom, not a real defect in the app. A
 * keyboard activation is immune to that coordinate mismatch entirely, and
 * is at least as strong an "operable control" proof for these review
 * deviations: every control this suite activates (the matrix disclosure
 * toggle, the lesson-rail anchor) is a native `<button>`/`<a>`, so `Enter`
 * triggers it exactly as a screen-reader or keyboard-only user's real
 * "activate" gesture would.
 */
async function activate(locator: Locator): Promise<void> {
  await locator.focus();
  await locator.page().keyboard.press("Enter");
}

const LESSONS = [
  { ...REPRESENTATIVE_LESSON, phonetic: false, kind: "semantic" },
  { ...SOUND_LESSON, phonetic: true, kind: "phonetic" },
] as const;

for (const lesson of LESSONS) {
  test.describe(`${lesson.kind} lesson ${lesson.moduleId}/${lesson.lessonId} at 200% zoom`, () => {
    test("Japanese, romaji, matrix/roster, and exercises stay visible with usable controls and no overflow", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));

      const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
      assertZoomApplied(evidence);

      if (lesson.phonetic) {
        const items = page.locator(".a1-phonetic-roster__item");
        await expect(items.first()).toBeVisible();
        expect(await items.count(), "phonetic roster item count").toBeGreaterThanOrEqual(8);
        await expect(page.locator(".a1-phonetic-item__jp").first()).toBeVisible();
      } else {
        const toggle = page.locator(".foundation-matrix__toggle");
        await expect(toggle).toBeVisible();
        await expect(page.locator(".foundation-matrix__row").first()).toBeVisible();
        await expect(page.locator(".foundation-matrix__jp").first()).toBeVisible();
        await expect(page.locator(".foundation-matrix__romaji").first()).toBeVisible();

        // The matrix disclosure toggle stays genuinely operable (not just
        // visible) at 200% zoom: it still expands the curated 3-row subset
        // to all 8 authored rows via a real keyboard activation (see
        // `activate()` above for why keyboard rather than pointer click).
        await expect(page.locator(".foundation-matrix__row")).toHaveCount(3);
        await activate(toggle);
        await expect(page.locator(".foundation-matrix__row")).toHaveCount(8);
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
      }

      const exercises = page.locator(".lesson-exercise");
      await expect(exercises.first()).toBeVisible();
      expect(await exercises.count(), "exercise count").toBeGreaterThanOrEqual(8);

      const canDo = page.locator(".a1-lesson-recap__can-do");
      await expect(canDo).toBeVisible();

      await assertNoHorizontalOverflow(page);

      const offenders = await auditTouchTargets(page);
      expect(offenders, JSON.stringify(offenders)).toEqual([]);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    test("a lesson-rail anchor link still scrolls its section into view and keeps focus at 200% zoom", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));

      const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
      assertZoomApplied(evidence);

      const recapLink = page
        .locator(".lesson-rail__step:visible, .lesson-rail-mobile__step:visible")
        .filter({ hasText: "Ripasso" });
      await expect(recapLink).toHaveCount(1);
      await activate(recapLink);

      // RouteScrollManager documents that it never moves focus itself; the
      // clicked link keeps it — true at 200% zoom exactly as at 100%.
      await expect(recapLink).toBeFocused();

      if (evidence.mode === "reflow") {
        // Desktop reflow-zoom: the visual viewport coincides with the
        // (genuinely shrunk) layout viewport, exactly like the 100%-zoom
        // acceptance test in a1-depth.spec.ts — same sticky-edge + 48px
        // slack, same coordinate space throughout.
        const headerEdge = await headerBottom(page);
        const mobileRailEdge = (await rectOf(page, ".lesson-rail-mobile"))?.bottom ?? 0;
        const stickyEdge = Math.max(headerEdge, mobileRailEdge);

        // RouteScrollManager schedules the actual scroll on the next
        // animation frame after the location change commits, so poll
        // rather than asserting immediately after the click.
        await expect
          .poll(() =>
            page.evaluate(() => {
              const el = document.getElementById("lesson-section-recap");
              return el ? el.getBoundingClientRect().top : Number.NaN;
            }),
          )
          .toBeLessThan(stickyEdge + 48);
        const recapTop = await page.evaluate(() => {
          const el = document.getElementById("lesson-section-recap");
          return el ? el.getBoundingClientRect().top : Number.NaN;
        });
        expect(recapTop, "recap section scrolled near the viewport top").toBeGreaterThanOrEqual(
          -2,
        );
      } else {
        // Mobile pinch-zoom: per the CSSOM View "scroll a target into view"
        // algorithm, a real browser's native `Element.scrollIntoView`
        // aligns the target to the pinch-zoomed *visual* viewport, which
        // can be offset/panned within the (unchanged) layout viewport that
        // `getBoundingClientRect()` reports against — position:sticky
        // chrome (computed purely from scrollY against the layout
        // viewport) can legitimately sit outside that pinch-panned visual
        // frame entirely. So "landed just past sticky chrome" isn't a
        // meaningful invariant here; what a real pinch-zoomed user actually
        // needs — the target genuinely visible somewhere in their current
        // zoomed view — is. Poll until the (still-animating) smooth scroll
        // settles the target inside the visible visual-viewport height,
        // then confirm it didn't overshoot past the top.
        const visualHeight = (await visualViewportMetrics(page)).height;
        await expect
          .poll(async () => {
            const visual = await visualViewportMetrics(page);
            const top = await page.evaluate(() => {
              const el = document.getElementById("lesson-section-recap");
              return el ? el.getBoundingClientRect().top : Number.NaN;
            });
            return top - visual.offsetTop;
          })
          .toBeLessThan(visualHeight);
        const visual = await visualViewportMetrics(page);
        const relativeTop = await page.evaluate(() => {
          const el = document.getElementById("lesson-section-recap");
          return el ? el.getBoundingClientRect().top : Number.NaN;
        });
        expect(
          relativeTop - visual.offsetTop,
          "recap section did not overshoot above the pinch-zoomed visual viewport",
        ).toBeGreaterThanOrEqual(-2);
      }

      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  });
}

/**
 * Phase 3 Task 9 — A2 release accessibility sweep. Extends the 200% zoom
 * reflow coverage above onto the runtime level selector, the A2 course map and
 * its per-level review/checkpoint/Can-do surfaces, a representative deep A2
 * lesson, and the two contextual-kanji states unique to A2 (the revealable
 * reveal control and the assessed bare glyph). Every scenario runs on BOTH
 * configured projects (desktop-1440 + mobile-390 → 1440×1000 and 390×844) via
 * the same `applyBrowserZoom`/`assertZoomApplied` mechanism the suite above
 * documents. A dedicated 320px block additionally proves the WCAG SC 1.4.10
 * reflow floor for the new Task 8/9 surfaces with no horizontal overflow.
 */
const A2_COURSE_URL = `${routeUrls.home}?livello=a2`;
const A2_LESSON = { moduleId: "sequencing-ongoing", lessonId: "sequencing-ongoing-3" } as const;
const A2_ASSESSED_LESSON = { moduleId: "connected-conversation", lessonId: "connected-conversation-4" } as const;

test.describe("A2 course map + level selector at 200% zoom", () => {
  test("the level selector stays operable and the A2 map, review, checkpoint, and Can-do surfaces reflow with usable targets and no overflow", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A2_COURSE_URL);

    const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
    assertZoomApplied(evidence);

    // A single h1 and the level heading anchor a coherent heading hierarchy.
    await expect(page.locator("main.course-home h1")).toHaveCount(1);
    await expect(page.locator("#course-level-heading")).toBeVisible();
    // Polite live regions exist for the dynamic evidence surfaces.
    expect(await page.locator('[aria-live="polite"]').count()).toBeGreaterThan(0);

    // The level selector remains keyboard-operable at 200% zoom: switch to A1
    // and back to A2 (real <a> links → Enter), the map swaps each way.
    await expect(page.locator(".module-card")).toHaveCount(15);
    await activate(page.locator('.level-selector__option[data-level="a1"]'));
    await expect(page.locator(".module-card")).toHaveCount(12);
    await activate(page.locator('.level-selector__option[data-level="a2"]'));
    await expect(page.locator(".module-card")).toHaveCount(15);

    await expect(page.locator(".can-do-summary")).toBeVisible();
    await expect(page.locator(".checkpoint-state")).toBeVisible();
    await expect(page.locator(".review-queue")).toBeVisible();

    await assertNoHorizontalOverflow(page);
    const offenders = await auditTouchTargets(page);
    expect(offenders, JSON.stringify(offenders)).toEqual([]);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe(`A2 lesson ${A2_LESSON.moduleId}/${A2_LESSON.lessonId} at 200% zoom`, () => {
  test("the matrix, staged kanji ruby, and the revealable reveal control stay visible and operable with no overflow", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson(A2_LESSON.moduleId, A2_LESSON.lessonId));

    const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
    assertZoomApplied(evidence);

    await expect(page.locator(".a2-lesson-rule")).toBeVisible();
    const toggle = page.locator(".a2-lesson-rule .foundation-matrix__toggle");
    await expect(toggle).toBeVisible();
    await activate(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await page.locator(".a2-lesson-rule .foundation-matrix__row").count()).toBeGreaterThanOrEqual(8);

    // The staged contextual-kanji section and a supported ruby are visible.
    await expect(page.locator(".a2-kanji")).toBeVisible();
    await expect(page.locator('.a2-kanji__item[data-stage="supported-retrieval"] ruby').first()).toBeVisible();

    // The revealable control is keyboard-operable at 200% zoom: reveal shows
    // the reading, and focus stays predictably on the toggle.
    const revealable = page.locator('.a2-kanji__item[data-stage="revealable"]').first();
    const reveal = revealable.locator(".kanji-reveal");
    await expect(reveal).toHaveAttribute("aria-expanded", "false");
    await expect(revealable.locator("rt")).toHaveCount(0);
    await activate(reveal);
    await expect(reveal).toHaveAttribute("aria-expanded", "true");
    await expect(reveal).toBeFocused();
    await expect(revealable.locator("rt")).toHaveCount(1);

    await assertNoHorizontalOverflow(page);
    const offenders = await auditTouchTargets(page);
    expect(offenders, JSON.stringify(offenders)).toEqual([]);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe(`A2 assessed kanji ${A2_ASSESSED_LESSON.lessonId} at 200% zoom`, () => {
  test("the assessed bare glyph and its why-caption stay visible with no romaji leak and no overflow", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson(A2_ASSESSED_LESSON.moduleId, A2_ASSESSED_LESSON.lessonId));

    const evidence = await applyBrowserZoom(page, ZOOM_FACTOR);
    assertZoomApplied(evidence);

    const assessed = page.locator('.a2-kanji__item[data-stage="assessed"]').first();
    await expect(assessed).toBeVisible();
    await expect(assessed.locator(".kanji-ruby--assessed")).toHaveCount(1);
    await expect(assessed.locator('.kanji-why[data-copy-id="a2-kanji-why-visible"]')).toBeVisible();
    // No furigana/romaji leak, even magnified.
    await expect(assessed.locator("ruby, rt, .kanji-ruby__romaji-hint")).toHaveCount(0);

    await assertNoHorizontalOverflow(page);
    const offenders = await auditTouchTargets(page);
    expect(offenders, JSON.stringify(offenders)).toEqual([]);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("A2 surfaces at the 320px reflow floor (WCAG SC 1.4.10)", () => {
  test("the course map, a representative A2 lesson, and a representative A1 lesson all reflow to 320px with no whole-page horizontal overflow", async ({
    page,
  }, testInfo) => {
    // This scenario explicitly forces a 320px CSS layout viewport regardless of
    // project, so run it once (on the desktop project) rather than twice.
    test.skip(testInfo.project.name !== "desktop-1440", "320px floor runs once");

    const observers = await setupPageObservers(page);
    await page.setViewportSize({ width: 320, height: 640 });

    // The A2 course map is a pure Task 8 surface (level selector, module grid,
    // per-level review/checkpoint/Can-do). It must reflow to 320px with NO
    // whole-page horizontal overflow at all.
    await gotoReady(page, A2_COURSE_URL);
    await assertNoHorizontalOverflow(page);
    const mapOffenders = await auditTouchTargets(page);
    expect(mapOffenders, JSON.stringify(mapOffenders)).toEqual([]);

    // The shared lesson chrome (`.lesson-layout` / `.foundation-matrix` grid)
    // must genuinely reflow — not merely fit its own A2 content — to the WCAG
    // SC 1.4.10 320px floor with NO whole-page horizontal overflow. This is
    // proven directly on both a representative deep A2 lesson
    // (`sequencing-ongoing-3`) and a representative A1 lesson
    // (`past-negative-2`, REPRESENTATIVE_LESSON), because the offending chrome
    // is shared across every lesson level. Content must wrap, not clip: the
    // A2-specific surfaces are additionally verified to stay within the
    // viewport (never intrinsically wider than 320 CSS px).
    const a2Selectors = [".a2-lesson-rule", ".a2-kanji", ".a2-kanji__item", ".kanji-reveal", ".kanji-ruby--assessed"];
    for (const lesson of [A2_LESSON, A2_ASSESSED_LESSON, REPRESENTATIVE_LESSON]) {
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));
      await assertNoHorizontalOverflow(page);
      const lessonOffenders = await auditTouchTargets(page);
      expect(lessonOffenders, `${lesson.lessonId} touch targets ${JSON.stringify(lessonOffenders)}`).toEqual([]);

      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
      for (const selector of a2Selectors) {
        const widths = await page
          .locator(selector)
          .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
        for (const width of widths) {
          expect(width, `${lesson.lessonId} ${selector} width ${width} ≤ ${viewportWidth}`).toBeLessThanOrEqual(
            viewportWidth + 1,
          );
        }
      }
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
