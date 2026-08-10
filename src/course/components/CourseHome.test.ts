import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { coursePathForLevel } from "../../routing/routePaths";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModules } from "../data/course";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { LEVEL_RUNTIME_CONFIG } from "../levels/runtimeConfig";
import {
  emptyProgress,
  emptyProgressV5,
  markLessonVisited,
  type CanDoEvidence,
  type CheckpointAttempt,
  type CourseProgressV3,
  type BaseOwnershipMigrationNotice,
  type LevelProgressV5,
} from "../progress/progress";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import { CourseHome } from "./CourseHome";
import { escapeHtmlText } from "./renderTestUtils";

const allLessons = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => ({ ...lesson, moduleId: courseModule.id })),
);
const totalLessons = allLessons.length;
const firstLesson = allLessons[0];
const lastLesson = allLessons[allLessons.length - 1];
const a1RuntimeCanDos = LEVEL_RUNTIME_CONFIG.a1.canDos;
const a1ModuleIdsInLearnerOrder = [
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
];

function makeProgressValue(
  overrides: Partial<ProgressContextValue> = {},
): ProgressContextValue {
  const progress = overrides.progress ?? emptyProgress();
  const progressV5 =
    overrides.progressV5 ??
    (() => {
      const empty = emptyProgressV5();
      return {
        ...empty,
        levels: {
          ...empty.levels,
          a1: {
            ...empty.levels.a1,
            lessons: progress.lessons,
            lastVisitedLessonId: progress.lastVisitedLessonId,
            reviewQueue: progress.reviewQueue,
            canDos: Object.fromEntries(
              Object.entries(overrides.canDoEvidence ?? {}).map(([id, evidence]) => [
                id,
                { ...evidence, historicalCheckpointRefs: [] },
              ]),
            ),
            checkpointAttempts: overrides.checkpointAttempts ?? [],
          },
        },
      };
    })();
  return {
    progress,
    corrupted: false,
    persistenceAvailable: true,
    markVisited: () => {},
    recordAttempt: () => {},
    resolveReview: () => {},
    dismissCorruption: () => {},
    reset: () => {},
    clearLevel: () => {},
    migrationNotice: null,
    acknowledgeMigrationNotice: () => {},
    levelSummary: {
      level: "a1",
      visitedLessonCount: 0,
      totalLessonCount: totalLessons,
      visitedPercent: 0,
      recommendedContinuationLessonId: firstLesson?.id ?? null,
    },
    canDoEvidence: {},
    checkpointAttempts: [],
    progressV5,
    lessonEvidence: () => undefined,
    levelSummaryFor: (level) => ({
      level,
      visitedLessonCount: 0,
      totalLessonCount: level === "a1" ? totalLessons : 60,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    }),
    canDoEvidenceFor: () => ({}),
    checkpointAttemptsFor: () => [],
    mutationError: null,
    clearMutationError: () => {},
    ...overrides,
  };
}

function progressWithVisited(lessonIds: string[]): CourseProgressV3 {
  return lessonIds.reduce(markLessonVisited, emptyProgress());
}

function progressWithVisitsButNoLastVisited(lessonIds: string[]): CourseProgressV3 {
  return {
    ...progressWithVisited(lessonIds),
    lastVisitedLessonId: null,
  };
}

function renderHome(
  progressValue: ProgressContextValue,
  initialEntries: Array<string | { pathname: string; state?: unknown }> = [
    coursePathForLevel("a1"),
  ],
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries },
      createElement(
        LocaleProvider,
        null,
        createElement(
          ProgressContext.Provider,
          { value: progressValue },
          createElement(CourseHome),
        ),
      ),
    ),
  );
}

const courseHomePath = fileURLToPath(new URL("./CourseHome.tsx", import.meta.url));
function readCourseHomeSource(): string {
  return readFileSync(courseHomePath, "utf8");
}

