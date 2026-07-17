import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { courseModules } from "../data/course";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import {
  emptyProgress,
  markLessonVisited,
  type CanDoEvidence,
  type CheckpointAttempt,
  type CourseProgressV3,
  type ProgressMigrationNotice,
} from "../progress/progress";
import {
  ProgressContext,
  type ProgressContextValue,
} from "../progress/ProgressContext";
import { CourseHome } from "./CourseHome";

const allLessons = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => ({ ...lesson, moduleId: courseModule.id })),
);
const totalLessons = allLessons.length;
const firstLesson = allLessons[0];
const lastLesson = allLessons[allLessons.length - 1];

function makeProgressValue(
  overrides: Partial<ProgressContextValue> = {},
): ProgressContextValue {
  return {
    progress: emptyProgress(),
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
      totalLessonCount: totalLessons,
      visitedPercent: 0,
      recommendedContinuationLessonId: firstLesson?.id ?? null,
    },
    canDoEvidence: {},
    checkpointAttempts: [],
    ...overrides,
  };
}

function progressWithVisited(lessonIds: string[]): CourseProgressV3 {
  return lessonIds.reduce(markLessonVisited, emptyProgress());
}

function renderHome(
  progressValue: ProgressContextValue,
  initialEntries: Array<string | { pathname: string; state?: unknown }> = [
    "/percorso",
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

/** React's renderToStaticMarkup HTML-escapes &, <, >, ", and ' even inside
 * plain text nodes (not just attributes) — see CourseMap.test.ts for the
 * same precedent. Any copy string containing an apostrophe must be run
 * through this before a .toContain() check against rendered HTML. */
function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
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

  it("shows the A1/JF-CEFR alignment badge and the exact fixed course shape (12 modules, 48 lessons)", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(itCopy.home.levelBadge);
    expect(courseModules.length).toBe(12);
    expect(totalLessons).toBe(48);
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

describe("CourseHome: renders the flat, single-path CourseMap, never the old chapter grid", () => {
  it("renders the course map heading and every real module title", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`class="course-map"`);
    expect(html).toContain(itCopy.courseMap.heading);
    expect(html).toContain(itCopy.modules.sounds.title);
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

describe("CourseHome: destructive, confirmed, localized reset", () => {
  it("renders reset as a destructive action and disables it when there is nothing to reset", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toMatch(
      /class="action action--destructive[^"]*" disabled=""[^>]*>Azzera i progressi</,
    );
  });

  it("enables reset once there is visited or last-visited progress", () => {
    const html = renderHome(
      makeProgressValue({
        progress: progressWithVisited([firstLesson.id]),
      }),
    );
    expect(html).toMatch(/class="action action--destructive[^"]*">Azzera i progressi</);
    expect(html).not.toMatch(
      /class="action action--destructive[^"]*" disabled=""/,
    );
  });

  it("never labels reset with mastery/completion wording", () => {
    expect(itCopy.home.reset.toLowerCase()).not.toMatch(/padronanza|completat/);
    expect(itCopy.home.resetConfirm.toLowerCase()).not.toMatch(/padronanza|completat/);
  });

  it("gates the destructive reset behind a localized window.confirm before clearing progress (source contract)", () => {
    // No @testing-library/react DOM harness is installed in this repo (see
    // LessonPage.test.ts), and renderToStaticMarkup never wires up
    // onClick handlers to real DOM events, so the confirm-gate itself is
    // asserted against the component source, matching that precedent.
    const source = readCourseHomeSource();
    expect(source).toMatch(
      /if \(window\.confirm\(copy\.home\.resetConfirm\)\) reset\(\);/,
    );
  });
});

const sampleMigrationNotice: ProgressMigrationNotice = {
  fromSchemaVersion: 3,
  preservedVisitedLessonIds: ["sounds-1", "sounds-2"],
  resetEvidenceLessonIds: ["introductions-1"],
  acknowledgedAt: null,
};

describe("CourseHome: v3→v4 migration notice (design spec §17, Phase 2 Task 6)", () => {
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
    const acknowledged: ProgressMigrationNotice = {
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
      itCopy.canDoSummary.demonstratedCount(0, a1CanDosAuthored.length),
    );
    for (const canDo of a1CanDosAuthored) {
      expect(html).toContain(escapeHtmlText(itCopy.objectives[canDo.descriptorCopyId]));
    }
    expect(html).toContain(itCopy.canDoSummary.tierNotStarted);
  });

  it("reflects a demonstrated Can-do's evidence tier and demonstrated count from real canDoEvidence", () => {
    const demonstrated = a1CanDosAuthored[0];
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
      itCopy.canDoSummary.demonstratedCount(1, a1CanDosAuthored.length),
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
    const visited = a1CanDosAuthored[0];
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
    const practiced = a1CanDosAuthored[0];
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
    const demonstrated = a1CanDosAuthored[0];
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


describe("CourseHome: A1 checkpoint attempt-state (design spec §8/§17, Phase 2 Task 6)", () => {
  it("shows the honest not-attempted body when there is no checkpoint attempt yet", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(itCopy.checkpoint.heading);
    expect(html).toContain(itCopy.checkpoint.notAttemptedBody);
  });

  it("shows the observational attempted body with real accepted/sampled counts, never a pass/fail score", () => {
    const attempt: CheckpointAttempt = {
      id: "a1-checkpoint-attempt-1",
      checkpointId: "a1-checkpoint",
      attemptedAt: "2024-01-01T00:00:00.000Z",
      acceptedExerciseIds: ["ex-1", "ex-2", "ex-3"],
      sampledCanDoIds: ["a1-can-do-sounds", "a1-can-do-identity"],
    };
    const html = renderHome(
      makeProgressValue({ checkpointAttempts: [attempt] }),
    );
    expect(html).toContain(
      itCopy.checkpoint.attemptedBody(
        attempt.acceptedExerciseIds.length,
        attempt.sampledCanDoIds.length,
      ),
    );
    expect(html).not.toContain(itCopy.checkpoint.notAttemptedBody);
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
