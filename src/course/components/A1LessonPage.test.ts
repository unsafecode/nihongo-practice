import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import {
  A1LessonSection,
  distinctLexicalTokens,
  getCachedA1CurriculumViewModel,
} from "./A1LessonPage";

function renderSection(lessonId: string): string {
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
              createElement(A1LessonSection, { lessonId, sectionId: "rule" }),
            ),
          ),
        ),
      ),
    ),
  );
}

describe("A1LessonSection curriculum realization cache", () => {
  it("reuses one immutable result for repeated lesson and locale requests", () => {
    const first = getCachedA1CurriculumViewModel("introductions-1", "it");
    const second = getCachedA1CurriculumViewModel("introductions-1", "it");

    expect(first).toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    if (first.ok) expect(Object.isFrozen(first.model)).toBe(true);
  });

  it("keeps locale-specific results isolated", () => {
    const italian = getCachedA1CurriculumViewModel("introductions-1", "it");
    const english = getCachedA1CurriculumViewModel("introductions-1", "en");

    expect(italian).not.toBe(english);
    expect(italian.ok).toBe(true);
    expect(english.ok).toBe(true);
    if (italian.ok && english.ok) {
      expect(italian.model.overview.canDo).not.toBe(english.model.overview.canDo);
      expect(italian.model.vocabulary[0]?.meaning).not.toBe(
        english.model.vocabulary[0]?.meaning,
      );
    }
  });

  it("renders a localized unavailable notice rather than partial content for an unknown lesson", () => {
    const html = renderSection("no-such-lesson");
    expect(html).toContain("Non è stato possibile preparare questa lezione");
  });
});

describe("distinctLexicalTokens", () => {
  it("de-duplicates repeated lexical tokens while excluding grammar tokens", () => {
    const result = getCachedA1CurriculumViewModel("introductions-1", "it");
    if (!result.ok || result.model.optionalPattern === null) {
      throw new Error("fixture assumption failed");
    }
    const vocab = distinctLexicalTokens(result.model.optionalPattern.rows);
    const keys = vocab.map((token) => `${token.jp}\u0000${token.romaji}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(vocab.every((token) => token.kind === "lexical")).toBe(true);
  });
});