describe("CourseHome — three-level runtime selection", () => {
  it("selects Base for a fresh bare course URL", () => {
    const html = renderHome(makeProgressValue(), ["/percorso"]);
    expect(html).toContain(itCopy.courseLevels.baseBadge);
    expect(html).toContain(itCopy.courseLevels.baseHeading);
    expect(html).toContain(itCopy.home.courseShape(10, 40));
    expect(html).toContain(itCopy.modules["argument-particles"].title);
  });

  it("uses only typed three-level selection and selected V5 progress data", () => {
    const source = readCourseHomeSource();
    expect(source).not.toContain("levelIsA1");
    expect(source).not.toContain("courseLevelFromParam");
    expect(source).not.toMatch(/\bvisitedLessonIds\(progress\)/);
    expect(source).not.toMatch(/\bprogress\.(lessons|lastVisitedLessonId)/);
  });
});

/**
 * Extracts the href of the primary hero CTA anchor specifically. The course
 * map below renders every lesson link (collapsed rows are only `hidden`), so a
 * document-wide `toContain(href)` cannot prove where the CTA points — scope to
 * the `action--primary` anchor. Class/href attribute order is not assumed.
 */
function primaryActionHref(html: string): string | null {
  const anchor = html.match(/<a[^>]*action--primary[^>]*>/);
  if (!anchor) return null;
  const href = anchor[0].match(/href="([^"]*)"/);
  return href ? href[1] : null;
}

describe("CourseHome hero: editoriale mnemonico", () => {
  it("renders a bounded-title editorial hero with eyebrow and lead", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`class="course-hero__eyebrow"`);
    expect(html).toContain(itCopy.home.eyebrow);
    expect(html).toContain(`class="course-hero__title"`);
    expect(html).toContain(itCopy.home.title);
    expect(html).toContain(`class="course-hero__lead"`);
    expect(html).toContain(itCopy.home.lead);
  });

  it("never renders the old 84px-class raw h1 without the bounded title class", () => {
    const html = renderHome(makeProgressValue());
    expect(html).not.toMatch(/<h1 id="course-title">/);
  });

  it("renders the visited progress summary as a lesson count, not a bare percentage or mastery claim", () => {
    const visited = [firstLesson.id, allLessons[1].id];
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited(visited),
      }),
    );
    expect(html).toContain(itCopy.home.lessonsProgress(visited.length, totalLessons));
  });

  it("shows the retained A1 badge and exact runtime shape (11 modules, 44 lessons)", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(itCopy.courseLevels.a1Badge);
    expect(courseModules.length).toBe(11);
    expect(totalLessons).toBe(44);
    expect(html).toContain(itCopy.home.courseShape(courseModules.length, totalLessons));
  });
});

describe("CourseHome hero: primary and secondary actions (Task 1 Action primitives)", () => {
  it("targets the primary action at the first lesson and labels it start when nothing is visited", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`href="${lessonPath(firstLesson.moduleId, firstLesson.id)}"`);
    expect(html).toMatch(/class="action action--primary[^"]*"[^>]*>Inizia</);
  });

  it("labels the primary action continue and resumes the recognized last-visited lesson (even past skipped lessons)", () => {
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited([allLessons[0].id, allLessons[1].id]),
      }),
    );
    // §7.3 rule 1: resume the valid last-visited lesson, not the next gap.
    const resumeLesson = allLessons[1];
    expect(primaryActionHref(html)).toBe(lessonPath(resumeLesson.moduleId, resumeLesson.id));
    expect(html).toMatch(/class="action action--primary[^"]*"[^>]*>Continua</);
  });

  it("keeps a returning learner on an existing A1 lesson", () => {
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited(["introductions-1", "essential-questions-1"]),
      }),
    );

    expect(primaryActionHref(html)).toBe(
      lessonPath("essential-questions", "essential-questions-1"),
    );
  });

  it("recommends the first lesson in the next retained module when a module is visited", () => {
    const introductionLessonIds = courseModules[0]!.lessons.map((lesson) => lesson.id);
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisitsButNoLastVisited(introductionLessonIds),
      }),
    );

    expect(primaryActionHref(html)).toBe(
      lessonPath("essential-questions", "essential-questions-1"),
    );
  });

  it("labels the primary action review and resumes the last-visited lesson once everything is visited", () => {
    const allIds = allLessons.map((lesson) => lesson.id);
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited(allIds),
      }),
    );
    expect(primaryActionHref(html)).toBe(lessonPath(lastLesson.moduleId, lastLesson.id));
    expect(html).toMatch(/class="action action--primary[^"]*"[^>]*>Ripassa</);
  });

  it("resumes a recognized last-visited lesson that is later than earlier skipped lessons (§7.3 rule 1 CTA)", () => {
    // Visit the first lesson and a much later one, skipping the lessons in
    // between; the recognized last-visited lesson is the later one.
    const resumeLesson = allLessons[3];
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited([allLessons[0].id, resumeLesson.id]),
      }),
    );
    // Must resume the later last-visited lesson, not the earliest gap (allLessons[1]).
    expect(primaryActionHref(html)).toBe(lessonPath(resumeLesson.moduleId, resumeLesson.id));
    expect(primaryActionHref(html)).not.toBe(
      lessonPath(allLessons[1].moduleId, allLessons[1].id),
    );
    expect(html).toMatch(/class="action action--primary[^"]*"[^>]*>Continua</);
  });

  it("renders a secondary explore-practice action to the practice route", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`href="${routePaths.practice}"`);
    expect(html).toMatch(
      new RegExp(`class="action action--secondary[^"]*"[^>]*>${itCopy.home.explorePractice}<`),
    );
  });
});

