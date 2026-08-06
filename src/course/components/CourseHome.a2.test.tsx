/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { coursePathForLevel } from "../../routing/routePaths";
import { lessonPath } from "../../routing/routes";
import { a2CanDoDescriptorCopy } from "../a2/catalog/canDos";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { courseModulesByLevel } from "../data/course";
import { it as itCopy } from "../i18n/it";
import {
  emptyProgressV5,
  emptyLevelProgressV5,
  type CourseProgressV5,
  type ReviewQueueEntry,
} from "../progress/progress";
import { reviewKeyFor } from "../progress/reviewQueue";
import { getLessonExercises } from "./lessonExerciseModel";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import { CourseHome } from "./CourseHome";
import { escapeHtmlText } from "./renderTestUtils";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const a2Modules = courseModulesByLevel.a2;
const a2Lessons = a2Modules.flatMap((m) => m.lessons);

function makeProgressValue(
  progressV5: CourseProgressV5 = emptyProgressV5(),
): ProgressContextValue {
  // Project the v3-compat `progress` surface from levels.a1, exactly as the
  // real ProgressContext does — so a level-scoped review surface reading
  // `progress` for A1 and `progressV5.levels.a2` for A2 see consistent data.
  const a1 = progressV5.levels.a1;
  return {
    progress: {
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: { ...a1.lessons },
      lastVisitedLessonId: a1.lastVisitedLessonId,
      reviewQueue: [...a1.reviewQueue],
      orphanedLessonIds: [...a1.orphanedLessonIds],
      orphanedReviewKeys: [...a1.orphanedReviewKeys],
      updatedAt: progressV5.updatedAt,
    },
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
      totalLessonCount: 64,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    },
    canDoEvidence: {},
    checkpointAttempts: [],
    progressV5,
    lessonEvidence: (lessonId) =>
      progressV5.levels.a2.lessons[lessonId] ?? progressV5.levels.a1.lessons[lessonId],
    levelSummaryFor: (level) => ({
      level,
      visitedLessonCount: 0,
      totalLessonCount: level === "a1" ? 64 : 60,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    }),
    canDoEvidenceFor: (level) => progressV5.levels[level].canDos,
    checkpointAttemptsFor: (level) => progressV5.levels[level].checkpointAttempts,
    mutationError: null,
    clearMutationError: () => {},
  };
}

function renderAt(path: string, value = makeProgressValue()): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        LocaleProvider,
        null,
        createElement(
          ProgressContext.Provider,
          { value },
          createElement(CourseHome),
        ),
      ),
    ),
  );
}

describe("CourseHome — A2 level view via ?livello=a2 (Phase 3 Task 8)", () => {
  const html = renderAt(coursePathForLevel("a2"));

  it("renders the A2 alignment badge and the exact A2 course shape (15 modules, 60 lessons)", () => {
    expect(html).toContain(itCopy.courseLevels.a2Badge);
    expect(a2Modules.length).toBe(15);
    expect(a2Lessons.length).toBe(60);
    expect(html).toContain(itCopy.home.courseShape(15, 60));
  });

  it("renders the A2 level heading as the focus target", () => {
    expect(html).toMatch(
      /<h2[^>]*id="course-level-heading"[^>]*tabindex="-1"[^>]*>[^<]*A2/,
    );
  });

  it("renders the A2 course map with real A2 module titles, not A1's", () => {
    expect(html).toContain(itCopy.modules["connected-conversation"].title);
    expect(html).toContain(itCopy.modules["a2-synthesis"].title);
    // A1 module titles must not appear in the A2 map.
    expect(html).not.toContain(`>${itCopy.modules.sounds.title}<`);
  });

  it("keeps A2 on the flat course map without A1 area sections", () => {
    expect(html).not.toContain('class="course-area"');
    expect(html).not.toContain("course-area--foundations");
  });

  it("lists the A2 Can-do descriptors and the A2 checkpoint section", () => {
    expect(html).toContain(itCopy.courseLevels.a2CheckpointHeading);
    expect(html).toContain(escapeHtmlText(itCopy.checkpoint.notMet));
    expect(html).toContain(
      itCopy.canDoSummary.demonstratedCount(0, a2CanDosAuthored.length),
    );
    // The summary resolves descriptors from the A2 catalog's own copy.
    const firstDescriptor = a2CanDoDescriptorCopy.it[a2CanDosAuthored[0]!.descriptorCopyId]!;
    expect(html).toContain(firstDescriptor);
  });

  it("marks A2 as the URL-selected option and A2 is never disabled", () => {
    expect(html).toMatch(/data-level="a2"[^>]*aria-current="true"|aria-current="true"[^>]*data-level="a2"/);
    expect(html).not.toContain("aria-disabled");
  });

  it("keeps the bare /percorso view on A1 (stable default)", () => {
    const a1 = renderAt("/percorso");
    expect(a1).toContain(itCopy.home.levelBadge);
    expect(a1).toContain(itCopy.modules.sounds.title);
    expect(a1).toContain(itCopy.home.courseShape(16, 64));
  });
});

