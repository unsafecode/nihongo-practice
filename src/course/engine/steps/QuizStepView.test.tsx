/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { QuizStepView } from "./QuizStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "q1", kind: "quiz", estimateSeconds: 60,
  prompt: { it: 'Come si dice "bevo"?', en: 'How do you say "I drink"?' },
  options: ["のみます", "たべます", "いきます"],
  correctIndex: 0,
} as never;

function staticHtml(onComplete: () => void = () => {}): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(QuizStepView, { step, locale: "it", onComplete })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(QuizStepView, { step, locale: "it", onComplete })));
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

describe("QuizStepView", () => {
  it("renders the prompt in the active locale", () => {
    expect(staticHtml()).toContain('Come si dice &quot;bevo&quot;?');
  });
  it("does not advance on a wrong answer", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickByText(container, "たべます");
    expect(completed).toBe(0);
    expect(container.querySelector('[role="status"]')?.textContent ?? "").not.toBe("");
  });
  it("advances exactly once on the correct answer", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickByText(container, "のみます");
    expect(completed).toBe(1);
  });
  it("advances once even after wrong attempts", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickByText(container, "たべます");
    clickByText(container, "いきます");
    clickByText(container, "のみます");
    clickByText(container, "のみます");
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
