import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  A1_LESSON_MANIFEST,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
} from "../../src/course/a1/manifest";
import { buildA1CurriculumViewModel } from "../../src/course/a1/curriculum/buildA1CurriculumViewModel";
import type { ExercisePrompt } from "../../src/course/exercises/types";
import { opaqueTargetKey } from "../../src/course/foundations/opaqueTargetKey";
import { getCourseCopy } from "../../src/course/i18n/catalog";
import { buildReviewQueueView } from "../../src/course/components/reviewQueueModel";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import { reviewKeyFor } from "../../src/course/progress/reviewQueue";
import { A1_LESSON_SECTION_IDS } from "../../src/routing/lessonSections";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
  gotoReady,
  installSpeechFake,
  installSpeechSynthesisFake,
  queueSpeechSynthesisOutcome,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const IT = getCourseCopy("it");
const EN = getCourseCopy("en");
/**
 * The routes A1 *still owns* after the Base ownership split (Tasks 16-18).
 * The four former Sounds/Foundations modules are published by Base now and are
 * covered by the Base suites (`base-level`/`base-accessibility`), so exercising
 * them here would assert an A1 learning contract against a Base page.
 */
const A1_ROUTE_ENTRIES = A1_RETAINED_LESSON_IDS.map(
  (lessonId) => A1_LESSON_MANIFEST[lessonId],
);
const REPRESENTATIVES = [
  { moduleId: "introductions", lessonId: "introductions-1" },
  { moduleId: "actions", lessonId: "actions-2" },
  { moduleId: "shopping", lessonId: "shopping-4" },
  { moduleId: "capstones", lessonId: "capstones-1" },
] as const;

function curriculumFor(lessonId: string) {
  const result = buildA1CurriculumViewModel(lessonId, "it");
  if (!result.ok) {
    throw new Error(`Cannot build the production curriculum model for ${lessonId}: ${result.error.code}`);
  }
  return result.model;
}

function practiceFor(lessonId: string) {
  const result = buildA1PracticeModel(lessonId);
  if (!result.ok) {
    throw new Error(`Cannot build the production practice model for ${lessonId}: ${result.error.code}`);
  }
  return result.model;
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

async function setLocale(page: Page, locale: "IT" | "EN"): Promise<void> {
  const settings = await visibleSettings(page);
  await settings.locator(".localetoggle button", { hasText: locale }).click();
  await closeMobileSettings(page);
}

async function setScript(page: Page, script: "Hiragana" | "Rōmaji"): Promise<void> {
  const settings = await visibleSettings(page);
  await settings.locator(".scripttoggle button", { hasText: script }).click();
  await closeMobileSettings(page);
}

async function nonEmptyTexts(locator: Locator): Promise<string[]> {
  const values = await locator.allTextContents();
  for (const value of values) {
    expect(value.trim(), "visible learner-facing copy").not.toBe("");
  }
  return values.map((value) => value.trim());
}

async function assertA1SectionContract(page: Page): Promise<void> {
  const sections = page.locator(".lesson-sections > section.lesson-section");
  const actual = await sections.evaluateAll((nodes) =>
    nodes.map((section) => ({
      id: section.id,
      labelledBy: section.getAttribute("aria-labelledby"),
      heading: section.querySelector("h2")?.id ?? null,
    })),
  );
  const expected = A1_LESSON_SECTION_IDS.map((sectionId) => ({
    id: `lesson-section-${sectionId}`,
    labelledBy: `lesson-section-${sectionId}-heading`,
    heading: `lesson-section-${sectionId}-heading`,
  }));
  expect(actual, "the six labelled A1 section regions stay in curriculum order").toEqual(expected);
  await expect(page.locator(".lesson-main > .lesson-header > h1")).toHaveCount(1);
}

async function assertNoJapaneseDataAttributes(page: Page): Promise<void> {
  const offenders = await page.locator(".lesson-layout *").evaluateAll((elements) => {
    const bad: Array<{ name: string; value: string }> = [];
    const japanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;
    for (const element of elements) {
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name.startsWith("data-") && japanese.test(attribute.value)) {
          bad.push({ name: attribute.name, value: attribute.value });
        }
      }
    }
    return bad;
  });
  expect(offenders, "A1 data attributes never expose raw Japanese targets").toEqual([]);
}

