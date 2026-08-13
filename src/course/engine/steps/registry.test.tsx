/** @vitest-environment jsdom */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { STEP_COMPONENTS, renderStep } from "./registry";
import { tokensForLexeme } from "./LexBatchStepView";

const noop = () => {};

function html(step: unknown): string {
  return renderToStaticMarkup(
    createElement(
      LocaleProvider,
      null,
      renderStep(step as never, { locale: "it", onComplete: noop }),
    ),
  );
}

describe("step registry", () => {
  it("registers every Phase 0 step kind", () => {
    for (const kind of ["hook", "rule", "lexBatch"] as const) {
      expect(STEP_COMPONENTS[kind]).toBeDefined();
    }
  });

  it("renders a hook with its situation and can-do", () => {
    const markup = html({
      id: "h", kind: "hook", estimateSeconds: 60,
      situation: { it: "Sei al konbini", en: "You are at the konbini" },
      canDo: { it: "Chiedere il sacchetto", en: "Ask for a bag" },
    });
    expect(markup).toContain("Sei al konbini");
    expect(markup).toContain("Chiedere il sacchetto");
  });

  it("renders a rule with its boundary and counter-example", () => {
    const markup = html({
      id: "r", kind: "rule", estimateSeconds: 90,
      statement: { it: "Regola", en: "Rule" },
      boundary: { it: "Limite", en: "Boundary" },
      counterExample: { it: "Controesempio", en: "Counter" },
    });
    expect(markup).toContain("Regola");
    expect(markup).toContain("Limite");
    expect(markup).toContain("Controesempio");
  });

  it("renders a lexBatch as a grid of real Base lexemes with kana, romaji and gloss", () => {
    const markup = html({
      id: "l", kind: "lexBatch", estimateSeconds: 180,
      lexemes: ["verb-nomu", "verb-kau", "verb-taberu", "verb-yomu"],
    });
    expect(markup).toContain("のみます");
    expect(markup).toContain("nomimasu");
    expect(markup).toContain("bere");
    expect(markup).toContain("engine-lexgrid");
  });

  it("throws on an unregistered kind instead of rendering nothing", () => {
    expect(() =>
      renderStep({ id: "x", kind: "transform", estimateSeconds: 10 } as never,
        { locale: "it", onComplete: noop }),
    ).toThrow(/no component registered/i);
  });
});

describe("lexBatch audio tokens", () => {
  it("gives every non-verb lexeme real synthesis tokens carrying its kana", () => {
    // Regression: an earlier implementation passed an empty token array for
    // every non-verb, so useBaseAudioPlayback would have synthesized "" for
    // the entire konbini vocabulary (all nouns and expressions).
    // Asserted on the tokens, not on the rendered control: jsdom exposes no
    // speechSynthesis, so every status is "unavailable" there and a DOM-level
    // assertion would pass vacuously.
    for (const [id, kana] of [
      ["noun-mizu", "みず"],
      ["expression-sumimasen", "すみません"],
      ["noun-konbini", "こんびに"],
      ["expression-douzo", "どうぞ"],
    ] as const) {
      const { tokens, kana: surface } = tokensForLexeme(id);
      expect(tokens.length, id).toBeGreaterThan(0);
      expect(tokens.map((t) => t.jp).join(""), id).toBe(kana);
      expect(surface, id).toBe(kana);
    }
  });

  it("realizes the polite masu form for verbs through the catalog morphology", () => {
    expect(tokensForLexeme("verb-nomu").kana).toBe("のみます");
    expect(tokensForLexeme("verb-nomu").romaji).toBe("nomimasu");
    expect(tokensForLexeme("verb-matsu").kana).toBe("まちます");
    expect(tokensForLexeme("verb-hanasu").romaji).toBe("hanashimasu");
  });

  it("skips an unknown lexeme id instead of throwing or rendering undefined", () => {
    const markup = html({
      id: "l", kind: "lexBatch", estimateSeconds: 120,
      lexemes: ["noun-mizu", "definitely-not-a-lexeme", "noun-konbini", "expression-douzo"],
    });
    expect(markup).toContain("みず");
    expect(markup).not.toContain("undefined");
  });
});
