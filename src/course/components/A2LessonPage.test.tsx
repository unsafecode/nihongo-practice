/** @vitest-environment jsdom */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../speech/SpeechRecognitionContext";
import { it as itCopy } from "../i18n/it";
import { LessonPage } from "./LessonPage";
import { lessonPath } from "../../routing/routes";

/**
 * The A2 lesson page (Phase 3 Task 8): the lesson route resolves the level
 * from the (disjoint) module id and renders the A2 section renderer, including
 * the staged contextual-kanji UI. The critical no-bypass contract is proven
 * here at the integration level: an `assessed` kanji rendered inside a real A2
 * lesson leaks neither its furigana nor its romaji into the DOM even when the
 * learner's script setting is `romaji`.
 */

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
  installStorage();
});
afterEach(() => {
  installStorage();
});

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

/** The rendered `<li>` markup for one kanji exposure, by its exposure id. */
function exposureItem(html: string, exposureId: string): string {
  const marker = `data-exposure-id="${exposureId}"`;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`no rendered kanji exposure ${exposureId}`);
  const liStart = html.lastIndexOf("<li", start);
  const liEnd = html.indexOf("</li>", start) + "</li>".length;
  return html.slice(liStart, liEnd);
}

describe("A2 lesson page renders through the A2 renderer + staged kanji", () => {
  const html = render(lessonPath("sequencing-ongoing", "sequencing-ongoing-3"));

  it("resolves the A2 module route and shows its position within the 15 A2 modules", () => {
    // sequencing-ongoing is A2 module 5 of 15.
    expect(html).toContain(itCopy.lesson.modulePosition(5, 15));
  });

  it("renders the reused foundation sentence matrix (8-12 models)", () => {
    expect(html).toContain("foundation-matrix");
  });

  it("renders the contextual-kanji section for this lesson", () => {
    expect(html).toContain(itCopy.kanji.sectionHeading);
    expect(html).toContain('class="a2-kanji"');
  });

  it("shows a supported-retrieval glyph as a semantic ruby with an aria-hidden reading", () => {
    // 洗 (arau) is at supported-retrieval in sequencing-ongoing-3.
    const item = exposureItem(html, "a2-kanji-ara-洗-supported-retrieval");
    expect(item).toMatch(/<ruby lang="ja"/);
    expect(item).toMatch(/<rt[^>]*aria-hidden="true"[^>]*>あら<\/rt>/);
  });

  it("shows a revealable glyph behind an accessible reveal control (aria-expanded), reading hidden until revealed", () => {
    // 起 (okiru) is at revealable in sequencing-ongoing-3.
    const item = exposureItem(html, "a2-kanji-o-起-revealable");
    expect(item).toContain("kanji-reveal");
    expect(item).toMatch(/aria-expanded="false"/);
    // The reading is not present in the DOM while collapsed (no <rt> leak).
    expect(item).not.toContain("<rt");
  });
});

describe("A2 lesson page: assessed kanji never leaks its reading, even in romaji mode", () => {
  it("renders an assessed glyph bare (no furigana, no romaji) with a visible explanation, under romaji script", () => {
    installStorage({ "nihongo.script": "romaji" });
    const html = render(lessonPath("connected-conversation", "connected-conversation-4"));
    // 話 (hana / はな) is assessed at connected-conversation-4.
    const item = exposureItem(html, "a2-kanji-hana-話-assessed");
    expect(item).toContain("話"); // the required bare glyph
    expect(item).toContain(itCopy.kanji.assessedExplanation); // explanatory caption
    // No romaji bypass and no furigana leak, even though script === "romaji":
    // no ruby/rt element, no romaji-hint element, and the kana reading never
    // appears as visible text. (The `data-exposure-id` deliberately carries the
    // glyph's semantic romaji id — that is an id, never learner-visible copy —
    // so the leak check targets rendered elements/text, not that attribute.)
    expect(item).not.toContain("はな");
    expect(item).not.toContain("kanji-ruby__romaji-hint");
    expect(item).not.toContain("<rt");
    expect(item).not.toContain("<ruby");
    // The assessed glyph span itself renders only the glyph + the caption.
    const assessedSpan = item.slice(item.indexOf('class="kanji-ruby kanji-ruby--assessed"'));
    expect(assessedSpan).not.toContain("hana");
  });
});