async function assertCurriculumRoute(page: Page, lessonId: string): Promise<void> {
  const entry = A1_LESSON_MANIFEST[lessonId];
  const model = curriculumFor(lessonId);

  await assertA1SectionContract(page);
  await expect(page.locator(".lesson-main .notice--warning")).toHaveCount(0);

  const overview = page.locator(".a1-lesson-overview");
  await expect(overview).toBeVisible();
  await expect(overview.locator(".a1-lesson-overview__details > div")).toHaveCount(2);
  await nonEmptyTexts(overview.locator(".a1-lesson-overview__details dt, .a1-lesson-overview__details dd"));
  await expect(overview.locator(".a1-lesson-overview__prerequisites")).toBeVisible();
  await expect(overview.locator(".a1-lesson-overview__prerequisites h3")).toBeVisible();

  const vocabulary = page.locator(".a1-vocabulary");
  const vocabularyItems = vocabulary.locator(".a1-vocabulary__item");
  await expect(vocabulary).toBeVisible();
  if (entry.contract === "synthesis") {
    await expect(vocabulary).toHaveAttribute("data-vocabulary-mode", "review");
    expect(await vocabularyItems.count(), "capstone review vocabulary").toBeGreaterThanOrEqual(4);
    await expect(vocabulary.locator(".a1-vocabulary__review-badge")).toBeVisible();
    await expect(vocabulary.locator(".a1-vocabulary__exception")).toBeVisible();
  } else {
    await expect(vocabulary).toHaveAttribute("data-vocabulary-mode", "new");
    expect(await vocabularyItems.count(), "new vocabulary on non-capstones").toBeGreaterThanOrEqual(4);
    expect(await vocabularyItems.count(), "new vocabulary on non-capstones").toBeLessThanOrEqual(6);
    await expect(vocabulary.locator(".a1-vocabulary__review-badge")).toHaveCount(0);
  }
  await nonEmptyTexts(vocabulary.locator(".a1-vocabulary__meaning"));

  const note = page.locator(".a1-learning-note");
  await expect(note).toBeVisible();
  await expect(note).toHaveAttribute("data-note-kind", /\S/);
  expect(await note.locator(".a1-learning-note__fields > div").count()).toBeGreaterThanOrEqual(4);
  await nonEmptyTexts(note.locator(".a1-learning-note__fields dt, .a1-learning-note__fields dd"));
  const patternTokens = note.locator(".a1-learning-note__pattern li[data-pattern-kind]");
  expect(await patternTokens.count(), "labelled pattern chips").toBeGreaterThan(0);
  await nonEmptyTexts(patternTokens.locator(".a1-learning-note__pattern-label"));

  const examples = page.locator(".a1-worked-examples__list > li > .a1-worked-examples__card");
  expect(await examples.count(), "worked examples").toBeGreaterThanOrEqual(2);
  expect(await examples.count(), "worked examples").toBeLessThanOrEqual(3);
  let lexicalGlosses = 0;
  for (let index = 0; index < await examples.count(); index += 1) {
    const example = examples.nth(index);
    await expect(example.locator(".a1-worked-examples__japanese")).toBeVisible();
    await expect(example.locator(".a1-worked-examples__romaji")).toBeVisible();
    await expect(example.locator(".a1-worked-examples__glosses [data-token-role='lexeme']").first()).toBeVisible();
    lexicalGlosses += await example
      .locator(".a1-worked-examples__glosses [data-token-role='lexeme'] .a1-worked-examples__gloss")
      .count();
    await expect(example.locator(".a1-worked-examples__translation")).toContainText(/\S/);
    await expect(example.locator(".a1-audio-button__control")).toBeVisible();
  }
  if (entry.contract === "phonetic") {
    // A mora-only example has an explicit lexical role plus its natural
    // pronunciation/contrast translation, but no fabricated lexical gloss.
    expect(
      await page.locator(".a1-worked-examples__glosses [data-token-role='lexeme']").count(),
      "phonetic examples retain their word-role label",
    ).toBeGreaterThanOrEqual(await examples.count());
  } else {
    expect(
      lexicalGlosses,
      "semantic worked examples include visible word glosses alongside natural translations",
    ).toBeGreaterThanOrEqual(await examples.count());
  }

  const optionalPattern = page.locator(".a1-worked-examples > details.a1-worked-examples__pattern");
  await expect(optionalPattern).toHaveCount(model.optionalPattern ? 1 : 0);
  if (model.optionalPattern) {
    await expect(optionalPattern.locator("summary")).toBeVisible();
    expect(await optionalPattern.evaluate((element) => element.hasAttribute("open"))).toBe(false);
    const order = await page.locator(".a1-worked-examples").evaluate((root) => [
      [...root.children].findIndex((child) => child.matches("ol.a1-worked-examples__list")),
      [...root.children].findIndex((child) => child.matches("details.a1-worked-examples__pattern")),
    ]);
    expect(order[1], "optional pattern follows the examples").toBeGreaterThan(order[0]);
  }
  const dialogue = page.locator(".a1-worked-examples__dialogue");
  await expect(dialogue).toHaveCount(model.dialogue ? 1 : 0);
  if (model.dialogue) {
    await expect(dialogue.locator(".a1-worked-examples__turn")).toHaveCount(
      model.dialogue.length,
    );
    await nonEmptyTexts(
      dialogue.locator(
        ".a1-worked-examples__japanese, .a1-worked-examples__romaji, .a1-worked-examples__translation",
      ),
    );
  }
  await expect(page.locator("#lesson-section-rule .foundation-matrix")).toHaveCount(0);

  const activities = page.locator(".a1-practice-ladder__list > li");
  await expect(page.locator(".lesson-exercise")).toHaveCount(4);
  await expect(page.locator(".spoken-attempt")).toHaveCount(1);
  await expect(activities).toHaveCount(5);
  const functions = await activities.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-practice-function") ?? ""),
  );
  expect(functions.every(Boolean), "every activity exposes its pedagogical function").toBe(true);
  expect(new Set(functions).size, "practice function variety").toBeGreaterThanOrEqual(4);
  expect(functions).toEqual(
    expect.arrayContaining([
      "meaning-comprehension",
      "form-discrimination",
      "controlled-production",
      "listening-speaking",
    ]),
  );
  for (let index = 1; index < functions.length; index += 1) {
    expect(functions[index], "adjacent activities must have distinct functions").not.toBe(
      functions[index - 1],
    );
  }

  const keys = await page
    .locator(".lesson-exercise")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-visible-target-key") ?? ""));
  expect(keys).toHaveLength(4);
  expect(new Set(keys).size, "four generated cards have distinct visible targets").toBe(4);
  for (const key of keys) {
    expect(key, "visible target key is opaque").toMatch(/^k[0-9a-z]+$/);
  }
  await assertNoJapaneseDataAttributes(page);

  const recap = page.locator(".a1-curriculum-recap");
  await expect(recap.locator(".a1-curriculum-recap__cue")).toBeVisible();
  await nonEmptyTexts(recap.locator(".a1-curriculum-recap__cue h3, .a1-curriculum-recap__cue p"));
  expect(await recap.locator(".a1-curriculum-recap__vocabulary li").count()).toBeGreaterThanOrEqual(
    entry.contract === "synthesis" ? 4 : 1,
  );
  await nonEmptyTexts(recap.locator(".a1-curriculum-recap__vocabulary li p"));
}

