import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { it as itCopy } from "../i18n/it";
import type { TransformComparisonData } from "../data/types";
import { TransformComparison } from "./TransformComparison";

/**
 * A real ending minimal pair from the course data (します -> しません): the only
 * genuine delta is the ません ending (changed example segment id "e1"), so the
 * renderer must mark exactly that one segment and nothing else.
 */
const comparison: TransformComparisonData = {
  id: "cmp-test",
  baseExampleId: "past-negative-2-base",
  changedExampleId: "past-negative-2-changed",
  contrastDimension: "ending",
  changedGearIds: ["ません"],
  changedSegmentIds: ["e1"],
};

/**
 * Module 1's real katakana-first-exposure lesson (design spec §7, §8.3):
 * "sounds-4" introduces コーヒー/ジュース, each carrying its shared hiragana
 * `reading` (こーひー/じゅーす) exactly once, at this, their first exposure.
 */
const soundsKatakanaComparison: TransformComparisonData = {
  id: "cmp-sounds-4",
  baseExampleId: "sounds-4-base",
  changedExampleId: "sounds-4-changed",
  contrastDimension: "word-order",
  changedGearIds: ["ジュース"],
  changedSegmentIds: ["w1"],
};

function render(data: TransformComparisonData): string {
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
          createElement(TransformComparison, { comparison: data }),
        ),
      ),
    ),
  );
}

