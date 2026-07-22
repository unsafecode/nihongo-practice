import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import {
  emptyProgress,
  emptyProgressV4,
  emptyLevelProgress,
  recordExerciseMistake,
} from "../progress/progress";
import type { CourseProgressV3, CourseProgressV4, ExerciseEvidence } from "../progress/progress";
import { reviewKeyFor } from "../progress/reviewQueue";
import { getLessonExercises } from "./lessonExerciseModel";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { lessonPath } from "../../routing/routes";
import { ReviewQueue } from "./ReviewQueue";

/**
 * Static accessible-markup contract for the lightweight `Da ripassare` review
 * queue surface on Practice Home (Slice C plan Task 4 step 4; design spec
 * §10.4). Interaction (opening an entry in review mode, resolving it) is proven
 * by the pure progress/queue tests and Playwright; these assert the surface's
 * empty, populated, orphan, and storage-unavailable presentations and its
 * stable ordering.
 */

/** A real exercise definition id from a lesson's own A1 practice set. */
const introductionsExerciseId = getLessonExercises("introductions-1")!.exercises[0]!.definitionId;
const pastNegativeExerciseId = getLessonExercises("past-negative-1")!.exercises[0]!.definitionId;

function evidence(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ExerciseEvidence {
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds:
      getLessonExercises(lessonId)?.exercises.map((e) => e.definitionId) ?? [
        exerciseDefinitionId,
      ],
    targetConceptIds: [],
    targetLexemeIds: [],
    at,
  };
}

function withMistakes(
  ...mistakes: readonly (readonly [string, string, string])[]
): CourseProgressV3 {
  let progress = emptyProgress();
  for (const [lessonId, exerciseId, at] of mistakes) {
    progress = recordExerciseMistake(progress, evidence(lessonId, exerciseId, at));
  }
  return progress;
}

function contextValue(
  progress: CourseProgressV3,
  overrides: Partial<ProgressContextValue> = {},
): ProgressContextValue {
  return {
    progress,
    corrupted: false,
    persistenceAvailable: true,
    markVisited: vi.fn(),
    recordAttempt: vi.fn(),
    resolveReview: vi.fn(),
    dismissCorruption: vi.fn(),
    reset: vi.fn(),
    clearLevel: vi.fn(),
    migrationNotice: null,
    acknowledgeMigrationNotice: vi.fn(),
    levelSummary: {
      level: "a1",
      visitedLessonCount: 0,
      totalLessonCount: 48,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    },
    canDoEvidence: {},
    checkpointAttempts: [],
    progressV4: emptyProgressV4(),
    lessonEvidence: () => undefined,
    levelSummaryFor: () => ({
      level: "a1",
      visitedLessonCount: 0,
      totalLessonCount: 48,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    }),
    canDoEvidenceFor: () => ({}),
    checkpointAttemptsFor: () => [],
    ...overrides,
  };
}

function render(value: ProgressContextValue, props: { level?: "a1" | "a2" } = {}): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(
            ProgressContext.Provider,
            { value },
            createElement(ReviewQueue, { ...props }),
          ),
        ),
      ),
    ),
  );
}

describe("ReviewQueue — heading and empty state", () => {
  it("renders the localized Da ripassare heading", () => {
    const html = render(contextValue(emptyProgress()));
    expect(html).toContain(itCopy.review.title); // "Da ripassare"
  });

  it("shows the explicit empty message when nothing is queued", () => {
    const html = render(contextValue(emptyProgress()));
    // Apostrophe-free substring (renderToStaticMarkup HTML-escapes ').
    expect(html).toContain("niente da ripassare");
  });
});

describe("ReviewQueue — populated state", () => {
  const populated = withMistakes(
    ["introductions-1", introductionsExerciseId, "2026-01-01T00:00:00.000Z"],
    ["past-negative-1", pastNegativeExerciseId, "2026-01-02T00:00:00.000Z"],
  );

  it("shows the queue count", () => {
    const html = render(contextValue(populated));
    expect(html).toContain(itCopy.review.count(2));
  });

  it("renders each entry with a deep link back to its lesson", () => {
    const html = render(contextValue(populated));
    expect(html).toContain(lessonPath("introductions", "introductions-1"));
    expect(html).toContain(lessonPath("past-negative", "past-negative-1"));
  });

  it("offers a review-now control for each entry", () => {
    const html = render(contextValue(populated));
    expect((html.match(new RegExp(itCopy.review.practice, "g")) ?? []).length).toBe(2);
  });

  it("orders entries most-recent-first (past-negative before introductions)", () => {
    const html = render(contextValue(populated));
    expect(html.indexOf("past-negative")).toBeLessThan(html.indexOf("introductions"));
  });

  it("shows a per-entry mistake count", () => {
    const twice = withMistakes(
      ["introductions-1", introductionsExerciseId, "2026-01-01T00:00:00.000Z"],
      ["introductions-1", introductionsExerciseId, "2026-01-03T00:00:00.000Z"],
    );
    const html = render(contextValue(twice));
    expect(html).toContain(itCopy.review.mistakes(2));
  });
});

