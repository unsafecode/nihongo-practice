import { expect, test, type Page } from "@playwright/test";
import {
  A2_EVIDENCE_ACTIVITY_ID,
  A2_EVIDENCE_CAN_DO_ID,
  A2_EVIDENCE_CHECKPOINT_ATTEMPT_ID,
  A2_EVIDENCE_LESSON_ID,
  A2_EVIDENCE_REVIEW_KEY,
  ALL_144_CURRENT_LESSON_ENTRIES,
  ALL_144_CURRENT_LESSON_ROUTES,
  ALL_CURRENT_LESSON_ROUTE_COUNT,
  assertNoRuntimeErrors,
  assertSameOriginStaticAssetsOnly,
  evidenceRichV4Progress,
  gotoReady,
  hashNavigate,
  HISTORICAL_ACTIVITY_IDS,
  readStoredProgress,
  recordRequests,
  REHOMED_EVIDENCE_LESSON_ID,
  REHOMED_LAST_VISITED_LESSON_ID,
  RETAINED_A1_EVIDENCE_ACTIVITY_ID,
  RETAINED_A1_EVIDENCE_CAN_DO_ID,
  RETAINED_A1_EVIDENCE_LESSON_ID,
  routesForLevel,
  seedFreshLearner,
  seedV4Progress,
} from "./baseFixtures";

/**
 * Task 18 — the complete Base learner journey, driven against the *built*
 * production preview at the real GitHub Pages base. Every claim below comes
 * from a real browser run: real navigations, real localStorage, the real
 * shipped V4→V5 ownership migration, and the app's own persisted output read
 * back out of storage.
 *
 * The 144-route smoke matrix is *derived* from the three release manifests in
 * `baseFixtures.ts` (Base 40 + retained A1 44 + A2 60) and its length is
 * asserted there at module load, before any test below is defined, so the
 * matrix can never silently shrink.
 */

// The derived length is re-asserted here, at collection time, so this spec
// refuses to define a reduced smoke matrix even if it were imported stale.
expect(ALL_144_CURRENT_LESSON_ROUTES).toHaveLength(ALL_CURRENT_LESSON_ROUTE_COUNT);

/**
 * The smoke matrix drives every one of the 144 routes through a real
 * navigation, batched into groups that share one document load: the first
 * route in each batch is a full `page.goto` and the rest are real in-app hash
 * navigations — the same client-side route change a learner's link click
 * performs. Coverage is complete (every route is visited and asserted); only
 * the redundant document reload between sibling routes is amortized.
 */
const SMOKE_BATCH_SIZE = 8;

function batched<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

const SMOKE_BATCHES = batched([...ALL_144_CURRENT_LESSON_ENTRIES], SMOKE_BATCH_SIZE);

async function assertLessonRouteRendered(page: Page, route: string): Promise<void> {
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading, `${route} renders a level-1 heading`).toBeVisible();
  await expect(heading, `${route} heading has real text`).toHaveText(/\S/);
  // A real lesson page, not the invalid-route redirect back to the map.
  expect(await page.evaluate(() => window.location.hash), `${route} stayed on its route`).toBe(
    `#${route}`,
  );
}

