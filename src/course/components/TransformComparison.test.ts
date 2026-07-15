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
