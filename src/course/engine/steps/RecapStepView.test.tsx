/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { RecapStepView } from "./RecapStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "rc1", kind: "recap", estimateSeconds: 40,
  learned: [
    { it: "Chiedere qualcosa con kudasai", en: "Ask for something with kudasai" },
    { it: "Ringraziare con arigatou", en: "Thank with arigatou" },
  ],
  next: { it: "Prossimo: pagare alla cassa", en: "Next: paying at the till" },
} as never;

function staticHtml(): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(RecapStepView, { step, locale: "it", onComplete: () => {} })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(RecapStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickPrimary(container: HTMLElement): void {
  const target = container.querySelector<HTMLButtonElement>("button.engine-primary");
  expect(target).not.toBeNull();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("RecapStepView", () => {
  it("renders the learned items and the forward pointer in the active locale", () => {
    const html = staticHtml();
    expect(html).toContain("Chiedere qualcosa con kudasai");
    expect(html).toContain("Ringraziare con arigatou");
    expect(html).toContain("Prossimo: pagare alla cassa");
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
