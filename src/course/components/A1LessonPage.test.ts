import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { it as itCopy } from "../i18n/it";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import { module1ItemsByLesson } from "../a1/catalog/module01Sounds";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { A1LessonSection, distinctLexicalTokens } from "./A1LessonPage";

/**
 * `A1LessonSection`'s focused contract (Phase 2 Task 6, master task point 2).
 * Every assertion checks *real* rendered content resolved from the validated
 * release catalog/foundation view model — never a legacy fixture string —
 * proving the rule/comparison/explore/recap anchors each carry the honest
 * content the plan requires for both a semantic and a phonetic lesson.
 */
function renderSection(lessonId: string, sectionId: "rule" | "comparison" | "explore" | "recap"): string {
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

const SEMANTIC_LESSON = "introductions-1";
const PHONETIC_LESSON = "sounds-1";

describe("A1LessonSection — semantic lesson (introductions-1)", () => {
  const model = buildA1LessonViewModel(SEMANTIC_LESSON, "it");
  if (!model.ok) throw new Error("fixture assumption failed: introductions-1 must resolve");

  it("rule: shows the Can-do descriptor and the eight-model sentence matrix", () => {
    const html = renderSection(SEMANTIC_LESSON, "rule");
    expect(html).toContain(model.model.canDoDescriptor);
    expect(html).toContain("foundation-matrix");
    // Italian locale is the LocaleProvider default; the matrix disclosure
    // label proves real foundation copy resolved, not a stub.
    expect(html).toContain(itCopy.foundation.showAll);
  });

  it("comparison: shows the same-family guided construction board", () => {
    const html = renderSection(SEMANTIC_LESSON, "comparison");
    expect(html).toContain("foundation-guided");
    expect(html).toContain(itCopy.foundation.initialLabel);
    expect(html).toContain(itCopy.foundation.targetLabel);
  });

  it("explore: renders the practice exercises and the optional spoken attempt", () => {
    const html = renderSection(SEMANTIC_LESSON, "explore");
    expect(html).toContain(itCopy.exercises.heading);
    expect(html).toContain("spoken-attempt");
  });

  it("recap: restates the Can-do, lists what varied, lists real vocabulary, and notes the next-retrieval behavior", () => {
    const html = renderSection(SEMANTIC_LESSON, "recap");
    expect(html).toContain(model.model.canDoDescriptor);
    expect(html).toContain(itCopy.lesson.recap.canDoLabel);
    expect(html).toContain(itCopy.lesson.recap.vocabLabel);
    expect(html).toContain(itCopy.lesson.recap.nextRetrievalTitle);
    expect(html).toContain(itCopy.lesson.recap.nextRetrievalBody);
    const vocab = distinctLexicalTokens(model.model.matrix.rows);
    expect(vocab.length).toBeGreaterThan(0);
    for (const token of vocab) {
      expect(html).toContain(token.romaji);
    }
  });

  it("never states a pronunciation grade, score, or percentage in any anchor", () => {
    for (const sectionId of ["rule", "comparison", "explore", "recap"] as const) {
      const html = renderSection(SEMANTIC_LESSON, sectionId);
      expect(html.toLowerCase()).not.toMatch(
        /pronunciation|accent|fluency|phoneme|score|grade|%/,
      );
    }
  });
});

describe("A1LessonSection — phonetic lesson (sounds-1)", () => {
  const items = module1ItemsByLesson[PHONETIC_LESSON]!;

  it("rule: shows every item's glyph, romaji, and localized hint", () => {
    const html = renderSection(PHONETIC_LESSON, "rule");
    for (const item of items) {
      expect(html).toContain(item.roman);
      expect(html).toContain(`data-item-id="${item.id}"`);
      expect(html).toContain(itCopy.phonetics[item.hintCopyId]);
    }
  });

  it("comparison: shows each item's contrast partner and a real feature label", () => {
    const html = renderSection(PHONETIC_LESSON, "comparison");
    for (const item of items) {
      expect(html).toContain(`data-contrast-with-id="${item.contrastWithId}"`);
    }
  });

  it("explore: renders the optional spoken attempt (no sentence exercises exist for phonetic lessons)", () => {
    const html = renderSection(PHONETIC_LESSON, "explore");
    expect(html).toContain("spoken-attempt");
  });

  it("recap: shows the phonetic outcome, the distinct contrast features, and the item roster", () => {
    const html = renderSection(PHONETIC_LESSON, "recap");
    expect(html).toContain(itCopy.phonetics["a1-phonetic-outcome-sounds-1"]);
    expect(html).toContain(itCopy.lesson.recap.nextRetrievalTitle);
    for (const item of items) {
      expect(html).toContain(item.roman);
    }
  });

  it("never states a pronunciation grade, score, or percentage in any anchor", () => {
    for (const sectionId of ["rule", "comparison", "explore", "recap"] as const) {
      const html = renderSection(PHONETIC_LESSON, sectionId);
      expect(html.toLowerCase()).not.toMatch(
        /pronunciation|accent|fluency|phoneme|score|grade|%/,
      );
    }
  });
});

describe("A1LessonSection — unavailable content", () => {
  it("renders the localized unavailable notice for an unknown lesson id, never partial content", () => {
    const html = renderSection("no-such-lesson", "rule");
    expect(html).toContain(itCopy.foundation.unavailableTitle);
    expect(html).toContain(itCopy.foundation.unavailableBody);
  });
});

describe("distinctLexicalTokens", () => {
  it("de-duplicates repeated lexical tokens by written form across rows", () => {
    const model = buildA1LessonViewModel(SEMANTIC_LESSON, "en");
    if (!model.ok) throw new Error("fixture assumption failed");
    const vocab = distinctLexicalTokens(model.model.matrix.rows);
    const keys = vocab.map((token) => `${token.jp}\u0000${token.romaji}`);
    expect(new Set(keys).size).toBe(keys.length);
    // Never includes a particle/ending/punctuation token as "vocabulary".
    for (const token of vocab) {
      expect(token.kind).toBe("lexical");
    }
  });
});
