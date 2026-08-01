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
    meaning: "to speak, to talk",
    exposure: exposureAt("first-supported"),
    script: "hiragana" as Script,
    assessedExplanation: "Kanji you're assessed on show no reading support.",
    revealShowLabel: "Reveal the reading",
    revealHideLabel: "Conceal the reading",
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

  it("renders the full word as the ruby base with the target glyph in kanji-ruby__word-target, and the whole-word kana in the aria-hidden rt (word prop)", () => {
    const html = renderStatic(
      baseProps({
        exposure: exposureAt("first-supported"),
        word: "話す",
        wordKana: "はなす",
      }),
    );
    expect(html).toContain('<ruby lang="ja"');
    expect(html).toMatch(/<rt[^>]*aria-hidden="true"[^>]*>はなす<\/rt>/);
    expect(html).toContain('class="kanji-ruby__word-target">話');
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
    // The ruby's own accessible name is pinned to the word base so it does
    // not become a duplicated "話はな" string once rt is no longer hidden.
    const ruby = container.querySelector("ruby");
    expect(ruby?.getAttribute("aria-label")).toBe("話");
  });

  it("pins the ruby aria-label to the whole word after revealing with word prop — regression for aria-label pinned to bare glyph", () => {
    const { container } = mount(
      baseProps({
        exposure: exposureAt("revealable"),
        word: "話す",
        wordKana: "はなす",
      }),
    );
    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    act(() => {
      button.click();
    });

    const ruby = container.querySelector("ruby");
    // aria-label must be the word, not the bare glyph, so the screen-reader
    // announces "話す" (the full context word) rather than just "話".
    expect(ruby?.getAttribute("aria-label")).toBe("話す");
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

  it("uses the exact caller-supplied EN revealShowLabel/revealHideLabel as the toggle's accessible name, proving no hardcoded fallback string", () => {
    const { container } = mount(
      baseProps({
        exposure: exposureAt("revealable"),
        revealShowLabel: "Reveal the reading",
        revealHideLabel: "Conceal the reading",
      }),
    );
    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Reveal the reading");
    act(() => button.click());
    expect(button.getAttribute("aria-label")).toBe("Conceal the reading");
  });

  it("uses the exact caller-supplied IT revealShowLabel/revealHideLabel as the toggle's accessible name, proving the label is localized rather than a fixed English string", () => {
    const { container } = mount(
      baseProps({
        exposure: exposureAt("revealable"),
        revealShowLabel: "Mostra la lettura",
        revealHideLabel: "Nascondi la lettura",
      }),
    );
    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Mostra la lettura");
    act(() => button.click());
    expect(button.getAttribute("aria-label")).toBe("Nascondi la lettura");
  });
});

describe("KanjiRubyText — assessed (no support, in every mode/script)", () => {
  it("renders only the bare glyph — no ruby, no rt, no romaji — even under romaji script", () => {
    const html = renderStatic(baseProps({ exposure: exposureAt("assessed"), script: "romaji" }));
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
    expect(html).not.toContain("hana");
    expect(html).not.toContain("はな");
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
      expect(html).not.toContain("はな");
    }
  });

  it("renders the 交ぜ書き word base at assessed — no ruby, no rt, no romaji (word prop)", () => {
    const html = renderStatic(
      baseProps({
        exposure: exposureAt("assessed"),
        script: "romaji",
        word: "話す",
        wordKana: "はなす",
      }),
    );
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
    expect(html).not.toContain("hana");
    // wordKana is never rendered at assessed — no rt to put it in.
    expect(html).not.toContain("はなす");
    // The 交ぜ書き word base is rendered with the glyph emphasised.
    expect(html).toContain('class="kanji-ruby__word-target">話');
  });
});

describe("KanjiRubyText — semantic gloss (Phase 3 Task 8 spec-fix, ISSUE 2)", () => {
  function mount(props: KanjiRubyTextProps): { container: HTMLDivElement; root: Root } {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(createElement(KanjiRubyText, props));
    });
    return { container, root };
  }

  for (const stage of ["first-supported", "supported-retrieval"] as const) {
    it(`surfaces the real localized meaning gloss at ${stage} (accessible, not aria-hidden)`, () => {
      const html = renderStatic(
        baseProps({ exposure: exposureAt(stage), meaning: "to speak, to talk" }),
      );
      expect(html).toContain("to speak, to talk");
      // The gloss is not hidden from assistive tech.
      expect(html).not.toMatch(/aria-hidden="true"[^>]*>to speak, to talk/);
    });
  }

  it("renders the meaning as text, never as a raw copy id", () => {
    const html = renderStatic(
      baseProps({ exposure: exposureAt("first-supported"), meaning: "to speak, to talk" }),
    );
    expect(html).toContain("to speak, to talk");
    // The resolved gloss text is rendered — never the catalog's copy id.
    expect(html).not.toContain("a2-kanji-");
    expect(html).not.toContain("-meaning");
  });

  it("does NOT surface the meaning at the assessed stage, in any mode or script (no answer leak)", () => {
    for (const mode of ALL_MODES) {
      for (const script of ["hiragana", "romaji"] as const) {
        const html = renderStatic(
          baseProps({
            exposure: exposureAt("assessed"),
            mode,
            script,
            meaning: "SENTINEL_ASSESSED_GLOSS",
          }),
        );
        expect(html).not.toContain("SENTINEL_ASSESSED_GLOSS");
      }
    }
  });

  it("gates the meaning behind the reveal toggle at the revealable stage: hidden until revealed, shown after", () => {
    const { container } = mount(
      baseProps({ exposure: exposureAt("revealable"), meaning: "SENTINEL_REVEAL_GLOSS" }),
    );
    // Collapsed: neither the reading nor the meaning is present anywhere.
    expect(container.textContent).not.toContain("SENTINEL_REVEAL_GLOSS");
    for (const node of container.querySelectorAll("*")) {
      expect(node.getAttribute("title") ?? "").not.toContain("SENTINEL_REVEAL_GLOSS");
      expect(node.getAttribute("aria-label") ?? "").not.toContain("SENTINEL_REVEAL_GLOSS");
    }

    const button = container.querySelector("button.kanji-reveal") as HTMLButtonElement;
    act(() => button.click());
    // Revealed: the meaning is now surfaced alongside the reading.
    expect(container.textContent).toContain("SENTINEL_REVEAL_GLOSS");
  });

  it("omits the meaning element entirely when no gloss is supplied", () => {
    const html = renderStatic(
      baseProps({ exposure: exposureAt("first-supported"), meaning: undefined }),
    );
    expect(html).not.toContain("kanji-ruby__meaning");
  });
});
