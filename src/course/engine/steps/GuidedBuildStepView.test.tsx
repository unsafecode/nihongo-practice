/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { GuidedBuildStepView } from "./GuidedBuildStepView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "gb1", kind: "guidedBuild", estimateSeconds: 90,
  target: {
    kana: "わたしはみずをのみます", romaji: "watashi wa mizu o nomimasu",
    literal: { it: "io tema acqua ogg bevo", en: "I topic water obj drink" },
    natural: { it: "Bevo acqua", en: "I drink water" },
  },
  fragments: ["わたしは", "みずを", "のみます"],
  distractors: ["たべます", "ください"],
} as never;

function staticHtml(): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(GuidedBuildStepView, { step, locale: "it", onComplete: () => {} })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(GuidedBuildStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickChip(container: HTMLElement, text: string): void {
  const target = Array.from(container.querySelectorAll("button.engine-chip")).find(
    (button) => button.textContent === text,
  );
  expect(target, `chip "${text}" should be available`).toBeDefined();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

function clickByText(container: HTMLElement, text: string): void {
  const target = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === text,
  );
  expect(target).toBeDefined();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("GuidedBuildStepView", () => {
  it("renders the goal and every fragment and distractor chip", () => {
    const html = staticHtml();
    expect(html).toContain("Bevo acqua");
    for (const chip of ["わたしは", "みずを", "のみます", "たべます", "ください"]) {
      expect(html).toContain(chip);
    }
  });

  it("shuffles chips deterministically for a given step", () => {
    expect(staticHtml()).toBe(staticHtml());
  });

  it("does not leak the assembled target before completion", () => {
    expect(staticHtml()).not.toContain("わたしはみずをのみます");
  });

  it("completes exactly once when the fragments are assembled in order", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickChip(container, "わたしは");
    clickChip(container, "みずを");
    expect(completed).toBe(0);
    clickChip(container, "のみます");
    expect(completed).toBe(1);
  });

  it("does not complete on a wrong order and can be reset", () => {
    let completed = 0;
    const { container } = mount(() => { completed += 1; });
    clickChip(container, "たべます");
    clickChip(container, "わたしは");
    expect(completed).toBe(0);
    clickByText(container, "Ricomincia");
    clickChip(container, "わたしは");
    clickChip(container, "みずを");
    clickChip(container, "のみます");
    expect(completed).toBe(1);
  });
});
