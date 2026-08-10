/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routePaths } from "../../routing/routePaths";
import type { ProgressContextValue } from "../progress/ProgressContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.doUnmock("../levels/runtimeConfig");
  vi.resetModules();
  document.body.innerHTML = "";
});

describe("CourseHome descriptor failure fallback", () => {
  it("keeps a labelled focusable can-do-summary target for the checkpoint evidence control", async () => {
    vi.resetModules();
    vi.doMock("../levels/runtimeConfig", async () => {
      const actual = await vi.importActual<typeof import("../levels/runtimeConfig")>(
        "../levels/runtimeConfig",
      );
      return {
        ...actual,
        LEVEL_RUNTIME_CONFIG: {
          ...actual.LEVEL_RUNTIME_CONFIG,
          a1: {
            ...actual.LEVEL_RUNTIME_CONFIG.a1,
            resolveDescriptor: () => null,
          },
        },
      };
    });

    const [{ CourseHome }, { LocaleProvider }, { ProgressContext }, { emptyProgressV5 }] =
      await Promise.all([
        import("./CourseHome"),
        import("../../i18n/LocaleContext"),
        import("../progress/ProgressContext"),
        import("../progress/progress"),
      ]);
    const progressV5 = emptyProgressV5();
    const progressValue: ProgressContextValue = {
      progress: {
        schemaVersion: 3,
        catalogVersion: "a0-a1-v1",
        lessons: {},
        lastVisitedLessonId: null,
        reviewQueue: [],
        orphanedLessonIds: [],
        orphanedReviewKeys: [],
        updatedAt: "1970-01-01T00:00:00.000Z",
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
        totalLessonCount: 44,
        visitedPercent: 0,
        recommendedContinuationLessonId: null,
      },
      canDoEvidence: {},
      checkpointAttempts: [],
      progressV5,
      lessonEvidence: () => undefined,
      levelSummaryFor: (level) => ({
        level,
        visitedLessonCount: 0,
        totalLessonCount: level === "a1" ? 44 : 0,
        visitedPercent: 0,
        recommendedContinuationLessonId: null,
      }),
      canDoEvidenceFor: () => ({}),
      checkpointAttemptsFor: () => [],
      mutationError: null,
      clearMutationError: () => {},
    };
    const container = document.createElement("div");
    document.body.append(container);
    const root: Root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            MemoryRouter,
            { initialEntries: [`${routePaths.course}?livello=a1`] },
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
      });

      const summary = document.getElementById("can-do-summary");
      expect(summary).not.toBeNull();
      expect(summary?.getAttribute("aria-labelledby")).toBe("can-do-summary-heading");
      expect(summary?.getAttribute("tabindex")).toBe("-1");
      expect(summary?.textContent).toContain("Can-do");
      expect(summary?.textContent).not.toContain("null");

      const scrollIntoView = vi.fn();
      Object.defineProperty(summary, "scrollIntoView", {
        configurable: true,
        value: scrollIntoView,
      });
      const evidenceControl = document.querySelector<HTMLButtonElement>(".checkpoint-state__link");
      expect(evidenceControl).not.toBeNull();

      await act(async () => {
        evidenceControl?.click();
      });

      expect(scrollIntoView).toHaveBeenCalled();
      expect(document.activeElement).toBe(summary);
    } finally {
      await act(async () => root.unmount());
    }
  });
});
