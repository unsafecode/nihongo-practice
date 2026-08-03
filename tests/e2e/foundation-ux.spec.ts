import { expect, test, type Locator, type Page } from "@playwright/test";
import { PREVIEW_BASE_PATH, PREVIEW_ORIGIN } from "../../playwright.config";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
  gotoReady,
  setupPageObservers,
} from "./helpers";
import { buildFoundationLessonViewModel } from "../../src/course/foundations/foundationViewModel";
import { getCourseCopy } from "../../src/course/i18n/catalog";
import { formatRomaji } from "../../src/romaji/formatRomaji";

/**
 * Phase 1 Task 6 — foundation UX acceptance (design spec §10.3, §11, §16, §19,
 * §21; Phase 1 exit gate). These scenarios drive the compile-time-gated
 * foundation fixture harness (built by the Playwright preview with
 * `VITE_FOUNDATION_FIXTURES=true`) through the real DOM on both the desktop and
 * mobile Playwright projects, for both authored fixtures. Every canonical
 * answer and every ordering expectation is recomputed in the test from the pure
 * {@link buildFoundationLessonViewModel} view model — never read back out of the
 * DOM — so the tests prove the rendered page against an independent oracle.
 */

// The fixed preview seed for the deterministic Phase 1 harness. Mirrors
// `FOUNDATION_PREVIEW_SEED` in FoundationFixturePage.tsx; hard-coded here so the
// test never imports the page module (which pulls the course stylesheet).
const SEED = "phase1-foundation-preview-v1";

const FIXTURE_IDS = [
  "fixture-a1-personal-details",
  "fixture-a2-routine-plans",
] as const;

// Independent copy oracles derived from the pure course catalog (never a
// hand-typed literal): the matrix heading each locale renders.
const MATRIX_TITLE_IT = getCourseCopy("it").foundation.matrixTitle;
const MATRIX_TITLE_EN = getCourseCopy("en").foundation.matrixTitle;

type ViewModel = ReturnType<typeof loadModel>;

function loadModel(fixtureId: string, locale: "it" | "en") {
  const result = buildFoundationLessonViewModel(fixtureId, locale, SEED);
  if (!result.ok) {
    throw new Error(
      `foundation view model failed for ${fixtureId}/${locale}: ${result.error.code}`,
    );
  }
  return result.model;
}

function foundationUrl(fixtureId: string): string {
  return `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/__fixtures__/foundation/${fixtureId}`;
}

function isMobile(width: number): boolean {
  return width < 700;
}

/** Resolves the one *visible* settings container, opening the mobile drawer. */
async function openSettings(
  page: Page,
  viewport: { width: number; height: number } | null,
): Promise<Locator> {
  if (viewport && isMobile(viewport.width)) {
    await page.locator(".header__settings-trigger").click();
    const panel = page.locator(".settings-drawer__panel");
    await expect(panel).toBeVisible();
    return panel;
  }
  return page.locator(".header__settings--desktop");
}

/** Closes the mobile settings drawer so the underlying page is live again. */
async function closeSettings(
  page: Page,
  viewport: { width: number; height: number } | null,
): Promise<void> {
  if (viewport && isMobile(viewport.width)) {
    await page.locator(".settings-drawer__close").click();
    await expect(page.locator(".settings-drawer__panel")).toHaveCount(0);
  }
}

async function variantOrder(page: Page): Promise<(string | null)[]> {
  return page.$$eval(".foundation-matrix__row", (els) =>
    els.map((el) => el.getAttribute("data-variant-id")),
  );
}

async function targetOrder(page: Page): Promise<(string | null)[]> {
  return page.$$eval(".foundation-round__card", (els) =>
    els.map((el) => el.getAttribute("data-target-id")),
  );
}

/**
 * The independent oracle for one row's expected comparison-emphasis
 * fragments in both scripts, recomputed straight from the pure view model
 * (never read back out of the DOM): the exact ordered Japanese glyph
 * fragments and the exact ordered romaji run fragments for that row's
 * `comparisonTokenIds`.
 */