describe("ReviewQueue — orphan and storage states (spec §10.4, §16)", () => {
  it("notes preserved orphaned entries without listing them as active", () => {
    const progress: CourseProgressV3 = {
      ...emptyProgress(),
      orphanedReviewKeys: ["old:one", "old:two"],
    };
    const html = render(contextValue(progress));
    expect(html).toContain(itCopy.review.orphaned(2));
  });

  it("warns when persistence is unavailable", () => {
    const html = render(
      contextValue(emptyProgress(), { persistenceAvailable: false }),
    );
    // Apostrophe-free substring (renderToStaticMarkup HTML-escapes ').
    expect(html).toContain("non sta salvando i progressi");
  });

  it("counts authored active entries whose exercises are no longer resolvable", () => {
    const progress: CourseProgressV3 = {
      ...emptyProgress(),
      reviewQueue: [
        {
          reviewKey: "introductions-1:introductions-1-ghost",
          lessonId: "introductions-1",
          exerciseDefinitionId: "introductions-1-ghost",
          targetConceptIds: [],
          targetLexemeIds: [],
          mistakeCount: 1,
          lastMistakeAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const html = render(contextValue(progress));
    expect(html).toContain(itCopy.review.unresolvable(1));
    expect(html).not.toContain(itCopy.review.empty);
  });
});

describe("ReviewQueue — locale parity", () => {
  it("renders English review copy when the locale is English", () => {
    // The LocaleProvider defaults to Italian; assert the English strings exist
    // and differ so the surface is fully localized in both.
    expect(enCopy.review.title).not.toBe(itCopy.review.title);
    expect(enCopy.review.empty).not.toBe(itCopy.review.empty);
    expect(enCopy.review.unresolvable(2)).toContain("2 authored review items");
    expect(itCopy.review.unresolvable(2)).toContain("2 elementi di ripasso");
  });
});

const a2ReviewExerciseId = getLessonExercises("connected-conversation-1")!.exercises[0]!.definitionId;

function progressV4WithA2Review(): CourseProgressV4 {
  const base = emptyProgressV4();
  return {
    ...base,
    levels: {
      ...base.levels,
      a2: {
        ...emptyLevelProgress(),
        reviewQueue: [
          {
            reviewKey: reviewKeyFor("connected-conversation-1", a2ReviewExerciseId),
            lessonId: "connected-conversation-1",
            exerciseDefinitionId: a2ReviewExerciseId,
            targetConceptIds: [],
            targetLexemeIds: [],
            mistakeCount: 1,
            lastMistakeAt: "2026-02-01T00:00:00.000Z",
          },
        ],
      },
    },
  };
}

describe("ReviewQueue — level-scoped A2 surface (Phase 3 Task 8 spec-fix, BLOCKER 1)", () => {
  it("reads progressV4.levels.a2 and renders the A2 entry with an A2 deep link when level='a2'", () => {
    const value = contextValue(emptyProgress(), { progressV4: progressV4WithA2Review() });
    const html = render(value, { level: "a2" });
    expect(html).toContain(itCopy.review.count(1));
    // The A2 lesson title (from the merged copy) and its A2 module deep link.
    expect(html).toContain(itCopy.lessons["connected-conversation-1"].title);
    expect(html).toContain(lessonPath("connected-conversation", "connected-conversation-1"));
  });

  it("shows the truthful empty state for A2 when only the A1 v3-compat queue has entries (never reads the other level)", () => {
    const a1Only = withMistakes([
      "introductions-1",
      getLessonExercises("introductions-1")!.exercises[0]!.definitionId,
      "2026-01-01T00:00:00.000Z",
    ]);
    // level='a2' reads levels.a2 (empty), so the A1 entry must not leak in.
    const html = render(contextValue(a1Only), { level: "a2" });
    expect(html).toContain("niente da ripassare");
    expect(html).not.toContain(lessonPath("introductions", "introductions-1"));
  });

  it("defaults to the A1 v3-compat surface when no level prop is given (existing behavior unchanged)", () => {
    const populated = withMistakes([
      "introductions-1",
      introductionsExerciseId,
      "2026-01-01T00:00:00.000Z",
    ]);
    const html = render(contextValue(populated));
    expect(html).toContain(lessonPath("introductions", "introductions-1"));
  });
});