function attemptActivity(lessonId: string) {
  const generated = practiceFor(lessonId).activities.filter(
    (activity) => activity.generatedExercise !== undefined,
  );
  const index = generated.findIndex(
    (activity) =>
      activity.generatedExercise?.prompt.kind === "choice" ||
      activity.generatedExercise?.prompt.kind === "completion" ||
      activity.generatedExercise?.prompt.kind === "transformation" ||
      activity.generatedExercise?.prompt.kind === "constrained-construction",
  );
  if (index === -1) throw new Error(`${lessonId} has no generated form or choice activity`);
  const activity = generated[index];
  if (!activity.generatedExercise) {
    throw new Error(`${lessonId} practice activity is malformed`);
  }
  return { index, prompt: activity.generatedExercise.prompt, exercise: activity.generatedExercise };
}

async function chooseRadio(card: Locator, optionId: string): Promise<void> {
  const optionIndex = await card.locator("input[type=radio]").evaluateAll((inputs, id) =>
    inputs.findIndex((input) => (input as HTMLInputElement).value === id),
  optionId);
  expect(optionIndex, `radio option ${optionId} is rendered`).toBeGreaterThanOrEqual(0);
  await card.locator("input[type=radio]").nth(optionIndex).check();
}

async function submitWrongPrompt(card: Locator, prompt: ExercisePrompt): Promise<void> {
  if (prompt.kind === "choice") {
    const wrong = prompt.options.find((option) => option.id !== prompt.correctOptionId);
    if (!wrong) throw new Error("Choice prompt has no wrong option");
    await chooseRadio(card, wrong.id);
  } else if (prompt.kind === "tile-ordering") {
    await card.locator(".lesson-exercise__bank button").first().click();
  } else {
    await card.locator(".lesson-exercise__input").fill("__not_a_valid_answer__");
  }
  const submit = card.locator("button[type=submit]");
  await submit.focus();
  await card.page().keyboard.press("Enter");
  await expect(card.locator(".lesson-exercise__feedback")).toHaveClass(
    /lesson-exercise__feedback--retry/,
  );
}

