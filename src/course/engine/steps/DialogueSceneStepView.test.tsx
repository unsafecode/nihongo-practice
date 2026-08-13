/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { DialogueSceneStepView } from "./DialogueSceneStepView";
import { konbiniImmersion } from "../pilot/konbiniImmersion";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const step = {
  id: "ds1", kind: "dialogueScene", estimateSeconds: 150,
  setting: { it: "Al konbini, alla cassa", en: "At the konbini, at the till" },
  turns: [
    {
      speaker: "Tenin",
      line: {
        kana: "いらっしゃいませ", romaji: "irasshaimase",
        literal: { it: "benvenuto", en: "welcome" },
        natural: { it: "Benvenuto", en: "Welcome" },
      },
    },
    {
      speaker: "Kyaku",
      line: {
        kana: "みずをください", romaji: "mizu o kudasai",
        literal: { it: "acqua ogg per favore", en: "water obj please" },
        natural: { it: "Acqua, per favore", en: "Water, please" },
      },
    },
  ],
} as never;

function staticHtml(): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, null,
      createElement(DialogueSceneStepView, { step, locale: "it", onComplete: () => {} })),
  );
}

function mount(onComplete: () => void): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null,
      createElement(DialogueSceneStepView, { step, locale: "it", onComplete })));
  });
  return { container, root };
}

function clickPrimary(container: HTMLElement): void {
  const target = container.querySelector<HTMLButtonElement>("button.engine-primary");
  expect(target).not.toBeNull();
  act(() => { target?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
}

describe("DialogueSceneStepView", () => {
  it("renders the setting, every speaker and every line in the active locale", () => {
    const html = staticHtml();
    expect(html).toContain("Al konbini, alla cassa");
    expect(html).toContain("Tenin");
    expect(html).toContain("いらっしゃいませ");
    expect(html).toContain("Kyaku");
    expect(html).toContain("みずをください");
  });

  it("offers one audio control per turn", () => {
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

/**
 * Speaker labels in the shipped pilot are kana (きゃく, ひと), so they need the
 * same lang="ja" the kana line beside them already carries — without it a screen
 * reader pronounces them with the document language, which is Italian.
 *
 * Asserted against the real lesson rather than the fixture above, whose speakers
 * are romaji and so cannot exhibit the defect.
 */
describe("dialogue speaker labels", () => {
  const scene = konbiniImmersion.steps.find((s) => s.kind === "dialogueScene");

  it("marks every kana speaker label as Japanese", () => {
    expect(scene).toBeDefined();
    const markup = renderToStaticMarkup(
      createElement(LocaleProvider, null,
        createElement(DialogueSceneStepView, {
          step: scene as never, locale: "it", onComplete: () => {},
        })),
    );
    const openingTags = [...markup.matchAll(/<span class="engine-turn__speaker"[^>]*>/g)].map(
      (m) => m[0],
    );
    expect(openingTags.length).toBeGreaterThan(0);
    for (const tag of openingTags) expect(tag, tag).toContain('lang="ja"');
  });
});
