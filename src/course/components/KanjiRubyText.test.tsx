/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Script } from "../../settings/ScriptContext";
import type { KanjiActivityMode, KanjiExposure } from "../a2/kanji/kanjiTypes";
import { KanjiRubyText, type KanjiRubyTextProps } from "./KanjiRubyText";

/**
 * Component contract for the A2 contextual kanji ruby/reveal renderer
 * (Phase 3 Task 3, locked decision L3). Recognition-only; behavior is driven
 * entirely by `exposure.stage` through the real assistance policy — there is
 * no script/mode combination that bypasses an assessed exposure's hidden
 * furigana/withheld romaji.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ALL_MODES: readonly KanjiActivityMode[] = ["read", "choose", "match"];

function exposureAt(stage: KanjiExposure["stage"]): KanjiExposure {
  return {
    id: `test-exposure-${stage}`,
    kanjiId: "a2-kanji-hana-話",
    lexemeSenseId: "a2-sense-hanasu",
    lessonId: "connected-conversation-1",
    stage,
    readingId: "a2-kanji-hana-話-reading",
    contextId: "a2-context-conversation",
  };
}

function baseProps(overrides: Partial<KanjiRubyTextProps> = {}): KanjiRubyTextProps {
  return {
    glyph: "話",
    reading: "はな",
    romaji: "hana",
    exposure: exposureAt("first-supported"),
    script: "hiragana" as Script,
    assessedExplanation: "Kanji you're assessed on show no reading support.",
    ...overrides,
  };
}

function renderStatic(props: KanjiRubyTextProps): string {
  return renderToStaticMarkup(createElement(KanjiRubyText, props));
}

describe("KanjiRubyText — first-supported / supported-retrieval (visible furigana)", () => {
  for (const stage of ["first-supported", "supported-retrieval"] as const) {
    it(`renders a semantic ruby with the glyph as base text and an aria-hidden rt reading (${stage})`, () => {
      const html = renderStatic(baseProps({ exposure: exposureAt(stage) }));
      expect(html).toContain('<ruby lang="ja"');
      expect(html).toMatch(/<ruby[^>]*>話/);
      expect(html).toMatch(/<rt[^>]*aria-hidden="true"[^>]*>はな<\/rt>/);
    });
  }

  it("exposes a permitted romaji hint as a separate element under romaji script, without replacing the glyph", () => {
    const html = renderStatic(baseProps({ script: "romaji" }));
    expect(html).toMatch(/<ruby[^>]*>話/);
    expect(html).toContain("hana");
    // The glyph itself must still be the ruby's base text, not swapped for romaji.
    expect(html).toMatch(/<ruby[^>]*>話<rt/);
  });

  it("does not render a romaji hint under hiragana script", () => {
    const html = renderStatic(baseProps({ script: "hiragana" }));
    expect(html).not.toContain("hana");
  });

  it("behaves identically across all three recognition modes", () => {
    const rendered = ALL_MODES.map((mode) => renderStatic(baseProps({ mode })));
    expect(new Set(rendered).size).toBe(1);
  });
});

describe("KanjiRubyText — revealable (furigana hidden behind a learner toggle)", () => {
  function mount(props: KanjiRubyTextProps): { container: HTMLDivElement; root: Root } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(createElement(KanjiRubyText, props));
    });
    return { container, root };
  }

  it("initially hides the reading behind a collapsed, keyboard-focusable toggle with no aria/title leak", () => {
    const { container } = mount(baseProps({ exposure: exposureAt("revealable") }));
    const button = container.querySelector("button.kanji-reveal");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(button?.tagName).toBe("BUTTON");

    // The glyph itself remains present/accessibly named...
    expect(container.textContent).toContain("話");
    // ...but the reading is not rendered anywhere yet: not in the DOM, not
    // leaked via any title/aria-label on the toggle or elsewhere.
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).not.toContain("はな");
    const allNodes = container.querySelectorAll("*");
    for (const node of allNodes) {
      expect(node.getAttribute("title") ?? "").not.toContain("はな");
      expect(node.getAttribute("aria-label") ?? "").not.toContain("はな");
    }
  });

  it("reveals the actual rt reading text and flips aria-expanded to true after a click, without duplicating glyph+reading in the accessible name", () => {
    const { container } = mount(baseProps({ exposure: exposureAt("revealable") }));
    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    act(() => {
      button.click();
    });

    expect(button.getAttribute("aria-expanded")).toBe("true");
    const rt = container.querySelector("rt");
    expect(rt).not.toBeNull();
    expect(rt?.textContent).toBe("はな");
    // Now that it is the only visible reading, it must not be re-hidden from
    // assistive tech by aria-hidden.
    expect(rt?.getAttribute("aria-hidden")).toBeNull();
    // The ruby's own accessible name is pinned to just the glyph so it does
    // not become a duplicated "話はな" string once rt is no longer hidden.
    const ruby = container.querySelector("ruby");
    expect(ruby?.getAttribute("aria-label")).toBe("話");
  });

  it("toggles back to hidden (aria-expanded false, rt removed) on a second click", () => {
    const { container } = mount(baseProps({ exposure: exposureAt("revealable") }));
    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    act(() => button.click());
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("rt")).toBeNull();
  });

  it("still allows the permitted romaji hint under romaji script at the revealable stage", () => {
    const { container } = mount(baseProps({ exposure: exposureAt("revealable"), script: "romaji" }));
    expect(container.textContent).toContain("hana");
  });
});

describe("KanjiRubyText — assessed (no support, in every mode/script)", () => {
  it("renders only the bare glyph — no ruby, no rt, no romaji — even under romaji script", () => {
    const html = renderStatic(baseProps({ exposure: exposureAt("assessed"), script: "romaji" }));
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
    expect(html).not.toContain("hana");
    expect(html).toContain("話");
  });

  it("renders the assessed explanation caption tagged with data-copy-id=a2-kanji-why-visible", () => {
    const html = renderStatic(
      baseProps({ exposure: exposureAt("assessed"), assessedExplanation: "Why no reading is shown here." }),
    );
    expect(html).toContain('data-copy-id="a2-kanji-why-visible"');
    expect(html).toContain("Why no reading is shown here.");
  });

  it("withholds furigana/romaji at assessed in every recognition mode", () => {
    for (const mode of ALL_MODES) {
      const html = renderStatic(baseProps({ exposure: exposureAt("assessed"), script: "romaji", mode }));
      expect(html).not.toContain("<rt");
      expect(html).not.toContain("hana");
    }
  });
});