function expectedComparisonText(
  row: ViewModel["matrix"]["rows"][number],
): { readonly japanese: readonly string[]; readonly romaji: readonly string[] } {
  const selected = new Set(row.comparisonTokenIds);
  const formatted = formatRomaji(row.tokens);
  if (!formatted.ok) throw new Error(`invalid romaji for ${row.variantId}`);
  return {
    japanese: row.tokens
      .filter((token) => selected.has(token.id))
      .map((token) => token.jp),
    romaji: formatted.runs
      .filter((run) => selected.has(run.tokenId))
      .map((run) => run.text),
  };
}

/** The visible (ruby-reading-stripped) text of every marked comparison
 * fragment in a row's Japanese line, in DOM order. */
async function visibleJapaneseMarkText(row: Locator): Promise<string[]> {
  return row
    .locator(".foundation-matrix__jp mark.foundation-matrix__comparison-token")
    .evaluateAll((marks) =>
      marks.map((mark) => {
        const clone = mark.cloneNode(true) as Element;
        clone.querySelectorAll("rt").forEach((reading) => reading.remove());
        return clone.textContent ?? "";
      }),
    );
}

/**
 * Proves the comparison mark's computed style genuinely carries the
 * background + weight + underline emphasis relative to its containing
 * phrase — a real browser-computed-style oracle, not a source-CSS regex
 * match, so it also proves the emphasis actually renders.
 */
async function expectComparisonEmphasis(mark: Locator, phrase: Locator): Promise<void> {
  const markStyle = await mark.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      weight: Number(style.fontWeight),
      decoration: style.textDecorationLine,
    };
  });
  const phraseWeight = await phrase.evaluate((element) =>
    Number(getComputedStyle(element).fontWeight),
  );
  expect(markStyle.background).not.toBe("transparent");
  expect(markStyle.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(markStyle.weight).toBeGreaterThan(phraseWeight);
  expect(markStyle.decoration.split(" ")).toContain("underline");
}

