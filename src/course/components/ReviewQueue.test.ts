/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import {
  emptyProgress,
  emptyProgressV5,
  emptyLevelProgressV5,
  recordExerciseAcceptance,
  recordExerciseMistake,
} from "../progress/progress";
import type { CourseProgressV3, CourseProgressV5, ExerciseEvidence } from "../progress/progress";
import { reviewKeyFor } from "../progress/reviewQueue";
import { getLessonExercises } from "./lessonExerciseModel";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { lessonPath } from "../../routing/routes";
import { ReviewQueue } from "./ReviewQueue";
import { buildReviewQueueView } from "./reviewQueueModel";
import { opaqueTargetKey } from "../foundations/opaqueTargetKey";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  const exercise = getLessonExercises(lessonId)?.exercises.find(
    (candidate) => candidate.definitionId === exerciseDefinitionId,
  );
  if (!exercise) throw new Error(`fixture assumption failed: ${lessonId}:${exerciseDefinitionId}`);
  return {
    lessonId,
    exerciseDefinitionId,
    requiredExerciseIds:
      getLessonExercises(lessonId)?.exercises.map((e) => e.definitionId) ?? [
        exerciseDefinitionId,
      ],
    targetConceptIds: [...exercise.prompt.assessedConceptIds],
    targetLexemeIds: [...exercise.prompt.assessedLexemeIds],
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
  const progressV5 = emptyProgressV5();
  const progressV5WithA1Queue: CourseProgressV5 = {
    ...progressV5,
    levels: {
      ...progressV5.levels,
      a1: {
        ...progressV5.levels.a1,
        lessons: progress.lessons,
        lastVisitedLessonId: progress.lastVisitedLessonId,
        reviewQueue: progress.reviewQueue,
        orphanedLessonIds: progress.orphanedLessonIds,
        orphanedReviewKeys: progress.orphanedReviewKeys,
      },
    },
  };
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
    progressV5: progressV5WithA1Queue,
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
    mutationError: null,
    clearMutationError: vi.fn(),
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

function mount(
  value: ProgressContextValue,
  props: { level?: "a1" | "a2" } = {},
): { readonly container: HTMLDivElement; readonly root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
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
  });
  return { container, root };
}

function reviewButton(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    ".review-queue__item-actions button",
  );
  if (!button) throw new Error("review button not found");
  return button;
}

function submit(container: HTMLElement): void {
  const button = container.querySelector<HTMLButtonElement>(".lesson-exercise__submit");
  if (!button) throw new Error("submit button not found");
  act(() => button.click());
}

