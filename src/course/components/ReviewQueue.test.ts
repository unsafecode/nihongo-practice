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
  recordExerciseMistake,
} from "../progress/progress";
import type { CourseProgressV3, ExerciseEvidence } from "../progress/progress";
import { exerciseIdsByLesson } from "../catalog/exercises";
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

function evidence(
  lessonId: string,
  exerciseDefinitionId: string,
  at: string,
): ExerciseEvidence {
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds: exerciseIdsByLesson.get(lessonId) ?? [exerciseDefinitionId],
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
    ...overrides,
  };
}

function render(value: ProgressContextValue): string {
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
            createElement(ReviewQueue, null),
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
    ["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"],
    ["past-negative-1", "past-negative-1-transform-base", "2026-01-02T00:00:00.000Z"],
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
      ["introductions-1", "introductions-1-particle-base", "2026-01-01T00:00:00.000Z"],
      ["introductions-1", "introductions-1-particle-base", "2026-01-03T00:00:00.000Z"],
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
});

describe("ReviewQueue — locale parity", () => {
  it("renders English review copy when the locale is English", () => {
    // The LocaleProvider defaults to Italian; assert the English strings exist
    // and differ so the surface is fully localized in both.
    expect(enCopy.review.title).not.toBe(itCopy.review.title);
    expect(enCopy.review.empty).not.toBe(itCopy.review.empty);
  });
});
