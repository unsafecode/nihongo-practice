import { expect, test, type Locator, type Page } from "@playwright/test";
import { A1_AREAS } from "../../src/course/a1/areas";
import {
  A1_LESSON_IDS,
  A1_MODULE_IDS,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
} from "../../src/course/a1/manifest";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import { getLessonExercises } from "../../src/course/components/lessonExerciseModel";
import {
  BASE_LESSON_IDS_BY_MODULE,
  BASE_MODULE_IDS,
} from "../../src/course/base/manifest";
import {
  CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
  CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
} from "../../src/course/progress/progress";
import { reviewKeyFor } from "../../src/course/progress/reviewQueue";
import {
  assertLocalOnlyNetwork,
  assertNoRuntimeErrors,
  gotoReady,
  routeUrls,
  setupPageObservers,
} from "./helpers";

const STORAGE_KEY = "nihongo.course.progress";
const AT = "2026-08-05T12:00:00.000Z";
/**
 * Post-Base-integration reality (Tasks 16-18): the four former A1 "Sounds" and
 * "Foundations" modules are published by Base now, so the retained A1 map keeps
 * only its two remaining semantic areas, and the sixteen foundation routes are
 * reached through the Base level instead. Both halves are asserted below.
 */
const AREA_IDS = ["situations", "synthesis"] as const;
const AREA_MODULE_COUNTS = [10, 1] as const;
const IT_AREA_TITLES = ["Situazioni quotidiane", "Sintesi"] as const;
const EN_AREA_TITLES = ["Everyday situations", "Synthesis"] as const;

/** The Base modules that now publish the foundation sound/sentence systems. */
const BASE_FOUNDATION_MODULE_IDS = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
] as const;

const A1_COURSE_URL = `${routeUrls.home}?livello=a1`;
const BASE_COURSE_URL = `${routeUrls.home}?livello=base`;

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

function lessonEvidence(
  attemptedExerciseIds: readonly string[] = [],
  acceptedExerciseIds: readonly string[] = [],
) {
  return {
    visitedAt: AT,
    practicedAt: attemptedExerciseIds.length > 0 ? AT : null,
    consolidatedAt:
      attemptedExerciseIds.length > 0 &&
      attemptedExerciseIds.length === acceptedExerciseIds.length
        ? AT
        : null,
    attemptedExerciseIds: [...attemptedExerciseIds],
    acceptedExerciseIds: [...acceptedExerciseIds],
  };
}

function currentProgress(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 4,
    catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    levels: { a1: emptyLevel(), a2: emptyLevel() },
    migrationNotice: null,
    updatedAt: AT,
    ...overrides,
  };
}

/** The additive schema-V5 level shape (Base ownership split, Task 3/16). */
function emptyLevelV5() {
  return {
    ...emptyLevel(),
    orphanedLessonRecords: {},
    historicalActivityDispositions: [],
  };
}

function currentProgressV5(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 5,
    catalogVersion: CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION,
    levels: { a0: emptyLevelV5(), a1: emptyLevelV5(), a2: emptyLevelV5() },
    migrationNotice: null,
    updatedAt: AT,
    ...overrides,
  };
}

async function seedProgress(page: Page, value: unknown): Promise<void> {
  await page.addInitScript(
    ({ key, value: serialized }: { key: string; value: string }) => {
      localStorage.setItem(key, serialized);
    },
    { key: STORAGE_KEY, value: JSON.stringify(value) },
  );
}

/** Opens every collapsed module disclosure so all lesson rows are present. */
async function expandAllBaseModules(page: Page): Promise<void> {
  const disclosures = page.locator(".module-card__disclosure");
  const count = await disclosures.count();
  for (let index = 0; index < count; index += 1) {
    const disclosure = disclosures.nth(index);
    if ((await disclosure.getAttribute("aria-expanded")) === "false") {
      await disclosure.click();
    }
  }
}

async function readProgress(page: Page): Promise<any> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
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

async function setLocale(page: Page, locale: "EN" | "IT"): Promise<void> {
  const settings = await visibleSettings(page);
  await settings.locator(".localetoggle button", { hasText: locale }).click();
  await closeMobileSettings(page);
}

function a1ReviewFixture(lessonId: string) {
  const result = buildA1PracticeModel(lessonId);
  if (!result.ok) throw new Error(`Could not build ${lessonId}: ${result.error.code}`);
  const exercise = result.model.activities.find(
    (activity) => activity.generatedExercise !== undefined,
  )?.generatedExercise;
  if (!exercise) throw new Error(`${lessonId} has no reviewable exercise`);
  return {
    reviewKey: reviewKeyFor(lessonId, exercise.definitionId),
    lessonId,
    exerciseDefinitionId: exercise.definitionId,
    targetConceptIds: [...exercise.prompt.assessedConceptIds],
    targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
    mistakeCount: 2,
    lastMistakeAt: AT,
  };
}