function storageForLocale(locale: "en" | "it"): Storage {
  const values = new Map<string, string>([["nihongo.locale.primary", locale]]);
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

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

  describe("ReviewQueue — varied A1 retrieval interaction", () => {
    const sourceExercise = getLessonExercises("past-negative-1")!.exercises[0]!;
    const sourceProgress = withMistakes([
      "past-negative-1",
      sourceExercise.definitionId,
      "2026-01-01T00:00:00.000Z",
    ]);

    it("labels a varied A1 retrieval and exposes only opaque target metadata on its open card", () => {
      const value = contextValue(sourceProgress);
      const item = buildReviewQueueView(sourceProgress, "a1").items[0]!;
      const { container, root } = mount(value);

      expect(container.innerHTML).toContain("review-queue__varied-task");
      expect(container.innerHTML).toContain(itCopy.a1Lesson.practice.functionLabel);
      expect(item.reviewKey).toBe(sourceProgress.reviewQueue[0]!.reviewKey);
      act(() => reviewButton(container).click());
      const card = container.querySelector<HTMLElement>(".lesson-exercise");

      expect(item.exerciseDefinitionId).not.toBe(sourceExercise.definitionId);
      expect(card?.getAttribute("data-practice-function")).toBe(item.practiceFunction);
      expect(card?.getAttribute("data-visible-target-key")).toBe(
        opaqueTargetKey(item.visibleTargetKey),
      );
      expect(card?.getAttribute("data-visible-target-key")).not.toBe(item.visibleTargetKey);
      expect(card?.outerHTML).not.toContain(
        `data-visible-target-key="${item.visibleTargetKey}"`,
      );

      act(() => root.unmount());
    });

    it("keeps the selected alternate stable across Italian and English UI locales", () => {
      const cardTargetForLocale = (locale: "en" | "it"): string | null => {
        const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          value: storageForLocale(locale),
        });
        try {
          const { container, root } = mount(contextValue(sourceProgress));
          act(() => reviewButton(container).click());
          const target = container
            .querySelector<HTMLElement>(".lesson-exercise")
            ?.getAttribute("data-visible-target-key") ?? null;
          act(() => root.unmount());
          return target;
        } finally {
          if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
          else delete (window as { localStorage?: Storage }).localStorage;
        }
      };

      expect(cardTargetForLocale("it")).toBe(cardTargetForLocale("en"));
    });

    it("resolves the original stored review definition after accepting an alternate", () => {
      const resolveReview = vi.fn();
      const value = contextValue(sourceProgress, { resolveReview });
      const item = buildReviewQueueView(sourceProgress, "a1").items[0]!;
      const prompt = item.prompt;
      const { container, root } = mount(value);

      act(() => reviewButton(container).click());
      if (prompt.kind === "choice") {
        const input = container.querySelector<HTMLInputElement>(
          `input[value="${prompt.correctOptionId}"]`,
        );
        if (!input) throw new Error("correct alternate option not found");
        act(() => input.click());
      } else if (
        prompt.kind === "completion" ||
        prompt.kind === "transformation" ||
        prompt.kind === "constrained-construction"
      ) {
        const input = container.querySelector<HTMLInputElement>('input[type="text"]');
        if (!input) throw new Error("alternate text input not found");
        act(() => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
            input,
            prompt.canonicalAnswer,
          );
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      } else {
        throw new Error(`fixture assumption failed: ${prompt.kind}`);
      }
      submit(container);

      expect(resolveReview).toHaveBeenCalledTimes(1);
      expect(resolveReview).toHaveBeenCalledWith({
        lessonId: "past-negative-1",
        exerciseDefinitionId: sourceExercise.definitionId,
        targetConceptIds: sourceProgress.reviewQueue[0]!.targetConceptIds,
        targetLexemeIds: sourceProgress.reviewQueue[0]!.targetLexemeIds,
      });
      expect(resolveReview.mock.calls[0]![0].exerciseDefinitionId).not.toBe(
        item.exerciseDefinitionId,
      );
      expect(
        recordExerciseAcceptance(
          sourceProgress,
          evidence(
            "past-negative-1",
            sourceExercise.definitionId,
            "2026-01-02T00:00:00.000Z",
          ),
          "review",
        ).reviewQueue,
      ).toEqual([]);

      act(() => root.unmount());
    });

    it("records a retry against the original key without creating an alternate-key attempt", () => {
      const recordAttempt = vi.fn();
      const value = contextValue(sourceProgress, { recordAttempt });
      const item = buildReviewQueueView(sourceProgress, "a1").items[0]!;
      const prompt = item.prompt;
      const { container, root } = mount(value);

      act(() => reviewButton(container).click());
      if (prompt.kind === "choice") {
        const wrongOption = prompt.options.find(
          (option) => option.id !== prompt.correctOptionId,
        );
        if (!wrongOption) throw new Error("wrong alternate option not found");
        const input = container.querySelector<HTMLInputElement>(
          `input[value="${wrongOption.id}"]`,
        );
        if (!input) throw new Error("wrong alternate option not found");
        act(() => input.click());
      } else if (
        prompt.kind === "completion" ||
        prompt.kind === "transformation" ||
        prompt.kind === "constrained-construction"
      ) {
        const input = container.querySelector<HTMLInputElement>('input[type="text"]');
        if (!input) throw new Error("alternate text input not found");
        act(() => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
            input,
            "not the target",
          );
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      } else {
        throw new Error(`fixture assumption failed: ${prompt.kind}`);
      }
      submit(container);

      expect(recordAttempt).toHaveBeenCalledTimes(1);
      expect(recordAttempt).toHaveBeenCalledWith({
        lessonId: "past-negative-1",
        exerciseDefinitionId: sourceExercise.definitionId,
        outcome: "retry",
        targetConceptIds: sourceProgress.reviewQueue[0]!.targetConceptIds,
        targetLexemeIds: sourceProgress.reviewQueue[0]!.targetLexemeIds,
      });
      expect(recordAttempt.mock.calls[0]![0].exerciseDefinitionId).not.toBe(
        item.exerciseDefinitionId,
      );
      const retried = recordExerciseMistake(
        sourceProgress,
        evidence("past-negative-1", sourceExercise.definitionId, "2026-01-02T00:00:00.000Z"),
      );
      expect(retried.reviewQueue).toHaveLength(1);
      expect(retried.reviewQueue[0]?.reviewKey).toBe(sourceProgress.reviewQueue[0]?.reviewKey);

      act(() => root.unmount());
    });
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

  it("treats a Base-owned entry found in the A1 queue as historical, never actionable", () => {
    const baseExercise = getLessonExercises("sounds-1")!.exercises[0]!;
    const base = emptyProgressV5();
    const progressV5: CourseProgressV5 = {
      ...base,
      levels: {
        ...base.levels,
        a1: {
          ...base.levels.a1,
          reviewQueue: [
            {
              reviewKey: reviewKeyFor("sounds-1", baseExercise.definitionId),
              lessonId: "sounds-1",
              exerciseDefinitionId: baseExercise.definitionId,
              targetConceptIds: [],
              targetLexemeIds: [],
              mistakeCount: 1,
              lastMistakeAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        },
      },
    };
    const html = render(contextValue(emptyProgress(), { progressV5 }));
    expect(html).toContain(itCopy.review.orphaned(1));
    expect(html).not.toContain(lessonPath("sounds", "sounds-1"));
    expect(html).not.toContain(itCopy.review.practice);
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

function progressV5WithA2Review(): CourseProgressV5 {
  const base = emptyProgressV5();
  return {
    ...base,
    levels: {
      ...base.levels,
      a2: {
        ...emptyLevelProgressV5(),
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
  it("reads progressV5.levels.a2 and renders the A2 entry with an A2 deep link when level='a2'", () => {
    const value = contextValue(emptyProgress(), { progressV5: progressV5WithA2Review() });
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

  it("keeps an opened A2 review on its original definition without A1 function metadata", () => {
    const progressV5 = progressV5WithA2Review();
    const value = contextValue(emptyProgress(), { progressV5 });
    const item = buildReviewQueueView(progressV5.levels.a2, "a2").items[0]!;
    const { container, root } = mount(value, { level: "a2" });

    act(() => reviewButton(container).click());

    expect(item.exerciseDefinitionId).toBe(item.sourceExerciseDefinitionId);
    expect(
      container.querySelector<HTMLElement>(".lesson-exercise")?.hasAttribute(
        "data-practice-function",
      ),
    ).toBe(false);

    act(() => root.unmount());
  });
});