test.describe("Base level runtime", () => {
  test("fresh learner defaults to Base and all levels stay open", async ({ page }) => {
    await seedFreshLearner(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");
    await expect(page.locator('[data-level="a0"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator('[data-level="a1"]')).toBeEnabled();
    await expect(page.locator('[data-level="a2"]')).toBeEnabled();
  });

  test("a fresh learner's Base map shows the whole 10-module / 40-lesson shape", async ({
    page,
  }) => {
    const recording = await recordRequests(page);
    await seedFreshLearner(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");

    await expect(page.locator(".course-hero__shape")).toHaveText(/10.*40|40.*10/);
    await expect(page.locator(".module-card")).toHaveCount(10);
    await expect(page.locator("h2#course-level-heading")).toHaveText(/\S/);
    // Neither A1 nor A2 is gated behind Base: both remain real, followable links.
    for (const level of ["a1", "a2"] as const) {
      const option = page.locator(`[data-level="${level}"]`);
      await expect(option).toHaveAttribute("href", new RegExp(`livello=${level}`));
      await expect(option).not.toHaveAttribute("aria-disabled", "true");
    }

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("selecting each level keeps every level reachable and swaps the map", async ({
    page,
  }) => {
    await seedFreshLearner(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");

    await page.locator('[data-level="a1"]').click();
    await expect(page.locator('[data-level="a1"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".module-card")).toHaveCount(11);

    await page.locator('[data-level="a2"]').click();
    await expect(page.locator('[data-level="a2"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".module-card")).toHaveCount(15);

    await page.locator('[data-level="a0"]').click();
    await expect(page.locator('[data-level="a0"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".module-card")).toHaveCount(10);
  });
});

test.describe("every current lesson route is reachable", () => {
  for (const batch of SMOKE_BATCHES) {
    const label = `${batch[0]!.route} … ${batch[batch.length - 1]!.route}`;
    test(`routes ${label} are reachable`, async ({ page }) => {
      const recording = await recordRequests(page);
      await seedFreshLearner(page);
      await gotoReady(page, `/nihongo-practice/#${batch[0]!.route}`);
      await assertLessonRouteRendered(page, batch[0]!.route);

      for (const entry of batch.slice(1)) {
        await hashNavigate(page, entry.route);
        await assertLessonRouteRendered(page, entry.route);
      }

      assertNoRuntimeErrors(recording);
      assertSameOriginStaticAssetsOnly(recording);
    });
  }

  test("the smoke matrix covered all 144 derived routes exactly once", () => {
    const covered = SMOKE_BATCHES.flat().map((entry) => entry.route);
    expect(covered).toEqual([...ALL_144_CURRENT_LESSON_ROUTES]);
    expect(new Set(covered).size).toBe(ALL_CURRENT_LESSON_ROUTE_COUNT);
    expect(routesForLevel("a0")).toHaveLength(40);
    expect(routesForLevel("a1")).toHaveLength(44);
    expect(routesForLevel("a2")).toHaveLength(60);
  });
});

test.describe("evidence-rich V4 progress migrates into the Base ownership split", () => {
  test("a returning learner is resumed on their rehomed Base lesson", async ({ page }) => {
    const recording = await recordRequests(page);
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");

    // Resume level is Base because the last visited lesson was rehomed there.
    await expect(page.locator('[data-level="a0"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".course-hero__actions .action--primary")).toHaveAttribute(
      "href",
      `#/percorso/time-movement/${REHOMED_LAST_VISITED_LESSON_ID}`,
    );
    // Both rehomed lessons kept their visit, so Base counts two of forty.
    await expect(page.locator(".course-hero__progress-summary")).toHaveText(/2.*40/);

    const stored = await readStoredProgress(page);
    expect(stored.schemaVersion).toBe(5);
    expect(stored.migrationNotice?.resumeLevel).toBe("a0");
    expect(stored.levels.a0!.lastVisitedLessonId).toBe(REHOMED_LAST_VISITED_LESSON_ID);
    expect(Object.keys(stored.levels.a0!.lessons).sort()).toEqual(
      [REHOMED_EVIDENCE_LESSON_ID, REHOMED_LAST_VISITED_LESSON_ID].sort(),
    );
    const rehomed = stored.levels.a0!.lessons[REHOMED_EVIDENCE_LESSON_ID]!;
    const source = evidenceRichV4Progress().levels.a1.lessons[REHOMED_EVIDENCE_LESSON_ID]!;
    expect(rehomed).toEqual(source);

    assertNoRuntimeErrors(recording);
    assertSameOriginStaticAssetsOnly(recording);
  });

  test("the rehomed lesson is reachable under Base and still shows its evidence", async ({
    page,
  }) => {
    await seedV4Progress(page);
    await gotoReady(page, `/nihongo-practice/#/percorso/sounds/${REHOMED_EVIDENCE_LESSON_ID}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await gotoReady(page, "/nihongo-practice/#/percorso?livello=base");
    const lessonLink = page.locator(
      `.module-card__lesson-link[href$="/${REHOMED_EVIDENCE_LESSON_ID}"]`,
    );
    await expect(lessonLink).toHaveCount(1);
  });

  test("retained A1 evidence stays in A1 and its lesson stays reachable", async ({ page }) => {
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso?livello=a1");

    await expect(page.locator('[data-level="a1"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".course-hero__progress-summary")).toHaveText(/1.*44/);

    const stored = await readStoredProgress(page);
    const a1 = stored.levels.a1!;
    expect(Object.keys(a1.lessons)).toEqual([RETAINED_A1_EVIDENCE_LESSON_ID]);
    expect(a1.lessons[RETAINED_A1_EVIDENCE_LESSON_ID]!.acceptedExerciseIds).toEqual([
      RETAINED_A1_EVIDENCE_ACTIVITY_ID,
    ]);
    expect(Object.keys(a1.canDos)).toEqual([RETAINED_A1_EVIDENCE_CAN_DO_ID]);
    expect(a1.reviewQueue.map((entry) => entry.reviewKey)).toEqual([
      `${RETAINED_A1_EVIDENCE_LESSON_ID}:${RETAINED_A1_EVIDENCE_ACTIVITY_ID}`,
    ]);

    await gotoReady(
      page,
      `/nihongo-practice/#/percorso/introductions/${RETAINED_A1_EVIDENCE_LESSON_ID}`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("A2 evidence comes through the migration unchanged", async ({ page }) => {
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso?livello=a2");

    const stored = await readStoredProgress(page);
    const a2 = stored.levels.a2!;
    const sourceA2 = evidenceRichV4Progress().levels.a2;

    expect(a2.lessons).toEqual(sourceA2.lessons);
    expect(a2.checkpointAttempts).toEqual(sourceA2.checkpointAttempts);
    expect(a2.lastVisitedLessonId).toBe(A2_EVIDENCE_LESSON_ID);
    expect(a2.reviewQueue.map((entry) => entry.reviewKey)).toEqual([A2_EVIDENCE_REVIEW_KEY]);
    // The only schema-level change is the additive V5 field, defaulted empty.
    expect(a2.canDos[A2_EVIDENCE_CAN_DO_ID]).toEqual({
      ...sourceA2.canDos[A2_EVIDENCE_CAN_DO_ID],
      historicalCheckpointRefs: [],
    });
    expect(a2.canDos[A2_EVIDENCE_CAN_DO_ID]!.checkpointAttemptIds).toEqual([
      A2_EVIDENCE_CHECKPOINT_ATTEMPT_ID,
    ]);
    expect(a2.canDos[A2_EVIDENCE_CAN_DO_ID]!.acceptedTransferExerciseIds).toEqual([
      A2_EVIDENCE_ACTIVITY_ID,
    ]);
    // No A2 activity was reclassified as historical: A2 never moved.
    expect(a2.historicalActivityDispositions).toEqual([]);

    await expect(page.locator(".course-hero__progress-summary")).toHaveText(/1.*60/);
  });

  test("the migration notice explains the rebuild and stays available as help", async ({
    page,
  }) => {
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");

    const notice = page.locator(".notice--info").first();
    await expect(notice).toBeVisible();
    await expect(notice.locator(".notice__title")).toHaveText(/\S/);
    await expect(notice.locator(".notice__text")).toHaveText(/\S/);
    const help = page.locator(".progress-migration-help");
    await expect(help).toBeVisible();
    const helpBody = (await help.locator(".progress-migration-help__body").innerText()).trim();
    expect(helpBody.length).toBeGreaterThan(80);

    // Acknowledging the one-time notice never removes the historical help.
    await notice.locator(".notice__dismiss").click();
    await expect(page.locator(".notice--info")).toHaveCount(0);
    await expect(help).toBeVisible();

    // …and it survives a real reload, read straight back out of storage.
    await gotoReady(page, "/nihongo-practice/#/percorso");
    await expect(page.locator(".progress-migration-help")).toBeVisible();
    const stored = await readStoredProgress(page);
    expect(stored.migrationNotice).not.toBeNull();
    expect(stored.migrationNotice!.acknowledgedAt).not.toBeNull();
  });

  test("historical activity evidence is explained, never silently dropped", async ({ page }) => {
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");

    const stored = await readStoredProgress(page);
    const notice = stored.migrationNotice!;
    expect(notice.fromSchemaVersion).toBe(4);
    expect(notice.movedLessonIds.sort()).toEqual(
      [REHOMED_EVIDENCE_LESSON_ID, REHOMED_LAST_VISITED_LESSON_ID].sort(),
    );
    expect([...notice.historicalActivityIds].sort()).toEqual(
      [...HISTORICAL_ACTIVITY_IDS].sort(),
    );

    // Every historical activity id is individually accounted for as a real
    // disposition record — the "no evidence drop" contract.
    const dispositions = stored.levels.a0!.historicalActivityDispositions;
    expect(dispositions).toHaveLength(HISTORICAL_ACTIVITY_IDS.length);
    for (const activityId of HISTORICAL_ACTIVITY_IDS) {
      const record = dispositions.find((entry) => entry.activityId === activityId);
      expect(record, `historical activity ${activityId} is accounted for`).toBeTruthy();
      expect(record!.sourceLevel).toBe("a1");
      expect(["same-semantics", "historical-orphan"]).toContain(record!.disposition);
    }

    // The Review queue tells the learner, in plain copy, that older saved
    // review items were set aside rather than pretending they never existed.
    await expect(page.locator(".review-queue__orphaned")).toHaveText(/\S/);
  });

  test("no evidence is dropped: every seeded V4 id survives somewhere in V5", async ({
    page,
  }) => {
    await seedV4Progress(page);
    await gotoReady(page, "/nihongo-practice/#/percorso");
    const stored = await readStoredProgress(page);
    const source = evidenceRichV4Progress();

    const survivingIds = new Set<string>();
    for (const level of Object.values(stored.levels)) {
      for (const lesson of Object.values(level.lessons)) {
        lesson.attemptedExerciseIds.forEach((id) => survivingIds.add(id));
        lesson.acceptedExerciseIds.forEach((id) => survivingIds.add(id));
      }
      for (const canDo of Object.values(level.canDos)) {
        canDo.acceptedTransferExerciseIds.forEach((id) => survivingIds.add(id));
      }
      level.historicalActivityDispositions.forEach((entry) =>
        survivingIds.add(entry.activityId),
      );
      level.reviewQueue.forEach((entry) => survivingIds.add(entry.reviewKey));
      level.orphanedReviewKeys.forEach((key) => survivingIds.add(key));
      level.orphanedLessonIds.forEach((id) => survivingIds.add(id));
    }

    const seededIds = new Set<string>();
    for (const level of Object.values(source.levels)) {
      for (const lesson of Object.values(level.lessons)) {
        lesson.attemptedExerciseIds.forEach((id) => seededIds.add(id));
        lesson.acceptedExerciseIds.forEach((id) => seededIds.add(id));
      }
      level.orphanedLessonIds.forEach((id) => seededIds.add(id));
    }
    const missing = [...seededIds].filter((id) => !survivingIds.has(id));
    expect(missing, "seeded V4 evidence ids with no V5 landing place").toEqual([]);

    // Every seeded lesson id is either a current record or explicitly retained.
    const seededLessonIds = Object.values(source.levels).flatMap((level) =>
      Object.keys(level.lessons),
    );
    const v5LessonIds = new Set(
      Object.values(stored.levels).flatMap((level) => [
        ...Object.keys(level.lessons),
        ...Object.keys(level.orphanedLessonRecords),
      ]),
    );
    expect(seededLessonIds.filter((id) => !v5LessonIds.has(id))).toEqual([]);
  });
});