async function fillCorrectPrompt(card: Locator, prompt: ExercisePrompt): Promise<void> {
  if (prompt.kind === "choice") {
    await chooseRadio(card, prompt.correctOptionId);
  } else if (prompt.kind === "tile-ordering") {
    for (const tileId of prompt.correctTileIds) {
      const tile = prompt.tiles.find((candidate) => candidate.id === tileId);
      if (!tile) throw new Error(`Missing tile ${tileId}`);
      await card.locator(".lesson-exercise__bank button", { hasText: tile.jp }).first().click();
    }
  } else {
    await card.locator(".lesson-exercise__input").fill(prompt.canonicalAnswer);
  }
}

async function submitCorrectPrompt(card: Locator, prompt: ExercisePrompt): Promise<void> {
  await fillCorrectPrompt(card, prompt);
  await card.locator("button[type=submit]").click();
  await expect(card.locator(".lesson-exercise__feedback")).toHaveClass(
    /lesson-exercise__feedback--accepted/,
  );
}

function reviewScenario(lessonId: string) {
  const exercises = practiceFor(lessonId).activities.flatMap((activity) =>
    activity.generatedExercise ? [activity.generatedExercise] : [],
  );
  for (const source of exercises) {
    // A one-tile answer to a multi-tile ordering task is intentionally
    // structurally invalid, so it cannot create review evidence. Select a
    // choice/text task where this test can submit a valid-but-wrong answer.
    if (source.prompt.kind === "tile-ordering") continue;
    const view = buildReviewQueueView({
      reviewQueue: [
        {
          reviewKey: reviewKeyFor(lessonId, source.definitionId),
          lessonId,
          exerciseDefinitionId: source.definitionId,
          targetConceptIds: [...source.prompt.assessedConceptIds],
          targetLexemeIds: [...source.prompt.assessedLexemeIds],
          mistakeCount: 1,
          lastMistakeAt: "2026-08-05T00:00:00.000Z",
        },
      ],
      orphanedReviewKeys: [],
    });
    const alternate = view.items[0];
    if (alternate) {
      return { source, alternate };
    }
  }
  throw new Error(`${lessonId} has no reviewable alternate`);
}