function marks(html: string): string[] {
  return [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map((m) => m[1]);
}

/**
 * A minimal in-memory `Storage` so {@link withScript} can force the settings
 * provider's initial script without touching real browser storage.
 */
function memoryStorage(initial: Record<string, string>): Storage {
  const values = new Map(Object.entries(initial));
  return {
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
}

/**
 * Forces `ScriptProvider`'s initial script for the duration of `fn` by
 * installing a fake `window.localStorage` before mounting (the settings
 * provider reads it once, synchronously, on mount). Needed because this test
 * environment runs under Node (no real `window`), and only the `mainField`
 * script (default "hiragana", i.e. the Japanese line) ever carries the
 * comparison's marks (design intent: the secondary reading line never
 * duplicates the highlight) — so proving the romaji `RomajiSequence`
 * integration marks its highlighted token correctly requires rendering with
 * script "romaji" at least once.
 */
function withScript<T>(script: "hiragana" | "romaji", fn: () => T): T {
  const globalWithWindow = globalThis as { window?: unknown };
  const original = globalWithWindow.window;
  globalWithWindow.window = {
    localStorage: memoryStorage({ "nihongo.script": script }),
  };
  try {
    return fn();
  } finally {
    globalWithWindow.window = original;
  }
}

function renderWithScript(
  data: TransformComparisonData,
  script: "hiragana" | "romaji",
): string {
  return withScript(script, () => render(data));
}

/**
 * A real question-form comparison (module "essential-questions", lesson 1):
 * これ/は/コーヒー/です/か. The changed example is the exact five-token real
 * catalog sentence "kore wa koohii desu ka" (design spec §6.3) — used to
 * cover first/middle/last/mixed highlighted-token positions with genuine
 * catalog content instead of synthetic fixtures.
 */
function questionComparison(
  changedSegmentIds: readonly string[],
): TransformComparisonData {
  return {
    id: "cmp-essential-questions-1",
    baseExampleId: "essential-questions-1-base",
    changedExampleId: "essential-questions-1-changed",
    contrastDimension: "question",
    changedGearIds: ["か"],
    changedSegmentIds,
  };
}

describe("TransformComparison", () => {
  it("renders localized before and after labels", () => {
    const html = render(comparison);
    expect(html).toContain(itCopy.lesson.comparison.before);
    expect(html).toContain(itCopy.lesson.comparison.after);
  });

  it("marks only the declared changed segment, not the unchanged stem", () => {
    const found = marks(render(comparison));
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("ません");
    expect(found[0]).not.toContain("しゅくだい");
  });

  it("names the changed gear and its localized contrast dimension on the delta strip", () => {
    const html = render(comparison);
    expect(html).toContain(itCopy.lesson.comparison.changed);
    expect(html).toContain(itCopy.lesson.comparison.dimensions.ending);
    expect(html).toContain("ません");
  });

  it("renders Japanese with an explicit ja language tag", () => {
    expect(render(comparison)).toContain('lang="ja"');
  });

  it("renders two comparison cards in a single comparison container", () => {
    const html = render(comparison);
    expect(html).toContain("lesson-comparison");
    expect(
      [...html.matchAll(/lesson-comparison__card--/g)],
    ).toHaveLength(2);
  });
});

/**
 * Assisted katakana first exposure (design spec §7, §8.3; Slice B
 * acceptance). `sounds-4` is Module 1's real lesson introducing コーヒー and
 * ジュース — each catalog segment carries its shared hiragana `reading`, so
 * the renderer must show the authentic katakana with that reading as a
 * semantic ruby annotation, while romaji (derived from the same shared
 * reading in `assembleCourse`, spec §7) keeps rendering as plain text.
 */
describe("TransformComparison: assisted katakana first exposure", () => {
  it("shows Module 1's first コーヒー exposure with its ruby hiragana reading, on the authentic katakana", () => {
    const html = render(soundsKatakanaComparison);
    expect(html).toMatch(
      /<ruby[^>]*>コーヒー<rt[^>]*>こーひー<\/rt><\/ruby>/,
    );
  });

  it("shows the changed ジュース endpoint with its own ruby hiragana reading too", () => {
    const html = render(soundsKatakanaComparison);
    expect(html).toMatch(
      /<ruby[^>]*>ジュース<rt[^>]*>じゅーす<\/rt><\/ruby>/,
    );
  });

  it("still derives the optional romaji line from the shared reading as plain text (no invented ruby on romaji)", () => {
    const html = render(soundsKatakanaComparison);
    expect(html).toContain("koohii");
    expect(html).toContain("juusu");
    // The reading line for a katakana word must never itself gain a nested
    // ruby annotation — the aid belongs on the katakana line only.
    expect(html).not.toMatch(/<rt[^>]*>[^<]*koohii/);
  });

  it("does not invent aid for content that carries no shared reading", () => {
    // The existing ending minimal-pair fixture has no katakana loanword
    // segments at all, so its render must carry no ruby/rt annotation.
    const html = render(comparison);
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
  });
});

/**
 * Semantic romaji rendering (Phase 0 Task 4, master spec §13.2-13.3): the
 * romaji line must render the full runtime segment token list through the
 * shared `RomajiSequence`, never a local fragment join. The comparison's
 * `changedSegmentIds` must feed `highlightedTokenIds` exactly, with every
 * separator kept outside the highlight wrapper.
 */
describe("TransformComparison: semantic romaji rendering", () => {
  it("renders the changed question sentence as one readable romaji sequence", () => {
    // The secondary "reading" line always renders the non-main script
    // (romaji, by default script "hiragana"), unmarked — this is the exact
    // literal the plan requires: "kore wa koohii desu ka".
    const html = render(questionComparison(["p2"]));
    expect(html).toContain("kore wa koohii desu ka");
  });

  it("marks the first highlighted token with the separator outside the mark", () => {
    const html = renderWithScript(questionComparison(["w1"]), "romaji");
    expect(html).toContain(
      '<mark class="lesson-comparison__delta-seg">kore</mark> wa koohii desu ka',
    );
  });

  it("marks a middle highlighted token with separators on both sides outside the mark", () => {
    const html = renderWithScript(questionComparison(["w2"]), "romaji");
    expect(html).toContain(
      'kore wa <mark class="lesson-comparison__delta-seg">koohii</mark> desu ka',
    );
  });

  it("marks the last highlighted token with the leading separator outside the mark", () => {
    const html = renderWithScript(questionComparison(["p2"]), "romaji");
    expect(html).toContain(
      'kore wa koohii desu <mark class="lesson-comparison__delta-seg">ka</mark>',
    );
  });

  it("keeps mixed highlighted and unhighlighted runs readable, each separator outside its mark", () => {
    const html = renderWithScript(questionComparison(["p1", "e1"]), "romaji");
    expect(html).toContain(
      'kore <mark class="lesson-comparison__delta-seg">wa</mark> koohii <mark class="lesson-comparison__delta-seg">desu</mark> ka',
    );
  });

  it("never wraps leading or trailing whitespace inside a highlighted romaji token", () => {
    for (const changedSegmentIds of [["w1"], ["w2"], ["p2"], ["p1", "e1"]]) {
      const html = renderWithScript(
        questionComparison(changedSegmentIds),
        "romaji",
      );
      for (const content of marks(html)) {
        expect(content).not.toMatch(/^\s|\s$/);
      }
    }
  });

  it("renders the guided-board verb ending attached, not separated (\"tabemasu\", never \"tabe masu\")", () => {
    // "actions-1-changed" is the real catalog sentence with a verb stem
    // (たべ) immediately followed by its polite ending (ます), which must
    // stay attached in romaji ("tabemasu"), never gain a spurious space.
    const html = render({
      id: "cmp-actions-1",
      baseExampleId: "actions-1-base",
      changedExampleId: "actions-1-changed",
      contrastDimension: "particle",
      changedGearIds: ["レストラン", "で"],
      changedSegmentIds: ["w1", "p1"],
    });
    expect(html).toContain("tabemasu");
    expect(html).not.toContain("tabe masu");
  });
});
