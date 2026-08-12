import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  A1_CAPSTONE_LESSON_IDS,
  A1_LESSON_MANIFEST,
} from "../../src/course/a1/manifest";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import type { ExercisePrompt } from "../../src/course/exercises/types";
import {
  CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
  CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
  type CourseProgressV4,
} from "../../src/course/progress/progress";
import {
  assertLocalOnlyNetwork,
  assertNoRuntimeErrors,
  gotoReady,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const STORAGE_KEY = "nihongo.course.progress";
const AT = "2026-01-01T00:00:00.000Z";

function generatedPractice(lessonId: string) {
  const result = buildA1PracticeModel(lessonId);
  if (!result.ok) {
    throw new Error(`Could not resolve current A1 practice for ${lessonId}: ${result.error.code}`);
  }
  return result.model.activities.flatMap((activity) =>
    activity.generatedExercise ? [activity.generatedExercise] : [],
  );
}

function lessonEvidence(
  exerciseIds: readonly string[],
  acceptedIds: readonly string[],
  consolidated: boolean,
) {
  return {
    visitedAt: AT,
    practicedAt: AT,
    consolidatedAt: consolidated ? AT : null,
    attemptedExerciseIds: [...exerciseIds],
    acceptedExerciseIds: [...acceptedIds],
  };
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

/**
 * The empty *schema-V5* level shape (Task 16/18): the V4 level fields plus the
 * two additive Base-ownership fields. Legacy payloads seeded below are still
 * written in their own historical schema — the app migrates them forward, so
 * every assertion reads the V5 result the runtime actually persists.
 */
function emptyLevelV5() {
  return {
    ...emptyLevel(),
    orphanedLessonRecords: {},
    historicalActivityDispositions: [],
  };
}

async function seedProgress(page: Page, value: unknown): Promise<void> {
  await page.addInitScript((seed: string) => {
    localStorage.setItem("nihongo.course.progress", seed);
  }, JSON.stringify(value));
}

async function readProgress(page: Page): Promise<any> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

async function chooseCorrectAnswer(card: Locator, prompt: ExercisePrompt): Promise<void> {
  if (prompt.kind === "choice") {
    const index = await card.locator("input[type=radio]").evaluateAll((inputs, id) =>
      inputs.findIndex((input) => (input as HTMLInputElement).value === id),
    prompt.correctOptionId);
    expect(index, `correct option ${prompt.correctOptionId}`).toBeGreaterThanOrEqual(0);
    await card.locator("input[type=radio]").nth(index).check();
  } else if (prompt.kind === "tile-ordering") {
    for (const tileId of prompt.correctTileIds) {
      const tile = prompt.tiles.find((candidate) => candidate.id === tileId);
      if (!tile) throw new Error(`Missing generated tile ${tileId}`);
      await card.locator(".lesson-exercise__bank button", { hasText: tile.jp }).first().click();
    }
  } else {
    await card.locator(".lesson-exercise__input").fill(prompt.canonicalAnswer);
  }
}

function legacyV3(overrides: Record<string, unknown> = {}) {
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

function legacyLesson(overrides: Record<string, unknown> = {}) {
  return {
    visitedAt: null,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
    ...overrides,
  };
}

test.describe("A1 capstone checkpoint with rebuilt four-card practice", () => {
  test("records a checkpoint only after the final live acceptance of the current four-card fixtures", async ({
    page,
  }) => {
    const capstoneExercises = Object.fromEntries(
      A1_CAPSTONE_LESSON_IDS.map((lessonId) => [
        lessonId,
        generatedPractice(lessonId),
      ]),
    ) as Record<string, ReturnType<typeof generatedPractice>>;
    const finalLessonId = "capstones-4";
    const finalExercises = capstoneExercises[finalLessonId];
    const missing = finalExercises[0];
    if (!missing) throw new Error("capstones-4 must expose a generated exercise");

    const seededLessons: Record<string, ReturnType<typeof lessonEvidence>> = {};
    for (const lessonId of A1_CAPSTONE_LESSON_IDS) {
      const ids = capstoneExercises[lessonId].map((exercise) => exercise.definitionId);
      const accepted =
        lessonId === finalLessonId
          ? ids.filter((id) => id !== missing.definitionId)
          : ids;
      seededLessons[lessonId] = lessonEvidence(
        ids,
        accepted,
        lessonId !== finalLessonId,
      );
    }
    const seed = {
      schemaVersion: 4,
      catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
      levels: {
        a1: {
          ...emptyLevel(),
          lessons: seededLessons,
          lastVisitedLessonId: finalLessonId,
        },
        a2: emptyLevel(),
      },
      migrationNotice: null,
      updatedAt: AT,
    };

    const observers = await setupPageObservers(page);
    await seedProgress(page, seed);
    await gotoReady(page, routeUrls.home);
    let progress = await readProgress(page);
    expect(progress.levels.a1.checkpointAttempts).toEqual([]);

    await gotoReady(page, routeUrls.lesson("capstones", finalLessonId));
    await expect(page.locator(".lesson-exercise")).toHaveCount(4);
    await expect(page.locator(".spoken-attempt")).toHaveCount(1);
    await expect(page.locator(".a1-practice-ladder__status")).toHaveAttribute(
      "data-state",
      "practiced",
    );

    const missingIndex = finalExercises.findIndex(
      (exercise) => exercise.definitionId === missing.definitionId,
    );
    const card = page.locator(".lesson-exercise").nth(missingIndex);
    await chooseCorrectAnswer(card, missing.prompt);
    await card.locator("button[type=submit]").click();
    await expect(card.locator(".lesson-exercise__feedback")).toHaveClass(
      /lesson-exercise__feedback--accepted/,
    );
    await expect(page.locator(".a1-practice-ladder__status")).toHaveAttribute(
      "data-state",
      "consolidated",
    );

    await gotoReady(page, routeUrls.home);
    progress = await readProgress(page);
    expect(progress.levels.a1.checkpointAttempts).toHaveLength(1);
    expect(progress.levels.a1.checkpointAttempts[0].acceptedExerciseIds).toEqual(
      expect.arrayContaining([missing.definitionId]),
    );

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("V3 to V4 A1 migration remains live and idempotent", () => {
  test("preserves safe visits, remaps aliases, and leaves unsafe evidence explicit", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedProgress(
      page,
      legacyV3({
        lessons: {
          "sounds-5": legacyLesson({
            visitedAt: "2025-01-01T00:00:00.000Z",
            consolidatedAt: "2025-01-01T01:00:00.000Z",
          }),
          "sounds-4": legacyLesson({ visitedAt: "2025-01-05T00:00:00.000Z" }),
          "capstones-self-introduction": legacyLesson({
            visitedAt: "2025-02-01T00:00:00.000Z",
          }),
          "capstones-everyday-outing": legacyLesson({
            visitedAt: "2025-02-02T00:00:00.000Z",
          }),
          "capstones-travel-day": legacyLesson({
            visitedAt: "2025-02-03T00:00:00.000Z",
          }),
          "capstones-orientation": legacyLesson({
            visitedAt: "2025-03-01T00:00:00.000Z",
          }),
          "unknown-legacy-lesson": legacyLesson({
            visitedAt: "2025-04-01T00:00:00.000Z",
          }),
        },
        lastVisitedLessonId: "capstones-self-introduction",
        reviewQueue: [
          {
            reviewKey: "legacy-review",
            lessonId: "introductions-1",
            exerciseDefinitionId: "legacy-definition",
            targetConceptIds: [],
            targetLexemeIds: [],
            mistakeCount: 1,
            lastMistakeAt: "2025-04-01T00:00:00.000Z",
          },
        ],
      }),
    );
    await gotoReady(page, routeUrls.home);

    // The runtime now runs the whole V3 -> V4 -> V5 chain in one load, so the
    // persisted result is schema-V5: `sounds-4` is a Base (a0) lesson under the
    // Task 3 ownership move, while the capstones stay in retained A1.
    const progress = await readProgress(page);
    expect(progress.schemaVersion).toBe(5);
    expect(progress.catalogVersion).toBe(CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION);
    expect(progress.levels.a0.lessons["sounds-4"].visitedAt).toBe(
      "2025-01-01T00:00:00.000Z",
    );
    expect(progress.levels.a0.lessons["sounds-4"].consolidatedAt).toBeNull();
    expect(progress.levels.a1.lessons["capstones-1"].visitedAt).toBe(
      "2025-02-01T00:00:00.000Z",
    );
    expect(progress.levels.a1.lessons["capstones-2"].visitedAt).toBe(
      "2025-02-02T00:00:00.000Z",
    );
    expect(progress.levels.a1.lessons["capstones-3"].visitedAt).toBe(
      "2025-02-03T00:00:00.000Z",
    );
    expect(progress.levels.a1.lastVisitedLessonId).toBe("capstones-1");
    expect(progress.levels.a1.orphanedLessonIds).toEqual(
      expect.arrayContaining(["capstones-orientation", "unknown-legacy-lesson"]),
    );
    expect(progress.levels.a1.reviewQueue).toEqual([]);
    expect(progress.levels.a1.orphanedReviewKeys).toEqual([]);
    expect(progress.levels.a2).toEqual(emptyLevelV5());
    // The V4 notice this chain produced is retained as the V5 notice's prior
    // record, so the earlier rebuild is never silently forgotten.
    expect(progress.migrationNotice.fromSchemaVersion).toBe(4);
    expect(progress.migrationNotice.priorNotice.fromSchemaVersion).toBe(3);
    expect(progress.migrationNotice.movedLessonIds).toContain("sounds-4");
    await expect(page.locator(".notice--info")).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("resets old attempt evidence but persists the migrated v3 record across a reload", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await seedProgress(
      page,
      legacyV3({
        lessons: {
          "introductions-1": legacyLesson({
            visitedAt: "2025-01-01T00:00:00.000Z",
            practicedAt: "2025-01-02T00:00:00.000Z",
            consolidatedAt: "2025-01-03T00:00:00.000Z",
            attemptedExerciseIds: ["old-a", "old-b"],
            acceptedExerciseIds: ["old-a", "old-b"],
          }),
        },
      }),
    );
    await gotoReady(page, routeUrls.home);

    let progress = await readProgress(page);
    const migrated = progress.levels.a1.lessons["introductions-1"];
    expect(migrated.visitedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(migrated.practicedAt).toBeNull();
    expect(migrated.consolidatedAt).toBeNull();
    expect(migrated.attemptedExerciseIds).toEqual([]);
    expect(migrated.acceptedExerciseIds).toEqual([]);
    // `introductions-1` stays in A1, so the reset-evidence accounting lives on
    // the retained V3 notice the V5 record carries forward.
    expect(progress.migrationNotice.priorNotice.resetEvidenceLessonIds).toContain(
      "introductions-1",
    );

    const saved = JSON.stringify(progress);
    await page.addInitScript((value: string) => {
      localStorage.setItem("nihongo.course.progress", value);
    }, saved);
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    progress = await readProgress(page);
    expect(progress.catalogVersion).toBe(CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION);
    expect(progress.levels.a1.lessons["introductions-1"].visitedAt).toBe(
      "2025-01-01T00:00:00.000Z",
    );

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("keeps a current v3 payload unchanged and handles unavailable persistence truthfully", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    const current: CourseProgressV4 = {
      schemaVersion: 4,
      catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
      levels: {
        a1: {
          ...emptyLevel(),
          lessons: {
            "introductions-1": lessonEvidence([], [], false),
          },
          lastVisitedLessonId: "introductions-1",
        },
        a2: emptyLevel(),
      },
      migrationNotice: null,
      updatedAt: AT,
    };
    await seedProgress(page, current);
    await gotoReady(page, routeUrls.home);
    let progress = await readProgress(page);
    // A schema-V4 payload is migrated once into schema-V5 without losing any
    // evidence: `introductions-1` is a retained A1 lesson, so it moves nowhere.
    expect(progress).toEqual({
      schemaVersion: 5,
      catalogVersion: CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
      levels: {
        a0: emptyLevelV5(),
        a1: {
          ...emptyLevelV5(),
          lessons: { "introductions-1": lessonEvidence([], [], false) },
          lastVisitedLessonId: "introductions-1",
        },
        a2: emptyLevelV5(),
      },
      migrationNotice: {
        fromSchemaVersion: 4,
        movedLessonIds: [],
        historicalActivityIds: [],
        resumeLevel: "a1",
        priorNotice: null,
        acknowledgedAt: null,
      },
      updatedAt: AT,
    });

    const saved = JSON.stringify(progress);
    await page.addInitScript((value: string) => {
      localStorage.setItem("nihongo.course.progress", value);
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: () => {
          throw new DOMException("simulated storage failure", "QuotaExceededError");
        },
      });
    }, saved);
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    // The already-visited introductory route is deliberately a no-op. Visit a
    // distinct lesson to exercise the failed persistence write through the real
    // `markVisited` mutation rather than expecting a warning on a read-only load.
    await gotoReady(page, routeUrls.lesson("shopping", "shopping-4"));
    await gotoReady(page, routeUrls.home);
    await expect(page.locator(".notice--warning")).toBeVisible();
    progress = await readProgress(page);
    expect(progress.levels.a1.lessons["introductions-1"].visitedAt).toBe(AT);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("A1 manifest runtime alignment", () => {
  test("keeps every capstone route on the synthesis contract and current four-card practice", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    for (const lessonId of A1_CAPSTONE_LESSON_IDS) {
      const entry = A1_LESSON_MANIFEST[lessonId];
      expect(entry.contract).toBe("synthesis");
      await gotoReady(page, routeUrls.lesson(entry.moduleId, lessonId));
      await expect(page.locator(".a1-vocabulary")).toHaveAttribute(
        "data-vocabulary-mode",
        "review",
      );
      await expect(page.locator(".lesson-exercise")).toHaveCount(4);
      await expect(page.locator(".spoken-attempt")).toHaveCount(1);
    }
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
