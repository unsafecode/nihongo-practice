import { expect, test, type Page } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
  gotoReady,
  headerBottom,
  installSpeechFake,
  rectOf,
  routeUrls,
  setupPageObservers,
} from "./helpers";

/**
 * Phase 2 Task 7 — A1 editorial/accessibility/migration depth acceptance.
 *
 * The A1 release replaced the old 40-lesson / 3-5-exercise-per-lesson
 * curriculum with a fixed 48-lesson catalog (12 modules x exactly 4 lessons
 * each, `src/course/a1/manifest.ts`) whose authoring contract
 * (`src/course/a1/authoring.ts`) fixes a semantic lesson at exactly 8
 * sentence-matrix models and exactly 10 exercises (two rounds of 5), and a
 * phonetic lesson at 8-12 contrastive items and 8-12 practice exercises (at
 * least 5 unique targets, each reused at most twice). This suite is the
 * dedicated acceptance layer for that new density/contract, the four
 * required capstone scenarios and the checkpoint-attempt mechanism they
 * gate, and the v3->v4 progress migration (`src/course/progress/progress.ts`)
 * that a real learner's stored browser data goes through exactly once.
 *
 * Every assertion here reads only stable, non-secret DOM metadata: opaque
 * author-time ids embedded in `aria-labelledby` (never the canonical
 * Japanese answer text a lesson teaches, which `authoring.ts`'s
 * `FORBIDDEN_FIELD_NAMES` bans from ever reaching a DOM attribute), fixed
 * class names, and `data-*` hooks the components already expose. No visual
 * OCR, no real network/microphone.
 */

