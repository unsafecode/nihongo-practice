import { expect, test, type Locator, type Page } from "@playwright/test";
import { PREVIEW_BASE_PATH, PREVIEW_ORIGIN } from "../../playwright.config";
import {
  assertLocalOnlyNetwork,
  assertNoRuntimeErrors,
  gotoReady,
  installSpeechFake,
  queueSpeechOutcome,
  routeUrls,
  setupPageObservers,
  speechStats,
  type PageObservers,
  type SpeechFakeConfig,
} from "./helpers";

/**
 * A2 release end-to-end acceptance against the *built* production preview
 * (Phase 3 Task 9 exit gate). Every assertion here drives the same HashRouter
 * app that ships to GitHub Pages, served at the real Pages base — no dev
 * server, no fixture data, no backend, no external network. It proves the
 * whole A2 runtime the earlier tasks assembled: the runtime level selector and
 * its URL/history/focus behaviour, a representative deep A2 lesson (models,
 * ruby+gloss, romaji boundaries, staged contextual kanji), the revealable and
 * assessed kanji states (including the romaji-mode no-bypass contract), the
 * per-level progress/Can-do/checkpoint/review surfaces and their persistence
 * and isolation, the injected-recognizer speech attempt, and settings
 * persistence — all with zero unexpected console errors and only local asset
 * requests.
 */

const A2_COURSE_URL = `${routeUrls.home}?livello=a2`;
const A2_REP_LESSON = { moduleId: "sequencing-ongoing", lessonId: "sequencing-ongoing-3" } as const;
const A2_REP_LESSON_URL = routeUrls.lesson(A2_REP_LESSON.moduleId, A2_REP_LESSON.lessonId);
// connected-conversation-4 stages 話 (hana) at the `assessed` recognition stage.
const A2_ASSESSED_LESSON_URL = routeUrls.lesson("connected-conversation", "connected-conversation-4");
const A1_REP_LESSON_URL = routeUrls.lesson("introductions", "introductions-1");

const PROGRESS_STORAGE_KEY = "nihongo.course.progress";

const A1_MODULE_COUNT = 12;
const A1_LESSON_COUNT = 48;
const A2_MODULE_COUNT = 15;
const A2_LESSON_COUNT = 60;

/** A2 spoken-attempt copy (identical `spokenAttempt` copy A1 uses, IT default). */
const SPEECH_IT = {
  tryButton: "Prova a parlare",
  consentAcknowledge: "Ho capito, continua",
  micStart: "Parla ora",
  statusMatched: "Il browser ha riconosciuto la frase.",
  statusClose: "Il browser ha riconosciuto quasi tutta la frase.",
  statusRetry: "Il browser non ha riconosciuto la frase. Riprova.",
  errorService: "La trasformazione della voce in testo non è disponibile ora.",
  errorUnsupported: "Questo browser non trasforma la voce in testo.",
} as const;

/** Certification/mastery vocabulary a JF/CEFR-aligned surface must never use. */
const FORBIDDEN_CERTIFICATION_TERMS = [
  "certificato",
  "certificazione",
  "certified",
  "certificate",
  "mastery",
  "mastered",
  "padronanza",
  "superato l'esame",
  "passed",
  "fluent",
  "fluente",
];

function isMobile(width: number): boolean {
  return width < 700;
}

/** The single visible settings container for the current viewport. */
async function settingsContainer(
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

/**
 * Runtime guards WITHOUT the localStorage-clearing init script, so an in-app
 * mutation genuinely survives a full document reload. Each Playwright test
 * already starts from a fresh, empty storage context, so no clearing is
 * needed for determinism here.
 */
async function setupObserversNoClear(page: Page): Promise<PageObservers> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requests: string[] = [];
  const externalRequests: string[] = [];
  const UNHANDLED_KEY = "__e2eUnhandledRejectionsNoClear__";

  await page.addInitScript((key: string) => {
    (window as unknown as Record<string, string[]>)[key] = [];
    window.addEventListener("unhandledrejection", (event) => {
      (window as unknown as Record<string, string[]>)[key].push(String(event.reason));
    });
  }, UNHANDLED_KEY);

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("request", (req) => {
    const url = req.url();
    requests.push(url);
    const local =
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url.startsWith("about:") ||
      url === PREVIEW_ORIGIN ||
      url.startsWith(PREVIEW_ORIGIN + "/");
    if (!local) externalRequests.push(url);
  });

  return {
    consoleErrors,
    pageErrors,
    requests,
    externalRequests,
    async unhandledRejections(target: Page) {
      return target.evaluate((key: string) => {
        const store = (window as unknown as Record<string, string[]>)[key];
        return Array.isArray(store) ? store.slice() : [];
      }, UNHANDLED_KEY);
    },
  };
}

