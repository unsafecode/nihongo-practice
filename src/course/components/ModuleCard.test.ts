import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { it as itCopy } from "../i18n/it";
import { legacyA1CourseModules as courseModules } from "../data/course";
import { buildCourseMapModel, type ModuleMapEntry } from "./courseMapModel";
import { ModuleCard } from "./ModuleCard";
import type { CourseModule } from "../data/types";

/**
 * One shared model exercised across many assertions below (see
 * courseMapModel.test.ts for the pure-model behavior itself; this file only
 * checks ModuleCard's rendering). Under design §7.3 the recognized
 * last-visited lesson is also the recommendation, so "current" and
 * "recommended" coincide on a single continuation module:
 * - "sounds": every lesson visited (all four A1 phonetic lessons), neither
 *   current nor recommended.
 * - "actions": partially visited, and its "actions-1" lesson is the
 *   recognized lastVisitedLessonId -> both current and recommended.
 * - "introductions" and every other module: none of the three states apply.
 */
const model = buildCourseMapModel(
  courseModules,
  ["sounds-1", "sounds-2", "sounds-3", "sounds-4", "actions-1"],
  "actions-1",
);

function entryFor(moduleId: string): ModuleMapEntry<CourseModule> {
  const entry = model.modules.find((item) => item.module.id === moduleId);
  if (!entry) throw new Error(`Missing fixture entry for ${moduleId}`);
  return entry;
}

function renderCard(
  entry: ModuleMapEntry<CourseModule>,
  options: { initiallyExpanded: boolean; recommendedLessonId?: string | null } = {
    initiallyExpanded: false,
  },
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(ModuleCard, {
          entry,
          initiallyExpanded: options.initiallyExpanded,
          recommendedLessonId: options.recommendedLessonId ?? model.recommendedLessonId,
        }),
      ),
    ),
  );
}

describe("ModuleCard: core content", () => {
  it("renders the module's semantic icon, localized title, and outcome", () => {
    const html = renderCard(entryFor("introductions"), { initiallyExpanded: false });
    expect(html).toContain("<svg");
    expect(html).toContain(itCopy.modules.introductions.title);
    expect(html).toContain(itCopy.outcomes["a1-module-outcome-introductions"]);
  });

  it("renders the module-scoped visited lesson count", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.lessonsProgress(1, 4));
  });

  it("never fabricates a time estimate or verb/vocabulary coverage count (the A1 catalog has none)", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html.toLowerCase()).not.toMatch(/\bmin\b|verb|vocabolar|parole/);
  });

  it("defaults its title to h3 for flat course maps", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(`<h3 class="module-card__title">${itCopy.modules.sounds.title}</h3>`);
    expect(html).not.toContain(`<h4 class="module-card__title">`);
  });

  it("renders its title as h4 when nested under a course-area heading", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(
          LocaleProvider,
          null,
          createElement(ModuleCard, {
            entry: entryFor("sounds"),
            initiallyExpanded: false,
            recommendedLessonId: model.recommendedLessonId,
            headingLevel: 4,
          }),
        ),
      ),
    );
    expect(html).toContain(`<h4 class="module-card__title">${itCopy.modules.sounds.title}</h4>`);
    expect(html).not.toContain(`<h3 class="module-card__title">`);
  });
});

describe("ModuleCard: advisory prerequisites", () => {
  it("shows the localized none/start-here text for a module with no prerequisites", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.courseMap.prerequisites([]));
  });

  it("shows the localized prerequisite module name for a module that has one", () => {
    const html = renderCard(entryFor("introductions"), { initiallyExpanded: false });
    expect(html).toContain(
      itCopy.courseMap.prerequisites([itCopy.modules["time-movement"].title]),
    );
  });
});

/**
 * Module-level state tags and per-lesson state text intentionally share the
 * same three words (a lesson row inside the always-rendered lesson list can
 * legitimately say "Visitato"/"Consigliato" too). So these assertions must
 * be scoped to the `.module-card__tags` wrapper specifically, not to the
 * whole document, to test the module-level tag rather than incidental
 * lesson-row text elsewhere in the same markup.
 */
function tagsBlock(html: string): string {
  const match = html.match(/<p class="module-card__tags">.*?<\/p>/);
  return match ? match[0] : "";
}

/**
 * Splits rendered markup into individual lesson `<li>` rows. Requires "<li"
 * to be followed by a space or ">" so it matches actual <li> tags without
 * also matching SVG <line> elements (some module icons use <line> shapes,
 * which otherwise share the same "<li" prefix).
 */
function lessonRows(html: string): string[] {
  return html.split(/(?=<li[ >])/).filter((chunk) => /^<li[ >]/.test(chunk));
}