function progressV5WithLevelVisit(
  level: "a1" | "a2",
  lessonId: string,
): CourseProgressV5 {
  const base = emptyProgressV5();
  return {
    ...base,
    levels: {
      ...base.levels,
      [level]: {
        ...base.levels[level],
        lessons: {
          [lessonId]: {
            visitedAt: "2026-07-22T00:00:00.000Z",
            practicedAt: null,
            consolidatedAt: null,
            attemptedExerciseIds: [],
            acceptedExerciseIds: [],
          },
        },
        lastVisitedLessonId: lessonId,
      },
    },
  };
}

describe("CourseHome — level-scoped reset on the A2 view (ISSUE 3)", () => {
  it("labels the destructive reset for the A2 level and disables it when A2 has no progress", () => {
    const html = renderAt(coursePathForLevel("a2"));
    expect(html).toMatch(
      /class="action action--destructive[^"]*" disabled=""[^>]*>Azzera i progressi di A2</,
    );
  });

  it("enables the A2 reset once the A2 level itself has visited progress", () => {
    const html = renderAt(
      coursePathForLevel("a2"),
      makeProgressValue(progressV5WithLevelVisit("a2", "connected-conversation-1")),
    );
    expect(html).toMatch(/class="action action--destructive[^"]*">Azzera i progressi di A2</);
    expect(html).not.toMatch(/class="action action--destructive[^"]*" disabled=""/);
  });

  it("keeps the A2 reset disabled when only A1 has progress — the enabled state follows the SELECTED level, never the other", () => {
    const html = renderAt(
      coursePathForLevel("a2"),
      makeProgressValue(progressV5WithLevelVisit("a1", "introductions-1")),
    );
    expect(html).toMatch(
      /class="action action--destructive[^"]*" disabled=""[^>]*>Azzera i progressi di A2</,
    );
  });

  it("keeps the A1 reset disabled on the default view when only A2 has progress", () => {
    const html = renderAt(
      "/percorso",
      makeProgressValue(progressV5WithLevelVisit("a2", "connected-conversation-1")),
    );
    expect(html).toMatch(
      /class="action action--destructive[^"]*" disabled=""[^>]*>Azzera i progressi di A1</,
    );
  });
});

function reviewEntry(lessonId: string, exerciseDefinitionId: string, at: string): ReviewQueueEntry {
  const exercise = getLessonExercises(lessonId)?.exercises.find(
    (candidate) => candidate.definitionId === exerciseDefinitionId,
  );
  if (!exercise) throw new Error(`fixture assumption failed: ${lessonId}:${exerciseDefinitionId}`);
  return {
    reviewKey: reviewKeyFor(lessonId, exerciseDefinitionId),
    lessonId,
    exerciseDefinitionId,
    targetConceptIds: [...exercise.prompt.assessedConceptIds],
    targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
    mistakeCount: 1,
    lastMistakeAt: at,
  };
}

function progressV5WithReviews(
  entries: Partial<Record<"a1" | "a2", ReviewQueueEntry[]>>,
): CourseProgressV5 {
  const base = emptyProgressV5();
  return {
    ...base,
    levels: {
      a0: base.levels.a0,
      a1: { ...emptyLevelProgressV5(), reviewQueue: entries.a1 ?? [] },
      a2: { ...emptyLevelProgressV5(), reviewQueue: entries.a2 ?? [] },
    },
  };
}

const a1ReviewExerciseId = getLessonExercises("introductions-1")!.exercises[0]!.definitionId;
const a2ReviewExerciseId = getLessonExercises("connected-conversation-1")!.exercises[0]!.definitionId;

describe("CourseHome — selected-level review surface (Phase 3 Task 8 spec-fix, BLOCKER 1)", () => {
  // `review.fromLesson(title)` ("Da: <title>") is unique to the review surface,
  // so asserting on it proves the entry is rendered by the review queue rather
  // than merely appearing as a CourseMap lesson link.
  const a1From = itCopy.review.fromLesson(itCopy.lessons["introductions-1"].title);
  const a2From = itCopy.review.fromLesson(itCopy.lessons["connected-conversation-1"].title);

  it("renders the A2 level's own review entry on the A2 view, with an A2 lesson deep link", () => {
    const html = renderAt(
      coursePathForLevel("a2"),
      makeProgressValue(
        progressV5WithReviews({
          a2: [reviewEntry("connected-conversation-1", a2ReviewExerciseId, "2026-02-01T00:00:00.000Z")],
        }),
      ),
    );
    expect(html).toContain(itCopy.review.title); // "Da ripassare"
    expect(html).toContain(itCopy.review.count(1));
    expect(html).toContain(a2From);
    expect(html).toContain(lessonPath("connected-conversation", "connected-conversation-1"));
  });

  it("never surfaces an A1 review entry on the A2 view (reads only the selected level) and shows the truthful A2 empty state", () => {
    const html = renderAt(
      coursePathForLevel("a2"),
      makeProgressValue(
        progressV5WithReviews({
          a1: [reviewEntry("introductions-1", a1ReviewExerciseId, "2026-01-01T00:00:00.000Z")],
        }),
      ),
    );
    // The A1 entry lives only in levels.a1; the A2 review surface must ignore it.
    expect(html).not.toContain(a1From);
    // Apostrophe-free substring of review.empty (renderToStaticMarkup escapes ').
    expect(html).toContain("niente da ripassare");
  });

  it("renders the A1 level's own review entry on the default A1 view", () => {
    const html = renderAt(
      "/percorso",
      makeProgressValue(
        progressV5WithReviews({
          a1: [reviewEntry("introductions-1", a1ReviewExerciseId, "2026-01-01T00:00:00.000Z")],
        }),
      ),
    );
    expect(html).toContain(itCopy.review.count(1));
    expect(html).toContain(a1From);
  });

  it("shows the truthful empty review state on a fresh A1 view", () => {
    const html = renderAt("/percorso");
    expect(html).toContain(itCopy.review.title);
    expect(html).toContain("niente da ripassare");
  });
});