describe("CourseHome: renders the area-grouped CourseMap, never the old chapter grid", () => {
  it("keeps the retained A1 path in learner order with navigable lessons", () => {
    expect(courseModules.map((courseModule) => courseModule.id)).toEqual(
      a1ModuleIdsInLearnerOrder,
    );

    const html = renderHome(makeProgressValue());
    let previousTitleIndex = -1;
    for (const moduleId of a1ModuleIdsInLearnerOrder) {
      const courseModule = courseModules.find((item) => item.id === moduleId);
      if (!courseModule) throw new Error(`missing expected module ${moduleId}`);

      const title = itCopy.modules[moduleId]!.title;
      const titleIndex = html.indexOf(
        `<h4 class="module-card__title">${escapeHtmlText(title)}</h4>`,
      );
      expect(titleIndex, moduleId).toBeGreaterThan(previousTitleIndex);
      previousTitleIndex = titleIndex;

      for (const lesson of courseModule.lessons) {
        expect(html, lesson.id).toContain(
          `href="${lessonPath(courseModule.id, lesson.id)}"`,
        );
      }
    }

    expect(primaryActionHref(html)).toBe(lessonPath("introductions", "introductions-1"));
    expect(html).toContain(
      escapeHtmlText(
        itCopy.courseMap.prerequisites([]),
      ),
    );
  });

  it("renders the course map heading and every real module title", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`class="course-map"`);
    expect(html).toContain(itCopy.courseMap.heading);
    expect(html).toContain(itCopy.modules.introductions.title);
    expect(html).toContain(itCopy.modules.capstones.title);
  });

  it("never renders the obsolete chapter-grid/chapter-card classes", () => {
    const html = renderHome(makeProgressValue());
    expect(html).not.toContain("chapter-grid");
    expect(html).not.toContain("chapter-card");
  });

  it("never renders stale chapter or mastery/completion wording in either locale", () => {
    const htmlIt = renderHome(makeProgressValue());
    expect(htmlIt.toLowerCase()).not.toMatch(/capitolo|padronanza|completat/);
    // en locale is selected via LocaleContext storage, unreachable in this
    // node test env (see LocaleContext), so this only asserts against the
    // it copy strings never appearing under the alternate wording either.
    expect(enCopy.home.title).not.toMatch(/chapter|mastery|complet(e|ion)/i);
    expect(enCopy.courseMap.heading).not.toMatch(/chapter|mastery|complet(e|ion)/i);
  });
});

describe("CourseHome: visible, non-blocking storage failure states", () => {
  it("shows a dismissible corrupted-progress notice when corrupted is true", () => {
    const html = renderHome(makeProgressValue({ corrupted: true }));
    expect(html).toContain("notice--warning");
    expect(html).toContain(itCopy.home.corruptProgressTitle);
    expect(html).toContain(itCopy.home.corruptProgress);
  });

  it("shows a visible, non-dismissible persistence warning when persistenceAvailable is false", () => {
    const html = renderHome(makeProgressValue({ persistenceAvailable: false }));
    expect(html).toContain(itCopy.home.persistenceWarningTitle);
    expect(html).toContain(escapeHtmlText(itCopy.home.persistenceWarningBody));
  });

  it("omits both storage notices when there is nothing to report", () => {
    const html = renderHome(makeProgressValue());
    expect(html).not.toContain(itCopy.home.corruptProgressTitle);
    expect(html).not.toContain(itCopy.home.persistenceWarningTitle);
  });

  it("surfaces an invalid-route notice via RouteNotice when the location carries an invalid path", () => {
    const html = renderHome(makeProgressValue(), [
      { pathname: "/percorso", state: { invalidPath: "/nope" } },
    ]);
    expect(html).toContain(itCopy.home.invalidRoute("/nope"));
  });
});

