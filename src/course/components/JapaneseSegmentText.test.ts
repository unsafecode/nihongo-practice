import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { KanjiExposure } from "../a2/kanji/kanjiTypes";
import { JapaneseSegmentText } from "./JapaneseSegmentText";

/**
 * Unit contract for the shared katakana-first-exposure renderer (design spec
 * §7, §8.3; Slice B acceptance). `TransformComparison` and
 * `GuidedTransformation` both render every segment's Japanese text through
 * this single component, so these tests prove the aid rule in one place: a
 * segment carrying a `reading` gets a semantic `<ruby><rt>` hiragana
 * annotation over its authentic katakana; a segment without one — including
 * a later, unassisted reuse of the very same katakana word — renders its
 * plain text completely unchanged, so the component never invents an aid the
 * catalog data does not carry.
 */
function render(jp: string, reading?: string): string {
  return renderToStaticMarkup(
    createElement(JapaneseSegmentText, { jp, reading }),
  );
}

describe("JapaneseSegmentText", () => {
  it("renders a katakana first-exposure segment with a ruby hiragana reading", () => {
    const html = render("コーヒー", "こーひー");
    expect(html).toBe(
      '<ruby class="katakana-assist">コーヒー<rt class="katakana-assist__reading">こーひー</rt></ruby>',
    );
  });

  it("keeps the authentic katakana as the ruby base text, never substituting hiragana for it", () => {
    const html = render("コーヒー", "こーひー");
    expect(html).toMatch(/<ruby[^>]*>コーヒー<rt/);
  });

  it("does not invent a reading for a later unassisted reuse of the same katakana word", () => {
    const html = render("コーヒー", undefined);
    expect(html).toBe("コーヒー");
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
  });

  it("renders any plain (non-katakana) segment unchanged when it carries no reading", () => {
    const html = render("たべます", undefined);
    expect(html).toBe("たべます");
  });
});

/**
 * Phase 3 Task 3 (contextual kanji layer): `JapaneseSegmentText` gains one
 * additive, optional `kanji` render descriptor. When present it delegates
 * entirely to `KanjiRubyText` — proving the delegation actually happens (not
 * a silent no-op) and that an assessed exposure's no-support guarantee
 * survives being routed through this shared renderer, including under a
 * romaji script setting. `jp`/`reading` stay completely unused whenever
 * `kanji` is supplied, and every existing katakana-assist test above keeps
 * passing unchanged, proving this is a pure addition.
 */
describe("JapaneseSegmentText — kanji exposure render path (Phase 3 Task 3)", () => {
  function kanjiExposureFixture(stage: KanjiExposure["stage"]): KanjiExposure {
    return {
      id: `test-${stage}`,
      kanjiId: "a2-kanji-hana-話",
      lexemeSenseId: "a2-sense-hanasu",
      lessonId: "connected-conversation-1",
      stage,
      readingId: "a2-kanji-hana-話-reading",
      contextId: "a2-context-conversation",
    };
  }

  it("delegates entirely to KanjiRubyText when a kanji descriptor is present, ignoring jp/reading", () => {
    const html = renderToStaticMarkup(
      createElement(JapaneseSegmentText, {
        jp: "should-not-appear",
        reading: "should-not-appear-either",
        kanji: {
          glyph: "話",
          reading: "はな",
          romaji: "hana",
          exposure: kanjiExposureFixture("first-supported"),
          script: "hiragana",
          assessedExplanation: "explanation",
          revealShowLabel: "Reveal the reading",
          revealHideLabel: "Conceal the reading",
        },
      }),
    );
    expect(html).toContain('<ruby lang="ja"');
    expect(html).toContain("話");
    expect(html).not.toContain("should-not-appear");
    expect(html).not.toContain("katakana-assist");
  });

  it("never lets an assessed kanji exposure leak furigana/romaji through this shared renderer, even under romaji script", () => {
    const html = renderToStaticMarkup(
      createElement(JapaneseSegmentText, {
        jp: "should-not-appear",
        kanji: {
          glyph: "話",
          reading: "はな",
          romaji: "hana",
          exposure: kanjiExposureFixture("assessed"),
          script: "romaji",
          assessedExplanation: "Why this kanji shows no reading.",
          revealShowLabel: "Reveal the reading",
          revealHideLabel: "Conceal the reading",
        },
      }),
    );
    expect(html).not.toContain("<rt");
    expect(html).not.toContain("hana");
    expect(html).toContain("話");
    expect(html).toContain('data-copy-id="a2-kanji-why-visible"');
  });
});