for (const fixtureId of FIXTURE_IDS) {
  const model: ViewModel = loadModel(fixtureId, "it");
  const modelEn: ViewModel = loadModel(fixtureId, "en");
  const url = foundationUrl(fixtureId);

  const authoredVariantOrder = model.matrix.rows.map((r) => r.variantId);
  const initialVariantIds = [...model.matrix.initialVariantIds];
  const omittedCount = model.matrix.rows.filter(
    (r) => r.subjectRealization === "omitted",
  ).length;
  const matrixFingerprints = new Set(
    model.matrix.rows.map((r) => r.semanticFingerprint),
  );

  const round1 = model.rounds[0];
  const round2 = model.rounds[1];
  const allTargetIds = model.rounds.flatMap((rd) =>
    rd.targets.map((t) => t.targetId),
  );

  const round1Choice = round1.targets.find(
    (t) => t.exerciseKind === "choice",
  );
  const constructionTarget = round2.targets.find(
    (t) => t.exerciseKind === "constrained-construction",
  );

  test.describe(`foundation UX — ${fixtureId}`, () => {
    // ---- (1) setup + reachable landmark: level / title / Can-do / alignment ----
    test("renders the level, title, Can-do, and aligned matrix landmark", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const eyebrow = page.locator(".course-eyebrow");
      await expect(eyebrow).toBeVisible();
      await expect(eyebrow).toHaveText(model.levelId);
      await expect(eyebrow).toHaveAttribute("data-level-id", model.levelId);

      const title = page.locator(".foundation-page__header h1");
      await expect(title).toBeVisible();
      await expect(title).toHaveText(model.lessonId);
      expect(model.lessonId).toBe(fixtureId);

      const canDo = page.locator(".foundation-page__can-do");
      await expect(canDo).toBeVisible();
      await expect(canDo).toHaveText(model.canDoDescriptor);

      // The matrix region is a labelled landmark (its heading id === aria-labelledby).
      const matrix = page.locator(".foundation-matrix");
      const labelledBy = await matrix.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const matrixTitle = page.locator(".foundation-matrix__title");
      await expect(matrixTitle).toHaveText(MATRIX_TITLE_IT);
      expect(await matrixTitle.getAttribute("id")).toBe(labelledBy);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (2) matrix disclosure: 3 → 8, semantic badges, emphasized comparison ----
    test("matrix discloses 3 to 8 authored rows with semantic badges and emphasized comparison tokens in both scripts", async ({
      page,
      viewport,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const rows = page.locator(".foundation-matrix__row");
      await expect(rows).toHaveCount(3);
      expect(await variantOrder(page)).toEqual(initialVariantIds);

      const toggle = page.locator(".foundation-matrix__toggle");
      const region = page.locator(".foundation-matrix__rows");
      const regionId = await region.getAttribute("id");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(await toggle.getAttribute("aria-controls")).toBe(regionId);

      // Keyboard: focus the disclosure and press Enter to expand.
      await toggle.focus();
      await page.keyboard.press("Enter");

      await expect(rows).toHaveCount(8);
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(await variantOrder(page)).toEqual(authoredVariantOrder);

      // Every expanded row places its Japanese, whole-sentence romaji, exact
      // translation, exact comparison-marked fragments (in both scripts), and
      // exactly two semantic speaker/context badges adjacently in the row —
      // every expectation recomputed from the pure view model, never read
      // back out of the DOM.
      for (let index = 0; index < model.matrix.rows.length; index += 1) {
        const rowModel = model.matrix.rows[index];
        const row = rows.nth(index);
        const expectedText = expectedComparisonText(rowModel);
        await expect(row.locator(".foundation-matrix__jp")).toHaveCount(1);
        await expect(row.locator(".foundation-matrix__romaji")).toHaveCount(1);
        await expect(row.locator(".foundation-matrix__translation")).toHaveText(
          rowModel.translation,
        );
        expect(await visibleJapaneseMarkText(row)).toEqual(expectedText.japanese);
        await expect(
          row.locator(".foundation-matrix__romaji mark.foundation-matrix__comparison-token"),
        ).toHaveText([...expectedText.romaji]);
        const pairs = row.locator("dl.foundation-matrix__meta > .foundation-matrix__meta-pair");
        await expect(pairs).toHaveCount(2);
        for (let pairIndex = 0; pairIndex < 2; pairIndex += 1) {
          await expect(pairs.nth(pairIndex).locator(":scope > dt")).toHaveCount(1);
          await expect(pairs.nth(pairIndex).locator(":scope > dd")).toHaveCount(1);
        }
      }

      // The omitted-subject note is present exactly on the pro-dropped rows.
      await expect(page.locator(".foundation-matrix__omitted")).toHaveCount(
        omittedCount,
      );
      expect(omittedCount).toBeGreaterThan(0);

      // The comparison mark's computed style genuinely carries the
      // background + weight + underline emphasis over its containing phrase.
      await expectComparisonEmphasis(
        rows.first().locator(".foundation-matrix__jp mark.foundation-matrix__comparison-token").first(),
        rows.first().locator(".foundation-matrix__jp"),
      );
      await expectComparisonEmphasis(
        rows.first().locator(".foundation-matrix__romaji mark.foundation-matrix__comparison-token").first(),
        rows.first().locator(".foundation-matrix__romaji"),
      );

      await assertNoHorizontalOverflow(page);

      // Switch to Rōmaji: the same 8 authored rows, no Japanese line, exact
      // marked romaji runs, intact whitespace, and the same computed
      // emphasis — proven again in romaji-only mode.
      const settings = await openSettings(page, viewport ?? null);
      await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
      await closeSettings(page, viewport ?? null);

      await expect(page.locator(".foundation-matrix")).toHaveClass(
        /foundation-matrix--romaji/,
      );
      await expect(page.locator(".foundation-matrix__jp")).toHaveCount(0);
      await expect(rows).toHaveCount(8);
      expect(await variantOrder(page)).toEqual(authoredVariantOrder);

      for (let index = 0; index < model.matrix.rows.length; index += 1) {
        const expectedText = expectedComparisonText(model.matrix.rows[index]);
        const row = rows.nth(index);
        await expect(
          row.locator(".foundation-matrix__romaji mark.foundation-matrix__comparison-token"),
        ).toHaveText([...expectedText.romaji]);
        expect(
          /\s/.test((await row.locator(".foundation-matrix__romaji").textContent()) ?? ""),
        ).toBe(true);
      }

      await expectComparisonEmphasis(
        rows.first().locator(".foundation-matrix__romaji mark.foundation-matrix__comparison-token").first(),
        rows.first().locator(".foundation-matrix__romaji"),
      );

      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (3) locale/script switching keeps identity + order, changes surface copy ----
    test("switching locale and script preserves IDs/order and updates visible copy", async ({
      page,
      viewport,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const matrixTitle = page.locator(".foundation-matrix__title");
      await expect(matrixTitle).toHaveText(MATRIX_TITLE_IT);

      const beforeVariants = await variantOrder(page);
      const beforeTargets = await targetOrder(page);
      expect(beforeVariants).toEqual(initialVariantIds);
      expect(beforeTargets).toEqual(allTargetIds);

      // IT → EN through the real settings control.
      let settings = await openSettings(page, viewport ?? null);
      await settings.locator(".localetoggle button", { hasText: "EN" }).click();
      await closeSettings(page, viewport ?? null);

      await expect(matrixTitle).toBeVisible();
      await expect(matrixTitle).toHaveText(MATRIX_TITLE_EN);
      expect(MATRIX_TITLE_EN).not.toBe(MATRIX_TITLE_IT);
      await expect(page.locator(".foundation-page__can-do")).toHaveText(
        modelEn.canDoDescriptor,
      );
      // Identity + order never move when the locale changes.
      expect(await variantOrder(page)).toEqual(initialVariantIds);
      expect(await targetOrder(page)).toEqual(allTargetIds);

      // Restore IT.
      settings = await openSettings(page, viewport ?? null);
      await settings.locator(".localetoggle button", { hasText: "IT" }).click();
      await closeSettings(page, viewport ?? null);
      await expect(matrixTitle).toHaveText(MATRIX_TITLE_IT);

      // Hiragana → Rōmaji hides the kana line but keeps romaji; identity holds.
      await expect(page.locator(".foundation-matrix__jp")).toHaveCount(3);
      settings = await openSettings(page, viewport ?? null);
      await settings
        .locator(".scripttoggle button", { hasText: "Rōmaji" })
        .click();
      await closeSettings(page, viewport ?? null);
      await expect(page.locator(".foundation-matrix__jp")).toHaveCount(0);
      await expect(page.locator(".foundation-matrix__romaji")).toHaveCount(3);
      expect(await variantOrder(page)).toEqual(initialVariantIds);
      expect(await targetOrder(page)).toEqual(allTargetIds);

      // Rōmaji → Hiragana brings the kana line back.
      settings = await openSettings(page, viewport ?? null);
      await settings
        .locator(".scripttoggle button", { hasText: "Hiragana" })
        .click();
      await closeSettings(page, viewport ?? null);
      await expect(page.locator(".foundation-matrix__jp")).toHaveCount(3);
      expect(await variantOrder(page)).toEqual(initialVariantIds);
      expect(await targetOrder(page)).toEqual(allTargetIds);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (4) guided board: same family, honest delta, marks + romaji spacing ----
    test("guided board shows a same-family delta with marked tokens and spaced romaji", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const guided = page.locator(".foundation-guided");
      await expect(guided).toHaveCount(1);
      await expect(guided).toHaveAttribute("data-family-id", model.guided.familyId);
      expect(model.guided.initial.familyId).toBe(model.guided.familyId);
      expect(model.guided.target.familyId).toBe(model.guided.familyId);

      await expect(
        guided.locator('.foundation-guided__row[data-role="initial"]'),
      ).toHaveCount(1);
      const targetRow = guided.locator(
        '.foundation-guided__row[data-role="target"]',
      );
      await expect(targetRow).toHaveCount(1);

      // Active axes: one <li> per changing axis, each with trimmed, non-empty text.
      const axisIds = await guided
        .locator(".foundation-guided__axes-list li")
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-axis-id")));
      expect(axisIds).toEqual([...model.guided.activeAxes]);
      const axisTexts = await guided
        .locator(".foundation-guided__axes-list li")
        .evaluateAll((els) => els.map((el) => (el.textContent ?? "").trim()));
      expect(axisTexts.length).toBe(model.guided.activeAxes.length);
      for (const t of axisTexts) expect(t.length).toBeGreaterThan(0);

      // Changed tokens are marked (both the kana row and the romaji sequence),
      // each mark non-empty and trimmed.
      const marks = targetRow.locator("mark.foundation-guided__changed");
      const markCount = await marks.count();
      expect(markCount).toBeGreaterThan(0);
      for (let i = 0; i < markCount; i += 1) {
        const raw = (await marks.nth(i).textContent()) ?? "";
        expect(raw.trim().length).toBeGreaterThan(0);
      }

      // Whole-sentence romaji carries semantic word spacing.
      const romaji = (
        (await targetRow
          .locator(".foundation-guided__romaji")
          .textContent()) ?? ""
      ).trim();
      expect(romaji.length).toBeGreaterThan(0);
      expect(/\s/.test(romaji)).toBe(true);

      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (5) rounds: metadata, transfer diversity, opaque keys, no answer leak ----
    test("two rounds expose exact metadata, opaque keys, and never leak answers", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      const rounds = page.locator(".foundation-round");
      await expect(rounds).toHaveCount(2);
      await expect(rounds.nth(0)).toHaveAttribute(
        "data-round-purpose",
        "guided-controlled",
      );
      await expect(rounds.nth(1)).toHaveAttribute(
        "data-round-purpose",
        "transfer",
      );

      await expect(rounds.nth(0).locator(".foundation-round__card")).toHaveCount(
        5,
      );
      await expect(rounds.nth(1).locator(".foundation-round__card")).toHaveCount(
        5,
      );
      await expect(page.locator(".foundation-round__card")).toHaveCount(10);

      // Round 2 is entirely transfer, with >= 1 constrained construction and at
      // least one other kind.
      const r2Cards = rounds.nth(1).locator(".foundation-round__card");
      const r2Purposes = await r2Cards.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-practice-purpose")),
      );
      expect(new Set(r2Purposes)).toEqual(new Set(["transfer"]));
      const r2Kinds = await r2Cards.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-exercise-kind")),
      );
      expect(r2Kinds.filter((k) => k === "constrained-construction").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(new Set(r2Kinds).size).toBeGreaterThanOrEqual(2);

      // Opaque visible-target keys: >= 5 unique across 10 cards, max reuse <= 2,
      // and every value is an opaque `k…` token (never raw Japanese).
      const keys = await page.$$eval(".foundation-round__card", (els) =>
        els.map((el) => el.getAttribute("data-visible-target-key")),
      );
      expect(keys).toHaveLength(10);
      const counts = new Map<string, number>();
      for (const k of keys) {
        expect(k).toMatch(/^k[0-9a-z]+$/);
        counts.set(k as string, (counts.get(k as string) ?? 0) + 1);
      }
      expect(counts.size).toBeGreaterThanOrEqual(5);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);

      // Transfer semantic fingerprints are absent from the matrix model set.
      const r2Fingerprints = await r2Cards.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-semantic-fingerprint")),
      );
      for (const fp of r2Fingerprints) {
        expect(fp).toBeTruthy();
        expect(matrixFingerprints.has(fp as string)).toBe(false);
      }

      // No answer/canonical/jp/romaji/comparison/token-id attribute name and no
      // Japanese in any data-* value, anywhere on the whole fixture page.
      const offenders = await page.$$eval(".foundation-page *", (els) => {
        const bad: { name: string; value: string }[] = [];
        const banned = /(answer|canonical|jp|romaji|comparison|token.?id)/i;
        for (const el of els) {
          for (const attr of Array.from(el.attributes)) {
            if (!attr.name.startsWith("data-")) continue;
            if (banned.test(attr.name)) {
              bad.push({ name: attr.name, value: attr.value });
            }
          }
        }
        return bad;
      });
      expect(offenders, JSON.stringify(offenders)).toEqual([]);

      const jpInData = await page.$$eval(".foundation-page *", (els) => {
        const bad: { name: string; value: string }[] = [];
        const jp = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;
        for (const el of els) {
          for (const attr of Array.from(el.attributes)) {
            if (!attr.name.startsWith("data-")) continue;
            if (jp.test(attr.value)) bad.push({ name: attr.name, value: attr.value });
          }
        }
        return bad;
      });
      expect(jpInData, JSON.stringify(jpInData)).toEqual([]);

      // The matrix specifically: every attribute on every element (not just
      // data-*) is scanned for the banned names or a Japanese value, since
      // the matrix is the one surface whose per-row Japanese/romaji answer
      // text and comparison token ids must never leak into any attribute at
      // all — legitimate `data-variant-id`/`data-family-id`/`data-context-id`/
      // `data-speaker-role-id`/`data-semantic-fingerprint` are unaffected
      // because none of those names or their opaque id values match either
      // predicate.
      const matrixOffenders = await page.$$eval(".foundation-matrix *", (els) => {
        const bad: { name: string; value: string }[] = [];
        const banned = /(answer|canonical|jp|romaji|comparison|token.?id)/i;
        const jp = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;
        for (const el of els) {
          for (const attr of Array.from(el.attributes)) {
            if (banned.test(attr.name) || jp.test(attr.value)) {
              bad.push({ name: attr.name, value: attr.value });
            }
          }
        }
        return bad;
      });
      expect(matrixOffenders, JSON.stringify(matrixOffenders)).toEqual([]);

      // No comparisonTokenIds value is ever serialized into any matrix
      // attribute, under any attribute name.
      const matrixAttributes = await page.$$eval(".foundation-matrix *", (els) =>
        els.flatMap((el) =>
          Array.from(el.attributes).map((attr) => ({
            name: attr.name,
            value: attr.value,
          })),
        ),
      );
      const allComparisonTokenIds = model.matrix.rows.flatMap(
        (row) => row.comparisonTokenIds,
      );
      for (const tokenId of allComparisonTokenIds) {
        expect(
          matrixAttributes.some((attribute) => attribute.value === tokenId),
        ).toBe(false);
      }

      // No row's Japanese or romaji token surface ever appears in a
      // metadata-carrying attribute (data-*, aria-*, title/value/name) —
      // legitimate visible text content (the rendered matrix rows
      // themselves) is untouched by this check.
      const metadataValues = matrixAttributes
        .filter(
          ({ name }) =>
            name.startsWith("data-") ||
            name.startsWith("aria-") ||
            ["title", "value", "name"].includes(name),
        )
        .map(({ value }) => value);
      for (const row of model.matrix.rows) {
        for (const token of row.tokens) {
          expect(metadataValues).not.toContain(token.jp);
          expect(metadataValues).not.toContain(token.romaji);
        }
      }

      // Legitimate matrix identity metadata still survives all the checks
      // above: opaque authored variant ids and target ids remain intact.
      expect(await variantOrder(page)).toEqual(initialVariantIds);
      expect(await targetOrder(page)).toEqual(allTargetIds);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (6) keyboard/touch parity: real controls, computed answer, polite feedback ----
    test("keyboard and touch both submit real answers with polite accepted feedback", async ({
      page,
    }) => {
      expect(round1Choice, "round 1 choice target").toBeTruthy();
      expect(constructionTarget, "round 2 constrained-construction target").toBeTruthy();

      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      // No microphone / speech affordance anywhere on the harness.
      await expect(
        page.locator(
          '.foundation-page [class*="speech"], .foundation-page [class*="mic"], .foundation-page [data-speech]',
        ),
      ).toHaveCount(0);

      // --- Round 1 choice through the keyboard ---
      const choiceCard = page.locator(
        `.foundation-round__card[data-target-id="${round1Choice!.targetId}"]`,
      );
      await expect(choiceCard).toHaveCount(1);
      const correctOptionId = (
        round1Choice!.prompt as { correctOptionId: string }
      ).correctOptionId;
      const radio = choiceCard.locator(
        `input.lesson-exercise__radio[value="${correctOptionId}"]`,
      );
      await radio.focus();
      await page.keyboard.press("Space");
      await expect(radio).toBeChecked();
      const choiceSubmit = choiceCard.locator("button[type=submit]");
      await choiceSubmit.focus();
      await page.keyboard.press("Enter");

      const choiceFeedback = choiceCard.locator(".lesson-exercise__feedback");
      await expect(choiceFeedback).toHaveAttribute("aria-live", "polite");
      await expect(choiceFeedback).toHaveAttribute("role", "status");
      await expect(choiceFeedback).toHaveAttribute("data-accepted", "true");
      await expect(choiceFeedback).toHaveClass(
        /lesson-exercise__feedback--accepted/,
      );
      await expect(choiceFeedback).toContainText("Corretto");

      // Clear/retry control stays reachable after the attempt.
      const choiceClear = choiceCard.locator(".lesson-exercise__clear");
      await choiceClear.focus();
      await expect(choiceClear).toBeFocused();

      // --- Round 2 constrained construction through pointer + typed answer ---
      const expectedAnswer = (
        constructionTarget!.prompt as { canonicalAnswer: string }
      ).canonicalAnswer;
      const buildCard = page.locator(
        `.foundation-round__card[data-target-id="${constructionTarget!.targetId}"]`,
      );
      await expect(buildCard).toHaveCount(1);
      const input = buildCard.locator("input.lesson-exercise__input");
      await input.click();
      await input.fill(expectedAnswer);
      await buildCard.locator("button[type=submit]").click();

      const buildFeedback = buildCard.locator(".lesson-exercise__feedback");
      await expect(buildFeedback).toHaveAttribute("aria-live", "polite");
      await expect(buildFeedback).toHaveAttribute("data-accepted", "true");
      await expect(buildFeedback).toHaveClass(
        /lesson-exercise__feedback--accepted/,
      );
      await expect(buildFeedback).toContainText("Corretto");

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });

    // ---- (7) a11y/layout: touch targets, focus-visible, reduced motion, semantics ----
    test("meets touch, focus-visible, reduced-motion, and list-semantics gates", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, url);

      // Reduced motion is honoured (emulated by gotoReady per design §9.2).
      const reduced = await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      expect(reduced).toBe(true);

      // Every actionable target meets 44×44 CSS px.
      const offenders = await auditTouchTargets(page);
      expect(offenders, JSON.stringify(offenders)).toEqual([]);

      // Rounds are semantic ordered lists whose direct children are the cards.
      const directCards = await page.$$eval(
        ".foundation-round__cards",
        (lists) =>
          lists.map((list) =>
            Array.from(list.children).every(
              (child) =>
                child.tagName === "LI" &&
                child.classList.contains("foundation-round__card"),
            ),
          ),
      );
      expect(directCards).toEqual([true, true]);
      await expect(page.locator("ol.foundation-round__cards")).toHaveCount(2);

      // focus-visible: keyboard modality then focus yields a computed outline on
      // the disclosure control and on an exercise control.
      await page.keyboard.press("Tab");
      const toggle = page.locator(".foundation-matrix__toggle");
      await toggle.focus();
      const toggleOutline = await toggle.evaluate((el) => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, width: s.outlineWidth };
      });
      expect(toggleOutline.style).not.toBe("none");
      expect(parseFloat(toggleOutline.width)).toBeGreaterThan(0);

      const exerciseControl = page
        .locator(".foundation-round__card button[type=submit]")
        .first();
      await exerciseControl.focus();
      const controlOutline = await exerciseControl.evaluate((el) => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, width: s.outlineWidth };
      });
      expect(controlOutline.style).not.toBe("none");
      expect(parseFloat(controlOutline.width)).toBeGreaterThan(0);

      await assertNoHorizontalOverflow(page);
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  });
}
