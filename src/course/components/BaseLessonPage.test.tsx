/** @vitest-environment jsdom */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { lessonSectionAnchorId } from "../../routing/lessonSections";
import { buildBaseLessonViewModel } from "../base/view/buildBaseLessonViewModel";
import { buildBasePracticeModel } from "../base/view/buildBasePracticeModel";
import { escapeHtmlText } from "./renderTestUtils";
import { BaseLessonPage } from "./BaseLessonPage";

function installStorage(initial: Readonly<Record<string, string>> = {}): void {
  const values = new Map<string, string>(Object.entries(initial));
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
}

beforeEach(() => {
  installStorage({ "nihongo.locale.primary": "en" });
});
afterEach(() => {
  installStorage({ "nihongo.locale.primary": "en" });
});

function render(lessonId: string): string {
  return renderToStaticMarkup(
    createElement(
      SpeechRecognitionProvider,
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
            createElement(BaseLessonPage, { lessonId }),
          ),
        ),
      ),
    ),
  );
}

const SIX_SECTIONS = ["rule", "vocabulary", "grammar", "comparison", "explore", "recap"] as const;

describe("BaseLessonPage", () => {
  it("renders the six stable section anchors for a semantic lesson", () => {
    const html = render("sentence-foundations-1");
    for (const sectionId of SIX_SECTIONS) {
      expect(html).toContain(`id="${lessonSectionAnchorId(sectionId)}"`);
    }
  });

  it("renders the complete promised content for a semantic lesson", () => {
    const lessonId = "sentence-foundations-1";
    const html = render(lessonId);
    const viewResult = buildBaseLessonViewModel(lessonId, "en");
    expect(viewResult.ok).toBe(true);
    if (!viewResult.ok || viewResult.model.contract === "phonetic") return;
    const model = viewResult.model;

    // Vocabulary.
    for (const item of model.vocabulary) {
      expect(html).toContain(`data-vocabulary-id="${item.id}"`);
    }
    // Explanation: construction, constraints/common error, nearest contrast.
    expect(html).toContain(escapeHtmlText(model.explanation.construction));
    expect(html).toContain(escapeHtmlText(model.explanation.constraints));
    expect(html).toContain(escapeHtmlText(model.explanation.commonError));
    expect(html).toContain(escapeHtmlText(model.explanation.nearestContrast));
    // Progressive reference snapshot.
    expect(model.referenceSnapshots.length).toBeGreaterThan(0);
    for (const snapshot of model.referenceSnapshots) {
      expect(html).toContain(`data-reference-id="${snapshot.id}"`);
    }
    // 6-14 worked examples.
    expect(model.examples.length).toBeGreaterThanOrEqual(1);
    for (const example of model.examples) {
      expect(html).toContain(`data-example-id="${example.id}"`);
    }
    // Cumulative recap.
    expect(html).toContain(escapeHtmlText(model.recap));

    // Staged practice: non-spoken + exactly one listening + one spoken.
    const practiceResult = buildBasePracticeModel(lessonId);
    expect(practiceResult.ok).toBe(true);
    if (!practiceResult.ok) return;
    for (const activity of practiceResult.model.activities) {
      expect(html).toContain(`data-activity-id="${activity.id}"`);
    }
    expect(html.match(/base-listening-activity"/g)?.length ?? 0).toBe(1);
  });

  it("renders the complete promised content for a phonetic lesson, including the contrast map", () => {
    const lessonId = "sounds-1";
    const html = render(lessonId);
    const viewResult = buildBaseLessonViewModel(lessonId, "en");
    expect(viewResult.ok).toBe(true);
    if (!viewResult.ok || viewResult.model.contract !== "phonetic") return;
    const model = viewResult.model;

    expect(html).toContain(escapeHtmlText(model.phoneticExplanation));
    for (const item of model.contrastMap.items) {
      expect(html).toContain(`data-contrast-id="${item.id}"`);
    }
    for (const item of model.vocabulary) {
      expect(html).toContain(`data-vocabulary-id="${item.id}"`);
    }
  });

  it("shows an honest unavailable notice for an unknown lesson id rather than a broken page", () => {
    const html = render("not-a-real-lesson");
    expect(html).not.toContain("base-lesson-page__sections");
    expect(html.toLowerCase()).toMatch(/could not be prepared|non è disponibile/);
  });

  it("gives every section a distinct accessible heading", () => {
    const html = render("sentence-foundations-1");
    const headingMatches = [...html.matchAll(/<h2[^>]*id="([^"]+)-heading"/g)];
    const ids = headingMatches.map((match) => match[1]);
    expect(new Set(ids).size).toBe(SIX_SECTIONS.length);
  });
});
