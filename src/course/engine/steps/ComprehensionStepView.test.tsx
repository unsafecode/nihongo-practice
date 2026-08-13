/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { ComprehensionStepView } from "./ComprehensionStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "c1", kind: "comprehension", estimateSeconds: 60,
  question: { it: "Cosa chiede il cliente?", en: "What does the customer ask for?" },
  options: [
    { it: "Un sacchetto", en: "A bag" },
    { it: "Dell'acqua", en: "Some water" },
    { it: "Il conto", en: "The bill" },
  ],
  correctIndex: 1,
} as never;

function staticHtml(onComplete: () => void = () => {}): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(ComprehensionStepView, { step, locale: "it", onComplete })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(ComprehensionStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickByText(container: HTMLElement, text: string): void {
  const target = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === text,
  );
  expect(target).toBeDefined();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("ComprehensionStepView", () => {
  it("renders the question and options in the active locale", () => {
    const html = staticHtml();
    expect(html).toContain("Cosa chiede il cliente?");
    expect(html).toContain("Un sacchetto");
    expect(html).toContain("Dell&#x27;acqua");
  });
  it("does not advance on a wrong answer", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickByText(container, "Un sacchetto");
    expect(completed).toBe(0);
    expect(container.querySelector('[role="status"]')?.textContent ?? "").not.toBe("");
  });
  it("advances exactly once when the correct option is chosen", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickByText(container, "Il conto");
    clickByText(container, "Dell'acqua");
    clickByText(container, "Dell'acqua");
    expect(completed).toBe(1);
  });
  it("never leaks which option is correct", () => {
    const html = staticHtml();
    for (const attribute of ["data-answer", "data-correct", "data-solution", "data-expected"]) {
      expect(html).not.toContain(attribute);
    }
    expect(html).not.toContain("correctIndex");
  });
});