describe("ModuleCard: explicit state text", () => {
  it("shows both current and recommended state text (not visited) for the coinciding continuation module", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: true });
    const tags = tagsBlock(html);
    expect(tags).toContain(itCopy.courseMap.stateCurrent);
    expect(tags).toContain(itCopy.courseMap.stateRecommended);
    // "actions" is only partially visited, so the module-level visited tag
    // must not appear alongside current/recommended.
    expect(tags).not.toContain(itCopy.courseMap.stateVisited);
  });

  it("shows the visited-state text (and not current/recommended) for the fully-visited module", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    const tags = tagsBlock(html);
    expect(tags).toContain(itCopy.courseMap.stateVisited);
    expect(tags).not.toContain(itCopy.courseMap.stateCurrent);
    expect(tags).not.toContain(itCopy.courseMap.stateRecommended);
  });

  it("shows no state tag block at all for a module that is neither visited, current, nor recommended", () => {
    const html = renderCard(entryFor("routines"), { initiallyExpanded: false });
    expect(html).not.toContain('class="module-card__tags"');
  });
});

describe("ModuleCard: expandable lesson list disclosure", () => {
  it("marks the disclosure expanded, with a visible (non-hidden) lesson list, when initiallyExpanded is true", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html).toMatch(/class="[^"]*module-card__disclosure[^"]*"[^>]*aria-expanded="true"/);
    expect(html).not.toMatch(/id="module-lessons-sounds"[^>]*hidden/);
  });

  it("marks the disclosure collapsed, with a hidden lesson list, when initiallyExpanded is false", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toMatch(/class="[^"]*module-card__disclosure[^"]*"[^>]*aria-expanded="false"/);
    expect(html).toMatch(/id="module-lessons-sounds"[^>]*hidden/);
  });

  it("points aria-controls at the same id the lesson list panel actually uses", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html).toMatch(/aria-controls="module-lessons-sounds"/);
    expect(html).toContain('id="module-lessons-sounds"');
  });

  it("gives the disclosure button a label mentioning the module title, distinct for expand vs collapse", () => {
    const expandedHtml = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(expandedHtml).toContain(
      itCopy.courseMap.expandLabel(itCopy.modules.sounds.title),
    );
    const collapsedHtml = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(collapsedHtml).toContain(
      itCopy.courseMap.collapseLabel(itCopy.modules.sounds.title),
    );
  });

  it("uses a real button element (not a bare styled div) so it's keyboard operable", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html).toMatch(/<button[^>]*module-card__disclosure/);
  });
});

describe("ModuleCard: lesson rows", () => {
  it("renders every lesson's localized title and objective, with no fabricated time estimate", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html).toContain(itCopy.lessons["sounds-1"].title);
    expect(html).toContain(itCopy.objectives["a1-can-do-sounds-descriptor"]);
    expect(html).toContain(itCopy.lessons["sounds-4"].title);
    expect(html.toLowerCase()).not.toMatch(/\bmin\b/);
  });

  it("shows the visited-state text on every visited lesson row", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row).toContain(itCopy.courseMap.stateVisited);
    }
  });

  it("marks exactly the recommended lesson's link with aria-current=\"step\"", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const recommendedRow = rows.find((row) => row.includes("actions-1"));
    const otherRow = rows.find((row) => row.includes("actions-2"));
    expect(recommendedRow).toContain('aria-current="step"');
    expect(otherRow).not.toContain('aria-current="step"');
  });

  it("links each lesson row to its lessonPath(moduleId, lessonId)", () => {
    const html = renderCard(entryFor("introductions"), { initiallyExpanded: true });
    expect(html).toContain('href="/percorso/introductions/introductions-1"');
    expect(html).toContain('href="/percorso/introductions/introductions-2"');
  });
});

/**
 * A second fixture model built with real `lessonEvidence` (design spec §17,
 * Phase 2 Task 6): "sounds-1" is practiced only (attempted, not yet
 * accepted), "sounds-2" is demonstrated (accepted), and the rest of
 * "sounds" carries no practiced/demonstrated evidence at all — only its
 * pre-existing visited status from the outer `visitedLessonIds` list.
 */
const modelWithEvidence = buildCourseMapModel(
  courseModules,
  ["sounds-1", "sounds-2", "sounds-3", "sounds-4", "actions-1"],
  "actions-1",
  {
    "sounds-1": { practicedAt: "2024-01-01T00:00:00.000Z", consolidatedAt: null },
    "sounds-2": {
      practicedAt: "2024-01-01T00:00:00.000Z",
      consolidatedAt: "2024-01-02T00:00:00.000Z",
    },
  },
);

