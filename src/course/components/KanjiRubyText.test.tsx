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
 * no script/mode combination that bypasses a revealable or assessed exposure's
 * withheld romaji, or an assessed exposure's hidden furigana.
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
    assessedExplanation: (glyph: string) => `You are being assessed on ${glyph}; no reading is shown.`,
    revealShowLabel: "Reveal the reading",
    revealHideLabel: "Conceal the reading",
    ...overrides,
  };
}

function renderStatic(props: KanjiRubyTextProps): string {
  return renderToStaticMarkup(createElement(KanjiRubyText, props));
}

/**
 * Renders to static markup, then parses it into a detached container so tests
 * can assert against the DOM (querySelector/textContent) instead of coupling
 * to React's exact HTML attribute serialization and ordering.
 */
function renderDom(props: KanjiRubyTextProps): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = renderStatic(props);
  return container;
}

describe("KanjiRubyText — first-supported / supported-retrieval (visible furigana)", () => {
  for (const stage of ["first-supported", "supported-retrieval"] as const) {
    it(`renders a semantic ruby with the glyph as base text and an aria-hidden rt reading (${stage})`, () => {
      const container = renderDom(baseProps({ exposure: exposureAt(stage) }));
      const ruby = container.querySelector("ruby");
      expect(ruby).not.toBeNull();
      expect(ruby?.getAttribute("lang")).toBe("ja");
      // The single taught glyph is the ruby base, always marked with the
      // target hook (consistent emphasis vocabulary), not rendered bare.
      expect(ruby?.querySelector(".kanji-ruby__word-target")?.textContent).toBe("話");
      const rt = ruby?.querySelector("rt");
      expect(rt?.getAttribute("aria-hidden")).toBe("true");
      expect(rt?.textContent).toBe("はな");
    });
  }

  it("exposes a permitted romaji hint as a separate element under romaji script, without replacing the glyph", () => {
    const props = baseProps({ script: "romaji" });
    const container = renderDom(props);
    const ruby = container.querySelector("ruby");
    expect(ruby?.querySelector(".kanji-ruby__word-target")?.textContent).toBe("話");
    expect(container.textContent).toContain("hana");
    // Serialization check kept as a string assertion: the target glyph span is
    // immediately followed by the <rt>, proving the glyph is the ruby base and
    // was not swapped for romaji. This asserts sibling *order* in the markup,
    // which a DOM presence query cannot express.
    expect(renderStatic(props)).toMatch(/kanji-ruby__word-target">話<\/span><\/span><rt/);
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
    const container = renderDom(
      baseProps({
        exposure: exposureAt("first-supported"),
        word: "話す",
        wordKana: "はなす",
      }),
    );
    const ruby = container.querySelector("ruby");
    expect(ruby?.getAttribute("lang")).toBe("ja");
    expect(ruby?.querySelector(".kanji-ruby__word-target")?.textContent).toBe("話");
    // The trailing す is context, in a context span (not the target hook).
    expect(ruby?.querySelector(".kanji-ruby__word-ctx")?.textContent).toBe("す");
    const rt = ruby?.querySelector("rt");
    expect(rt?.getAttribute("aria-hidden")).toBe("true");
    expect(rt?.textContent).toBe("はなす");
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

  it("withholds the romaji hint even under romaji script at the revealable stage", () => {
    const { container } = mount(baseProps({ exposure: exposureAt("revealable"), script: "romaji" }));
    expect(container.textContent).not.toContain("hana");
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
  it("marks the single taught glyph with the target hook — no ruby, no rt, no romaji — even under romaji script", () => {
    const container = renderDom(baseProps({ exposure: exposureAt("assessed"), script: "romaji" }));
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).not.toContain("hana");
    expect(container.textContent).not.toContain("はな");
    // A word that is the single taught glyph is still marked (no context
    // spans, but the target hook), so it never reads as an unemphasised
    // context character. Regression guard for the 13 single-glyph words.
    expect(container.querySelector(".kanji-ruby__word-target")?.textContent).toBe("話");
    expect(container.querySelector(".kanji-ruby__word-ctx")).toBeNull();
  });

  it("renders the assessed explanation caption tagged with data-copy-id=a2-kanji-why-visible", () => {
    const html = renderStatic(
      baseProps({ exposure: exposureAt("assessed"), assessedExplanation: () => "Why no reading is shown here." }),
    );
    expect(html).toContain('data-copy-id="a2-kanji-why-visible"');
    expect(html).toContain("Why no reading is shown here.");
  });

  it("names the taught glyph in the assessed explanation caption (the non-visual cue of which glyph is under test)", () => {
    // At assessed there is no ruby and no gloss, so the visual emphasis is the
    // only thing saying which glyph is being tested — for sighted users. The
    // caption interpolates the glyph so that information is also present as
    // plain DOM text (resolvable by braille / character navigation).
    const container = renderDom(baseProps({ glyph: "毎", exposure: exposureAt("assessed") }));
    const caption = container.querySelector('[data-copy-id="a2-kanji-why-visible"]');
    expect(caption?.textContent).toContain("毎");
  });

  it("withholds furigana/romaji at assessed in every recognition mode", () => {
    for (const mode of ALL_MODES) {
      const html = renderStatic(baseProps({ exposure: exposureAt("assessed"), script: "romaji", mode }));
      expect(html).not.toContain("<rt");
      expect(html).not.toContain("hana");
      expect(html).not.toContain("はな");
    }
  });

  it("renders the word base at assessed — no ruby, no rt, no romaji (word prop)", () => {
    const container = renderDom(
      baseProps({
        exposure: exposureAt("assessed"),
        script: "romaji",
        word: "話す",
        wordKana: "はなす",
      }),
    );
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).not.toContain("hana");
    // wordKana is never rendered at assessed — no rt to put it in.
    expect(container.textContent).not.toContain("はなす");
    // The word base wraps the taught glyph in its emphasis hook; this asserts
    // the DOM structure only — the rendered visual emphasis is verified by the
    // Playwright suite (jsdom has no layout engine to see it).
    expect(container.querySelector(".kanji-ruby__word-target")?.textContent).toBe("話");
    expect(container.querySelector(".kanji-ruby__word-ctx")?.textContent).toBe("す");
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