describe("CourseHome — selecting a level moves focus and is back/forward safe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("focuses the level heading when switching to A2, and back to A1 restores its heading", async () => {
    // RR7 commits a `Link` navigation via `React.startTransition`, which the
    // scheduler posts as a MessageChannel macrotask. A bare `await act(async
    // () => dispatch)` only drains microtasks, leaving the transition to
    // commit on a later out-of-act tick and log "update ... not wrapped in
    // act(...)". `clickAndFlush` awaits a macrotask inside act() so the
    // navigation commits within the act() scope; this spy proves the warning
    // is genuinely gone (it still forwards to the real console — not
    // suppressed) rather than merely tolerated.
    const consoleError = vi.spyOn(console, "error");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const value = makeProgressValue();

    const clickAndFlush = async (link: HTMLAnchorElement) => {
      await act(async () => {
        link.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/percorso"] },
          createElement(
            LocaleProvider,
            null,
            createElement(
              ProgressContext.Provider,
              { value },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: "/percorso",
                  element: createElement(CourseHome),
                }),
              ),
            ),
          ),
        ),
      );
    });

    const heading = () => container.querySelector<HTMLHeadingElement>("#course-level-heading");
    expect(heading()?.textContent).toContain("A1");

    // Activate the A2 option (a real link → client push navigation).
    const a2Link = container.querySelector<HTMLAnchorElement>('[data-level="a2"]');
    await clickAndFlush(a2Link!);

    expect(heading()?.textContent).toContain("A2");
    // Focus moved to the newly-selected level's heading (keyboard/AT context).
    expect(document.activeElement).toBe(heading());

    // Both options stay routable: selecting A1 again returns and refocuses.
    const a1Link = container.querySelector<HTMLAnchorElement>('[data-level="a1"]');
    await clickAndFlush(a1Link!);
    expect(heading()?.textContent).toContain("A1");
    expect(document.activeElement).toBe(heading());

    await act(async () => {
      root.unmount();
    });
    container.remove();

    const actWarnings = consoleError.mock.calls.filter((args) =>
      String(args[0]).includes("not wrapped in act"),
    );
    expect(actWarnings).toEqual([]);
  });

  it("swaps the review surface to the newly-selected level on navigation, and back", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const value = makeProgressValue(
      progressV5WithReviews({
        a1: [reviewEntry("introductions-1", a1ReviewExerciseId, "2026-01-01T00:00:00.000Z")],
        a2: [reviewEntry("connected-conversation-1", a2ReviewExerciseId, "2026-02-01T00:00:00.000Z")],
      }),
    );

    const clickAndFlush = async (link: HTMLAnchorElement) => {
      await act(async () => {
        link.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };

    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: ["/percorso"] },
          createElement(
            LocaleProvider,
            null,
            createElement(
              ProgressContext.Provider,
              { value },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: "/percorso",
                  element: createElement(CourseHome),
                }),
              ),
            ),
          ),
        ),
      );
    });

    const a1From = itCopy.review.fromLesson(itCopy.lessons["introductions-1"].title);
    const a2From = itCopy.review.fromLesson(itCopy.lessons["connected-conversation-1"].title);
    // Scope assertions to the review surface (the CourseMap also renders lesson
    // links, so a page-wide check could not tell the two apart).
    const reviewHtml = () => container.querySelector(".review-queue")?.innerHTML ?? "";

    // Default A1 view shows the A1 review entry, not the A2 one.
    expect(reviewHtml()).toContain(a1From);
    expect(reviewHtml()).not.toContain(a2From);

    // Switch to A2 → the review surface swaps to the A2 queue.
    await clickAndFlush(container.querySelector<HTMLAnchorElement>('[data-level="a2"]')!);
    expect(reviewHtml()).toContain(a2From);
    expect(reviewHtml()).not.toContain(a1From);

    // Back to A1 → the surface swaps back to the A1 queue.
    await clickAndFlush(container.querySelector<HTMLAnchorElement>('[data-level="a1"]')!);
    expect(reviewHtml()).toContain(a1From);
    expect(reviewHtml()).not.toContain(a2From);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