async function assertRailScroll(page: Page, sectionId: string): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate((id) => {
        const section = document.getElementById(`lesson-section-${id}`);
        return section?.getBoundingClientRect().top ?? Number.NaN;
      }, sectionId),
    )
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
}

test.describe("A1 foundations curriculum — exhaustive production routes", () => {
  test.skip(
    ({ viewport }) => !viewport || viewport.width < 700,
    "the retained 44-route contract runs once on desktop",
  );

  test("imports the complete retained 11-module / 44-route A1 manifest before exercising it", () => {
    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_ROUTE_ENTRIES).toHaveLength(44);
    expect(new Set(A1_ROUTE_ENTRIES.map((entry) => entry.lessonId)).size).toBe(44);
    expect(A1_ROUTE_ENTRIES.map((entry) => entry.moduleId)).toEqual(
      A1_RETAINED_MODULE_IDS.flatMap((moduleId) => Array.from({ length: 4 }, () => moduleId)),
    );
  });

  for (const entry of A1_ROUTE_ENTRIES) {
    test(`${entry.moduleId}/${entry.lessonId}: six-section A1 learning contract`, async ({ page }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(entry.moduleId, entry.lessonId));

      await assertCurriculumRoute(page, entry.lessonId);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  }
});

test.describe("A1 foundations curriculum — representative learner behavior", () => {
  for (const lesson of REPRESENTATIVES) {
    const url = routeUrls.lesson(lesson.moduleId, lesson.lessonId);

    test(`${lesson.lessonId}: meanings, localized explanatory copy, and script surfaces remain usable`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const vocabulary = page.locator(".a1-vocabulary");
      const meaningToggle = vocabulary.locator(".a1-vocabulary__meaning-toggle");
      const beforeVocabulary = await vocabulary.locator(".a1-vocabulary__item").evaluateAll((items) =>
        items.map((item) => ({
          kana: item.querySelector(".a1-vocabulary__kana")?.textContent?.trim() ?? "",
          romaji: item.querySelector(".a1-vocabulary__romaji")?.textContent?.trim() ?? "",
          meaning: item.querySelector(".a1-vocabulary__meaning")?.textContent?.trim() ?? "",
        })),
      );
      expect(beforeVocabulary.every((item) => item.kana && item.romaji && item.meaning)).toBe(true);

      await meaningToggle.focus();
      await page.keyboard.press("Enter");
      await expect(vocabulary.locator(".a1-vocabulary__meaning")).toHaveText(
        Array.from({ length: beforeVocabulary.length }, () => ""),
      );
      await meaningToggle.click();
      await nonEmptyTexts(vocabulary.locator(".a1-vocabulary__meaning"));

      const beforeSections = await page
        .locator(".lesson-sections > section")
        .evaluateAll((sections) => sections.map((section) => section.id));
      const beforeKeys = await page
        .locator(".lesson-exercise")
        .evaluateAll((cards) => cards.map((card) => card.getAttribute("data-visible-target-key")));
      const beforeExamples = await page
        .locator(".a1-worked-examples__list > li > .a1-worked-examples__card")
        .evaluateAll((cards) =>
          cards.map((card) => ({
            japanese: card.querySelector(".a1-worked-examples__japanese")?.textContent?.trim() ?? "",
            romaji: card.querySelector(".a1-worked-examples__romaji")?.textContent?.trim() ?? "",
          })),
        );

      await setLocale(page, "EN");
      await expect(page.locator("#lesson-section-rule > h2")).toHaveText(EN.a1Lesson.sections.rule);
      await expect(page.locator("#lesson-section-vocabulary > h2")).toHaveText(
        EN.a1Lesson.sections.vocabulary,
      );
      await expect(page.locator("#lesson-section-grammar > h2")).toHaveText(EN.a1Lesson.sections.grammar);
      await expect(page.locator("#lesson-section-comparison > h2")).toHaveText(
        EN.a1Lesson.sections.comparison,
      );
      await expect(page.locator("#lesson-section-explore > h2")).toHaveText(EN.a1Lesson.sections.explore);
      await expect(page.locator("#lesson-section-recap > h2")).toHaveText(EN.a1Lesson.sections.recap);
      await expect(vocabulary.locator(".a1-vocabulary__metadata dt").nth(1)).toHaveText(
        EN.a1Lesson.vocabulary.meaningLabel,
      );
      await expect(page.locator(".a1-learning-note__fields dt").first()).toHaveText(
        EN.a1Lesson.learningNote.meaningLabel,
      );
      await expect(page.locator(".a1-worked-examples__translation").first()).toContainText(
        EN.a1Lesson.examples.translationLabel,
      );
      await expect(page.locator(".a1-practice-ladder__head h3")).toHaveText(EN.exercises.heading);
      await expect(page.locator(".a1-curriculum-recap__cue h3")).toHaveText(
        EN.a1Lesson.recap.retrievalCueLabel,
      );

      expect(
        await page.locator(".lesson-sections > section").evaluateAll((sections) => sections.map((section) => section.id)),
      ).toEqual(beforeSections);
      expect(
        await page.locator(".lesson-exercise").evaluateAll((cards) =>
          cards.map((card) => card.getAttribute("data-visible-target-key")),
        ),
      ).toEqual(beforeKeys);
      expect(
        await page
          .locator(".a1-worked-examples__list > li > .a1-worked-examples__card")
          .evaluateAll((cards) =>
            cards.map((card) => ({
              japanese: card.querySelector(".a1-worked-examples__japanese")?.textContent?.trim() ?? "",
              romaji: card.querySelector(".a1-worked-examples__romaji")?.textContent?.trim() ?? "",
            })),
          ),
      ).toEqual(beforeExamples);

      await setScript(page, "Rōmaji");
      await nonEmptyTexts(vocabulary.locator(".a1-vocabulary__meaning"));
      expect(
        await vocabulary.locator(".a1-vocabulary__item").evaluateAll((items) =>
          items.map((item) => ({
            kana: item.querySelector(".a1-vocabulary__kana")?.textContent?.trim() ?? "",
            romaji: item.querySelector(".a1-vocabulary__romaji")?.textContent?.trim() ?? "",
          })),
        ),
      ).toEqual(beforeVocabulary.map(({ kana, romaji }) => ({ kana, romaji })));

      const optional = page.locator(".a1-worked-examples__pattern");
      if (await optional.count()) {
        await optional.locator("summary").click();
        await expect(optional.locator(".foundation-matrix__romaji").first()).toBeVisible();
        await expect(optional.locator(".foundation-matrix__jp")).toHaveCount(0);
      }
      await setScript(page, "Hiragana");
      if (await optional.count()) {
        await expect(optional.locator(".foundation-matrix__jp").first()).toBeVisible();
      }

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    test(`${lesson.lessonId}: audio controls and practice feedback report real state without focus theft`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await installSpeechFake(page);
      await installSpeechSynthesisFake(page);
      await gotoReady(page, url);

      const audioControls = page.locator(".a1-audio-button__control");
      expect(await audioControls.count(), "word and example playback controls").toBeGreaterThanOrEqual(6);
      for (let index = 0; index < await audioControls.count(); index += 1) {
        const control = audioControls.nth(index);
        await queueSpeechSynthesisOutcome(page, { kind: "playing" });
        if (index % 2 === 0) {
          await control.click();
        } else {
          await control.focus();
          await page.keyboard.press("Enter");
        }
        const status = control.locator("xpath=following-sibling::*[@role='status']");
        await expect(status).toHaveText(IT.a1Lesson.audio.playing);
        await expect(control).toHaveText(IT.a1Lesson.audio.playing);
      }

      const firstAudio = audioControls.first();
      await queueSpeechSynthesisOutcome(page, { kind: "failure", error: "synthesis-failed" });
      await firstAudio.click();
      await expect(firstAudio.locator("xpath=following-sibling::*[@role='status']")).toHaveText(
        IT.a1Lesson.audio.failed,
      );
      await expect(firstAudio).toBeEnabled();
      await queueSpeechSynthesisOutcome(page, { kind: "ended" });
      await firstAudio.click();
      await expect(firstAudio.locator("xpath=following-sibling::*[@role='status']")).toHaveText("");
      await expect(firstAudio).toHaveText(IT.a1Lesson.audio.play);

      const attempt = attemptActivity(lesson.lessonId);
      const card = page.locator(".lesson-exercise").nth(attempt.index);
      await submitWrongPrompt(card, attempt.prompt);
      const submit = card.locator("button[type=submit]");
      await expect(submit).toBeFocused();
      await expect(card.locator(".lesson-exercise__feedback")).toHaveAttribute("aria-live", "polite");
      await expect(card.locator(".lesson-exercise__feedback-detail")).toContainText(/\S/);

      await submitCorrectPrompt(card, attempt.prompt);
      await expect(submit).toBeFocused();
      await expect(card.locator(".lesson-exercise__feedback-detail")).toContainText(/\S/);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    test(`${lesson.lessonId}: a live failed attempt survives into review and resolves its original key`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const scenario = reviewScenario(lesson.lessonId);
      const generated = practiceFor(lesson.lessonId).activities.filter(
        (activity) => activity.generatedExercise !== undefined,
      );
      const sourceIndex = generated.findIndex(
        (activity) => activity.generatedExercise?.definitionId === scenario.source.definitionId,
      );
      expect(sourceIndex).toBeGreaterThanOrEqual(0);
      const sourceCard = page.locator(".lesson-exercise").nth(sourceIndex);
      await submitWrongPrompt(sourceCard, scenario.source.prompt);

      const storedAfterFailure = await page.evaluate(() => {
        const value = localStorage.getItem("nihongo.course.progress");
        return value ? JSON.parse(value) : null;
      });
      expect(storedAfterFailure.levels.a1.reviewQueue).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reviewKey: reviewKeyFor(lesson.lessonId, scenario.source.definitionId),
            exerciseDefinitionId: scenario.source.definitionId,
          }),
        ]),
      );

      expect(scenario.alternate.exerciseDefinitionId).not.toBe(scenario.source.definitionId);
      expect(scenario.alternate.practiceFunction).not.toBe(scenario.source.practiceFunction);
      expect(scenario.alternate.visibleTargetKey).not.toBe(scenario.source.visibleTargetKey);

      await gotoReady(page, routeUrls.home);
      const queueItem = page.locator(".review-queue__item");
      await expect(queueItem).toHaveCount(1);
      await expect(queueItem.locator(".review-queue__varied-task")).toBeVisible();
      await expect(queueItem.locator(".review-queue__practice-function")).toHaveAttribute(
        "data-practice-function",
        scenario.alternate.practiceFunction ?? "",
      );
      await queueItem.getByRole("button", { name: IT.review.practice, exact: true }).click();
      const reviewCard = queueItem.locator(".lesson-exercise");
      await expect(reviewCard).toHaveAttribute(
        "data-visible-target-key",
        opaqueTargetKey(scenario.alternate.visibleTargetKey),
      );
      expect(
        await reviewCard.getAttribute("data-visible-target-key"),
        "the review card must not reuse the failed source target",
      ).not.toBe(opaqueTargetKey(scenario.source.visibleTargetKey));

      await fillCorrectPrompt(reviewCard, scenario.alternate.prompt);
      await reviewCard.locator("button[type=submit]").click();
      await expect(page.locator(".review-queue__item")).toHaveCount(0);
      const storedAfterAcceptance = await page.evaluate(() => {
        const value = localStorage.getItem("nihongo.course.progress");
        return value ? JSON.parse(value) : null;
      });
      expect(storedAfterAcceptance.levels.a1.reviewQueue).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reviewKey: reviewKeyFor(lesson.lessonId, scenario.source.definitionId),
          }),
        ]),
      );

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    test(`${lesson.lessonId}: unsupported speech is nonblocking and v3 visit evidence persists across reload`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await installSpeechFake(page, { supported: false });
      await gotoReady(page, url);

      const spoken = page.locator(".spoken-attempt");
      await expect(spoken).toBeVisible();
      await expect(spoken.locator(".spoken-attempt__fallback")).toBeVisible();
      await expect(page.locator(".lesson-exercise")).toHaveCount(4);
      await expect(page.locator(".a1-practice-ladder__status")).toHaveAttribute("data-state", "visited");

      const beforeReload = await page.evaluate(() => localStorage.getItem("nihongo.course.progress"));
      expect(beforeReload).not.toBeNull();
      const parsed = JSON.parse(beforeReload!);
      expect(parsed.catalogVersion).toBe("base-a1-a2-v1");
      expect(parsed.levels.a1.lessons[lesson.lessonId].visitedAt).toMatch(/\S/);
      await page.addInitScript((stored: string) => {
        localStorage.setItem("nihongo.course.progress", stored);
      }, beforeReload!);
      await page.reload({ waitUntil: "load" });
      await page.locator("#root >> main").first().waitFor({ state: "visible" });
      await expect(page.locator(".a1-practice-ladder__status")).toHaveAttribute("data-state", "visited");

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    test(`${lesson.lessonId}: six rail links work by pointer and keyboard with legacy and new hashes`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const links = page.locator(".lesson-rail__step:visible, .lesson-rail-mobile__step:visible");
      await expect(links).toHaveCount(6);
      const grammar = links.filter({ has: page.locator("[class$='__label']", { hasText: IT.a1Lesson.sections.grammar }) });
      await expect(grammar).toHaveCount(1);
      await grammar.click();
      await expect(grammar).toBeFocused();
      await assertRailScroll(page, "grammar");

      const vocabulary = links.filter({ has: page.locator("[class$='__label']", { hasText: IT.a1Lesson.sections.vocabulary }) });
      await expect(vocabulary).toHaveCount(1);
      await vocabulary.focus();
      await page.keyboard.press("Enter");
      await expect(vocabulary).toBeFocused();
      await assertRailScroll(page, "vocabulary");

      for (const sectionId of ["rule", "comparison", "explore", "recap", "vocabulary", "grammar"]) {
        await gotoReady(page, `${url}#${sectionId}`);
        await expect(page.locator(`#lesson-section-${sectionId}`)).toBeVisible();
        await assertRailScroll(page, sectionId);
      }

      await assertNoHorizontalOverflow(page);
      expect(await auditTouchTargets(page)).toEqual([]);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  }
});

test.describe("A1 foundations curriculum — localized combinations", () => {
  for (const lesson of REPRESENTATIVES) {
    test(`${lesson.lessonId}: English/Italian and hiragana/rōmaji have no blank explanatory copy`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));

      for (const locale of ["IT", "EN"] as const) {
        await setLocale(page, locale);
        for (const script of ["Hiragana", "Rōmaji"] as const) {
          await setScript(page, script);
          await nonEmptyTexts(
            page.locator(
              [
                ".lesson-section__landmark",
                ".a1-lesson-overview dt",
                ".a1-vocabulary h3",
                ".a1-learning-note h3",
                ".a1-learning-note__pattern-label",
                ".a1-worked-examples__translation",
                ".a1-practice-ladder__function",
                ".a1-curriculum-recap h3",
              ].join(", "),
            ),
          );
          expect(
            await page.locator(".a1-vocabulary__kana").count(),
            "vocabulary retains Japanese alongside its selected script surface",
          ).toBeGreaterThan(0);
          expect(await page.locator(".a1-vocabulary__romaji").count()).toBeGreaterThan(0);
        }
      }

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  }
});
