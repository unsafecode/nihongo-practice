import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModules } from "../data/course";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import {
  emptyProgress,
  markLessonVisited,
  type CourseProgressV3,
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

describe("CourseHome: renders the phase-based CourseMap, never the old chapter grid", () => {
  it("renders the course map heading and every phase title", () => {
    const html = renderHome(makeProgressValue());
    expect(html).toContain(`class="course-map"`);
    expect(html).toContain(itCopy.courseMap.heading);
    expect(html).toContain(itCopy.courseMap.phases.orient.title);
    expect(html).toContain(itCopy.courseMap.phases.build.title);
    expect(html).toContain(itCopy.courseMap.phases.navigate.title);
    expect(html).toContain(itCopy.courseMap.phases.synthesize.title);
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
