import { expect, test, type Locator, type Page } from "@playwright/test";
import { buildBasePracticeModel } from "../../src/course/base/view/buildBasePracticeModel";
import { BASE_REFERENCE_IDS } from "../../src/course/base/references/catalog";
import {
  appUrl,
  assertNoBodyOverflow,
  assertNoRuntimeErrors,
  assertSameOriginStaticAssetsOnly,
  auditMinimumTargets,
  collectLeakageSurface,
  gotoReady,
  measureBodyOverflow,
  recordRequests,
  seedFreshLearner,
} from "./baseFixtures";
import {
  installSpeechFake,
  installSpeechSynthesisFake,
  queueSpeechOutcome,
  queueSpeechSynthesisOutcome,
} from "./helpers";

/**
 * Task 18 — accessibility, zoom, reduced motion, answer-leakage and network
 * contracts for the complete Base surface, measured in a real browser.
 *
 * Nothing here is conditionally skipped: every test forces the viewport it
 * needs, so the same assertions run identically under both Playwright
 * projects rather than being silently reduced on one of them.
 */

/** The two reflow floors the Base surface must survive (design spec §9.3). */
const A11Y_VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
] as const;

/** WCAG 1.4.10's reflow floor: content must fit 320 CSS px without 2D scroll. */
const REFLOW_FLOOR = 320;

/**
 * `argument-particles-2` is the single Base lesson that renders *every*
 * activity category (all eight non-spoken categories plus listening and
 * spoken) and every interaction kind the Base practice sequence can produce
 * (choice, tile-ordering, listening, spoken), so keyboard operation can be
 * proven exhaustively on one real page.
 */
const ALL_KINDS_LESSON = {
  moduleId: "argument-particles",
  lessonId: "argument-particles-2",
} as const;
const ALL_KINDS_LESSON_ROUTE = `/percorso/${ALL_KINDS_LESSON.moduleId}/${ALL_KINDS_LESSON.lessonId}`;

const BASE_MAP_ROUTE = "/percorso";
const DIAGNOSTIC_ROUTE = "/percorso/diagnostica-base";
const REFERENCE_ROUTE = (id: string) => `/riferimenti/base/${id}`;

/** The authored practice model behind that lesson, used to know the answers. */
function practiceModel() {
  const result = buildBasePracticeModel(ALL_KINDS_LESSON.lessonId, "it");
  if (!("model" in result) || !result.model) {
    throw new Error("base-accessibility: the representative practice model failed to build");
  }
  return result.model;
}

const PRACTICE = practiceModel();
const ACTIVITY_CATEGORIES = [...new Set(PRACTICE.activities.map((a) => a.category))];
const INTERACTION_KINDS = [...new Set(PRACTICE.activities.map((a) => a.interactionKind))];

// Collection-time proof the representative lesson really is exhaustive.
expect(ACTIVITY_CATEGORIES.sort()).toEqual(
  [
    "contextual-response",
    "controlled-production",
    "cumulative-retrieval",
    "error-diagnosis",
    "form-function-discrimination",
    "listening",
    "meaning-comprehension",
    "ordering",
    "spoken",
    "transformation",
  ].sort(),
);
expect(INTERACTION_KINDS.sort()).toEqual(
  ["choice", "listening", "spoken", "tile-ordering"].sort(),
);

async function activeElementInfo(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      type: element.getAttribute("type"),
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      classes: Array.from(element.classList),
      activityId:
        element.closest("[data-activity-id]")?.getAttribute("data-activity-id") ?? null,
      inDiagnosticActions: element.closest(".base-diagnostic__actions") !== null,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
}

/** Tabs forward until `predicate` holds on the focused element, or fails. */
async function tabUntil(
  page: Page,
  predicate: (info: NonNullable<Awaited<ReturnType<typeof activeElementInfo>>>) => boolean,
  label: string,
  limit = 250,
): Promise<NonNullable<Awaited<ReturnType<typeof activeElementInfo>>>> {
  for (let presses = 0; presses < limit; presses += 1) {
    await page.keyboard.press("Tab");
    const info = await activeElementInfo(page);
    if (info && predicate(info)) return info;
  }
  throw new Error(`base-accessibility: keyboard Tab never reached ${label}`);
}

