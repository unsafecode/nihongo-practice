import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  A1_LESSON_MANIFEST,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
} from "../../src/course/a1/manifest";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import { getA1SpokenAttemptModel } from "../../src/course/components/a1SpokenAttemptModel";
import type { ExercisePrompt } from "../../src/course/exercises/types";
import { getCourseCopy } from "../../src/course/i18n/catalog";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  gotoReady,
  headerBottom,
  rectOf,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const INTRODUCTION = { moduleId: "introductions", lessonId: "introductions-1" } as const;
const A1_COURSE_URL = `${routeUrls.home}?livello=a1`;
/**
 * The katakana bridge moved with the Sounds module into Base (Tasks 16-18), so
 * the *retained* A1 lesson that still teaches an authentic katakana loanword
 * (コーヒー) is the everyday-outing capstone; the Base-owned sounds lessons are
 * covered by the Base suites instead.
 */
const KATAKANA_BRIDGE = { moduleId: "capstones", lessonId: "capstones-2" } as const;
const KATAKANA_BRIDGE_WORD = "コーヒー";
const KATAKANA_BRIDGE_ROMAJI = /koohii/i;
/**
 * The retained A1 tile-ordering exercise the keyboard test drives, with the
 * bank's presentation order and the canonical answer both taken straight from
 * the shipped practice model rather than re-typed here.
 */
const TILE_LESSON = { moduleId: "actions", lessonId: "actions-2" } as const;
const TILE_EXERCISE_COPY = getCourseCopy("it").exercises;
const CHECKPOINT_COPY = getCourseCopy("it").checkpoint;

function isMobile(width: number): boolean {
  return width < 700;
}

async function visibleSettings(page: Page): Promise<Locator> {
  const desktop = page.locator(".header__settings--desktop");
  if (await desktop.isVisible()) return desktop;
  await page.locator(".header__settings-trigger").click();
  const drawer = page.locator(".settings-drawer__panel");
  await expect(drawer).toBeVisible();
  return drawer;
}

async function closeMobileSettings(page: Page): Promise<void> {
  const drawer = page.locator(".settings-drawer__panel");
  if (await drawer.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  }
}

async function currentTileExerciseCard(page: Page, visibleFirstTile: string): Promise<Locator> {
  const cards = page
    .locator(".lesson-exercise")
    .filter({
      has: page.getByRole("list", {
        name: TILE_EXERCISE_COPY.bankLabel,
        exact: true,
      }),
    })
    .filter({
      has: page.getByRole("button", {
        name: TILE_EXERCISE_COPY.addTile(visibleFirstTile),
        exact: true,
      }),
    });
  await expect(cards, "the current A1 lesson has one live tile-ordering card").toHaveCount(1);
  const headingId = await cards.getAttribute("aria-labelledby");
  if (!headingId) throw new Error("Tile-ordering card needs an accessible heading reference");
  return page.locator(`.lesson-exercise[aria-labelledby="${headingId}"]`);
}

async function expectActiveControl(page: Page, control: Locator): Promise<void> {
  const id = await control.getAttribute("id");
  if (!id) throw new Error("Tile control needs a stable DOM id");
  await expect(control).toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.id ?? null)).toBe(id);
}

function generatedActivities(lessonId: string) {
  const result = buildA1PracticeModel(lessonId);
  if (!result.ok) throw new Error(`Cannot build ${lessonId} practice: ${result.error.code}`);
  return result.model.activities.flatMap((activity) =>
    activity.generatedExercise ? [activity.generatedExercise] : [],
  );
}

async function answerPrompt(card: Locator, prompt: ExercisePrompt, correct: boolean): Promise<void> {
  if (prompt.kind === "choice") {
    const option = correct
      ? prompt.correctOptionId
      : prompt.options.find((candidate) => candidate.id !== prompt.correctOptionId)?.id;
    if (!option) throw new Error("Choice prompt has no alternative");
    const index = await card.locator("input[type=radio]").evaluateAll((inputs, id) =>
      inputs.findIndex((input) => (input as HTMLInputElement).value === id),
    option);
    expect(index, `choice option ${option}`).toBeGreaterThanOrEqual(0);
    await card.locator("input[type=radio]").nth(index).check();
  } else if (prompt.kind === "tile-ordering") {
    if (correct) {
      for (const tileId of prompt.correctTileIds) {
        const tile = prompt.tiles.find((candidate) => candidate.id === tileId);
        if (!tile) throw new Error(`Missing tile ${tileId}`);
        await card.locator(".lesson-exercise__bank button", { hasText: tile.jp }).first().click();
      }
    } else {
      await card.locator(".lesson-exercise__bank button").first().click();
    }
  } else {
    await card
      .locator(".lesson-exercise__input")
      .fill(correct ? prompt.canonicalAnswer : "__wrong_a1_answer__");
  }
  await card.locator("button[type=submit]").click();
}

