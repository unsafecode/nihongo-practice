/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { renderStep } from "./steps/registry";
import { konbiniImmersion } from "./pilot/konbiniImmersion";
import { politePresentBlock } from "./pilot/politePresentBlock";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Japanese glyphs must render in a Japanese face. On a kana-first learning
 * site this is content, not chrome: a label set in the Latin UI stack picks up
 * whatever fallback the browser happens to have, so the same kana renders in a
 * different face from the line beneath it.
 *
 * The rule is derived from what the pilots actually render rather than from a
 * hand-written list of class names, so a Phase 1 step view that shows kana in
 * an unstyled span fails here instead of shipping.
 */

const JAPANESE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/u;

/** Punctuation and spacing shared by both scripts, which identify neither. */
const SCRIPT_NEUTRAL = /[\s0-9.,:;!?()[\]{}'"«»…—–\-/、。・「」【】〜ー]/gu;

function isEntirelyJapanese(text: string): boolean {
  const script = text.replace(SCRIPT_NEUTRAL, "");
  if (script.length === 0) return false;
  return [...script].every((char) => JAPANESE.test(char));
}

/**
 * Class names that engine.css gives a Japanese face, read from the stylesheet.
 *
 * Only the *subject* of each selector counts — the last class in the compound.
 * `.lesson-engine .engine-turn__kana` grants the face to `engine-turn__kana`,
 * not to `lesson-engine`, which is an ancestor of every element in the engine
 * and would let this guard pass vacuously the moment a caller rendered a step
 * through the full runner rather than in isolation.
 *
 * Matching class names is a deliberate approximation of the cascade: a rule
 * scoped to a context (`.engine-step--quiz .engine-option`) is credited to the
 * subject class generally. That is sound while the type system keeps the
 * contexts apart — `QuizStep.options` is `string` (Japanese) where
 * `ComprehensionStep.options` is `LocalizedText` (prose).
 */
function classesWithJapaneseFace(): Set<string> {
  const css = readFileSync(
    resolve(process.cwd(), "src/course/engine/engine.css"),
    "utf8",
  );
  const named = new Set<string>();
  for (const block of css.split("}")) {
    if (!block.includes("font-family: var(--engine-font-jp)")) continue;
    const selector = block.slice(0, block.indexOf("{"));
    for (const alternative of selector.split(",")) {
      const classes = [...alternative.matchAll(/\.([A-Za-z0-9_-]+)/g)];
      const subject = classes.at(-1);
      if (subject !== undefined) named.add(subject[1]);
    }
  }
  return named;
}

/** Direct text of an element, ignoring text owned by its children. */
function ownText(element: Element): string {
  return [...element.childNodes]
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? "")
    .join("");
}

interface JapaneseElement {
  readonly text: string;
  readonly classChain: readonly string[];
}

function japaneseElements(container: HTMLElement): JapaneseElement[] {
  const found: JapaneseElement[] = [];
  for (const element of container.querySelectorAll("*")) {
    const text = ownText(element).trim();
    if (!isEntirelyJapanese(text)) continue;
    const classChain: string[] = [];
    for (let node: Element | null = element; node !== null; node = node.parentElement) {
      classChain.push(...node.classList);
    }
    found.push({ text, classChain });
  }
  return found;
}

function renderAllPilotSteps(): JapaneseElement[] {
  const found: JapaneseElement[] = [];
  for (const lesson of [politePresentBlock, konbiniImmersion]) {
    for (const step of lesson.steps) {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            renderStep(step, { locale: "it", onComplete: () => {} }),
          ),
        );
      });
      found.push(...japaneseElements(container));
      act(() => root.unmount());
      container.remove();
    }
  }
  return found;
}

describe("Japanese typography", () => {
  it("renders every all-Japanese label in a Japanese face", () => {
    const japaneseFace = classesWithJapaneseFace();
    const elements = renderAllPilotSteps();

    // Non-vacuity: the pilots really do put kana on screen.
    expect(elements.length).toBeGreaterThan(20);

    const unstyled = elements
      .filter((element) => !element.classChain.some((name) => japaneseFace.has(name)))
      .map((element) => `${element.text} (${element.classChain[0] ?? "no class"})`);

    expect([...new Set(unstyled)]).toEqual([]);
  });
});