describe("CourseHome: destructive, confirmed, level-scoped reset (ISSUE 3)", () => {
  it("labels the destructive action with the selected level (A1) and disables it when there is nothing to reset", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toMatch(
      /class="action action--destructive[^"]*" disabled=""[^>]*>Azzera i progressi di A1</,
    );
  });

  it("enables the A1 reset once the A1 level has visited or last-visited progress", () => {
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited([firstLesson.id]),
      }),
    );
    expect(html).toMatch(/class="action action--destructive[^"]*">Azzera i progressi di A1</);
    expect(html).not.toMatch(
      /class="action action--destructive[^"]*" disabled=""/,
    );
  });

  function progressWithA1Evidence(
    mutate: (level: LevelProgressV5) => LevelProgressV5,
  ) {
    const progress = emptyProgressV5();
    return {
      ...progress,
      levels: {
        ...progress.levels,
        a1: mutate(progress.levels.a1),
      },
    };
  }

  it.each([
    ["Can-do record", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      canDos: {
        "a1-can-do-identity": {
          canDoId: "a1-can-do-identity",
          visitedLessonIds: [],
          practicedLessonIds: [],
          acceptedTransferExerciseIds: [],
          checkpointAttemptIds: [],
          historicalCheckpointRefs: [],
          lastUpdatedAt: "2026-08-10T00:00:00.000Z",
        },
      },
    })],
    ["checkpoint attempt", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      checkpointAttempts: [{
        id: "a1-checkpoint-attempt-1",
        checkpointId: "a1-checkpoint",
        attemptedAt: "2026-08-10T00:00:00.000Z",
        acceptedExerciseIds: [],
        sampledCanDoIds: [],
      }],
    })],
    ["active review", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      reviewQueue: [{
        reviewKey: "introductions-1:introductions-1-x1",
        lessonId: "introductions-1",
        exerciseDefinitionId: "introductions-1-x1",
        targetConceptIds: [],
        targetLexemeIds: [],
        mistakeCount: 1,
        lastMistakeAt: "2026-08-10T00:00:00.000Z",
      }],
    })],
    ["orphan lesson record and ID", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      orphanedLessonIds: ["retired-a1-lesson"],
      orphanedLessonRecords: {
        "retired-a1-lesson": {
          visitedAt: null,
          practicedAt: null,
          consolidatedAt: null,
          attemptedExerciseIds: ["retired-exercise"],
          acceptedExerciseIds: [],
        },
      },
    })],
    ["orphan review key", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      orphanedReviewKeys: ["retired-a1-lesson:retired-exercise"],
    })],
    ["historical activity disposition", (level: LevelProgressV5): LevelProgressV5 => ({
      ...level,
      historicalActivityDispositions: [{
        sourceLevel: "a1",
        lessonId: "retired-a1-lesson",
        activityId: "retired-exercise",
        disposition: "historical-orphan",
        orphanedReview: null,
      }],
    })],
  ] as const)("enables the A1 reset when the level contains only %s evidence", (_, mutate) => {
    const html = renderHome(
      makeProgressValue({
        progressV5: progressWithA1Evidence(mutate),
      }),
    );

    expect(html).toMatch(/class="action action--destructive[^"]*">Azzera i progressi di A1</);
    expect(html).not.toMatch(
      /class="action action--destructive[^"]*" disabled=""/,
    );
  });

  it("never labels the level-scoped reset with mastery/completion wording, in either locale", () => {
    for (const copy of [itCopy, enCopy]) {
      for (const label of ["A1", "A2"]) {
        expect(copy.courseLevels.resetLevel(label).toLowerCase()).not.toMatch(
          /padronanza|completat|master|complete/,
        );
        expect(copy.courseLevels.resetLevelConfirm(label).toLowerCase()).not.toMatch(
          /padronanza|completat|master|complete/,
        );
      }
    }
  });

  it("gates the level-scoped reset behind a localized window.confirm and clears ONLY the selected level (source contract)", () => {
    // No @testing-library/react DOM harness is installed in this repo (see
    // LessonPage.test.ts), and renderToStaticMarkup never wires up onClick
    // handlers to real DOM events, so the confirm-gate + level-scoped clear
    // are asserted against the component source, matching that precedent.
    // The pure level-only-clear behavior is proven in ProgressContext.a2.test.ts.
    const source = readCourseHomeSource();
    expect(source).toMatch(
      /if \(window\.confirm\(copy\.courseLevels\.resetLevelConfirm\(levelLabel\)\)\)\s*\n?\s*clearLevel\(level\);/,
    );
    // It must NOT call the global, both-levels reset from this level-scoped view.
    expect(source).not.toMatch(/\breset\(\);/);
  });
});