test.describe("navigation and settings", () => {
  test("the mobile settings drawer traps focus and restores the trigger", async ({ page }) => {
    // Forces the mobile reference viewport so the overlay contract is measured
    // under both projects rather than conditionally skipped on desktop.
    await page.setViewportSize({ width: 390, height: 844 });
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const trigger = page.locator(".header__settings-trigger");
    await trigger.click();
    const drawer = page.locator(".settings-drawer__panel");
    await expect(drawer).toBeVisible();
    await expect(page.locator("#root")).toHaveAttribute("inert", "");
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest(".settings-drawer__panel"))),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();

    await assertNoRuntimeErrors(page, observers);
  });

  test("push, back, and forward reset document scroll", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    await page.evaluate(() => window.scrollTo(0, 1400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    await page.locator(".course-hero__actions a.action--primary").click();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.goBack();
    await page.locator(".course-home").waitFor({ state: "visible" });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goForward();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await assertNoRuntimeErrors(page, observers);
  });

  test("invalid routes and invalid Lab deep links report a visible warning", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, `${routeUrls.home.replace("#/percorso", "#/not-a-route")}`);
    await expect(page.locator(".notice--warning").first()).toBeVisible();

    await gotoReady(
      page,
      `${routeUrls.lab}?scenario=__bogus__&from=%2Fpercorso%2Fnot-a-real%2Flesson%23explore`,
    );
    await expect(page.locator(".notice--warning").first()).toBeVisible();
    await expect(page.locator(".guided-return")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("the standalone Syllabary deep link focuses its group and returns to the lesson hash", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    const from = `/percorso/sounds/sounds-1#explore`;
    await gotoReady(
      page,
      `${routeUrls.syllabary}?group=gojuon&from=${encodeURIComponent(from)}`,
    );
    const group = page.locator("#syllabary-group-gojuon");
    await expect(group).toBeFocused();
    await expect(group.locator(":is(.kana-grid, .kana-notes)").first()).toBeVisible();
    const header = await headerBottom(page);
    expect((await rectOf(page, "#syllabary-group-gojuon"))!.top).toBeGreaterThanOrEqual(header - 2);

    await page.locator(".syllabary__return").click();
    await page.locator(".lesson-layout").waitFor({ state: "visible" });
    expect(page.url()).toContain("/percorso/sounds/sounds-1#explore");
    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("complete published A1 routes", () => {
  test("the Course map exposes the retained manifest's 44 canonical lesson links in order", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A1_COURSE_URL);

    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
    const disclosures = page.locator(".module-card__disclosure");
    for (let index = 0; index < await disclosures.count(); index += 1) {
      if ((await disclosures.nth(index).getAttribute("aria-expanded")) === "false") {
        await disclosures.nth(index).click();
      }
    }
    const links = await page.locator(".module-card__lesson-link").evaluateAll((items) =>
      items.map((item) => item.getAttribute("href") ?? ""),
    );
    const expected = A1_RETAINED_LESSON_IDS.map((lessonId) => {
      const entry = A1_LESSON_MANIFEST[lessonId];
      return `#/percorso/${entry.moduleId}/${lessonId}`;
    });
    expect(links).toEqual(expected);
    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("legacy same-module and cross-module URLs still resolve with truthful notices", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson("sounds", "sounds-core"));
    expect(page.url()).toBe(routeUrls.lesson("sounds", "sounds-1"));
    await expect(page.locator(".notice--info:has(.notice__dismiss)")).toHaveCount(0);

    await gotoReady(page, routeUrls.lesson("sentence-map", "sentence-order"));
    expect(page.url()).toBe(routeUrls.lesson("introductions", "introductions-1"));
    await expect(page.locator(".notice--info:has(.notice__dismiss)")).toBeVisible();
    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("A1 foundation lesson navigation and current practice", () => {
  test("locale/script settings preserve the katakana bridge vocabulary and all six rail targets", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson(KATAKANA_BRIDGE.moduleId, KATAKANA_BRIDGE.lessonId));

    const coffee = page
      .locator(".a1-vocabulary__item")
      .filter({ has: page.locator(".a1-vocabulary__kana", { hasText: KATAKANA_BRIDGE_WORD }) });
    await expect(coffee).toHaveCount(1);
    await expect(coffee.locator(".a1-vocabulary__romaji")).toContainText(KATAKANA_BRIDGE_ROMAJI);

    let settings = await visibleSettings(page);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await closeMobileSettings(page);
    await expect(page.locator("#lesson-section-vocabulary > h2")).toHaveText(
      getCourseCopy("en").a1Lesson.sections.vocabulary,
    );

    settings = await visibleSettings(page);
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await closeMobileSettings(page);
    await expect(coffee.locator(".a1-vocabulary__kana")).toHaveText(KATAKANA_BRIDGE_WORD);
    await expect(coffee.locator(".a1-vocabulary__romaji")).toContainText(KATAKANA_BRIDGE_ROMAJI);

    const rail = page.locator(".lesson-rail__step:visible, .lesson-rail-mobile__step:visible");
    await expect(rail).toHaveCount(6);
    const recap = rail.last();
    await recap.focus();
    await page.keyboard.press("Enter");
    await expect(recap).toBeFocused();
    await expect
      .poll(() =>
        page.evaluate(() => document.getElementById("lesson-section-recap")?.getBoundingClientRect().top),
      )
      .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("keyboard tile ordering follows focus through moves, removal, and an accepted current A1 answer", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson(TILE_LESSON.moduleId, TILE_LESSON.lessonId));

    // The bank order and the canonical answer come from the shipped practice
    // model, so this test can never drift from what the lesson really renders.
    const tilePrompt = generatedActivities(TILE_LESSON.lessonId)
      .map((exercise) => exercise.prompt)
      .filter((prompt): prompt is Extract<ExercisePrompt, { kind: "tile-ordering" }> =>
        prompt.kind === "tile-ordering",
      )
      .find((prompt) => prompt.tiles.length === 6);
    expect(tilePrompt, `${TILE_LESSON.lessonId} publishes a six-tile ordering exercise`).toBeTruthy();
    const bankOrder = tilePrompt!.tiles.map((tile) => tile.jp);
    const targetOrder = tilePrompt!.correctTileIds.map(
      (tileId) => tilePrompt!.tiles.find((tile) => tile.id === tileId)!.jp,
    );
    expect(new Set(bankOrder).size, "every tile glyph is distinct").toBe(bankOrder.length);

    const card = await currentTileExerciseCard(page, bankOrder[0]!);
    const add = (tile: string) =>
      card.getByRole("button", { name: TILE_EXERCISE_COPY.addTile(tile), exact: true });
    const remove = (tile: string) =>
      card.getByRole("button", { name: TILE_EXERCISE_COPY.removeTile(tile), exact: true });
    const moveBack = (tile: string) =>
      card.getByRole("button", { name: TILE_EXERCISE_COPY.moveTileBack(tile), exact: true });
    const moveForward = (tile: string) =>
      card.getByRole("button", { name: TILE_EXERCISE_COPY.moveTileForward(tile), exact: true });
    const bank = card.getByRole("list", { name: TILE_EXERCISE_COPY.bankLabel, exact: true });
    const answer = card.getByRole("list", { name: TILE_EXERCISE_COPY.answerAreaLabel, exact: true });
    const feedback = card.locator(".lesson-exercise__feedback");
    const placedGlyphs = () =>
      card.locator(".lesson-exercise__placed").evaluateAll((tiles) =>
        tiles.map((tile) =>
          tile.querySelector(".lesson-exercise__glyph-primary")?.textContent?.trim(),
        ),
      );

    // Start with a genuinely wrong tile: the canonical *last* chunk placed
    // first. Focus follows to the next remaining bank control, and the
    // canonical first chunk is never placed or focused as a side effect.
    const lastTile = targetOrder[targetOrder.length - 1]!;
    const firstTile = targetOrder[0]!;
    const nextBankTile = bankOrder.find((tile) => tile !== lastTile)!;
    await add(lastTile).focus();
    await expectActiveControl(page, add(lastTile));
    await page.keyboard.press("Enter");
    await expect(answer).toContainText(lastTile);
    await expect(answer).not.toContainText(firstTile);
    await expectActiveControl(page, add(nextBankTile));
    await expect(add(firstTile)).not.toBeFocused();
    await expect(feedback).toHaveClass("lesson-exercise__feedback");
    await expect(feedback).toBeEmpty();

    // Clear the wrong partial answer before exercising the full keyboard path.
    const clear = card.getByRole("button", { name: TILE_EXERCISE_COPY.clear, exact: true });
    await clear.focus();
    await page.keyboard.press("Enter");
    await expect(bank.getByRole("button")).toHaveCount(bankOrder.length);
    await expect(answer.locator(".lesson-exercise__placed")).toHaveCount(0);
    await expect(feedback).toHaveClass("lesson-exercise__feedback");

    // Place every tile in the bank's own (deliberately not canonical) order.
    for (const tile of bankOrder) {
      const control = add(tile);
      await expect(control).toBeVisible();
      await control.focus();
      await expectActiveControl(page, control);
      await page.keyboard.press("Enter");
    }
    await expect(bank).toBeEmpty();
    // Emptying the bank leaves focus on the last-placed tile's remove control.
    await expectActiveControl(page, remove(bankOrder[bankOrder.length - 1]!));
    expect(await placedGlyphs()).toEqual(bankOrder);

    // Reorder into the canonical answer with the keyboard alone, asserting the
    // focus contract at every step: a move-back leaves focus on the same tile's
    // forward control (and vice versa), so focus always follows the tile.
    let current = [...bankOrder];
    const moveTile = async (tile: string, direction: "back" | "forward") => {
      const control = direction === "back" ? moveBack(tile) : moveForward(tile);
      await control.focus();
      await page.keyboard.press("Enter");
      const index = current.indexOf(tile);
      const nextIndex = direction === "back" ? index - 1 : index + 1;
      current.splice(index, 1);
      current.splice(nextIndex, 0, tile);
      const settled = direction === "back" ? moveForward(tile) : moveBack(tile);
      await expectActiveControl(page, settled);
      expect(await placedGlyphs()).toEqual(current);
    };

    for (const tile of targetOrder) {
      const from = current.indexOf(tile);
      const to = targetOrder.indexOf(tile);
      for (let step = from; step > to; step -= 1) await moveTile(tile, "back");
      for (let step = from; step < to; step += 1) await moveTile(tile, "forward");
    }
    expect(await placedGlyphs()).toEqual(targetOrder);
    // The boundary controls really are disabled at each end.
    await expect(moveBack(targetOrder[0]!)).toBeDisabled();
    await expect(moveForward(lastTile)).toBeDisabled();

    // Removing a focused tile restores focus to its bank control, and keyboard
    // re-addition continues the same non-pointer path.
    const middleTile = targetOrder[2]!;
    await remove(middleTile).focus();
    await page.keyboard.press("Enter");
    await expectActiveControl(page, add(middleTile));
    await page.keyboard.press("Enter");
    await expectActiveControl(page, remove(middleTile));
    current = [...targetOrder.filter((tile) => tile !== middleTile), middleTile];
    expect(await placedGlyphs()).toEqual(current);
    for (let step = current.indexOf(middleTile); step > 2; step -= 1) {
      await moveTile(middleTile, "back");
    }
    expect(await placedGlyphs()).toEqual(targetOrder);

    const submit = card.getByRole("button", { name: TILE_EXERCISE_COPY.submit, exact: true });
    await submit.focus();
    await page.keyboard.press("Enter");
    await expect(card.locator(".lesson-exercise__feedback")).toHaveClass(
      /lesson-exercise__feedback--accepted/,
    );

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("four generated activities plus one spoken attempt give text feedback and preserve a failed review", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.lesson(INTRODUCTION.moduleId, INTRODUCTION.lessonId));

    const exercises = generatedActivities(INTRODUCTION.lessonId);
    await expect(page.locator(".lesson-exercise")).toHaveCount(4);
    await expect(page.locator(".spoken-attempt")).toHaveCount(1);
    const functions = await page
      .locator(".a1-practice-ladder__list > li")
      .evaluateAll((items) => items.map((item) => item.getAttribute("data-practice-function")));
    expect(new Set(functions).size).toBeGreaterThanOrEqual(4);

    const source = exercises[0];
    if (!source) throw new Error("introductions-1 has no generated exercise");
    const card = page.locator(".lesson-exercise").first();
    await answerPrompt(card, source.prompt, false);
    await expect(card.locator(".lesson-exercise__feedback")).toHaveClass(
      /lesson-exercise__feedback--retry/,
    );
    await expect(card.locator(".lesson-exercise__feedback-detail")).toContainText(/\S/);

    await gotoReady(page, routeUrls.practice);
    await expect(page.locator(".review-queue__item")).toHaveCount(1);
    await assertNoHorizontalOverflow(page);
    const reviewTargets = await page.locator(".review-queue button, .review-queue a[href]").evaluateAll(
      (targets) =>
        targets.map((target) => {
          const rect = target.getBoundingClientRect();
          return { text: (target.textContent ?? "").trim(), width: rect.width, height: rect.height };
        }),
    );
    for (const target of reviewTargets) {
      expect(target.width, `${target.text} review target width`).toBeGreaterThanOrEqual(43.5);
      expect(target.height, `${target.text} review target height`).toBeGreaterThanOrEqual(43.5);
    }
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("worked examples and spoken target retain readable romaji without legacy matrix markup", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    const model = getA1SpokenAttemptModel(INTRODUCTION.lessonId, "en");
    if (!model.ok) throw new Error(`Cannot resolve spoken model: ${model.error.code}`);
    await gotoReady(page, routeUrls.lesson(INTRODUCTION.moduleId, INTRODUCTION.lessonId));

    const settings = await visibleSettings(page);
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await closeMobileSettings(page);

    const examples = await page.locator(".a1-worked-examples__romaji").allTextContents();
    expect(examples.length).toBeGreaterThanOrEqual(2);
    for (const example of examples) {
      expect(example.trim()).not.toBe("");
      expect(example).toMatch(/\s/);
    }
    const spoken = await page
      .locator(".spoken-attempt__glyph-primary")
      .allTextContents();
    expect(spoken.join(" ")).toBe(model.model.targetRomaji);
    await expect(page.locator("#lesson-section-rule .foundation-guided, #lesson-section-rule .foundation-matrix")).toHaveCount(0);

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("checkpoint evidence link", () => {
  for (const activation of ["pointer", "keyboard Enter"] as const) {
    test(`${activation} activation reveals and focuses the current A1 Can-do evidence`, async ({
      page,
      viewport,
    }) => {
      const observers = await setupPageObservers(page);
      if (viewport) await page.setViewportSize({ width: viewport.width, height: 420 });
      await gotoReady(page, routeUrls.home);

      expect(
        await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
      ).toBe(true);
      const button = page.getByRole("button", {
        name: CHECKPOINT_COPY.evidenceLink,
        exact: true,
      });
      const target = page.locator("#can-do-summary");
      const route = page.url();
      await expect(button).toBeVisible();

      // Start below the summary so an activation must perform the actual reveal,
      // rather than passing merely because the target happened to be visible.
      await button.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const summary = document.getElementById("can-do-summary");
        if (!summary) return;
        const { bottom } = summary.getBoundingClientRect();
        if (bottom > 0) window.scrollBy(0, bottom + 24);
      });
      expect(
        await target.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        }),
      ).toBe(false);

      if (activation === "pointer") {
        await button.click();
      } else {
        await button.focus();
        await expect(button).toBeFocused();
        await page.keyboard.press("Enter");
      }

      await expect(target).toBeInViewport();
      await expect(target).toBeFocused();
      expect(page.url()).toBe(route);
      await expect(page.locator(".notice--warning")).toHaveCount(0);
      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
    });
  }
});