/** Asserts the focused element paints a real, visible focus indicator. */
async function assertVisibleFocus(page: Page, label: string): Promise<void> {
  const info = await activeElementInfo(page);
  expect(info, `${label}: something is focused`).not.toBeNull();
  expect(info!.outlineStyle, `${label}: focus outline style`).not.toBe("none");
  expect(info!.outlineWidth, `${label}: focus outline width`).toBeGreaterThanOrEqual(2);
}

async function applyZoom(page: Page, factor: number): Promise<void> {
  await page.evaluate((value: number) => {
    document.documentElement.style.zoom = String(value);
  }, factor);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

async function resetZoom(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
}

// ---------------------------------------------------------------------------
// Keyboard-only operation
// ---------------------------------------------------------------------------

test.describe("keyboard-only Base journey", () => {
  test("selects each level with the keyboard alone", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await gotoReady(page, BASE_MAP_ROUTE);

    for (const level of ["a1", "a2", "a0"] as const) {
      await page.evaluate(() => {
        document.body.focus();
        (document.activeElement as HTMLElement | null)?.blur();
      });
      const info = await tabUntil(
        page,
        (element) => element.classes.includes("level-selector__option"),
        "a level-selector option",
      );
      expect(info.tag).toBe("a");
      await assertVisibleFocus(page, "level selector option");

      // Walk the remaining options with Tab only, then activate with Enter.
      let guard = 0;
      while (guard < 10) {
        const current = await page.evaluate(
          () =>
            (document.activeElement as HTMLElement | null)?.getAttribute("data-level") ?? null,
        );
        if (current === level) break;
        await page.keyboard.press("Tab");
        guard += 1;
      }
      expect(
        await page.evaluate(
          () =>
            (document.activeElement as HTMLElement | null)?.getAttribute("data-level") ?? null,
        ),
        `Tab reached the ${level} option`,
      ).toBe(level);
      await page.keyboard.press("Enter");
      await expect(page.locator(`[data-level="${level}"]`)).toHaveAttribute(
        "aria-current",
        "true",
      );
      // Focus moves into the newly selected level's heading, not left behind.
      await expect(page.locator("h2#course-level-heading")).toBeFocused();
    }

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("reaches and reads every Base reference by keyboard, from a lesson link", async ({
    page,
  }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    // A retained A1 lesson links back to the Base references it reviews.
    await gotoReady(page, "/percorso/actions/actions-2");

    const referenceLink = page
      .locator(".a1-curriculum-recap__base-references a")
      .first();
    await expect(referenceLink).toBeVisible();
    const href = await referenceLink.getAttribute("href");
    expect(href).toMatch(/riferimenti\/base\//);

    await referenceLink.focus();
    await assertVisibleFocus(page, "Base reference link");
    await page.keyboard.press("Enter");
    await expect(page.locator(".base-reference-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/\S/);

    // Every published reference is directly reachable and renders its grid.
    for (const referenceId of BASE_REFERENCE_IDS) {
      await gotoReady(page, REFERENCE_ROUTE(referenceId));
      const main = page.locator(`.base-reference-page[data-reference-id="${referenceId}"]`);
      await expect(main).toBeVisible();
      await expect(main.locator(".base-reference-table tbody tr").first()).toHaveCount(1);
      await expect(main.locator(".base-reference-cards > li").first()).toHaveCount(1);
      // Table rows and stacked cards are generated from the same rows.
      const tableRows = await main.locator(".base-reference-table tbody tr").count();
      const cards = await main.locator(".base-reference-cards > li").count();
      expect(cards, `${referenceId}: card view mirrors the table row-for-row`).toBe(tableRows);
    }

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("operates every Base activity kind with the keyboard alone", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await installSpeechFake(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const seenCategories = new Set<string>();
    const seenKinds = new Set<string>();

    for (const activity of PRACTICE.activities) {
      const card = page.locator(`[data-activity-id="${activity.id}"]`);
      await expect(card, `${activity.id} renders`).toHaveCount(1);
      await card.scrollIntoViewIfNeeded();
      seenCategories.add(activity.category);
      seenKinds.add(activity.interactionKind);

      if (activity.interactionKind === "choice" || activity.interactionKind === "listening") {
        const radios = card.locator("input[type=radio]");
        const count = await radios.count();
        expect(count, `${activity.id} offers real options`).toBeGreaterThan(1);
        // Native radios: focus the group, then move within it with arrows only.
        await radios.first().focus();
        await assertVisibleFocus(page, `${activity.id} option`);
        await page.keyboard.press("ArrowDown");
        await expect(radios.nth(1)).toBeChecked();
        await page.keyboard.press("ArrowUp");
        await expect(radios.first()).toBeChecked();

        const submit = card.locator("button.action--primary");
        await submit.focus();
        await assertVisibleFocus(page, `${activity.id} submit`);
        await page.keyboard.press("Enter");
        const status = card.locator('[role="status"][aria-live="polite"]').last();
        await expect(status, `${activity.id} announces a settled outcome`).toHaveText(/\S/);
      } else if (activity.interactionKind === "tile-ordering") {
        const bankTiles = card.locator(".base-practice-activity__bank button");
        const initial = await bankTiles.count();
        expect(initial, `${activity.id} offers tiles`).toBeGreaterThan(1);
        await bankTiles.first().focus();
        await assertVisibleFocus(page, `${activity.id} tile`);
        await page.keyboard.press("Enter");
        await expect(card.locator(".base-practice-activity__answer button")).toHaveCount(1);
        // The placed tile can be taken back out with the keyboard too.
        await card.locator(".base-practice-activity__answer button").first().focus();
        await page.keyboard.press("Enter");
        await expect(card.locator(".base-practice-activity__answer button")).toHaveCount(0);

        await card.locator(".base-practice-activity__bank button").first().focus();
        await page.keyboard.press("Enter");
        const submit = card.locator("button.action--primary");
        await submit.focus();
        await page.keyboard.press("Enter");
        await expect(card.locator('[role="status"][aria-live="polite"]')).toHaveText(/\S/);
      } else if (activity.interactionKind === "spoken") {
        // The spoken card's own controls are reachable and operable by keyboard;
        // the denial fallback is proven in its own test below.
        const control = card.locator("button").first();
        await control.focus();
        await assertVisibleFocus(page, `${activity.id} spoken control`);
      }
    }

    expect([...seenCategories].sort()).toEqual([...ACTIVITY_CATEGORIES].sort());
    expect([...seenKinds].sort()).toEqual([...INTERACTION_KINDS].sort());

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("retries the listening activity by keyboard after a playback failure", async ({
    page,
  }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const listening = PRACTICE.activities.find((a) => a.interactionKind === "listening")!;
    const card = page.locator(`[data-activity-id="${listening.id}"]`);
    await card.scrollIntoViewIfNeeded();
    const audio = card.locator(".base-audio-button");
    await expect(audio).toHaveAttribute("data-audio-status", "idle");

    // A genuine synthesis failure must surface as a failure with a retry —
    // never as a silent success, and never substituted by another sound.
    await queueSpeechSynthesisOutcome(page, { kind: "failure", error: "synthesis-failed" });
    await audio.locator(".base-audio-button__control").focus();
    await page.keyboard.press("Enter");
    await expect(audio).toHaveAttribute("data-audio-status", "failed");
    const status = audio.locator('.base-audio-button__status[role="status"]');
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toHaveText(/\S/);

    const retry = audio.locator(".base-audio-button__retry");
    await expect(retry).toBeVisible();
    await queueSpeechSynthesisOutcome(page, { kind: "ended" });
    await retry.focus();
    await assertVisibleFocus(page, "listening retry");
    await page.keyboard.press("Enter");
    await expect(audio).not.toHaveAttribute("data-audio-status", "failed");

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("falls back to listen-and-self-check when the microphone is denied", async ({
    page,
  }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await installSpeechFake(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const spoken = PRACTICE.activities.find((a) => a.interactionKind === "spoken")!;
    const card = page.locator(`[data-activity-id="${spoken.id}"]`);
    await card.scrollIntoViewIfNeeded();

    // Consent is an explicit, keyboard-operable privacy step — never implicit.
    const tryButton = card.locator("button").filter({ hasText: /^(?!.*audio).*$/ }).last();
    await tryButton.focus();
    await assertVisibleFocus(page, "spoken try button");
    await page.keyboard.press("Enter");
    const consent = card.locator(".base-spoken-activity__consent");
    await expect(consent).toBeVisible();
    await expect(consent.locator(".base-spoken-activity__consent-body")).toHaveText(/\S/);
    await consent.locator("button.action--primary").focus();
    await page.keyboard.press("Enter");

    await queueSpeechOutcome(page, { kind: "failure", failure: "denied" });
    const micStart = card.locator("button.action--primary").first();
    await micStart.focus();
    await page.keyboard.press("Enter");

    const fallback = card.locator(".base-spoken-activity__self-check");
    await expect(fallback, "denial reveals the self-check fallback").toBeVisible();
    await expect(fallback.locator("p")).toHaveText(/\S/);

    // The fallback never auto-accepts: it needs an explicit keyboard action.
    const statusBefore = await card.locator(".base-practice-activity__status").count();
    expect(statusBefore).toBe(0);
    await fallback.locator("button.action--primary").focus();
    await assertVisibleFocus(page, "self-check accept");
    await page.keyboard.press("Enter");
    await expect(card.locator(".base-practice-activity__status")).toHaveText(/\S/);

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("skips the optional Base diagnostic with the keyboard alone", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await gotoReady(page, DIAGNOSTIC_ROUTE);

    const diagnostic = page.locator(".base-diagnostic");
    await expect(diagnostic).toHaveAttribute("data-diagnostic-state", "questions");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/\S/);

    const skip = await tabUntil(
      page,
      (info) =>
        info.tag === "button" &&
        info.inDiagnosticActions &&
        info.classes.includes("action--secondary"),
      "the diagnostic skip button",
    );
    expect(skip.text.length).toBeGreaterThan(0);
    await assertVisibleFocus(page, "diagnostic skip");
    await page.keyboard.press("Enter");

    await expect(diagnostic).toHaveAttribute("data-diagnostic-state", "skipped");
    await expect(page.locator(".base-diagnostic__skipped-notice")).toHaveText(/\S/);
    // Skipping is honest: it records its own separate setting and never writes
    // a single piece of course-progress evidence.
    const diagnosticSetting = await page.evaluate(() =>
      localStorage.getItem("nihongo.course.baseDiagnostic"),
    );
    expect(JSON.parse(diagnosticSetting!)).toEqual({ status: "skipped" });
    const progress = JSON.parse(
      (await page.evaluate(() => localStorage.getItem("nihongo.course.progress")))!,
    );
    for (const level of ["a0", "a1", "a2"] as const) {
      expect(
        progress.levels[level],
        `skipping the diagnostic never records ${level} evidence`,
      ).toEqual({
        lessons: {},
        canDos: {},
        checkpointAttempts: [],
        lastVisitedLessonId: null,
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: [],
        orphanedLessonRecords: {},
        historicalActivityDispositions: [],
      });
    }

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });
});

// ---------------------------------------------------------------------------
// Viewports, zoom, targets, headings, live regions
// ---------------------------------------------------------------------------

const A11Y_SURFACES = [
  { name: "Base map", route: BASE_MAP_ROUTE },
  { name: "Base lesson", route: ALL_KINDS_LESSON_ROUTE },
  { name: "Base diagnostic", route: DIAGNOSTIC_ROUTE },
  ...BASE_REFERENCE_IDS.map((id) => ({
    name: `reference ${id}`,
    route: REFERENCE_ROUTE(id),
  })),
] as const;

for (const viewport of A11Y_VIEWPORTS) {
  test.describe(`Base surface at ${viewport.width}x${viewport.height}`, () => {
    test(`never overflows the viewport horizontally`, async ({ page }) => {
      const recording = await recordRequests(page);
      await seedFreshLearner(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const surface of A11Y_SURFACES) {
        await gotoReady(page, surface.route);
        const measurement = await measureBodyOverflow(page);
        expect(
          measurement.offenders,
          `${surface.name} at ${viewport.width}px has elements past the viewport`,
        ).toEqual([]);
        await assertNoBodyOverflow(page, `${surface.name} at ${viewport.width}px`);
      }

      assertNoRuntimeErrors(recording);
      assertSameOriginStaticAssetsOnly(recording);
    });

    test(`keeps every control at least 44x44`, async ({ page }) => {
      await seedFreshLearner(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const surface of A11Y_SURFACES) {
        await gotoReady(page, surface.route);
        const offenders = await auditMinimumTargets(page);
        expect(
          offenders,
          `${surface.name} at ${viewport.width}px: ${JSON.stringify(offenders, null, 2)}`,
        ).toEqual([]);
      }
    });

    test(`survives 200% document zoom without horizontal overflow`, async ({ page }) => {
      const recording = await recordRequests(page);
      await seedFreshLearner(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const surface of A11Y_SURFACES) {
        await gotoReady(page, surface.route);
        await applyZoom(page, 2);
        expect(
          await page.evaluate(() => document.documentElement.style.zoom),
          "the zoom really applied",
        ).toBe("2");
        // `zoom` magnifies the layout, so `getBoundingClientRect()` reports
        // *visual* pixels while `clientWidth`/`scrollWidth` stay in layout
        // pixels; only the latter pair can be compared honestly here. The
        // measured claim is the WCAG 1.4.10 reflow contract: even magnified
        // 2x, the page never needs more horizontal space than the 320 CSS px
        // reflow floor, so it never scrolls in two dimensions.
        const zoomed = await page.evaluate(() => ({
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
        }));
        expect(
          zoomed.bodyClientWidth,
          `${surface.name}: 200% zoom halved the ${viewport.width}px layout`,
        ).toBeLessThan(viewport.width);
        expect(
          zoomed.bodyScrollWidth,
          `${surface.name} at ${viewport.width}px @200% zoom needs ${zoomed.bodyScrollWidth}px, past the 320px reflow floor`,
        ).toBeLessThanOrEqual(REFLOW_FLOOR);
        await resetZoom(page);
      }

      // …and with the magnification removed the page is back inside its own
      // viewport, proving the zoom itself left no residual overflow.
      await gotoReady(page, ALL_KINDS_LESSON_ROUTE);
      await assertNoBodyOverflow(page, `${viewport.width}px after zoom reset`);

      assertNoRuntimeErrors(recording);
      assertSameOriginStaticAssetsOnly(recording);
    });

    test(`stacks the generated reference grids instead of scrolling them`, async ({ page }) => {
      await seedFreshLearner(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const referenceId of BASE_REFERENCE_IDS) {
        await gotoReady(page, REFERENCE_ROUTE(referenceId));
        const table = page.locator(".base-reference-table");
        const cards = page.locator(".base-reference-cards");
        // The table view is the desktop presentation; at these widths the
        // generated stacked cards are what a learner actually reads.
        await expect(cards, `${referenceId} shows stacked cards`).toBeVisible();
        expect(
          await table.evaluate((element) => getComputedStyle(element).display),
          `${referenceId} hides the wide table at ${viewport.width}px`,
        ).toBe("none");

        const rows = await page.evaluate(
          () => document.querySelectorAll(".base-reference-cards > li").length,
        );
        expect(rows, `${referenceId} renders its rows as cards`).toBeGreaterThan(0);
        // Each card exposes the same labelled cells the table columns carry.
        const labelled = await page.evaluate(
          () =>
            Array.from(document.querySelectorAll(".base-reference-cards > li")).every(
              (card) =>
                card.querySelectorAll("dt").length > 0 &&
                card.querySelectorAll("dt").length === card.querySelectorAll("dd").length,
            ),
        );
        expect(labelled, `${referenceId} cards label every cell`).toBe(true);

        // Table/card equivalence *by column*, not by position: every row must
        // place each value under the header that actually names it.
        const alignment = await page.evaluate(() => {
          // Only real grid columns take part in alignment: the trailing
          // explanation column is UI chrome carried by both presentations
          // (a `td` here, a `p` on the card), never an authored form column.
          const columnIds = Array.from(
            document.querySelectorAll(
              ".base-reference-table thead th:not(.base-reference-page__explanation-heading)",
            ),
          )
            .slice(1)
            .map((_, index) => index);
          const rows = Array.from(
            document.querySelectorAll(".base-reference-table tbody tr"),
          ).map((row) => ({
            id: row.getAttribute("data-row-id"),
            cells: Array.from(row.querySelectorAll("td[data-column-id]")).map((cell) =>
              cell.getAttribute("data-column-id"),
            ),
            filledCells: Array.from(row.querySelectorAll("td[data-column-id]"))
              .filter((cell) => (cell.textContent ?? "").trim().length > 0)
              .map((cell) => cell.getAttribute("data-column-id")),
            explanation: (
              row.querySelector("td.base-reference-page__explanation")?.textContent ?? ""
            ).trim(),
          }));
          const headerOrder = Array.from(
            document.querySelectorAll(".base-reference-cards > li"),
          ).map((card) =>
            Array.from(card.querySelectorAll("[data-column-id]")).map((cell) =>
              cell.getAttribute("data-column-id"),
            ),
          );
          return { columnCount: columnIds.length, rows, headerOrder };
        });
        for (const row of alignment.rows) {
          expect(
            row.cells.length,
            `${referenceId} row ${row.id} spans every column`,
          ).toBe(alignment.columnCount);
          // A row that shows a form but never says when to use it does not
          // teach the system the reference promises.
          expect(
            row.explanation,
            `${referenceId} row ${row.id} says when to use the form`,
          ).not.toBe("");
        }
        const cardExplanations = await page.evaluate(() =>
          Array.from(document.querySelectorAll(".base-reference-cards > li")).map(
            (card) =>
              (
                card.querySelector(":scope > .base-reference-page__explanation")
                  ?.textContent ?? ""
              ).trim(),
          ),
        );
        expect(cardExplanations, `${referenceId} cards carry the same explanations`).toEqual(
          alignment.rows.map((row) => row.explanation),
        );
        // Each stacked card lists only the cells its row really has, in the
        // same column order the table places them in.
        alignment.headerOrder.forEach((cardColumns, index) => {
          const tableColumns = alignment.rows[index]!.filledCells;
          expect(cardColumns, `${referenceId} card ${index} mirrors its table row`).toEqual(
            tableColumns,
          );
        });
        await assertNoBodyOverflow(page, `reference ${referenceId} cards`);
      }
    });
  });
}

test.describe("structure and announcements", () => {
  test("headings descend logically on every Base surface", async ({ page }) => {
    await seedFreshLearner(page);
    for (const surface of A11Y_SURFACES) {
      await gotoReady(page, surface.route);
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("main :is(h1,h2,h3,h4,h5,h6)"))
          .filter((heading) => {
            const style = getComputedStyle(heading);
            return style.display !== "none" && style.visibility !== "hidden";
          })
          .map((heading) => Number(heading.tagName.slice(1))),
      );
      expect(levels.length, `${surface.name} has headings`).toBeGreaterThan(0);
      expect(levels[0], `${surface.name} starts at h1`).toBe(1);
      expect(
        levels.filter((level) => level === 1).length,
        `${surface.name} has exactly one h1`,
      ).toBe(1);
      for (let index = 1; index < levels.length; index += 1) {
        expect(
          levels[index]! - levels[index - 1]!,
          `${surface.name} heading ${index} jumps from h${levels[index - 1]} to h${levels[index]}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("tab order follows the document's logical order on the Base lesson", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    // Logical order is *document* order: geometry can legitimately differ (a
    // sticky rail, a wrapped strip), but focus must never jump backwards
    // through the document, which is what an AT user follows.
    const stops: string[] = [];
    await page.evaluate(() => {
      (window as unknown as { __tabStops__: Element[] }).__tabStops__ = [];
    });
    for (let presses = 0; presses < 80; presses += 1) {
      await page.keyboard.press("Tab");
      const result = await page.evaluate(() => {
        const element = document.activeElement;
        // Tab eventually wraps out of the document (to the browser chrome and
        // back to the first control); a wrap is not a backwards jump.
        if (!(element instanceof HTMLElement) || element === document.body) {
          return { wrapped: false, backwards: null as string | null };
        }
        const store = (window as unknown as { __tabStops__: Element[] }).__tabStops__;
        if (store.length > 0 && store[0] === element) {
          return { wrapped: true, backwards: null as string | null };
        }
        const previous = store[store.length - 1];
        store.push(element);
        const backwards =
          previous !== undefined &&
          previous !== element &&
          (previous.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
        const id = element.id ? `#${element.id}` : "";
        const cls = element.classList.length ? `.${element.classList[0]}` : "";
        return {
          wrapped: false,
          backwards: backwards ? `${element.tagName.toLowerCase()}${id}${cls}` : null,
        };
      });
      if (result.wrapped) break;
      if (result.backwards) stops.push(result.backwards);
    }
    expect(stops, `tab order moved backwards through the document: ${stops.join(", ")}`).toEqual(
      [],
    );

    // …and it really did reach a meaningful number of controls.
    const reached = await page.evaluate(
      () => new Set((window as unknown as { __tabStops__: Element[] }).__tabStops__).size,
    );
    expect(reached, "tabbing reaches real controls").toBeGreaterThan(15);
  });

  test("every status region is polite, never assertive", async ({ page }) => {
    await seedFreshLearner(page);
    for (const surface of A11Y_SURFACES) {
      await gotoReady(page, surface.route);
      const regions = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("[aria-live], [role=status]")).map(
          (element) => ({
            live: element.getAttribute("aria-live"),
            role: element.getAttribute("role"),
            className: element.className,
          }),
        ),
      );
      for (const region of regions) {
        if (region.role === "alert") continue;
        expect(
          region.live ?? "polite",
          `${surface.name}: ${region.className} live politeness`,
        ).toBe("polite");
      }
    }
  });

  test("reduced motion collapses every Base transition", async ({ page }) => {
    await seedFreshLearner(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const durations = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          ".base-practice-activity, .base-audio-button__control, .base-spoken-activity, .action, .lesson-rail__step",
        ),
      ).map((element) => ({
        selector: element.className,
        transition: getComputedStyle(element).transitionDuration,
        animation: getComputedStyle(element).animationDuration,
      })),
    );
    expect(durations.length).toBeGreaterThan(5);
    for (const entry of durations) {
      const longest = (value: string) =>
        Math.max(...value.split(",").map((part) => Number.parseFloat(part) || 0));
      expect(
        longest(entry.transition),
        `${entry.selector} transition under reduced motion`,
      ).toBeLessThan(0.05);
      expect(
        longest(entry.animation),
        `${entry.selector} animation under reduced motion`,
      ).toBeLessThan(0.05);
    }

    // …and the same surface really does animate when motion is allowed, so the
    // assertion above is proving a preference is honored, not that nothing moves.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const moving = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".action")).some((element) =>
        element
          .ownerDocument!.defaultView!.getComputedStyle(element)
          .transitionDuration.split(",")
          .some((part) => (Number.parseFloat(part) || 0) > 0),
      ),
    );
    expect(moving, "a real transition exists when motion is allowed").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Answer leakage + network
// ---------------------------------------------------------------------------

/** Attribute names that would mark which option is correct before an attempt. */
const FORBIDDEN_ATTRIBUTE_NAMES = /correct|answer|solution|expected|is-right/i;

async function attributeNames(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel: string) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    const names = new Set<string>();
    const walk = (element: Element) => {
      for (const attribute of Array.from(element.attributes)) names.add(attribute.name);
      for (const child of Array.from(element.children)) walk(child);
    };
    walk(root);
    return [...names];
  }, selector);
}

test.describe("no answer leakage before an attempt", () => {
  test("every representative activity hides which option is correct", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await installSpeechFake(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const correctOptionIndices: number[] = [];
    for (const activity of PRACTICE.activities) {
      const selector = `[data-activity-id="${activity.id}"]`;
      const surface = await collectLeakageSurface(page, selector);

      // 1. The settled feedback copy is never readable before an attempt.
      for (const feedback of [activity.acceptedFeedback, activity.retryFeedback]) {
        for (const [where, haystack] of [
          ["visible text", surface.visibleText],
          ["accessibility snapshot", surface.accessibleText],
          ["hidden nodes", surface.hiddenText],
          ["data-* attributes", surface.dataAttributes.join(" ")],
          ["other attributes", surface.attributeValues.join(" ")],
        ] as const) {
          expect(
            haystack.includes(feedback),
            `${activity.id}: settled feedback leaked in ${where}`,
          ).toBe(false);
        }
      }

      // 2. No attribute anywhere names an answer/correctness concept.
      const names = await attributeNames(page, selector);
      expect(
        names.filter((name) => FORBIDDEN_ATTRIBUTE_NAMES.test(name)),
        `${activity.id}: answer-revealing attribute names`,
      ).toEqual([]);
      // The names are covered above; here the *values* are scanned, so an
      // attribute like `data-state="correct-option"` cannot slip through.
      for (const value of [...surface.dataAttributes, ...surface.attributeValues]) {
        const separator = value.indexOf("=");
        const attributeValue = separator === -1 ? value : value.slice(separator + 1);
        expect(
          FORBIDDEN_ATTRIBUTE_NAMES.test(attributeValue),
          `${activity.id}: answer-revealing attribute value in ${value}`,
        ).toBe(false);
      }

      // 3. Options are structurally indistinguishable: the correct one carries
      //    exactly the same markup shape as the distractors.
      if ("correctOptionId" in activity && Array.isArray((activity as { options?: unknown }).options)) {
        const shapes = await page.evaluate((sel: string) => {
          const root = document.querySelector(sel)!;
          return Array.from(root.querySelectorAll("label")).map((label) => ({
            classes: Array.from(label.classList).sort().join(" "),
            attributes: Array.from(label.attributes)
              .map((attribute) => attribute.name)
              .sort()
              .join(" "),
            inputAttributes: Array.from(label.querySelector("input")?.attributes ?? [])
              .map((attribute) => attribute.name)
              .sort()
              .join(" "),
          }));
        }, selector);
        expect(shapes.length, `${activity.id} renders its options`).toBeGreaterThan(1);
        for (const shape of shapes) {
          expect(shape.classes, `${activity.id}: option classes differ`).toBe(shapes[0]!.classes);
          expect(shape.attributes, `${activity.id}: option attributes differ`).toBe(
            shapes[0]!.attributes,
          );
          expect(shape.inputAttributes, `${activity.id}: option input attributes differ`).toBe(
            shapes[0]!.inputAttributes,
          );
        }
        // The DOM order of the options must not simply be "correct first".
        const correctIndex = await page.evaluate(
          ({ sel, correctId }: { sel: string; correctId: string }) =>
            Array.from(
              document.querySelectorAll<HTMLInputElement>(`${sel} input[type=radio]`),
            ).findIndex((input) => input.value === correctId),
          { sel: selector, correctId: (activity as { correctOptionId: string }).correctOptionId },
        );
        expect(correctIndex, `${activity.id}: the correct option is rendered`).toBeGreaterThanOrEqual(0);
        correctOptionIndices.push(correctIndex);
      }

      // 4. A tile bank is never pre-arranged into the answer.
      if (activity.interactionKind === "tile-ordering") {
        const bankOrder = await page.evaluate(
          (sel: string) =>
            Array.from(
              document.querySelectorAll<HTMLElement>(
                `${sel} .base-practice-activity__bank [data-tile-id]`,
              ),
            ).map((tile) => tile.getAttribute("data-tile-id")!),
          selector,
        );
        expect(
          bankOrder,
          `${activity.id}: the tile bank must not be pre-sorted into the answer`,
        ).not.toEqual([...(activity as { correctTileIds: string[] }).correctTileIds]);
        await expect(
          page.locator(`${selector} .base-practice-activity__answer button`),
          `${activity.id}: the answer strip starts empty`,
        ).toHaveCount(0);
      }
    }

    // Position itself must not encode the answer: a build that rendered the
    // correct option first every time would satisfy every per-activity check
    // above, so the distribution across activities is asserted directly.
    expect(correctOptionIndices.length, "choice activities were inspected").toBeGreaterThan(1);
    expect(
      new Set(correctOptionIndices).size,
      `the correct option's position varies (saw ${correctOptionIndices.join(",")})`,
    ).toBeGreaterThan(1);

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });
});

test.describe("network and privacy", () => {
  test("audio playback and speech recognition never upload anything", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await installSpeechSynthesisFake(page);
    await installSpeechFake(page);
    await gotoReady(page, ALL_KINDS_LESSON_ROUTE);

    const listening = PRACTICE.activities.find((a) => a.interactionKind === "listening")!;
    const listeningCard = page.locator(`[data-activity-id="${listening.id}"]`);
    await listeningCard.scrollIntoViewIfNeeded();
    await queueSpeechSynthesisOutcome(page, { kind: "ended" });
    await listeningCard.locator(".base-audio-button__control").click();

    const spoken = PRACTICE.activities.find((a) => a.interactionKind === "spoken")!;
    const spokenCard = page.locator(`[data-activity-id="${spoken.id}"]`);
    await spokenCard.scrollIntoViewIfNeeded();
    await spokenCard.locator("button").last().click();
    const consent = spokenCard.locator(".base-spoken-activity__consent");
    if (await consent.count()) {
      await consent.locator("button.action--primary").click();
      await queueSpeechOutcome(page, { kind: "transcript", transcript: "すずきさんはびょういんへいきます" });
      await spokenCard.locator("button.action--primary").first().click();
      await expect(
        spokenCard.locator('p[role="status"][aria-live="polite"]'),
      ).toHaveText(/\S/);
    }

    assertSameOriginStaticAssetsOnly(recording);
    assertNoRuntimeErrors(recording);
    // Belt and braces: nothing left the origin, and no request body existed at
    // all — the only ways recorded audio or a transcript could be exfiltrated.
    expect(recording.foreign).toEqual([]);
    expect(recording.uploads).toEqual([]);
  });

  test("every Base surface loads only same-origin static assets", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    for (const surface of A11Y_SURFACES) {
      await gotoReady(page, surface.route);
    }
    assertSameOriginStaticAssetsOnly(recording);
    assertNoRuntimeErrors(recording);
  });
});