/** Read the persisted v4 progress payload (or null) straight from storage. */
async function readProgress(page: Page): Promise<{
  schemaVersion?: number;
  levels?: Record<string, { lessons?: Record<string, unknown> }>;
} | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, PROGRESS_STORAGE_KEY);
}

/** Seed the v4 progress store AFTER navigation-time so it wins over any clear. */
async function seedProgress(page: Page, payload: unknown): Promise<void> {
  await page.addInitScript(
    (args: { key: string; value: string }) => {
      localStorage.setItem(args.key, args.value);
    },
    { key: PROGRESS_STORAGE_KEY, value: JSON.stringify(payload) },
  );
}

function emptyLevel() {
  return {
    lessons: {},
    canDos: {},
    checkpointAttempts: [],
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
  };
}

// ---------------------------------------------------------------------------
// 1. Runtime level selector: URL, structure, history, focus, deep link.
// ---------------------------------------------------------------------------
test.describe("A2 level selector on the built preview", () => {
  test("defaults to A1 with A2 enabled, and selecting A2 routes to ?livello=a2 with the exact A2 shape", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // The Pages base is exactly the shipped one.
    expect(new URL(page.url()).pathname).toBe(PREVIEW_BASE_PATH);

    const a1Option = page.locator('.level-selector__option[data-level="a1"]');
    const a2Option = page.locator('.level-selector__option[data-level="a2"]');
    await expect(a1Option).toHaveAttribute("aria-current", "true");
    await expect(a2Option).not.toHaveAttribute("aria-current", "true");
    // A2 is never hard-locked/disabled — always selectable.
    await expect(a2Option).not.toHaveAttribute("aria-disabled", /.*/);
    await expect(page.locator(".module-card")).toHaveCount(A1_MODULE_COUNT);
    await expect(page.locator(".module-card__lesson-link")).toHaveCount(A1_LESSON_COUNT);

    await a2Option.click();
    await expect(page).toHaveURL(/livello=a2/);
    await expect(a2Option).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);
    await expect(page.locator(".module-card__lesson-link")).toHaveCount(A2_LESSON_COUNT);

    // The selected-level heading owns focus after a level change (keyboard/AT).
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("course-level-heading");

    // Level-specific companion surfaces are all present on the A2 view.
    await expect(page.locator(".level-selector")).toBeVisible();
    await expect(page.locator(".can-do-summary")).toBeVisible();
    await expect(page.locator(".checkpoint-state")).toBeVisible();
    await expect(page.locator(".review-queue")).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("browser Back returns to A1 and Forward returns to A2, each moving focus to the level heading", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    await page.locator('.level-selector__option[data-level="a2"]').click();
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);

    await page.goBack();
    await expect(page).not.toHaveURL(/livello=a2/);
    await expect(page.locator(".module-card")).toHaveCount(A1_MODULE_COUNT);
    await expect(page.locator('.level-selector__option[data-level="a1"]')).toHaveAttribute("aria-current", "true");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("course-level-heading");

    await page.goForward();
    await expect(page).toHaveURL(/livello=a2/);
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);
    await expect(page.locator('.level-selector__option[data-level="a2"]')).toHaveAttribute("aria-current", "true");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("course-level-heading");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("a direct deep link to ?livello=a2 renders the A2 map (no prior A1 navigation needed)", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A2_COURSE_URL);
    await expect(page.locator('.level-selector__option[data-level="a2"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);
    await expect(page.locator(".module-card__lesson-link")).toHaveCount(A2_LESSON_COUNT);
    await expect(page.locator("#course-level-heading")).toBeVisible();

    // Alignment claim only — never a certification/mastery claim.
    const checkpoint = (await page.locator(".checkpoint-state").innerText()).toLowerCase();
    for (const term of FORBIDDEN_CERTIFICATION_TERMS) {
      expect(checkpoint, `checkpoint must not claim "${term}"`).not.toContain(term);
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// 2. Representative deep A2 lesson.
// ---------------------------------------------------------------------------
test.describe("A2 representative lesson (sequencing-ongoing-3) on the built preview", () => {
  test("renders the full lesson body: ≥8 model rows, all sections, semantic romaji boundaries, staged kanji ruby+gloss", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A2_REP_LESSON_URL);

    await expect(page.locator("main.lesson-layout")).toBeVisible();
    // All four lesson sections render as real landmarks.
    await expect(page.locator(".lesson-section")).toHaveCount(4);

    // The reused foundation sentence matrix discloses all 8-12 models on demand.
    const matrix = page.locator(".a2-lesson-rule .foundation-matrix").first();
    await expect(matrix).toBeVisible();
    await matrix.locator(".foundation-matrix__toggle").click();
    const rowCount = await matrix.locator(".foundation-matrix__row").count();
    expect(rowCount).toBeGreaterThanOrEqual(8);
    expect(rowCount).toBeLessThanOrEqual(12);

    // Semantic romaji boundaries survive to the DOM: at least one model's
    // whole-sentence romaji has an inter-word space (never one fused blob).
    const romajiTexts = await matrix.locator(".foundation-matrix__row .foundation-matrix__romaji").allInnerTexts();
    expect(romajiTexts.some((text) => /\S\s\S/.test(text))).toBe(true);

    // The staged contextual-kanji section renders.
    const kanji = page.locator(".a2-kanji");
    await expect(kanji).toBeVisible();

    // A supported-retrieval glyph shows a semantic ruby (rt reading) + gloss.
    const supported = kanji.locator('.a2-kanji__item[data-stage="supported-retrieval"]').first();
    await expect(supported).toBeVisible();
    await expect(supported.locator("ruby")).toHaveCount(1);
    await expect(supported.locator("rt")).toHaveCount(1);
    await expect(supported.locator(".kanji-ruby__meaning")).toHaveCount(1);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// 3. Revealable kanji control.
// ---------------------------------------------------------------------------
test.describe("A2 revealable kanji control on the built preview", () => {
  test("hides the reading behind a named ≥44px aria-expanded control, reveals it on activation, and is keyboard operable", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A2_REP_LESSON_URL);

    const revealable = page.locator('.a2-kanji__item[data-stage="revealable"]').first();
    await expect(revealable).toBeVisible();
    // Reading is genuinely absent from the DOM while collapsed (no rt leak).
    await expect(revealable.locator("rt")).toHaveCount(0);

    const toggle = revealable.locator(".kanji-reveal");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // The control carries a real, non-empty accessible name (localized copy).
    expect(((await toggle.getAttribute("aria-label")) ?? "").trim().length).toBeGreaterThan(0);
    // ≥44px touch target.
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(44);

    // Keyboard focus is predictable and activation reveals the reading.
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(revealable.locator("rt")).toHaveCount(1);
    // Focus stays on the toggle after activation (predictable, no focus loss).
    await expect(toggle).toBeFocused();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// 4. Assessed kanji no-bypass, even under the romaji script setting.
// ---------------------------------------------------------------------------
test.describe("A2 assessed kanji no-bypass on the built preview", () => {
  test("keeps an assessed glyph within its contextual word, with a why-caption and no rt/romaji/gloss leak even in romaji mode", async ({ page, viewport }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    // Switch the whole app into romaji script — the assessed policy must still
    // withhold the reading (no romaji bypass).
    const settings = await settingsContainer(page, viewport ?? null);
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    if (viewport && isMobile(viewport.width)) await page.keyboard.press("Escape");

    await gotoReady(page, A2_ASSESSED_LESSON_URL);
    const assessed = page.locator('.a2-kanji__item[data-stage="assessed"]').first();
    await expect(assessed).toBeVisible();

    // Contextual word (taught glyph emphasised) + a visible why-caption sourced from the assessed-explanation copy.
    await expect(assessed.locator(".kanji-ruby--assessed")).toHaveCount(1);
    await expect(assessed.locator('.kanji-why[data-copy-id="a2-kanji-why-visible"]')).toBeVisible();
    // No furigana, no romaji hint, no gloss — nothing that leaks the reading.
    await expect(assessed.locator("ruby")).toHaveCount(0);
    await expect(assessed.locator("rt")).toHaveCount(0);
    await expect(assessed.locator(".kanji-ruby__romaji-hint")).toHaveCount(0);
    await expect(assessed.locator(".kanji-ruby__meaning")).toHaveCount(0);

    // No handwriting/IME surface anywhere in the kanji section.
    await expect(page.locator(".a2-kanji canvas, .a2-kanji input, .a2-kanji textarea")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// 5. Per-level progress / review isolation + persistence + level-scoped reset.
// ---------------------------------------------------------------------------
test.describe("A2 progress isolation and persistence on the built preview", () => {
  test("an A2 lesson visit persists across a full reload and never contaminates A1", async ({ page }) => {
    const observers = await setupObserversNoClear(page);

    // Visit one A1 lesson and one A2 lesson (real markVisited writes).
    await gotoReady(page, A1_REP_LESSON_URL);
    await gotoReady(page, A2_REP_LESSON_URL);

    // Full document reload — the app's own persistence must restore both.
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> :is(main, .lab-page)").first().waitFor({ state: "visible" });

    const progress = await readProgress(page);
    expect(progress?.schemaVersion).toBe(4);
    const a1Lessons = Object.keys(progress?.levels?.a1?.lessons ?? {});
    const a2Lessons = Object.keys(progress?.levels?.a2?.lessons ?? {});
    // Each visit landed in its own level's slice — no cross-contamination.
    expect(a2Lessons).toContain(A2_REP_LESSON.lessonId);
    expect(a1Lessons).toContain("introductions-1");
    expect(a2Lessons).not.toContain("introductions-1");
    expect(a1Lessons).not.toContain(A2_REP_LESSON.lessonId);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("a genuine A2 mistake enqueues a review entry that shows on the A2 view and never on A1", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A2_REP_LESSON_URL);

    // Drive a real wrong attempt through a plain-completion exercise (no
    // planted answer literal, no fabricated id): a clearly-wrong value submits
    // as a retry, which enqueues this A2 lesson into the A2 review queue.
    const completion = page
      .locator(".lesson-exercise")
      .filter({ has: page.locator(".lesson-exercise__input") })
      .first();
    await completion.scrollIntoViewIfNeeded();
    await completion.locator(".lesson-exercise__input").first().fill("zzz");
    await completion.locator("button[type=submit]").first().click();
    // A clearly-wrong attempt is a text-labelled retry (the same shared
    // feedback the choice-exercise review test relies on) and enqueues review.
    await expect(completion.locator(".lesson-exercise__feedback")).toHaveClass(
      /lesson-exercise__feedback--retry/,
    );

    // SPA-navigate (never a full reload, which the observer would clear) to the
    // course map, then to the A2 view via the level selector.
    await page.locator('.lesson-footer a[href$="#/percorso"]').click();
    await expect(page.locator(".course-home")).toBeVisible();
    await page.locator('.level-selector__option[data-level="a2"]').click();
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);

    // The A2 review surface shows exactly this A2 lesson, deep-linked.
    const review = page.locator(".review-queue");
    await expect(review.locator(".review-queue__item")).toHaveCount(1);
    await expect(
      review.locator(`a[href*="${A2_REP_LESSON.moduleId}/${A2_REP_LESSON.lessonId}"]`),
    ).toHaveCount(1);

    // Switching to A1 must never surface the A2 entry (level isolation).
    await page.locator('.level-selector__option[data-level="a1"]').click();
    await expect(page.locator(".module-card")).toHaveCount(A1_MODULE_COUNT);
    await expect(
      review.locator(`a[href*="${A2_REP_LESSON.moduleId}/${A2_REP_LESSON.lessonId}"]`),
    ).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("the level-scoped reset clears only the selected level and preserves the other", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await seedProgress(page, {
      schemaVersion: 4,
      catalogVersion: "a1-a2-v1",
      levels: {
        a1: {
          ...emptyLevel(),
          lessons: {
            "introductions-1": {
              visitedAt: "2026-01-01T00:00:00.000Z",
              practicedAt: null,
              consolidatedAt: null,
              attemptedExerciseIds: [],
              acceptedExerciseIds: [],
            },
          },
          lastVisitedLessonId: "introductions-1",
        },
        a2: {
          ...emptyLevel(),
          lessons: {
            "connected-conversation-1": {
              visitedAt: "2026-02-01T00:00:00.000Z",
              practicedAt: null,
              consolidatedAt: null,
              attemptedExerciseIds: [],
              acceptedExerciseIds: [],
            },
          },
          lastVisitedLessonId: "connected-conversation-1",
        },
      },
      migrationNotice: null,
      updatedAt: "2026-02-01T00:00:00.000Z",
    });

    page.on("dialog", (dialog) => dialog.accept());
    await gotoReady(page, A2_COURSE_URL);

    // Reset the A2 level.
    await page.locator(".course-hero__actions .action--destructive").click();

    // A2 lesson slice is cleared; A1's is preserved.
    await expect
      .poll(async () => {
        const progress = await readProgress(page);
        return Object.keys(progress?.levels?.a2?.lessons ?? {}).length;
      })
      .toBe(0);
    const progress = await readProgress(page);
    expect(Object.keys(progress?.levels?.a1?.lessons ?? {})).toContain("introductions-1");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

// ---------------------------------------------------------------------------
// 6. Speech via the injected recognizer + settings persistence.
// ---------------------------------------------------------------------------
test.describe("A2 spoken attempt via the injected recognizer on the built preview", () => {
  async function openMic(page: Page): Promise<Locator> {
    const block = page.locator(".spoken-attempt");
    await expect(block).toBeVisible();
    await block.scrollIntoViewIfNeeded();
    await block.getByRole("button", { name: SPEECH_IT.tryButton, exact: true }).click();
    await block.getByRole("button", { name: SPEECH_IT.consentAcknowledge, exact: true }).click();
    await expect(block.getByRole("button", { name: SPEECH_IT.micStart, exact: true })).toBeVisible();
    return block;
  }

  test("a recognized transcript surfaces a truthful result — one ja-JP recognize call, no scores, no external network", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await installSpeechFake(page, {});
    await gotoReady(page, A2_REP_LESSON_URL);

    const block = await openMic(page);
    await queueSpeechOutcome(page, { kind: "transcript", transcript: "テスト" });
    await block.getByRole("button", { name: SPEECH_IT.micStart, exact: true }).click();

    const status = block.locator(".spoken-attempt__status-text");
    await expect(status).toHaveText(
      new RegExp(
        [SPEECH_IT.statusMatched, SPEECH_IT.statusClose, SPEECH_IT.statusRetry]
          .map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|"),
      ),
    );
    // The recognizer was invoked exactly once, in Japanese, through the fake.
    const stats = await speechStats(page);
    expect(stats.recognizeCount).toBe(1);
    expect(stats.calls[0]?.lang).toBe("ja-JP");
    // Never a pronunciation score/percentage claim.
    const text = (await block.innerText()).toLowerCase();
    for (const term of ["%", "punteggio", "score", "pronuncia", "accuratezza"]) {
      expect(text).not.toContain(term);
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("a recognizer failure shows an honest error with the listen-and-repeat fallback (no false success)", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await installSpeechFake(page, {});
    await gotoReady(page, A2_REP_LESSON_URL);

    const block = await openMic(page);
    await queueSpeechOutcome(page, { kind: "failure", failure: "service-error" });
    await block.getByRole("button", { name: SPEECH_IT.micStart, exact: true }).click();

    await expect(block.locator(".spoken-attempt__status-text")).toContainText(SPEECH_IT.errorService);
    await expect(block.locator(".spoken-attempt__repeat")).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("an unsupported recognizer never calls recognize and offers the listen-and-repeat fallback", async ({ page }) => {
    const observers = await setupPageObservers(page);
    const unsupported: SpeechFakeConfig = { supported: false };
    await installSpeechFake(page, unsupported);
    await gotoReady(page, A2_REP_LESSON_URL);

    const block = page.locator(".spoken-attempt");
    await expect(block).toBeVisible();
    await expect(block.locator(".spoken-attempt__fallback")).toBeVisible();
    await expect(block).toContainText(SPEECH_IT.errorUnsupported);
    // No mic entry point at all when unsupported, and no recognize call.
    await expect(block.getByRole("button", { name: SPEECH_IT.tryButton, exact: true })).toHaveCount(0);
    expect((await speechStats(page)).recognizeCount).toBe(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("A2 settings persistence on the built preview", () => {
  test("locale and script persist across a level switch, a lesson route, and a full reload", async ({ page, viewport }) => {
    const observers = await setupObserversNoClear(page);
    await gotoReady(page, routeUrls.home);

    const settings = await settingsContainer(page, viewport ?? null);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    if (viewport && isMobile(viewport.width)) await page.keyboard.press("Escape");

    const assertActive = async () => {
      const desktop = page.locator(".header__settings--desktop");
      await expect(desktop.locator('.localetoggle button[aria-pressed="true"]')).toContainText("EN");
      await expect(desktop.locator('.scripttoggle button[aria-pressed="true"]')).toContainText("Rōmaji");
    };

    await page.locator('.level-selector__option[data-level="a2"]').click();
    await expect(page.locator(".module-card")).toHaveCount(A2_MODULE_COUNT);
    await assertActive();

    await gotoReady(page, A2_REP_LESSON_URL);
    await assertActive();

    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> :is(main, .lab-page)").first().waitFor({ state: "visible" });
    await assertActive();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
