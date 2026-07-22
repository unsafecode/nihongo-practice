/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { coursePathForLevel } from "../../routing/routePaths";
import { a2CanDoDescriptorCopy } from "../a2/catalog/canDos";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { courseModulesByLevel } from "../data/course";
import { it as itCopy } from "../i18n/it";
import { emptyProgressV4, type CourseProgressV4 } from "../progress/progress";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import { CourseHome } from "./CourseHome";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const a2Modules = courseModulesByLevel.a2;
const a2Lessons = a2Modules.flatMap((m) => m.lessons);

function makeProgressValue(
  progressV4: CourseProgressV4 = emptyProgressV4(),
): ProgressContextValue {
  return {
    progress: {
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: {},
      lastVisitedLessonId: null,
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
      updatedAt: new Date(0).toISOString(),
    },
    corrupted: false,
    persistenceAvailable: true,
    markVisited: () => {},
    recordAttempt: () => {},
    resolveReview: () => {},
    dismissCorruption: () => {},
    reset: () => {},
    migrationNotice: null,
    acknowledgeMigrationNotice: () => {},
    levelSummary: {
      level: "a1",
      visitedLessonCount: 0,
      totalLessonCount: 48,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    },
    canDoEvidence: {},
    checkpointAttempts: [],
    progressV4,
    lessonEvidence: (lessonId) =>
      progressV4.levels.a2.lessons[lessonId] ?? progressV4.levels.a1.lessons[lessonId],
    levelSummaryFor: (level) => ({
      level,
      visitedLessonCount: 0,
      totalLessonCount: level === "a1" ? 48 : 60,
      visitedPercent: 0,
      recommendedContinuationLessonId: null,
    }),
    canDoEvidenceFor: (level) => progressV4.levels[level].canDos,
    checkpointAttemptsFor: (level) => progressV4.levels[level].checkpointAttempts,
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

  it("lists the A2 Can-do descriptors and the A2 checkpoint section", () => {
    expect(html).toContain(itCopy.courseLevels.a2CheckpointHeading);
    expect(html).toContain(itCopy.courseLevels.a2CheckpointNotAttempted);
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
    expect(a1).toContain(itCopy.home.courseShape(12, 48));
  });
});

describe("CourseHome — selecting a level moves focus and is back/forward safe", () => {
  it("focuses the level heading when switching to A2, and back to A1 restores its heading", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const value = makeProgressValue();

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
    await act(async () => {
      a2Link!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
    });

    expect(heading()?.textContent).toContain("A2");
    // Focus moved to the newly-selected level's heading (keyboard/AT context).
    expect(document.activeElement).toBe(heading());

    // Both options stay routable: selecting A1 again returns and refocuses.
    const a1Link = container.querySelector<HTMLAnchorElement>('[data-level="a1"]');
    await act(async () => {
      a1Link!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
    });
    expect(heading()?.textContent).toContain("A1");
    expect(document.activeElement).toBe(heading());

    root.unmount();
    container.remove();
  });
});