const A1_MODULE_IDS = [
  "sounds",
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

const PHONETIC_MODULE_IDS: ReadonlySet<string> = new Set(["sounds"]);

interface LessonRef {
  readonly moduleId: string;
  readonly lessonId: string;
  readonly phonetic: boolean;
}

const ALL_LESSONS: readonly LessonRef[] = A1_MODULE_IDS.flatMap((moduleId) =>
  ([1, 2, 3, 4] as const).map((n) => ({
    moduleId,
    lessonId: `${moduleId}-${n}`,
    phonetic: PHONETIC_MODULE_IDS.has(moduleId),
  })),
);

function isMobile(width: number): boolean {
  return width < 700;
}

/**
 * Classifies one `.lesson-exercise`'s `aria-labelledby` id into its round
 * (semantic only) and its opaque target/item key, generically for either
 * lesson shape:
 *  - semantic: `ex-{lessonId}-round-{n}::{lessonId}-{suffix}-heading`
 *  - phonetic: `ex-{itemId}-ex-heading` (no round, no `::`)
 */
function classifyExercise(
  labelledby: string,
  lessonId: string,
): { readonly round: number | null; readonly key: string } {
  const splitAt = labelledby.indexOf("::");
  if (splitAt === -1) {
    const key = labelledby.replace(/^ex-/, "").replace(/-ex-heading$/, "");
    return { round: null, key };
  }
  const before = labelledby.slice(0, splitAt);
  const roundMatch = /-round-(\d+)$/.exec(before);
  const round = roundMatch ? Number(roundMatch[1]) : null;
  const after = labelledby.slice(splitAt + 2).replace(/-heading$/, "");
  const key = after.startsWith(`${lessonId}-`) ? after.slice(lessonId.length + 1) : after;
  return { round, key };
}

async function readExerciseKeys(
  page: Page,
  lessonId: string,
): Promise<{ readonly round: number | null; readonly key: string }[]> {
  const labels = await page
    .locator(".lesson-exercise")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-labelledby") ?? ""));
  return labels.map((label) => classifyExercise(label, lessonId));
}

/** Fails if the lesson route rendered a content-generation-error notice
 * anywhere in its four rule/comparison/explore/recap sections (the shared
 * `Notice tone="warning"` both `A1LessonPage` and `LessonExercises` fall
 * back to when a lesson's model or exercise set can't be built), or the
 * phonetic-only romaji-assembly error text. */
async function assertNoContentErrorNotice(page: Page): Promise<void> {
  await expect(page.locator(".lesson-sections .notice--warning")).toHaveCount(0);
  await expect(page.locator(".a1-phonetic-contrasts__error")).toHaveCount(0);
}

test.describe("48-route density and contract acceptance", () => {
  // The exhaustive per-route loop runs once (desktop project only); the
  // representative-lesson describe block below repeats the richer
  // interaction checks on both configured viewports.
  test.skip(({ viewport }) => !viewport || isMobile(viewport.width), "desktop only");

  for (const lesson of ALL_LESSONS) {
    test(`${lesson.moduleId}/${lesson.lessonId}: stable density, targets, and Can-do`, async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      await gotoReady(page, routeUrls.lesson(lesson.moduleId, lesson.lessonId));

      await assertNoContentErrorNotice(page);

      if (lesson.phonetic) {
        const itemCount = await page.locator(".a1-phonetic-roster__item").count();
        expect(itemCount, "phonetic contrastive item count").toBeGreaterThanOrEqual(8);
        expect(itemCount, "phonetic contrastive item count").toBeLessThanOrEqual(12);
      } else {
        const toggle = page.locator(".foundation-matrix__toggle");
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator(".foundation-matrix__row")).toHaveCount(8);
      }

      const exerciseCount = await page.locator(".lesson-exercise").count();
      expect(exerciseCount, "exercise count").toBeGreaterThanOrEqual(8);
      expect(exerciseCount, "exercise count").toBeLessThanOrEqual(12);

      const keys = await readExerciseKeys(page, lesson.lessonId);
      expect(keys, "every exercise resolves a round+key").toHaveLength(exerciseCount);

      if (!lesson.phonetic) {
        // Semantic lessons: exactly 10 exercises, an exact 5+5 round split
        // (round labels + transfer metadata, carried as the definitionId's
        // `-round-1-`/`-round-2-` segment — the real, tree-shaken
        // `PracticeRounds` prose UI is fixture-only, never in the
        // production lesson render).
        expect(exerciseCount, "semantic exercise count").toBe(10);
        const roundOne = keys.filter((k) => k.round === 1);
        const roundTwo = keys.filter((k) => k.round === 2);
        expect(roundOne, "round 1 size").toHaveLength(5);
        expect(roundTwo, "round 2 size").toHaveLength(5);
      }

      // >=5 unique target keys, each reused at most twice — the DOM-safe
      // proxy for the authoring-time `visibleTargetKey` diversity gate
      // (the canonical Japanese sentence itself, which is deliberately
      // never emitted as DOM metadata — see `authoring.ts`'s
      // `FORBIDDEN_FIELD_NAMES`). Semantic rounds are constructed with
      // unique variant ids by `assertRoundShape`, so this always holds by
      // construction there; phonetic lessons declare it directly
      // ("phonetic uses explicit contract" per `A1_PHONETIC_PRACTICE_MIN_UNIQUE`
      // / `_MAX_REUSE`).
      const counts = new Map<string, number>();
      for (const { key } of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
      expect(counts.size, "unique target/item keys").toBeGreaterThanOrEqual(5);
      for (const [key, count] of counts) {
        expect(count, `reuse of target/item key "${key}"`).toBeLessThanOrEqual(2);
      }

      const canDo = page.locator(".a1-lesson-recap__can-do");
      await expect(canDo).toBeVisible();
      await expect(canDo).toContainText("Can-do:");

      await assertNoRuntimeErrors(page, observers);
    });
  }
});

