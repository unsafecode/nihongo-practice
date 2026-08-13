/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { ExamplesStepView } from "./ExamplesStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "ex1", kind: "examples", estimateSeconds: 120,
  lines: [
    {
      kana: "みずをください", romaji: "mizu o kudasai",
      literal: { it: "acqua ogg per favore", en: "water obj please" },
      natural: { it: "Acqua, per favore", en: "Water, please" },
    },
    {
      kana: "のみます", romaji: "nomimasu",
      literal: { it: "bevo", en: "I drink" },
      natural: { it: "Bevo", en: "I drink" },
    },
  ],
} as never;

function staticHtml(): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(ExamplesStepView, { step, locale: "it", onComplete: () => {} })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(ExamplesStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickPrimary(container: HTMLElement): void {
  const target = container.querySelector<HTMLButtonElement>("button.engine-primary");
  expect(target).not.toBeNull();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("ExamplesStepView", () => {
  it("renders every line as kana, romaji and natural translation in the active locale", () => {
    const html = staticHtml();
    expect(html).toContain("みずをください");
    expect(html).toContain("mizu o kudasai");
    expect(html).toContain("Acqua, per favore");
    expect(html).toContain("のみます");
    expect(html).toContain("nomimasu");
  });

  it("offers one audio control per line", () => {
    const { container } = mount(() => {});
    expect(container.querySelectorAll(".base-audio-button")).toHaveLength(2);
  });

  it("does not complete before the learner continues", () => {
    let completed = 0;
    mount(() => { completed += 1; });
    expect(completed).toBe(0);
  });

  it("completes exactly once when the learner continues", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickPrimary(container);
    expect(completed).toBe(1);
  });
});