function a2ReviewFixture(lessonId: string) {
  const exercise = getLessonExercises(lessonId)?.exercises[0];
  if (!exercise) throw new Error(`${lessonId} has no reviewable exercise`);
  return {
    reviewKey: reviewKeyFor(lessonId, exercise.definitionId),
    lessonId,
    exerciseDefinitionId: exercise.definitionId,
    targetConceptIds: [...exercise.prompt.assessedConceptIds],
    targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
    mistakeCount: 1,
    lastMistakeAt: AT,
  };
}

test.describe("Retained A1 areas and rehomed Base foundations on the built Course Map", () => {
  test("renders the two retained A1 areas and the sixteen foundation routes now published by Base", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, A1_COURSE_URL);

    expect(A1_RETAINED_MODULE_IDS).toHaveLength(11);
    expect(A1_RETAINED_LESSON_IDS).toHaveLength(44);
    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    // The published A1 area definition still describes the whole authored A1
    // catalog; the runtime map below renders only what A1 still owns.
    expect(A1_AREAS.map((area) => area.id)).toEqual([
      "sounds",
      "foundations",
      "situations",
      "synthesis",
    ]);

    const areas = page.locator(".course-area");
    await expect(areas).toHaveCount(AREA_IDS.length);
    const shape = await areas.evaluateAll((nodes) =>
      nodes.map((area) => {
        const heading = area.querySelector<HTMLElement>(".course-area__heading");
        return {
          ariaLabelledBy: area.getAttribute("aria-labelledby"),
          headingId: heading?.id ?? "",
          headingTag: heading?.tagName.toLowerCase() ?? "",
          heading: heading?.textContent?.trim() ?? "",
          description: area.querySelector(".course-area__description")?.textContent?.trim() ?? "",
          modules: area.querySelectorAll(".module-card").length,
          lessonLinks: area.querySelectorAll(".module-card__lesson-link").length,
        };
      }),
    );
    expect(shape.map(({ ariaLabelledBy, headingId, headingTag, heading, modules }) => ({
      ariaLabelledBy,
      headingId,
      headingTag,
      heading,
      modules,
    }))).toEqual(
      AREA_IDS.map((id, index) => ({
        ariaLabelledBy: `course-area-${id}`,
        headingId: `course-area-${id}`,
        headingTag: "h3",
        heading: IT_AREA_TITLES[index],
        modules: AREA_MODULE_COUNTS[index],
      })),
    );
    expect(shape.map((area) => area.description.length > 0)).toEqual([true, true]);
    await expect(
      page.locator('[aria-labelledby="course-area-situations"] .module-card__title').first(),
    ).toHaveText("Presentazioni");

    // Non-color hierarchy cues on the retained areas: a real labelled heading
    // element plus its own description, and a marker glyph on every module
    // card — never a colour difference alone. (The extra underline/icon
    // emphasis belonged to the Foundations area, which Base publishes now.)
    const situations = page.locator('.course-area[aria-labelledby="course-area-situations"]');
    const areaCue = await situations.evaluate((area) => {
      const heading = area.querySelector<HTMLElement>(".course-area__heading");
      const description = area.querySelector<HTMLElement>(".course-area__description");
      const markers = area.querySelectorAll(".module-card__marker svg[aria-hidden='true']");
      return {
        headingTag: heading?.tagName.toLowerCase() ?? "",
        headingWeight: heading ? getComputedStyle(heading).fontWeight : "",
        headingText: heading?.textContent?.trim() ?? "",
        descriptionText: description?.textContent?.trim() ?? "",
        markers: markers.length,
        moduleCards: area.querySelectorAll(".module-card").length,
      };
    });
    expect(areaCue.headingTag).toBe("h3");
    expect(Number.parseInt(areaCue.headingWeight, 10)).toBeGreaterThanOrEqual(600);
    expect(areaCue.headingText.length).toBeGreaterThan(0);
    expect(areaCue.descriptionText.length).toBeGreaterThan(0);
    expect(areaCue.markers).toBe(areaCue.moduleCards);

    await setLocale(page, "EN");
    await expect(page.locator(".course-area__heading")).toHaveText([...EN_AREA_TITLES]);
    await setLocale(page, "IT");

    // The sixteen foundation routes are still published, now by Base, and the
    // Base map lists them in its own module order.
    await gotoReady(page, BASE_COURSE_URL);
    expect(BASE_MODULE_IDS).toHaveLength(10);
    await expect(page.locator(".module-card")).toHaveCount(10);
    const foundationRoutes = BASE_FOUNDATION_MODULE_IDS.filter(
      (moduleId) => moduleId !== "sounds",
    ).flatMap((moduleId) =>
      BASE_LESSON_IDS_BY_MODULE[moduleId]!.map(
        (lessonId) => `#/percorso/${moduleId}/${lessonId}`,
      ),
    );
    expect(foundationRoutes).toHaveLength(16);
    await expandAllBaseModules(page);
    for (const href of foundationRoutes) {
      await expect(
        page.locator(`.module-card__lesson-link[href="${href}"]`),
        `${href} is published on the Base map`,
      ).toHaveCount(1);
    }

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("expands rehomed Base foundation modules by pointer and keyboard before following their real routes", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, BASE_COURSE_URL);

    const sentenceFoundations = page.locator(
      '.module-card:has(.module-card__lesson-link[href$="/sentence-foundations/sentence-foundations-1"])',
    );
    const sentenceDisclosure = sentenceFoundations.locator(".module-card__disclosure");
    await expect(sentenceDisclosure).toHaveAttribute("aria-expanded", "false");
    await sentenceDisclosure.click();
    await expect(sentenceDisclosure).toHaveAttribute("aria-expanded", "true");
    await expect(
      sentenceFoundations.locator(".module-card__lesson-link").filter({ visible: true }),
    ).toHaveCount(4);
    await sentenceFoundations
      .locator('.module-card__lesson-link[href$="/sentence-foundations/sentence-foundations-1"]')
      .click();
    await expect(page).toHaveURL(/\/sentence-foundations\/sentence-foundations-1$/);
    await expect(page.locator(".lesson-layout")).toBeVisible();

    await page.goBack();
    await expect(page.locator(".course-home")).toBeVisible();
    const timeMovement = page.locator(
      '.module-card:has(.module-card__lesson-link[href$="/time-movement/time-movement-4"])',
    );
    const timeDisclosure = timeMovement.locator(".module-card__disclosure");
    await expect(timeDisclosure).toHaveAttribute("aria-expanded", "false");
    await timeDisclosure.focus();
    await page.keyboard.press("Enter");
    await expect(timeDisclosure).toHaveAttribute("aria-expanded", "true");
    const timeRoute = timeMovement.locator(
      '.module-card__lesson-link[href$="/time-movement/time-movement-4"]',
    );
    await expect(timeRoute).toHaveCount(1);
    await timeRoute.click();
    await expect(page).toHaveURL(/\/time-movement\/time-movement-4$/);
    await expect(page.locator(".lesson-layout")).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("Base foundation continuation and catalog progress normalization", () => {
  test("starts at sounds, advances to sentence foundations after Sounds, and resumes a returning introduction", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, BASE_COURSE_URL);
    const primary = page.locator(".course-hero__actions a.action--primary");
    await expect(primary).toHaveAttribute("href", /#\/percorso\/sounds\/sounds-1$/);

    // Sounds is a Base module now, so its completed evidence is seeded on the
    // Base level and the Base map is what advances.
    const completedSounds = Object.fromEntries(
      BASE_LESSON_IDS_BY_MODULE.sounds!.map((lessonId) => [lessonId, lessonEvidence()]),
    );
    await seedProgress(
      page,
      currentProgressV5({
        levels: {
          a0: {
            ...emptyLevelV5(),
            lessons: completedSounds,
            lastVisitedLessonId: null,
          },
          a1: emptyLevelV5(),
          a2: emptyLevelV5(),
        },
      }),
    );
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    await expect(primary).toHaveAttribute(
      "href",
      /#\/percorso\/sentence-foundations\/sentence-foundations-1$/,
    );
    await expect(
      page.locator(
        '.module-card__lesson-link[href$="/sentence-foundations/sentence-foundations-1"]',
      ),
    ).toHaveAttribute("aria-current", "step");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("normalizes a legacy catalog payload into schema-V5 without losing A1/A2 evidence and records removed reviews as orphans", async ({
    page,
  }) => {
    const a1Review = a1ReviewFixture("introductions-1");
    const a2Review = a2ReviewFixture("connected-conversation-1");
    const a1Lesson = lessonEvidence([a1Review.exerciseDefinitionId], [a1Review.exerciseDefinitionId]);
    const a2Lesson = lessonEvidence([a2Review.exerciseDefinitionId], []);
    const oldCatalogProgress = {
      schemaVersion: 4,
      catalogVersion: "a1-a2-v2",
      levels: {
        a1: {
          ...emptyLevel(),
          lessons: { "introductions-1": a1Lesson },
          canDos: {
            "preserved-a1-can-do": {
              canDoId: "preserved-a1-can-do",
              visitedLessonIds: ["introductions-1"],
              practicedLessonIds: ["introductions-1"],
              acceptedTransferExerciseIds: [a1Review.exerciseDefinitionId],
              checkpointAttemptIds: ["preserved-a1-checkpoint"],
              lastUpdatedAt: AT,
            },
          },
          checkpointAttempts: [
            {
              id: "preserved-a1-checkpoint",
              checkpointId: "preserved-a1-checkpoint",
              attemptedAt: AT,
              acceptedExerciseIds: [a1Review.exerciseDefinitionId],
              sampledCanDoIds: ["preserved-a1-can-do"],
            },
          ],
          lastVisitedLessonId: "introductions-1",
          reviewQueue: [
            a1Review,
            {
              reviewKey: "removed-review-key",
              lessonId: "retired-review-lesson",
              exerciseDefinitionId: "retired-review-definition",
              targetConceptIds: [],
              targetLexemeIds: [],
              mistakeCount: 1,
              lastMistakeAt: AT,
            },
          ],
          orphanedLessonIds: ["existing-a1-orphan"],
          orphanedReviewKeys: ["existing-a1-orphan-review"],
        },
        a2: {
          ...emptyLevel(),
          lessons: { "connected-conversation-1": a2Lesson },
          canDos: {
            "preserved-a2-can-do": {
              canDoId: "preserved-a2-can-do",
              visitedLessonIds: ["connected-conversation-1"],
              practicedLessonIds: ["connected-conversation-1"],
              acceptedTransferExerciseIds: [],
              checkpointAttemptIds: [],
              lastUpdatedAt: AT,
            },
          },
          checkpointAttempts: [],
          lastVisitedLessonId: "connected-conversation-1",
          reviewQueue: [a2Review],
          orphanedLessonIds: ["existing-a2-orphan"],
          orphanedReviewKeys: ["existing-a2-orphan-review"],
        },
      },
      migrationNotice: null,
      updatedAt: AT,
    };

    const observers = await setupPageObservers(page);
    await seedProgress(page, oldCatalogProgress);
    await gotoReady(page, A1_COURSE_URL);

    await expect
      .poll(async () => (await readProgress(page))?.catalogVersion)
      .toBe(CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION);
    let migrated = await readProgress(page);
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.levels.a1.lessons["introductions-1"]).toEqual(a1Lesson);
    // The additive V5 field is the only change to preserved Can-do evidence.
    expect(migrated.levels.a1.canDos["preserved-a1-can-do"]).toEqual({
      ...oldCatalogProgress.levels.a1.canDos["preserved-a1-can-do"],
      historicalCheckpointRefs: [],
    });
    expect(migrated.levels.a1.checkpointAttempts).toEqual(
      oldCatalogProgress.levels.a1.checkpointAttempts,
    );
    expect(migrated.levels.a1.reviewQueue).toEqual([a1Review]);
    expect(migrated.levels.a1.orphanedLessonIds).toEqual(["existing-a1-orphan"]);
    expect(migrated.levels.a1.orphanedReviewKeys).toEqual([
      "existing-a1-orphan-review",
      "removed-review-key",
    ]);
    expect(migrated.levels.a2).toEqual({
      ...oldCatalogProgress.levels.a2,
      canDos: {
        "preserved-a2-can-do": {
          ...oldCatalogProgress.levels.a2.canDos["preserved-a2-can-do"],
          historicalCheckpointRefs: [],
        },
      },
      orphanedLessonRecords: {},
      historicalActivityDispositions: [],
    });
    // The sixteen foundation routes are Base-owned now, so they can never
    // appear as A1 lesson records after the migration.
    const foundationLessonIds = BASE_FOUNDATION_MODULE_IDS.flatMap(
      (moduleId) => BASE_LESSON_IDS_BY_MODULE[moduleId]!,
    );
    expect(foundationLessonIds).toHaveLength(20);
    expect(
      foundationLessonIds.every((lessonId) => migrated.levels.a1.lessons[lessonId] === undefined),
      "the rehomed foundation routes are never A1 records after migration",
    ).toBe(true);
    await expect(page.locator(".course-hero__actions a.action--primary")).toHaveAttribute(
      "href",
      /#\/percorso\/introductions\/introductions-\d$/,
    );

    await seedProgress(page, migrated);
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    migrated = await readProgress(page);
    expect(migrated.catalogVersion).toBe(CURRENT_COURSE_PROGRESS_V5_CATALOG_VERSION);
    expect(migrated.levels.a1.lessons["introductions-1"]).toEqual(a1Lesson);
    expect(migrated.levels.a1.orphanedReviewKeys).toContain("removed-review-key");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