test.describe("representative desktop + mobile deep interaction", () => {
  const SEMANTIC = { moduleId: "introductions", lessonId: "introductions-1" } as const;
  const SEMANTIC_URL = routeUrls.lesson(SEMANTIC.moduleId, SEMANTIC.lessonId);

  test("matrix disclosure expands from the curated 3-row subset to all 8 authored rows", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SEMANTIC_URL);

    const toggle = page.locator(".foundation-matrix__toggle");
    await expect(page.locator(".foundation-matrix__row")).toHaveCount(3);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(page.locator(".foundation-matrix__row")).toHaveCount(8);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await toggle.click();
    await expect(page.locator(".foundation-matrix__row")).toHaveCount(3);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await assertNoRuntimeErrors(page, observers);
  });

  test("the matrix disclosure is operable by keyboard and by pointer alike", async ({ page }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SEMANTIC_URL);

    const toggle = page.locator(".foundation-matrix__toggle");
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".foundation-matrix__row")).toHaveCount(8);

    // The same control is equally operable via a pointer click/tap — no
    // touch-only or keyboard-only escape hatch.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    const offenders = await auditTouchTargets(page);
    expect(offenders, JSON.stringify(offenders)).toEqual([]);

    await assertNoRuntimeErrors(page, observers);
  });

  test("locale and script toggles change the rail label and hide the hiragana row without breaking the lesson", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SEMANTIC_URL);

    // The settings controls render twice (desktop bar + mobile drawer);
    // exactly one copy is actually visible per viewport, so this suite
    // never assumes which and instead opens the drawer only if needed.
    const desktopEn = page.locator(".localetoggle:visible button", { hasText: "EN" });
    if ((await desktopEn.count()) === 0) {
      await page.locator(".header__settings-trigger").click();
    }
    const enButton = page.locator(".localetoggle:visible button", { hasText: "EN" });
    await expect(enButton).toBeVisible();
    await enButton.click();

    // Rail label flips from the Italian "Ripasso" to the English "Recap".
    await expect(page.locator(":visible", { hasText: "Recap" }).first()).toBeVisible();

    const romajiButton = page.locator(".scripttoggle:visible button", { hasText: "Rōmaji" });
    await expect(page.locator(".foundation-matrix__jp").first()).toBeVisible();
    await romajiButton.click();
    await expect(page.locator(".foundation-matrix__jp")).toHaveCount(0);

    await assertNoContentErrorNotice(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("an unsupported speech engine falls back gracefully without blocking the lesson", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await installSpeechFake(page, { supported: false });
    await gotoReady(page, SEMANTIC_URL);

    const block = page.locator(".spoken-attempt");
    await expect(block).toBeVisible();
    await expect(block).toContainText(
      "Questo browser non trasforma la voce in testo. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    );
    // Never blocks the rest of the lesson.
    await expect(page.locator(".lesson-exercise").first()).toBeVisible();

    await assertNoContentErrorNotice(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("reloading mid-lesson keeps the visited-evidence state and renders identically", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SEMANTIC_URL);

    const status = page.locator(".lesson-exercises__status");
    await expect(status).toHaveAttribute("data-state", "visited");

    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });

    await expect(status).toHaveAttribute("data-state", "visited");
    await expect(page.locator(".a1-lesson-recap__can-do")).toBeVisible();
    await assertNoContentErrorNotice(page);
    await assertNoRuntimeErrors(page, observers);
  });

  test("a lesson-rail anchor link scrolls its section into view without stealing focus", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, SEMANTIC_URL);

    const recapLink = page
      .locator(".lesson-rail__step:visible, .lesson-rail-mobile__step:visible")
      .filter({ hasText: "Ripasso" });
    await expect(recapLink).toHaveCount(1);
    await recapLink.click();

    // RouteScrollManager documents that it never moves focus itself; the
    // clicked link keeps it.
    await expect(recapLink).toBeFocused();

    // The section must land at/just below the real sticky chrome — not an
    // arbitrary pixel guess, since the sticky header's height differs
    // between the desktop and mobile projects, and mobile additionally
    // stacks a sticky `.lesson-rail-mobile` beneath the header (collapsed
    // to a zero-size rect on desktop, where it plays no part).
    const headerEdge = await headerBottom(page);
    const mobileRailEdge = (await rectOf(page, ".lesson-rail-mobile"))?.bottom ?? 0;
    const stickyEdge = Math.max(headerEdge, mobileRailEdge);

    // RouteScrollManager schedules the actual scroll on the next animation
    // frame after the location change commits, so poll rather than
    // asserting immediately after the click.
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
    expect(recapTop, "recap section scrolled near the viewport top").toBeGreaterThanOrEqual(-2);

    await assertNoHorizontalOverflow(page);
    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("capstones and checkpoint", () => {
  /** A fully consolidated capstone: every one of its 10 real exercise
   * definitionIds already attempted+accepted, matching the exact
   * `{lessonId}-round-{1|2}::{lessonId}-{m|t}{n}` shape confirmed live. */
  function consolidatedCapstone(lessonId: string, at: string) {
    const ids = [
      ...[1, 2, 3, 6, 7].map((n) => `${lessonId}-round-1::${lessonId}-m${n}`),
      ...[1, 2, 3, 4, 5].map((n) => `${lessonId}-round-2::${lessonId}-t${n}`),
    ];
    return {
      visitedAt: at,
      practicedAt: at,
      consolidatedAt: at,
      attemptedExerciseIds: ids,
      acceptedExerciseIds: ids,
    };
  }

  /** capstones-4, missing exactly its `m2` (radio) exercise — practiced
   * (required exercises fully attempted at least once) but not yet
   * consolidated, so one more live accept finishes it. */
  function almostConsolidatedCapstoneFour(at: string) {
    const lessonId = "capstones-4";
    const withoutM2 = [
      `${lessonId}-round-1::${lessonId}-m3`,
      `${lessonId}-round-1::${lessonId}-m1`,
      `${lessonId}-round-1::${lessonId}-m7`,
      `${lessonId}-round-1::${lessonId}-m6`,
      ...[1, 2, 3, 4, 5].map((n) => `${lessonId}-round-2::${lessonId}-t${n}`),
    ];
    return {
      visitedAt: at,
      practicedAt: at,
      consolidatedAt: null,
      attemptedExerciseIds: [...withoutM2, `${lessonId}-round-1::${lessonId}-m2`],
      acceptedExerciseIds: withoutM2,
    };
  }

  const AT = "2026-01-01T00:00:00.000Z";

  function seedFixture() {
    return {
      schemaVersion: 4,
      catalogVersion: "a1-a2-v1",
      levels: {
        a1: {
          lessons: {
            "capstones-1": consolidatedCapstone("capstones-1", AT),
            "capstones-2": consolidatedCapstone("capstones-2", AT),
            "capstones-3": consolidatedCapstone("capstones-3", AT),
            "capstones-4": almostConsolidatedCapstoneFour(AT),
          },
          // Seeded directly (never fabricated from lesson visits): proves
          // Home's tier rendering distinguishes a mere visit from real
          // practiced/demonstrated evidence, independent of the checkpoint
          // mechanism under test below.
          canDos: {
            "a1-can-do-actions": {
              canDoId: "a1-can-do-actions",
              visitedLessonIds: ["actions-1"],
              practicedLessonIds: [],
              acceptedTransferExerciseIds: [],
              checkpointAttemptIds: [],
              lastUpdatedAt: AT,
            },
          },
          checkpointAttempts: [],
          lastVisitedLessonId: "capstones-4",
          reviewQueue: [],
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
      updatedAt: AT,
    };
  }

  async function seedProgress(page: Page, value: unknown): Promise<void> {
    await page.addInitScript((seed: string) => {
      localStorage.setItem("nihongo.course.progress", seed);
    }, JSON.stringify(value));
  }

  async function readProgress(page: Page): Promise<any> {
    return page.evaluate(() => {
      const raw = localStorage.getItem("nihongo.course.progress");
      return raw ? JSON.parse(raw) : null;
    });
  }

  test("the four capstone routes render real synthesis content (no new concept/sense, no content-error notice)", async ({
    page,
  }) => {
    // `defineA1Lesson`'s synthesis-new-content gate (authoring.ts) already
    // enforces, at module-eval/build time, that every `contract: "synthesis"`
    // lesson (all four capstones) declares empty
    // `introducedConceptIds`/`introducedSenseIds` — violating it throws an
    // `AuthoringError` and the whole SPA fails to load. So the strongest,
    // most honest runtime proof available here is that all four routes
    // really do render real, error-free content (rather than re-deriving the
    // authoring invariant from rendered prose, which would be a fragile
    // content-OCR check the failure-discipline rules out).
    const observers = await setupPageObservers(page);
    for (let n = 1; n <= 4; n += 1) {
      const lessonId = `capstones-${n}`;
      await gotoReady(page, routeUrls.lesson("capstones", lessonId));
      await assertNoContentErrorNotice(page);
      await expect(page.locator(".lesson-exercise")).toHaveCount(10);
      await expect(page.locator(".a1-lesson-recap__can-do")).toBeVisible();
    }
    await assertNoRuntimeErrors(page, observers);
  });

  test("a checkpoint attempt is recorded only from a real accepted acceptance, never from a mere visit or reload, and Home reflects only genuine evidence", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedProgress(page, seedFixture());

    // 1) Before any live interaction: Home must show "not attempted" and the
    // seeded visited-only Can-do must render as "Visitato", never inflated.
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".checkpoint-state__body")).toContainText(
      "Non hai ancora affrontato gli scenari della verifica A1.",
    );
    const actionsItem = page.locator('.can-do-summary__item[data-can-do-id="a1-can-do-actions"]');
    await expect(actionsItem.locator(".can-do-summary__tier-text")).toHaveText("Visitato");
    await expect(page.locator(".can-do-summary__count")).toContainText("0 di 15");

    // 2) Merely visiting the almost-consolidated capstones-4 lesson (which
    // is already "practiced", not "consolidated") must not synthesize an
    // attempt either.
    await gotoReady(page, routeUrls.lesson("capstones", "capstones-4"));
    await expect(page.locator(".lesson-exercises__status")).toHaveAttribute(
      "data-state",
      "practiced",
    );
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".checkpoint-state__body")).toContainText(
      "Non hai ancora affrontato gli scenari della verifica A1.",
    );

    // 3) A single live, correct submission of the one missing exercise
    // (the radio choice, m2) is the only thing that flips capstones-4 to
    // consolidated and, as a side effect, records the checkpoint attempt.
    await gotoReady(page, routeUrls.lesson("capstones", "capstones-4"));
    const radioCard = page.locator('.lesson-exercise[aria-labelledby*="capstones-4-m2"]');
    await radioCard.locator('input[type=radio][value^="capstones-4-m2#"]').check();
    await radioCard.locator("button[type=submit]").click();
    await expect(page.locator(".lesson-exercises__status")).toHaveAttribute(
      "data-state",
      "consolidated",
    );

    // 4) Home now shows a genuine attempted state: 40 accepted exercises
    // (4 capstones x 10 each) across the fixed 15 sampled Can-dos, and every
    // sampled Can-do — including the previously visited-only one — is
    // folded to "demonstrated" by the checkpoint-attempt evidence fold.
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".checkpoint-state__body")).toContainText(
      "Hai affrontato gli scenari della verifica A1, con 40 esercizi accettati su 15 Can-do campionati.",
    );
    await expect(page.locator(".can-do-summary__count")).toContainText("15 di 15");
    await expect(actionsItem.locator(".can-do-summary__tier-text")).toHaveText("Dimostrato");
    await expect(page.locator(".can-do-summary__tier--demonstrated")).toHaveCount(15);

    const afterFirstAttempt = await readProgress(page);
    expect(afterFirstAttempt.levels.a1.checkpointAttempts).toHaveLength(1);

    // 5) Idempotent reload: the single recorded attempt is never duplicated
    // or re-triggered just by loading Home again. A real `reload()` re-runs
    // every previously registered init script (including the original seed
    // this test installed before any live interaction), so the just-created
    // live state is captured and re-applied as a fresh, later-registered
    // init script — otherwise the reload would only prove the *seed* was
    // stable, not that the app's own persisted state survives a reload.
    const liveState = await page.evaluate(
      () => localStorage.getItem("nihongo.course.progress"),
    );
    await page.addInitScript((value: string | null) => {
      if (value !== null) localStorage.setItem("nihongo.course.progress", value);
    }, liveState);
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    await expect(page.locator(".checkpoint-state__body")).toContainText(
      "con 40 esercizi accettati su 15 Can-do campionati",
    );
    const afterReload = await readProgress(page);
    expect(afterReload.levels.a1.checkpointAttempts).toHaveLength(1);
    expect(afterReload.levels.a1.checkpointAttempts[0].id).toBe(
      afterFirstAttempt.levels.a1.checkpointAttempts[0].id,
    );

    await assertNoRuntimeErrors(page, observers);
  });
});