const sampleMigrationNotice: BaseOwnershipMigrationNotice = {
  fromSchemaVersion: 4,
  movedLessonIds: ["sounds-1", "sounds-2"],
  historicalActivityIds: [],
  resumeLevel: "a1",
  priorNotice: {
    fromSchemaVersion: 3,
    preservedVisitedLessonIds: ["sounds-1", "sounds-2"],
    resetEvidenceLessonIds: ["introductions-1"],
    acknowledgedAt: null,
  },
  acknowledgedAt: null,
};

describe("CourseHome: schema-v3→schema-v4 migration notice (design spec §17, Phase 2 Task 6)", () => {
  it("omits the migration notice entirely when there is nothing to migrate", () => {
    const html = renderHome(makeProgressValue());
    expect(html).not.toContain(itCopy.progressMigration.noticeTitle);
  });

  it("shows the dismissible migration notice, its truthful copy, and an acknowledge action while unacknowledged", () => {
    const html = renderHome(
      makeProgressValue({ migrationNotice: sampleMigrationNotice }),
    );
    expect(html).toContain(itCopy.progressMigration.noticeTitle);
    expect(html).toContain(escapeHtmlText(itCopy.progressMigration.noticeBody));
    expect(html).toContain(itCopy.progressMigration.acknowledge);
  });

  it("always keeps the migration help explanation available, even once acknowledged", () => {
    const acknowledged: BaseOwnershipMigrationNotice = {
      ...sampleMigrationNotice,
      acknowledgedAt: "2024-01-01T00:00:00.000Z",
    };
    const html = renderHome(makeProgressValue({ migrationNotice: acknowledged }));
    expect(html).toContain(itCopy.progressMigration.helpTitle);
    expect(html).toContain(escapeHtmlText(itCopy.progressMigration.helpBody));
    // The dismissible top notice's own acknowledge action is gone once
    // acknowledged, but the always-available help explanation remains.
    expect(html).not.toContain(itCopy.progressMigration.acknowledge);
  });

  it("wires the acknowledge action to acknowledgeMigrationNotice, never deleting the record (source contract)", () => {
    const source = readCourseHomeSource();
    expect(source).toMatch(/onDismiss=\{acknowledgeMigrationNotice\}/);
  });
});

describe("CourseHome: Can-do evidence summary (design spec §8/§17, Phase 2 Task 6)", () => {
  it("lists every authored Can-do's descriptor text with an honest 'not started' tier by default", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(itCopy.canDoSummary.heading);
    expect(html).toContain(
      itCopy.canDoSummary.demonstratedCount(0, a1RuntimeCanDos.length),
    );
    for (const canDo of a1RuntimeCanDos) {
      expect(html).toContain(escapeHtmlText(itCopy.objectives[canDo.descriptorCopyId]));
    }
    expect(html).toContain(itCopy.canDoSummary.tierNotStarted);
  });

  it("reflects a demonstrated Can-do's evidence tier and demonstrated count from real canDoEvidence", () => {
    const demonstrated = a1RuntimeCanDos[0]!;
    const evidence: Record<string, CanDoEvidence> = {
      [demonstrated.id]: {
        canDoId: demonstrated.id,
        visitedLessonIds: [demonstrated.lessonIds[0]],
        practicedLessonIds: [demonstrated.lessonIds[0]],
        acceptedTransferExerciseIds: ["some-exercise-id"],
        checkpointAttemptIds: [],
        lastUpdatedAt: "2024-01-01T00:00:00.000Z",
      },
    };
    const html = renderHome(
      makeProgressValue({ canDoEvidence: evidence }),
    );
    expect(html).toContain(itCopy.canDoSummary.tierDemonstrated);
    expect(html).toContain(
      itCopy.canDoSummary.demonstratedCount(1, a1RuntimeCanDos.length),
    );
  });
});

