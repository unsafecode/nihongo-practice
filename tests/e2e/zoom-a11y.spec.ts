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