test.describe("V3 -> V4 migration, live", () => {
  const STORAGE_KEY = "nihongo.course.progress";

  function v3Lesson(overrides: {
    visitedAt?: string | null;
    practicedAt?: string | null;
    consolidatedAt?: string | null;
    attemptedExerciseIds?: string[];
    acceptedExerciseIds?: string[];
  } = {}) {
    return {
      visitedAt: overrides.visitedAt ?? null,
      practicedAt: overrides.practicedAt ?? null,
      consolidatedAt: overrides.consolidatedAt ?? null,
      attemptedExerciseIds: overrides.attemptedExerciseIds ?? [],
      acceptedExerciseIds: overrides.acceptedExerciseIds ?? [],
    };
  }

  function v3Base(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: {},
      lastVisitedLessonId: null,
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
      updatedAt: "2025-06-01T00:00:00.000Z",
      ...overrides,
    };
  }

  async function seedV3(page: Page, value: unknown): Promise<void> {
    await page.addInitScript((seed: string) => {
      localStorage.setItem("nihongo.course.progress", seed);
    }, JSON.stringify(value));
  }

  async function readProgress(page: Page): Promise<any> {
    return page.evaluate((key: string) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, STORAGE_KEY);
  }

  test("unchanged practiced/consolidated evidence on a 1:1-mapped lesson is safely reset with a truthful notice", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "introductions-1": v3Lesson({
            visitedAt: "2025-01-01T00:00:00.000Z",
            practicedAt: "2025-01-02T00:00:00.000Z",
            consolidatedAt: "2025-01-03T00:00:00.000Z",
            attemptedExerciseIds: ["introductions-1-ex-1", "introductions-1-ex-2"],
            acceptedExerciseIds: ["introductions-1-ex-1", "introductions-1-ex-2"],
          }),
        },
        lastVisitedLessonId: "introductions-1",
      }),
    );

    await gotoReady(page, routeUrls.home);

    const progress = await readProgress(page);
    expect(progress.schemaVersion).toBe(4);
    const migrated = progress.levels.a1.lessons["introductions-1"];
    expect(migrated.visitedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(migrated.practicedAt).toBeNull();
    expect(migrated.consolidatedAt).toBeNull();
    expect(migrated.attemptedExerciseIds).toEqual([]);
    expect(migrated.acceptedExerciseIds).toEqual([]);
    expect(progress.migrationNotice.preservedVisitedLessonIds).toContain("introductions-1");
    expect(progress.migrationNotice.resetEvidenceLessonIds).toContain("introductions-1");
    expect(progress.migrationNotice.acknowledgedAt).toBeNull();

    // The notice is truthful and visible (not merely an in-memory shape).
    await expect(page.locator(".notice--info")).toContainText(
      "I tuoi progressi nel percorso sono stati ricostruiti",
    );

    // The safely matched visit really is reflected on the map: expand the
    // introductions module and confirm the lesson shows "Visitato" (never
    // "Esercitato"/"Dimostrato", since that evidence was reset).
    const disclosure = page.locator('.module-card:has(a[href*="introductions-1"]) .module-card__disclosure');
    if ((await disclosure.getAttribute("aria-expanded")) === "false") {
      await disclosure.click();
    }
    const lessonRow = page.locator('.module-card__lesson-link[href*="introductions-1"]');
    await expect(lessonRow.locator(".module-card__lesson-state--visited")).toBeVisible();
    await expect(lessonRow.locator(".module-card__lesson-state--demonstrated")).toHaveCount(0);
    await expect(lessonRow.locator(".module-card__lesson-state--practiced")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
  });

  test("the retired sounds-5 lesson aliases onto sounds-4, keeping the earliest visitedAt", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          // sounds-5 (retired) visited first, with stronger evidence that
          // must be reset; sounds-4 visited later on its own.
          "sounds-5": v3Lesson({
            visitedAt: "2025-01-01T00:00:00.000Z",
            consolidatedAt: "2025-01-01T01:00:00.000Z",
          }),
          "sounds-4": v3Lesson({ visitedAt: "2025-01-05T00:00:00.000Z" }),
        },
      }),
    );

    await gotoReady(page, routeUrls.home);
    const progress = await readProgress(page);
    expect(progress.levels.a1.lessons["sounds-5"]).toBeUndefined();
    const merged = progress.levels.a1.lessons["sounds-4"];
    expect(merged.visitedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(progress.migrationNotice.resetEvidenceLessonIds).toContain("sounds-4");

    await assertNoRuntimeErrors(page, observers);
  });

  test("the three named capstone scenarios map onto their numbered v4 destinations", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "capstones-self-introduction": v3Lesson({ visitedAt: "2025-02-01T00:00:00.000Z" }),
          "capstones-everyday-outing": v3Lesson({ visitedAt: "2025-02-02T00:00:00.000Z" }),
          "capstones-travel-day": v3Lesson({ visitedAt: "2025-02-03T00:00:00.000Z" }),
        },
      }),
    );

    await gotoReady(page, routeUrls.home);
    const progress = await readProgress(page);
    const lessons = progress.levels.a1.lessons;
    expect(lessons["capstones-1"].visitedAt).toBe("2025-02-01T00:00:00.000Z");
    expect(lessons["capstones-2"].visitedAt).toBe("2025-02-02T00:00:00.000Z");
    expect(lessons["capstones-3"].visitedAt).toBe("2025-02-03T00:00:00.000Z");
    expect(progress.migrationNotice.preservedVisitedLessonIds).toEqual(
      expect.arrayContaining(["capstones-1", "capstones-2", "capstones-3"]),
    );

    await assertNoRuntimeErrors(page, observers);
  });

  test("the unsafe capstones-orientation source has no v4 twin and is retained as an orphan", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "capstones-orientation": v3Lesson({
            visitedAt: "2025-03-01T00:00:00.000Z",
            consolidatedAt: "2025-03-01T00:00:00.000Z",
          }),
        },
      }),
    );

    await gotoReady(page, routeUrls.home);
    const progress = await readProgress(page);
    expect(progress.levels.a1.lessons["capstones-orientation"]).toBeUndefined();
    expect(progress.levels.a1.orphanedLessonIds).toContain("capstones-orientation");

    await assertNoRuntimeErrors(page, observers);
  });

  test("an unknown lesson id is retained as an orphan and any review-queue entries are unconditionally cleared", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "totally-unknown-lesson-xyz": v3Lesson({ visitedAt: "2025-04-01T00:00:00.000Z" }),
        },
        reviewQueue: [
          {
            reviewKey: "old-key-1",
            lessonId: "introductions-1",
            exerciseDefinitionId: "old-ex-1",
            targetConceptIds: [],
            targetLexemeIds: [],
            mistakeCount: 1,
            lastMistakeAt: "2025-04-01T00:00:00.000Z",
          },
          {
            reviewKey: "old-key-2",
            lessonId: "sounds-1",
            exerciseDefinitionId: "old-ex-2",
            targetConceptIds: [],
            targetLexemeIds: [],
            mistakeCount: 2,
            lastMistakeAt: "2025-04-02T00:00:00.000Z",
          },
        ],
      }),
    );

    await gotoReady(page, routeUrls.home);
    const progress = await readProgress(page);
    expect(progress.levels.a1.orphanedLessonIds).toContain("totally-unknown-lesson-xyz");
    // The new catalog's review keys share nothing with the old ones: the
    // whole queue is unconditionally cleared, with no per-entry orphan
    // accounting (`orphanedReviewKeys` stays empty too).
    expect(progress.levels.a1.reviewQueue).toEqual([]);
    expect(progress.levels.a1.orphanedReviewKeys).toEqual([]);

    await assertNoRuntimeErrors(page, observers);
  });

  test("last-visited carries through the id map, and A2 is always completely empty after migration", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "capstones-self-introduction": v3Lesson({ visitedAt: "2025-05-01T00:00:00.000Z" }),
        },
        lastVisitedLessonId: "capstones-self-introduction",
      }),
    );

    await gotoReady(page, routeUrls.home);
    const progress = await readProgress(page);
    expect(progress.levels.a1.lastVisitedLessonId).toBe("capstones-1");
    expect(progress.levels.a2).toEqual({
      lessons: {},
      canDos: {},
      checkpointAttempts: [],
      lastVisitedLessonId: null,
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
    });

    await assertNoRuntimeErrors(page, observers);
  });

  test("a failed storage write during migration surfaces truthfully without corrupting the in-memory result", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedV3(
      page,
      v3Base({
        lessons: {
          "introductions-1": v3Lesson({ visitedAt: "2025-06-01T00:00:00.000Z" }),
        },
      }),
    );
    // Break persistence before the app boots (migration writes the
    // migrated v4 straight back on load): `getItem` stays real so the
    // migration itself still reads the seeded v3 payload; only `setItem`
    // throws, matching a real quota-exceeded/private-browsing failure.
    await page.addInitScript(() => {
      const proto = Object.getPrototypeOf(window.localStorage) as Storage;
      const originalSetItem = proto.setItem.bind(window.localStorage);
      let allowed = 0;
      Object.defineProperty(window.localStorage, "setItem", {
        configurable: true,
        value: (key: string, value: string) => {
          allowed += 1;
          if (allowed <= 0) return originalSetItem(key, value);
          throw new DOMException("simulated storage failure", "QuotaExceededError");
        },
      });
    });

    await gotoReady(page, routeUrls.home);

    // Persistence-unavailable warning is shown...
    await expect(page.locator(".notice--warning")).toContainText(
      "I progressi non verranno salvati",
    );
    // ...yet the in-memory migrated result is still fully usable this
    // session: the migration notice and the safely-matched visit both
    // still render correctly even though the disk write failed.
    await expect(page.locator(".notice--info")).toContainText(
      "I tuoi progressi nel percorso sono stati ricostruiti",
    );
    const disclosure = page.locator('.module-card:has(a[href*="introductions-1"]) .module-card__disclosure');
    if ((await disclosure.getAttribute("aria-expanded")) === "false") {
      await disclosure.click();
    }
    await expect(
      page
        .locator('.module-card__lesson-link[href*="introductions-1"]')
        .locator(".module-card__lesson-state--visited"),
    ).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
  });

  test("an already-valid V4 payload is passed through unchanged and reloads idempotently", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    const validV4 = {
      schemaVersion: 4,
      catalogVersion: "a1-a2-v1",
      levels: {
        a1: {
          lessons: {
            "introductions-1": {
              visitedAt: "2026-01-01T00:00:00.000Z",
              practicedAt: null,
              consolidatedAt: null,
              attemptedExerciseIds: [],
              acceptedExerciseIds: [],
            },
          },
          canDos: {},
          checkpointAttempts: [],
          lastVisitedLessonId: "introductions-1",
          reviewQueue: [],
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
    };
    await seedV3(page, validV4);

    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".notice--info").filter({ hasText: "ricostruiti" })).toHaveCount(0);
    let progress = await readProgress(page);
    expect(progress.schemaVersion).toBe(4);
    expect(progress.migrationNotice).toBeNull();
    expect(progress.levels.a1.lessons["introductions-1"].visitedAt).toBe(
      "2026-01-01T00:00:00.000Z",
    );

    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    progress = await readProgress(page);
    expect(progress.schemaVersion).toBe(4);
    expect(progress.migrationNotice).toBeNull();
    await expect(page.locator(".notice--info").filter({ hasText: "ricostruiti" })).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
  });
});
