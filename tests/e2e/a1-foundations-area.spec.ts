import { expect, test, type Locator, type Page } from "@playwright/test";
import { A1_AREAS } from "../../src/course/a1/areas";
import {
  A1_LESSON_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_MODULE_IDS,
} from "../../src/course/a1/manifest";
import { buildA1PracticeModel } from "../../src/course/components/a1PracticeModel";
import { getLessonExercises } from "../../src/course/components/lessonExerciseModel";
import {
  CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
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
const AREA_IDS = ["sounds", "foundations", "situations", "synthesis"] as const;
const AREA_MODULE_COUNTS = [1, 4, 10, 1] as const;
const IT_AREA_TITLES = ["Suoni", "Fondamentali", "Situazioni quotidiane", "Sintesi"] as const;
const EN_AREA_TITLES = ["Sounds", "Foundations", "Everyday situations", "Synthesis"] as const;

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

async function seedProgress(page: Page, value: unknown): Promise<void> {
  await page.addInitScript(
    ({ key, value: serialized }: { key: string; value: string }) => {
      localStorage.setItem(key, serialized);
    },
    { key: STORAGE_KEY, value: JSON.stringify(value) },
  );
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

test.describe("A1 Foundations area on the built Course Map", () => {
  test("renders four ordered, labelled areas with 16 Foundation links and non-color hierarchy cues", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    expect(A1_MODULE_IDS).toHaveLength(16);
    expect(A1_LESSON_IDS).toHaveLength(64);
    expect(A1_AREAS.map((area) => area.id)).toEqual([...AREA_IDS]);
    expect(A1_AREAS.map((area) => area.moduleIds.length)).toEqual(
      [...AREA_MODULE_COUNTS],
    );

    const areas = page.locator(".course-area");
    await expect(areas).toHaveCount(4);
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
    expect(shape.map((area) => area.description.length > 0)).toEqual([true, true, true, true]);
    expect(shape[1]?.lessonLinks).toBe(16);

    const foundations = page.locator(".course-area--foundations");
    const foundationsPrecedeSituations = await page.evaluate(() => {
      const finalFoundationLink = document.querySelector(
        '.course-area--foundations .module-card__lesson-link[href$="/time-movement/time-movement-4"]',
      );
      const situations = document.querySelector('[aria-labelledby="course-area-situations"]');
      return Boolean(
        finalFoundationLink &&
          situations &&
          (finalFoundationLink.compareDocumentPosition(situations) &
            Node.DOCUMENT_POSITION_FOLLOWING),
      );
    });
    expect(foundationsPrecedeSituations).toBe(true);
    await expect(
      page.locator('[aria-labelledby="course-area-situations"] .module-card__title').first(),
    ).toHaveText("Presentazioni");

    const foundationCue = await foundations.evaluate((area) => {
      const heading = area.querySelector<HTMLElement>(".course-area__heading");
      const icon = area.querySelector<HTMLElement>(".course-area__icon");
      return {
        headingDecoration: heading ? getComputedStyle(heading).textDecorationLine : "",
        iconBorderWidth: icon ? Number.parseFloat(getComputedStyle(icon).borderTopWidth) : 0,
        iconHidden: icon?.getAttribute("aria-hidden"),
        iconSvgHidden: icon?.querySelector("svg")?.getAttribute("aria-hidden"),
      };
    });
    expect(foundationCue.headingDecoration).toContain("underline");
    expect(foundationCue.iconBorderWidth).toBeGreaterThanOrEqual(2);
    expect(foundationCue.iconHidden).toBe("true");
    expect(foundationCue.iconSvgHidden).toBe("true");

    await setLocale(page, "EN");
    await expect(page.locator(".course-area__heading")).toHaveText([...EN_AREA_TITLES]);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("expands new Foundation modules by pointer and keyboard before following their real routes", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);

    const foundations = page.locator(".course-area--foundations");
    const sentenceFoundations = foundations.locator(".module-card").nth(0);
    const sentenceDisclosure = sentenceFoundations.locator(".module-card__disclosure");
    await expect(sentenceDisclosure).toHaveAttribute("aria-expanded", "false");
    await sentenceDisclosure.click();
    await expect(sentenceDisclosure).toHaveAttribute("aria-expanded", "true");
    await expect(sentenceFoundations.locator(".module-card__lesson-link")).toHaveCount(4);
    await sentenceFoundations
      .locator('.module-card__lesson-link[href$="/sentence-foundations/sentence-foundations-1"]')
      .click();
    await expect(page).toHaveURL(/\/sentence-foundations\/sentence-foundations-1$/);
    await expect(page.locator(".lesson-layout")).toBeVisible();

    await page.goBack();
    await expect(page.locator(".course-home")).toBeVisible();
    const timeMovement = page.locator(".course-area--foundations .module-card").nth(3);
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

test.describe("A1 Foundations continuation and catalog-v3 progress", () => {
  test("starts at sounds, advances to sentence foundations after Sounds, and resumes a returning introduction", async ({
    page,
  }) => {
    const observers = await setupPageObservers(page);
    await gotoReady(page, routeUrls.home);
    const primary = page.locator(".course-hero__actions a.action--primary");
    await expect(primary).toHaveAttribute("href", /#\/percorso\/sounds\/sounds-1$/);

    const completedSounds = Object.fromEntries(
      A1_LESSON_IDS_BY_MODULE.sounds.map((lessonId) => [lessonId, lessonEvidence()]),
    );
    await seedProgress(
      page,
      currentProgress({
        levels: {
          a1: {
            ...emptyLevel(),
            lessons: completedSounds,
            lastVisitedLessonId: null,
          },
          a2: emptyLevel(),
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

  test("normalizes a v2 catalog payload to v3 without losing A1/A2 evidence and records removed reviews as orphans", async ({
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
    await gotoReady(page, routeUrls.home);

    await expect
      .poll(async () => (await readProgress(page))?.catalogVersion)
      .toBe(CURRENT_COURSE_PROGRESS_CATALOG_VERSION);
    let migrated = await readProgress(page);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.levels.a1.lessons["introductions-1"]).toEqual(a1Lesson);
    expect(migrated.levels.a1.canDos["preserved-a1-can-do"]).toEqual(
      oldCatalogProgress.levels.a1.canDos["preserved-a1-can-do"],
    );
    expect(migrated.levels.a1.checkpointAttempts).toEqual(
      oldCatalogProgress.levels.a1.checkpointAttempts,
    );
    expect(migrated.levels.a1.reviewQueue).toEqual([a1Review]);
    expect(migrated.levels.a1.orphanedLessonIds).toEqual(["existing-a1-orphan"]);
    expect(migrated.levels.a1.orphanedReviewKeys).toEqual([
      "existing-a1-orphan-review",
      "removed-review-key",
    ]);
    expect(migrated.levels.a2).toEqual(oldCatalogProgress.levels.a2);
    const foundationLessonIds = A1_AREAS.find((area) => area.id === "foundations")!.moduleIds.flatMap(
      (moduleId) => A1_LESSON_IDS_BY_MODULE[moduleId],
    );
    expect(foundationLessonIds).toHaveLength(16);
    expect(
      foundationLessonIds.every((lessonId) => migrated.levels.a1.lessons[lessonId] === undefined),
      "the 16 new Foundations routes begin unvisited after catalog migration",
    ).toBe(true);
    await expect(page.locator(".course-hero__actions a.action--primary")).toHaveAttribute(
      "href",
      /#\/percorso\/introductions\/introductions-1$/,
    );

    await seedProgress(page, migrated);
    await page.reload({ waitUntil: "load" });
    await page.locator("#root >> main").first().waitFor({ state: "visible" });
    migrated = await readProgress(page);
    expect(migrated.catalogVersion).toBe(CURRENT_COURSE_PROGRESS_CATALOG_VERSION);
    expect(migrated.levels.a1.lessons["introductions-1"]).toEqual(a1Lesson);
    expect(migrated.levels.a2).toEqual(oldCatalogProgress.levels.a2);
    expect(migrated.levels.a1.orphanedReviewKeys).toContain("removed-review-key");

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
