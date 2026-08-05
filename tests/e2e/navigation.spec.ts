import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  A1_LESSON_IDS,
  A1_LESSON_MANIFEST,
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
const SOUND_BRIDGE = { moduleId: "sounds", lessonId: "sounds-4" } as const;
const SOUND_BRIDGE_TILE_TARGET = ["レ", "ス", "ト", "ラ", "ン"] as const;
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
  test("the mobile settings drawer traps focus and restores the trigger", async ({ page, viewport }) => {
    test.skip(!viewport || !isMobile(viewport.width), "mobile-only overlay behavior");
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
  test("the Course map exposes the manifest's 48 canonical lesson links in order", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const disclosures = page.locator(".module-card__disclosure");
    for (let index = 0; index < await disclosures.count(); index += 1) {
      if ((await disclosures.nth(index).getAttribute("aria-expanded")) === "false") {
        await disclosures.nth(index).click();
      }
    }
    const links = await page.locator(".module-card__lesson-link").evaluateAll((items) =>
      items.map((item) => item.getAttribute("href") ?? ""),
    );
    const expected = A1_LESSON_IDS.map((lessonId) => {
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
    await gotoReady(page, routeUrls.lesson(SOUND_BRIDGE.moduleId, SOUND_BRIDGE.lessonId));

    const coffee = page
      .locator(".a1-vocabulary__item")
      .filter({ has: page.locator(".a1-vocabulary__kana", { hasText: "コーヒー" }) });
    await expect(coffee).toHaveCount(1);
    await expect(coffee.locator(".a1-vocabulary__romaji")).toContainText(/koohii/i);

    let settings = await visibleSettings(page);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await closeMobileSettings(page);
    await expect(page.locator("#lesson-section-vocabulary > h2")).toHaveText(
      getCourseCopy("en").a1Lesson.sections.vocabulary,
    );

    settings = await visibleSettings(page);
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await closeMobileSettings(page);
    await expect(coffee.locator(".a1-vocabulary__kana")).toHaveText("コーヒー");
    await expect(coffee.locator(".a1-vocabulary__romaji")).toContainText(/koohii/i);

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
    await gotoReady(page, routeUrls.lesson(SOUND_BRIDGE.moduleId, SOUND_BRIDGE.lessonId));

    const rosterItem = page
      .locator(".a1-vocabulary__item")
      .filter({ hasText: "レストラン" });
    await expect(rosterItem, "the target word is visible in the current A1 lesson").toHaveCount(1);
    const card = await currentTileExerciseCard(page, SOUND_BRIDGE_TILE_TARGET[0]);
    const add = (tile: string) =>
      card.getByRole("button", {
        name: TILE_EXERCISE_COPY.addTile(tile),
        exact: true,
      });
    const remove = (tile: string) =>
      card.getByRole("button", {
        name: TILE_EXERCISE_COPY.removeTile(tile),
        exact: true,
      });
    const moveBack = (tile: string) =>
      card.getByRole("button", {
        name: TILE_EXERCISE_COPY.moveTileBack(tile),
        exact: true,
      });
    const moveForward = (tile: string) =>
      card.getByRole("button", {
        name: TILE_EXERCISE_COPY.moveTileForward(tile),
        exact: true,
      });

    // The target word is learner-visible in the current production exercise;
    // this deliberately locates the card by its accessible bank, not card order.
    for (const tile of ["ス", "レ", "ン", "ト", "ラ"] as const) {
      const control = add(tile);
      await expect(control).toBeVisible();
      await control.focus();
      await expectActiveControl(page, control);
      await page.keyboard.press("Enter");
    }
    await expect(card.getByRole("list", { name: TILE_EXERCISE_COPY.bankLabel })).toBeEmpty();
    await expectActiveControl(page, remove("ラ"));

    // Moving a middle tile to the first boundary leaves focus on its enabled
    // forward control; returning it to the middle leaves focus on move-back.
    await moveBack("レ").focus();
    await page.keyboard.press("Enter");
    await expect(moveBack("レ")).toBeDisabled();
    await expectActiveControl(page, moveForward("レ"));
    await page.keyboard.press("Enter");
    await expectActiveControl(page, moveBack("レ"));

    // Moving a middle tile to the last boundary similarly follows the tile.
    await moveForward("ト").focus();
    await page.keyboard.press("Enter");
    await expect(moveForward("ト")).toBeDisabled();
    await expectActiveControl(page, moveBack("ト"));
    await page.keyboard.press("Enter");
    await expectActiveControl(page, moveForward("ト"));

    // Removing a focused tile restores focus to its bank control, then keyboard
    // re-addition can continue the same non-pointer path.
    await remove("ス").focus();
    await page.keyboard.press("Enter");
    await expectActiveControl(page, add("ス"));
    await page.keyboard.press("Enter");
    await expectActiveControl(page, remove("ス"));

    for (let index = 0; index < 3; index += 1) {
      await moveBack("ス").focus();
      await page.keyboard.press("Enter");
      await expectActiveControl(page, moveForward("ス"));
    }
    for (let index = 0; index < 2; index += 1) {
      await moveForward("ン").focus();
      await page.keyboard.press("Enter");
      await expectActiveControl(page, moveBack("ン"));
    }

    expect(
      await card.locator(".lesson-exercise__placed").evaluateAll((tiles) =>
        tiles.map((tile) => tile.querySelector(".lesson-exercise__glyph-primary")?.textContent?.trim()),
      ),
    ).toEqual(SOUND_BRIDGE_TILE_TARGET);

    const submit = card.getByRole("button", {
      name: TILE_EXERCISE_COPY.submit,
      exact: true,
    });
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