/**
 * M2/M3 (quality-review Phase 2 Task 6): the can-do-summary tier glyph must
 * be unified with `LessonExercises.tsx`'s canonical scheme (visited=○,
 * practiced=◐, demonstrated=●) and rendered as an explicit `aria-hidden`
 * JSX span alongside the always-visible tier text — never injected only via
 * a CSS `::before` pseudo-element, which a DOM-only render (like this test,
 * and any assistive technology relying on the accessibility tree) cannot
 * see at all.
 */
describe("CourseHome: Can-do evidence tier glyphs are explicit aria-hidden spans, unified with the lesson-exercises scheme (M2/M3)", () => {
  function tierRowFor(html: string, canDoId: string): string {
    const marker = `data-can-do-id="${canDoId}"`;
    const start = html.indexOf(marker);
    if (start === -1) throw new Error(`fixture assumption failed: no row for ${canDoId}`);
    const liStart = html.lastIndexOf("<li", start);
    const liEnd = html.indexOf("</li>", start) + "</li>".length;
    return html.slice(liStart, liEnd);
  }

  it("renders the visited tier's glyph (○) as a real aria-hidden DOM span next to the visible tier text", () => {
    const visited = a1RuntimeCanDos[0]!;
    const evidence: Record<string, CanDoEvidence> = {
      [visited.id]: {
        canDoId: visited.id,
        visitedLessonIds: [visited.lessonIds[0]],
        practicedLessonIds: [],
        acceptedTransferExerciseIds: [],
        checkpointAttemptIds: [],
        lastUpdatedAt: "2024-01-01T00:00:00.000Z",
      },
    };
    const html = renderHome(makeProgressValue({ canDoEvidence: evidence }));
    const row = tierRowFor(html, visited.id);
    expect(row).toMatch(
      /<span class="can-do-summary__tier-glyph" aria-hidden="true">○<\/span>/,
    );
    expect(row).toContain(
      `<span class="can-do-summary__tier-text">${itCopy.canDoSummary.tierVisited}</span>`,
    );
  });

  it("renders the practiced tier's glyph (◐) as a real aria-hidden DOM span next to the visible tier text", () => {
    const practiced = a1RuntimeCanDos[0]!;
    const evidence: Record<string, CanDoEvidence> = {
      [practiced.id]: {
        canDoId: practiced.id,
        visitedLessonIds: [practiced.lessonIds[0]],
        practicedLessonIds: [practiced.lessonIds[0]],
        acceptedTransferExerciseIds: [],
        checkpointAttemptIds: [],
        lastUpdatedAt: "2024-01-01T00:00:00.000Z",
      },
    };
    const html = renderHome(makeProgressValue({ canDoEvidence: evidence }));
    const row = tierRowFor(html, practiced.id);
    expect(row).toMatch(
      /<span class="can-do-summary__tier-glyph" aria-hidden="true">◐<\/span>/,
    );
    expect(row).toContain(
      `<span class="can-do-summary__tier-text">${itCopy.canDoSummary.tierPracticed}</span>`,
    );
  });

  it("renders the demonstrated tier's glyph as ● (matching lesson-exercises' consolidated tier), not ✓ or ★, as a real aria-hidden DOM span", () => {
    const demonstrated = a1RuntimeCanDos[0]!;
    const evidence: Record<string, CanDoEvidence> = {
      [demonstrated.id]: {
        canDoId: demonstrated.id,
        visitedLessonIds: [demonstrated.lessonIds[0]],
        practicedLessonIds: [demonstrated.lessonIds[0]],
        acceptedTransferExerciseIds: ["some-exercise-id"],
        checkpointAttemptIds: [],
        lastUpdatedAt: "2024-01-01T00:00:00.000Z",
      },
    };
    const html = renderHome(makeProgressValue({ canDoEvidence: evidence }));
    const row = tierRowFor(html, demonstrated.id);
    expect(row).toMatch(
      /<span class="can-do-summary__tier-glyph" aria-hidden="true">●<\/span>/,
    );
    expect(row).not.toContain("✓");
    expect(row).not.toContain("★");
    expect(row).toContain(
      `<span class="can-do-summary__tier-text">${itCopy.canDoSummary.tierDemonstrated}</span>`,
    );
  });
});


