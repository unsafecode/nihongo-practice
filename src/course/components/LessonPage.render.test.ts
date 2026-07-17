import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { it as itCopy } from "../i18n/it";
import { LessonPage } from "./LessonPage";

/**
 * Static accessible-markup contract for the one-page lesson (design spec
 * §4.4/§5.2/§6.2, Task A/D). `renderToStaticMarkup` never runs effects, so the
 * scrollspy is inert and the first section ("rule") is the initial active
 * step — exactly the deterministic markup a first paint / no-JS crawl sees.
 */
function render(path: string): string {
  return renderToStaticMarkup(
    createElement(
      SpeechRecognitionProvider,
      null,
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          LocaleProvider,
          null,
          createElement(
            ScriptProvider,
            null,
            createElement(
              ProgressProvider,
              null,
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: "/percorso/:moduleId/:lessonId",
                  element: createElement(LessonPage),
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function renderWithLegacyNotice(path: string): string {
  return renderToStaticMarkup(
    createElement(
      SpeechRecognitionProvider,
      null,
      createElement(
        MemoryRouter,
        {
          initialEntries: [
            { pathname: path, state: { legacyModuleRedirect: true } },
          ],
        },
        createElement(
          LocaleProvider,
          null,
          createElement(
            ScriptProvider,
            null,
            createElement(
              ProgressProvider,
              null,
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: "/percorso/:moduleId/:lessonId",
                  element: createElement(LessonPage),
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

const TOOL_LESSON = "/percorso/sounds/sounds-1";
const TRANSFORMATION_LESSON = "/percorso/actions/actions-1";

describe("LessonPage — one semantic page, four ordered section landmarks", () => {
  it("renders a single lesson-layout main with exactly four section anchors", () => {
    const html = render(TOOL_LESSON);
    expect(html).toMatch(/<main class="lesson-layout">/);
    const sections = html.match(
      /class="lesson-section lesson-section-anchor"/g,
    );
    expect(sections).toHaveLength(4);
  });

  it("orders the four section anchors rule -> comparison -> explore -> recap", () => {
    const html = render(TOOL_LESSON);
    const positions = LESSON_SECTION_IDS.map((id) =>
      html.indexOf(`id="lesson-section-${id}"`),
    );
    for (const position of positions) expect(position).toBeGreaterThan(-1);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it("labels every section with its own localized heading via aria-labelledby", () => {
    const html = render(TOOL_LESSON);
    for (const id of LESSON_SECTION_IDS) {
      expect(html).toContain(
        `aria-labelledby="lesson-section-${id}-heading"`,
      );
      expect(html).toMatch(
        new RegExp(
          `<h2 id="lesson-section-${id}-heading"[^>]*>${itCopy.lesson.sections[id]}</h2>`,
        ),
      );
    }
  });

  it("marks only the first section active by default (scrollspy inert without effects)", () => {
    const html = render(TOOL_LESSON);
    // One active step per rail (desktop rail + mobile context bar).
    const active = html.match(/aria-current="step"/g);
    expect(active).toHaveLength(2);
  });

  it("shows the module semantic icon in the lesson header eyebrow", () => {
    const html = render(TOOL_LESSON);
    expect(html).toMatch(
      /<p class="course-eyebrow lesson-header__eyebrow">.*?<svg[^>]*aria-hidden="true"/s,
    );
  });

  it("renders both a desktop rail and a mobile context bar with four steps each", () => {
    const html = render(TOOL_LESSON);
    expect(html).toMatch(/<nav class="lesson-rail"/);
    expect(html).toMatch(/<nav class="lesson-rail-mobile"/);
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(4);
    expect(html.match(/class="lesson-rail-mobile__step"/g)).toHaveLength(4);
  });

  it("renders a footer with map/prev/next actions and no completion control", () => {
    const html = render(TRANSFORMATION_LESSON);
    expect(html).toMatch(/<footer class="lesson-footer">/);
    expect(html).toContain(itCopy.lesson.map);
    expect(html).toContain(itCopy.lesson.previous);
    expect(html).toContain(itCopy.lesson.next);
  });
});

describe("LessonPage — explore section renders practice + the optional spoken attempt", () => {
  it("renders the practice exercises heading and the optional spoken attempt for a semantic lesson", () => {
    const html = render(TRANSFORMATION_LESSON);
    expect(html).toContain(itCopy.exercises.heading);
    expect(html).toContain("spoken-attempt");
  });

  it("renders only the optional spoken attempt for a phonetic lesson (no sentence-level exercises exist)", () => {
    const html = render(TOOL_LESSON);
    expect(html).toContain("spoken-attempt");
    expect(html).not.toContain('class="lesson-exercise"');
  });
});

/**
 * Module 1's real katakana roster and its own authored minimal-pair contrasts
 * (Phase 2 Task 6). The legacy curriculum's single ruby-annotated コーヒー
 * sentence no longer exists in the A1 release — every phonetic item's `kana`
 * equals its `glyph` (no distinct hiragana reading is authored), so this
 * proves the real comparison content the validated catalog actually carries:
 * コーヒー's authored chōonpu-length contrast with テレビ.
 */
const KATAKANA_LESSON = "/percorso/sounds/sounds-4";

describe("LessonPage — phonetic lesson comparison section (sounds-4)", () => {
  it("shows コーヒー's authored contrast partner and feature label", () => {
    const html = render(KATAKANA_LESSON);
    expect(html).toContain("koohii");
    expect(html).toContain("terebi");
    expect(html).toContain('data-item-id="snd4-koohii"');
    expect(html).toContain('data-contrast-with-id="snd4-terebi"');
    expect(html).toContain(itCopy.phonetics["a1-phonetic-contrast-chouonpu-length"]);
  });
});

describe("LessonPage — legacy redirect notice", () => {
  it("does not render different-module notice copy for the same-module target", () => {
    const html = render("/percorso/sounds/sounds-1");
    expect(html).not.toContain(itCopy.lesson.legacyModuleNoticeTitle);
    expect(html).not.toContain(itCopy.lesson.legacyModuleNoticeBody);
  });

  it("renders the existing localized notice copy for a cross-module target", () => {
    const html = renderWithLegacyNotice(
      "/percorso/past-negative/past-negative-1",
    );
    expect(html).toContain(itCopy.lesson.legacyModuleNoticeTitle);
    expect(html).toContain(itCopy.lesson.legacyModuleNoticeBody);
  });
});
