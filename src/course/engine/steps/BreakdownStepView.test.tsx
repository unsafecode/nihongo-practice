/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { BreakdownStepView } from "./BreakdownStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "bd1", kind: "breakdown", estimateSeconds: 90,
  line: {
    kana: "わたしはみずをのみます", romaji: "watashi wa mizu o nomimasu",
    literal: { it: "io tema acqua ogg bevo", en: "I topic water obj drink" },
    natural: { it: "Io bevo acqua", en: "I drink water" },
  },
  parts: [
    { chunk: "わたしは", role: { it: "soggetto", en: "subject" } },
    { chunk: "みずを", role: { it: "oggetto", en: "object" } },
    { chunk: "のみます", role: { it: "verbo", en: "verb" } },
  ],
} as never;

function staticHtml(): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(BreakdownStepView, { step, locale: "it", onComplete: () => {} })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(BreakdownStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickReveal(container: HTMLElement): void {
  const target = container.querySelector<HTMLButtonElement>("button.engine-reveal");
  expect(target).not.toBeNull();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("BreakdownStepView", () => {
  it("renders the line meaning in the active locale", () => {
    expect(staticHtml()).toContain("Io bevo acqua");
  });

  it("does not reveal any part before the learner asks", () => {
    const html = staticHtml();
    for (const hidden of ["わたしは", "みずを", "のみます", "soggetto", "oggetto", "verbo"]) {
      expect(html).not.toContain(hidden);
    }
  });

  it("reveals parts one at a time with their role labels", () => {
    const { container } = mount(() => {});
    clickReveal(container);
    expect(container.textContent).toContain("わたしは");
    expect(container.textContent).toContain("soggetto");
    expect(container.textContent).not.toContain("のみます");
    expect(container.textContent).not.toContain("verbo");
  });

  it("completes exactly once when the last part is revealed", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickReveal(container);
    clickReveal(container);
    expect(completed).toBe(0);
    clickReveal(container);
    expect(completed).toBe(1);
    expect(container.textContent).toContain("のみます");
    expect(container.textContent).toContain("verbo");
  });
});
