/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { ScriptProvider } from "../../../settings/ScriptContext";
import type { A1LessonSectionId } from "../../../routing/lessonSections";
import { buildA1CurriculumViewModel } from "../../a1/curriculum/buildA1CurriculumViewModel";
import { ProgressProvider } from "../../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../../speech/SpeechRecognitionContext";
import { A1LessonSection } from "../A1LessonPage";
import { escapeHtmlText } from "../renderTestUtils";
import { getCourseCopy } from "../../i18n/catalog";
import { A1VocabularySection } from "./A1VocabularySection";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SEMANTIC_LESSON = "introductions-1";
const PHONETIC_LESSON = "sounds-1";

function modelFor(lessonId: string) {
  const result = buildA1CurriculumViewModel(lessonId, "it");
  if (!result.ok) throw new Error(`fixture assumption failed: ${lessonId}`);
  return result.model;
}

function renderSection(
  lessonId: string,
  sectionId: A1LessonSectionId,
): string {
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
            ProgressProvider,
            null,
            createElement(
              SpeechRecognitionProvider,
              null,
              createElement(A1LessonSection, { lessonId, sectionId }),
            ),
          ),
        ),
      ),
    ),
  );
}

describe("A1 curriculum section renderers", () => {
  it("renders an overview before vocabulary with its Can-do, situation, and prerequisite links", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const html = renderSection(SEMANTIC_LESSON, "rule");

    expect(html).toContain('class="a1-lesson-overview"');
    expect(html).toContain(model.overview.canDo);
    expect(html).toContain(model.overview.situation);
    for (const prerequisite of model.overview.prerequisites) {
      expect(html).toContain(prerequisite.title);
      expect(html).toMatch(
        new RegExp(`/percorso/[^"]+/${prerequisite.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
    }
    expect(html).not.toContain("foundation-matrix");
  });

  it("renders every vocabulary item with kana, romaji, its meaning, category, and audio", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const html = renderSection(SEMANTIC_LESSON, "vocabulary");

    expect(html).toContain('class="a1-vocabulary"');
    expect(html).toContain('aria-pressed="true"');
    for (const item of model.vocabulary) {
      expect(html).toContain(`data-vocabulary-id="${item.id}"`);
      expect(html).toContain(item.kana);
      expect(html).toContain(item.romaji);
      expect(html).toContain(item.meaning);
      expect(html).toContain(`data-category="${item.category}"`);
      expect(html).toContain(`data-audio-key="a1-vocabulary-${item.id}"`);
    }
  });

  it("renders grammar fields, textual pattern roles, omission, and nearest contrast", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const html = renderSection(SEMANTIC_LESSON, "grammar");

    expect(html).toContain('class="a1-learning-note"');
    expect(html).toContain(`data-note-kind="${model.note.kind}"`);
    for (const field of [
      model.note.title,
      model.note.meaning,
      model.note.use,
      model.note.construction,
      model.note.typicalMistake,
      model.note.subjectOmission,
      model.note.nearestContrast?.title,
    ]) {
      if (field) expect(html).toContain(escapeHtmlText(field));
    }
    for (const token of model.note.pattern) {
      expect(html).toContain(token.text);
      expect(html).toContain(token.label);
      expect(html).toContain(`data-pattern-kind="${token.kind}"`);
    }
  });

  it("puts glossed, translated, audio-enabled worked examples before the optional pattern disclosure", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const html = renderSection(SEMANTIC_LESSON, "comparison");

    expect(html).toContain('class="a1-worked-examples"');
    for (const example of model.examples) {
      expect(html).toContain(example.spokenJapanese);
      expect(html).toContain(example.translation);
      expect(html).toContain(`data-audio-key="a1-example-${example.variantId}"`);
      for (const token of example.tokens) {
        expect(html).toContain(`data-token-id="${token.token.id}"`);
        expect(html).toContain(token.roleLabel);
        if (token.gloss) expect(html).toContain(token.gloss);
      }
    }
    expect(html).toContain("<details");
    expect(html).toContain("foundation-matrix");
    expect(html.indexOf(model.examples[0]!.spokenJapanese)).toBeLessThan(
      html.indexOf("foundation-matrix"),
    );
    expect(model.dialogue).not.toBeNull();
    expect(html).toContain('class="a1-worked-examples__dialogue"');
    for (const [index, turn] of (model.dialogue ?? []).entries()) {
      expect(html).toContain(turn.spokenJapanese);
      expect(html).toContain(`Turno ${index + 1}`);
    }
  });

  it("shows dictionary, polite, and class labels for every verb vocabulary entry", () => {
    const model = modelFor("actions-1");
    const html = renderSection("actions-1", "vocabulary");
    const verbs = model.vocabulary.filter((item) => item.verb);

    expect(verbs.length).toBeGreaterThan(0);
    for (const item of verbs) {
      expect(html).toContain(item.verb!.dictionary.kana);
      expect(html).toContain(item.verb!.dictionary.romaji);
      expect(html).toContain(item.verb!.polite.kana);
      expect(html).toContain(item.verb!.polite.romaji);
      expect(html).toContain(`Classe verbale`);
    }
  });

  it("renders the blueprint's four generated exercises with function labels and one fifth spoken attempt", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const html = renderSection(SEMANTIC_LESSON, "explore");
    const generated = model.practice.activities.filter(
      (activity) => activity.interactionKind !== "spoken",
    );

    expect(html.match(/class="lesson-exercise"/g)).toHaveLength(4);
    expect(html.match(/class="spoken-attempt"/g)).toHaveLength(1);
    for (const activity of model.practice.activities) {
      expect(html).toContain(`data-practice-function="${activity.function}"`);
    }
    const functions = model.practice.activities.map((activity) =>
      html.indexOf(`data-practice-function="${activity.function}"`),
    );
    expect(functions).toEqual([...functions].sort((left, right) => left - right));
    expect(generated).toHaveLength(4);
  });

  it("renders phonetic lessons through the same six-section flow", () => {
    const model = modelFor(PHONETIC_LESSON);
    expect(renderSection(PHONETIC_LESSON, "rule")).toContain(
      "a1-lesson-overview",
    );
    expect(renderSection(PHONETIC_LESSON, "vocabulary")).toContain(
      "a1-vocabulary",
    );
    const examples = renderSection(PHONETIC_LESSON, "comparison");
    expect(examples).toContain("a1-worked-examples");
    for (const example of model.examples) {
      expect(examples).toContain(example.spokenJapanese);
    }
    const practice = renderSection(PHONETIC_LESSON, "explore");
    expect(practice.match(/class="lesson-exercise"/g)).toHaveLength(4);
    expect(practice.match(/class="spoken-attempt"/g)).toHaveLength(1);
  });

  it("identifies capstone vocabulary as review rather than new words", () => {
    const model = modelFor("capstones-1");
    const html = renderSection("capstones-1", "vocabulary");

    expect(model.vocabulary.every((item) => item.isReview)).toBe(true);
    expect(html).toContain('data-vocabulary-mode="review"');
    expect(html).not.toContain('data-vocabulary-mode="new"');
    expect(html).toContain(model.vocabularyException!);
  });
});

describe("A1 vocabulary meanings", () => {
  it("starts visible and can be hidden and shown again without persisting the toggle", () => {
    const model = modelFor(SEMANTIC_LESSON);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const meaning = model.vocabulary[0]!.meaning;

    act(() => {
      root.render(
        createElement(
          LocaleProvider,
          null,
          createElement(A1VocabularySection, {
            vocabulary: model.vocabulary,
            vocabularyException: model.vocabularyException,
            copy: getCourseCopy("it").a1Lesson,
          }),
        ),
      );
    });

    const toggle = container.querySelector<HTMLButtonElement>(
      ".a1-vocabulary__meaning-toggle",
    );
    expect(toggle?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain(meaning);

    act(() => toggle?.click());
    expect(toggle?.getAttribute("aria-pressed")).toBe("false");
    expect(container.textContent).not.toContain(meaning);
    expect(container.textContent).toContain(model.vocabulary[0]!.kana);
    expect(container.textContent).toContain(model.vocabulary[0]!.romaji);

    act(() => toggle?.click());
    expect(toggle?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain(meaning);

    act(() => root.unmount());
    container.remove();
  });
});