function entryForWithEvidence(moduleId: string): ModuleMapEntry<CourseModule> {
  const entry = modelWithEvidence.modules.find((item) => item.module.id === moduleId);
  if (!entry) throw new Error(`Missing fixture entry for ${moduleId}`);
  return entry;
}

describe("ModuleCard: per-lesson practiced/demonstrated evidence tags (design spec §17, Phase 2 Task 6)", () => {
  it("shows only the practiced tag (not demonstrated) for a lesson that was attempted but not yet accepted", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const practicedOnlyRow = rows.find((row) => row.includes("sounds-1"));
    expect(practicedOnlyRow).toContain(itCopy.courseMap.statePracticed);
    expect(practicedOnlyRow).not.toContain(itCopy.courseMap.stateDemonstrated);
  });

  it("shows the demonstrated tag (the higher tier wins, not also practiced) for an accepted lesson", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const demonstratedRow = rows.find((row) => row.includes("sounds-2"));
    expect(demonstratedRow).toContain(itCopy.courseMap.stateDemonstrated);
    expect(demonstratedRow).not.toContain(itCopy.courseMap.statePracticed);
  });

  it("shows neither the practiced nor the demonstrated tag for a visited-only lesson with no such evidence", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const visitedOnlyRow = rows.find((row) => row.includes("sounds-3"));
    expect(visitedOnlyRow).toContain(itCopy.courseMap.stateVisited);
    expect(visitedOnlyRow).not.toContain(itCopy.courseMap.statePracticed);
    expect(visitedOnlyRow).not.toContain(itCopy.courseMap.stateDemonstrated);
  });
});

/**
 * M2/M3 (quality-review Phase 2 Task 6): per-lesson evidence glyphs must be
 * unified with `LessonExercises.tsx`'s canonical scheme (visited=○,
 * practiced=◐, demonstrated=●) and rendered as explicit `aria-hidden` JSX
 * spans alongside the always-visible text label — never injected only via a
 * CSS `::before` pseudo-element on the text span itself, which assistive
 * tech and any DOM-only inspection (like this render test) cannot see.
 */
describe("ModuleCard: per-lesson evidence glyphs are explicit aria-hidden spans, unified with the lesson-exercises scheme (M2/M3)", () => {
  it("renders the visited row's glyph (○) as a real aria-hidden DOM span next to the visible label", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const visitedOnlyRow = rows.find((row) => row.includes("sounds-3"))!;
    expect(visitedOnlyRow).toMatch(
      /<span class="module-card__lesson-state-glyph" aria-hidden="true">○<\/span>/,
    );
    expect(visitedOnlyRow).toContain(
      `<span class="module-card__lesson-state-text">${itCopy.courseMap.stateVisited}</span>`,
    );
  });

  it("renders the practiced row's glyph (◐) as a real aria-hidden DOM span next to the visible label", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const practicedOnlyRow = rows.find((row) => row.includes("sounds-1"))!;
    expect(practicedOnlyRow).toMatch(
      /<span class="module-card__lesson-state-glyph" aria-hidden="true">◐<\/span>/,
    );
    expect(practicedOnlyRow).toContain(
      `<span class="module-card__lesson-state-text">${itCopy.courseMap.statePracticed}</span>`,
    );
  });

  it("renders the demonstrated row's glyph as ● (matching lesson-exercises' consolidated tier), not ✓ or ★, as a real aria-hidden DOM span", () => {
    const html = renderCard(entryForWithEvidence("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const demonstratedRow = rows.find((row) => row.includes("sounds-2"))!;
    expect(demonstratedRow).toMatch(
      /<span class="module-card__lesson-state-glyph" aria-hidden="true">●<\/span>/,
    );
    expect(demonstratedRow).not.toContain("✓");
    expect(demonstratedRow).not.toContain("★");
    expect(demonstratedRow).toContain(
      `<span class="module-card__lesson-state-text">${itCopy.courseMap.stateDemonstrated}</span>`,
    );
  });
});

describe("ModuleCard: primary call to action", () => {
  it("uses the start label and links to the module's first lesson when nothing in it is visited", () => {
    const html = renderCard(entryFor("routines"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.start);
    expect(html).toContain('href="/percorso/routines/routines-1"');
  });

  it("uses the continue label and links to the first unvisited lesson when partially visited", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.continue);
    expect(html).toContain('href="/percorso/actions/actions-2"');
  });

  it("uses the review label and links to the module's first lesson when fully visited", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.review);
    expect(html).toContain('href="/percorso/sounds/sounds-1"');
  });
});

describe("ModuleCard: no stale chapter/completion language", () => {
  it("never renders chapter/capitolo or mastery/completion wording", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html.toLowerCase()).not.toMatch(/chapter|capitolo/);
    expect(html.toLowerCase()).not.toMatch(/mastery|padronanza|completat|mastered/);
  });
});
