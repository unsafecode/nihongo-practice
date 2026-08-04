import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import {
  A1_LESSON_SECTION_IDS,
  A2_LESSON_SECTION_IDS,
  lessonSectionAnchorId,
} from "../../routing/lessonSections";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { it as itCopy } from "../i18n/it";
import { LessonPage } from "./LessonPage";

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

const A1_LESSON = "/percorso/introductions/introductions-1";
const PHONETIC_A1_LESSON = "/percorso/sounds/sounds-1";
const A2_LESSON = "/percorso/sequencing-ongoing/sequencing-ongoing-3";

describe("LessonPage — A1 vocabulary-first section dispatcher", () => {
  it("renders six A1 section anchors in the required DOM order with localized headings", () => {
    const html = render(A1_LESSON);
    const sections = html.match(
      /class="lesson-section lesson-section-anchor"/g,
    );
    expect(sections).toHaveLength(6);

    const positions = A1_LESSON_SECTION_IDS.map((sectionId) => {
      expect(html).toContain(
        `<h2 id="${lessonSectionAnchorId(sectionId)}-heading" class="lesson-section__landmark">${itCopy.a1Lesson.sections[sectionId]}</h2>`,
      );
      return html.indexOf(`id="${lessonSectionAnchorId(sectionId)}"`);
    });
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it("does not place examples or practice before vocabulary and grammar", () => {
    const html = render(A1_LESSON);
    const vocabulary = html.indexOf('id="lesson-section-vocabulary"');
    const grammar = html.indexOf('id="lesson-section-grammar"');
    const examples = html.indexOf('class="a1-worked-examples"');
    const practice = html.indexOf('class="a1-practice-ladder"');

    expect(vocabulary).toBeGreaterThan(-1);
    expect(grammar).toBeGreaterThan(vocabulary);
    expect(examples).toBeGreaterThan(grammar);
    expect(practice).toBeGreaterThan(grammar);
  });

  it("renders six desktop and six mobile rail steps", () => {
    const html = render(A1_LESSON);
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(6);
    expect(html.match(/class="lesson-rail-mobile__step"/g)).toHaveLength(6);
  });

  it("uses the same six anchors for a phonetic lesson, with its sound note and fifth spoken activity", () => {
    const html = render(PHONETIC_A1_LESSON);
    expect(html.match(/class="lesson-section lesson-section-anchor"/g)).toHaveLength(
      6,
    );
    expect(html).toContain('data-note-kind="phonetic"');
    expect(html).toContain('class="a1-vocabulary"');
    expect(html.match(/class="lesson-exercise"/g)).toHaveLength(4);
    expect(html.match(/class="spoken-attempt"/g)).toHaveLength(1);
  });
});

describe("LessonPage — A2 remains a four-section lesson", () => {
  it("renders only its established four anchors, labels, and rail steps", () => {
    const html = render(A2_LESSON);
    expect(html.match(/class="lesson-section lesson-section-anchor"/g)).toHaveLength(
      4,
    );
    for (const sectionId of A2_LESSON_SECTION_IDS) {
      expect(html).toContain(
        `<h2 id="${lessonSectionAnchorId(sectionId)}-heading" class="lesson-section__landmark">${itCopy.lesson.sections[sectionId]}</h2>`,
      );
    }
    expect(html.match(/class="lesson-rail__step"/g)).toHaveLength(4);
    expect(html.match(/class="lesson-rail-mobile__step"/g)).toHaveLength(4);
    expect(html).not.toContain('id="lesson-section-vocabulary"');
    expect(html).not.toContain('id="lesson-section-grammar"');
  });
});
