import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
