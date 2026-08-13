/** @vitest-environment jsdom */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { STEP_COMPONENTS, renderStep } from "./registry";

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
