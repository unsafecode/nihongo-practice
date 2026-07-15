import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { it as itCopy } from "../i18n/it";
import { courseModules } from "../data/course";
import { buildCourseMapModel, type ModuleMapEntry } from "./courseMapModel";
import { ModuleCard } from "./ModuleCard";
import type { CourseModule } from "../data/types";

/**
 * One shared model exercised across many assertions below (see
 * courseMapModel.test.ts for the pure-model behavior itself; this file only
 * checks ModuleCard's rendering). Under design §7.3 the recognized
 * last-visited lesson is also the recommendation, so "current" and
 * "recommended" coincide on a single continuation module:
 * - "sounds": every lesson visited, neither current nor recommended.
 * - "actions": partially visited, and its "actions-object" lesson is the
 *   recognized lastVisitedLessonId -> both current and recommended.
 * - "sentence-map" and every later module: none of the three states apply.
 */
const model = buildCourseMapModel(
  courseModules,
  ["sounds-core", "sounds-special", "actions-object"],
  "actions-object",
);

function entryFor(moduleId: string): ModuleMapEntry<CourseModule> {
  const entry = model.phases
    .flatMap((phase) => phase.modules)
    .find((item) => item.module.id === moduleId);
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
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain("<svg");
    expect(html).toContain(itCopy.modules.sounds.title);
    expect(html).toContain(itCopy.outcomes.sounds);
  });

  it("renders the module's total estimated minutes", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.courseMap.estimatedMinutes(entryFor("sounds").module.estimatedMinutes));
  });

  it("renders the module-scoped visited lesson count", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.lessonsProgress(1, 2));
  });
});

describe("ModuleCard: advisory prerequisites", () => {
  it("shows the localized none/start-here text for a module with no prerequisites", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.courseMap.prerequisites([]));
  });

  it("shows the localized prerequisite module name for a module that has one", () => {
    const html = renderCard(entryFor("sentence-map"), { initiallyExpanded: false });
    expect(html).toContain(
      itCopy.courseMap.prerequisites([itCopy.modules.sounds.title]),
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
    const html = renderCard(entryFor("time"), { initiallyExpanded: false });
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
  it("renders every lesson's localized title, objective, and estimated minutes", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html).toContain(itCopy.lessons["sounds-core"].title);
    expect(html).toContain(itCopy.objectives["sounds-core"]);
    expect(html).toContain(itCopy.courseMap.estimatedMinutes(10));
    expect(html).toContain(itCopy.lessons["sounds-special"].title);
    expect(html).toContain(itCopy.objectives["sounds-special"]);
    expect(html).toContain(itCopy.courseMap.estimatedMinutes(8));
  });

  it("shows the visited-state text on every visited lesson row", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toContain(itCopy.courseMap.stateVisited);
    }
  });

  it("marks exactly the recommended lesson's link with aria-current=\"step\"", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: true });
    const rows = lessonRows(html);
    const recommendedRow = rows.find((row) => row.includes("actions-object"));
    const otherRow = rows.find((row) => row.includes("actions-masu"));
    expect(recommendedRow).toContain('aria-current="step"');
    expect(otherRow).not.toContain('aria-current="step"');
  });

  it("links each lesson row to its lessonPath(moduleId, lessonId)", () => {
    const html = renderCard(entryFor("sentence-map"), { initiallyExpanded: true });
    expect(html).toContain('href="/percorso/sentence-map/sentence-order"');
    expect(html).toContain('href="/percorso/sentence-map/sentence-omission"');
  });
});

describe("ModuleCard: primary call to action", () => {
  it("uses the start label and links to the module's first lesson when nothing in it is visited", () => {
    const html = renderCard(entryFor("time"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.start);
    expect(html).toContain('href="/percorso/time/time-past"');
  });

  it("uses the continue label and links to the first unvisited lesson when partially visited", () => {
    const html = renderCard(entryFor("actions"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.continue);
    expect(html).toContain('href="/percorso/actions/actions-masu"');
  });

  it("uses the review label and links to the module's first lesson when fully visited", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: false });
    expect(html).toContain(itCopy.home.review);
    expect(html).toContain('href="/percorso/sounds/sounds-core"');
  });
});

describe("ModuleCard: no stale chapter/completion language", () => {
  it("never renders chapter/capitolo or mastery/completion wording", () => {
    const html = renderCard(entryFor("sounds"), { initiallyExpanded: true });
    expect(html.toLowerCase()).not.toMatch(/chapter|capitolo/);
    expect(html.toLowerCase()).not.toMatch(/mastery|padronanza|completat|mastered/);
  });
});