describe("CourseHome: checkpoint evidence state (Phase 4 Task 27 — automatic accrual)", () => {
  it("reports when no checkpoint attempt has been recorded yet", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(itCopy.courseLevels.a1CheckpointHeading);
    expect(html).toContain(
      escapeHtmlText(itCopy.courseLevels.checkpointNotAttempted(itCopy.courseLevels.a1)),
    );
  });

  it("reports an observed checkpoint attempt without a result claim", () => {
    const attempt: CheckpointAttempt = {
      id: "a1-checkpoint-attempt-1",
      checkpointId: "a1-checkpoint",
      attemptedAt: "2024-01-01T00:00:00.000Z",
      acceptedExerciseIds: ["ex-1", "ex-2", "ex-3"],
      sampledCanDoIds: [a1RuntimeCanDos[0]!.id],
    };
    const html = renderHome(
      makeProgressValue({ checkpointAttempts: [attempt] }),
    );
    expect(html).toContain(
      escapeHtmlText(itCopy.courseLevels.checkpointAttemptRecorded(itCopy.courseLevels.a1)),
    );
    expect(html).not.toContain(
      escapeHtmlText(itCopy.courseLevels.checkpointNotAttempted(itCopy.courseLevels.a1)),
    );
  });

  it("reveals the on-page can-do-summary section without any bare-fragment anchor (in-page action, not a route)", () => {
    const html = renderHome(makeProgressValue());
    // The evidence control reveals a section this very page renders, by its
    // element id. Under the app's HashRouter that section has no URL, so it must
    // NOT be exposed as an anchor: a fragment href is read by ⌘/middle-click,
    // copy-link, bookmark, and session restore, all of which detonate the
    // router into the false "page not found" warning.
    //
    // The invariant is precise: under HashRouter a legitimate route link renders
    // `href="#/percorso"` — a `#` followed by `/` — whereas a bare in-page
    // fragment renders `href="#can-do-summary"` — a `#` NOT followed by `/`. Only
    // the latter has no route and detonates. So assert no anchor's href is a bare
    // fragment (`#` then a non-`/`), NOT merely any `href="#"` (which this test's
    // MemoryRouter never emits but production's HashRouter puts on every real
    // link, so that laxer form would be an artifact of the harness rather than a
    // statement about the danger). This regex is correct under both routers and
    // survives someone making the harness more faithful.
    expect(html).not.toMatch(/href="#[^/]/);
    expect(html).toContain('id="can-do-summary"');
    expect(html).toContain(escapeHtmlText(itCopy.checkpoint.evidenceLink));
  });
});

describe("CourseHome: never claims certification, mastery, or A1 completion anywhere (design spec §3.1)", () => {
  const forbidden = /certif|mastered|\bpassed a1\b|completed a1|completa (l'|l’)?a1/i;

  it("never uses forbidden proficiency-claim language in the fresh-state render (either locale's copy)", () => {
    const html = renderHome(
      makeProgressValue({
        migrationNotice: sampleMigrationNotice,
        checkpointAttempts: [
          {
            id: "a1-checkpoint-attempt-1",
            checkpointId: "a1-checkpoint",
            attemptedAt: "2024-01-01T00:00:00.000Z",
            acceptedExerciseIds: ["ex-1"],
            sampledCanDoIds: ["a1-can-do-sounds"],
          },
        ],
      }),
    );
    expect(html).not.toMatch(forbidden);
    expect(JSON.stringify(enCopy.home)).not.toMatch(forbidden);
    expect(JSON.stringify(enCopy.checkpoint)).not.toMatch(forbidden);
    expect(JSON.stringify(enCopy.canDoSummary)).not.toMatch(forbidden);
    expect(JSON.stringify(enCopy.progressMigration)).not.toMatch(forbidden);
  });
});
