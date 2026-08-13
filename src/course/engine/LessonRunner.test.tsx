/** @vitest-environment jsdom */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { archetypeById } from "./archetypes";
import type { Lesson, Step } from "./types";
import { LessonRunner, phaseIndexForStep } from "./LessonRunner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STEP_KEY = (id: string): string => `nihongo.engine.pilot.${id}.step`;

const quiz = (id: string, prompt: string, correct: string, wrong: string): Step =>
  ({
    id,
    kind: "quiz",
    estimateSeconds: 30,
    prompt: { it: prompt, en: prompt },
    options: [correct, wrong],
    correctIndex: 0,
  }) as unknown as Step;

const recap = (id: string, learned: string): Step =>
  ({
    id,
    kind: "recap",
    estimateSeconds: 20,
    learned: [{ it: learned, en: learned }],
    next: { it: "Next", en: "Next" },
  }) as unknown as Step;

/** A checkpoint lesson uses the `stage` layout: quizzes then a recap. */
const checkpointLesson = (id = "cp"): Lesson =>
  ({
    id,
    unitId: "u",
    archetype: "checkpoint",
    title: { it: "T", en: "T" },
    canDo: { it: "C", en: "C" },
    teaches: [],
    requires: [],
    lexemes: [],
    steps: [
      quiz("s0", "Question A", "A-ok", "A-no"),
      quiz("s1", "Question B", "B-ok", "B-no"),
      recap("s2", "Learned R"),
    ],
  }) as unknown as Lesson;

function mount(element: ReactElement): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null, element));
  });
  return { container, root };
}

function clickText(container: HTMLElement, text: string): void {
  const target = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === text,
  );
  expect(target, `button with text "${text}"`).toBeDefined();
  act(() => {
    target?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function pressKey(container: HTMLElement, key: string): void {
  const host = container.querySelector(".lesson-runner");
  expect(host, "keyboard host").not.toBeNull();
  act(() => {
    host?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

// jsdom ships no localStorage here, so — like the progress-store tests — install
// a memory-backed Storage on window and restore it afterwards.
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}

let storageDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
  window.localStorage.setItem("nihongo.locale.primary", "en");
});

afterEach(() => {
  document.body.innerHTML = "";
  if (storageDescriptor) Object.defineProperty(window, "localStorage", storageDescriptor);
  else delete (window as { localStorage?: Storage }).localStorage;
});

describe("phaseIndexForStep", () => {
  it("mirrors the checkpoint archetype's greedy phase walk", () => {
    const lesson = checkpointLesson();
    const cp = archetypeById("checkpoint");
    // retrieve phase swallows both quizzes; close phase holds the recap.
    expect(phaseIndexForStep(cp, lesson.steps, 0)).toBe(0);
    expect(phaseIndexForStep(cp, lesson.steps, 1)).toBe(0);
    expect(phaseIndexForStep(cp, lesson.steps, 2)).toBe(1);
  });

  it("assigns each step of a new-block lesson to its editorial phase", () => {
    const nb = archetypeById("new-block");
    const steps = [
      { kind: "hook" },
      { kind: "rule" },
      { kind: "lexBatch" },
      { kind: "guidedBuild" },
      { kind: "quiz" },
      { kind: "recap" },
    ] as unknown as readonly Step[];
    expect(phaseIndexForStep(nb, steps, 0)).toBe(0); // open
    expect(phaseIndexForStep(nb, steps, 1)).toBe(1); // teach
    expect(phaseIndexForStep(nb, steps, 2)).toBe(1); // teach
    expect(phaseIndexForStep(nb, steps, 3)).toBe(2); // apply
    expect(phaseIndexForStep(nb, steps, 4)).toBe(3); // check
    expect(phaseIndexForStep(nb, steps, 5)).toBe(4); // close
  });

  it("clamps an out-of-range step to the final phase", () => {
    const cp = archetypeById("checkpoint");
    const lesson = checkpointLesson();
    expect(phaseIndexForStep(cp, lesson.steps, 99)).toBe(cp.phases.length - 1);
  });
});

describe("LessonRunner", () => {
  it("renders only the current step, never the whole lesson at once", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Question A");
    expect(text).not.toContain("Question B");
    expect(text).not.toContain("Learned R");
  });

  it("advances when a step reports completion", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    clickText(container, "A-ok");
    const text = container.textContent ?? "";
    expect(text).toContain("Question B");
    expect(text).not.toContain("Question A");
  });

  it("reports 'n of total' to assistive technology and as visible text", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    expect(container.querySelector('[aria-label="Step 1 of 3"]')).not.toBeNull();
    expect(container.textContent ?? "").toContain("1 / 3");
    clickText(container, "A-ok");
    expect(container.querySelector('[aria-label="Step 2 of 3"]')).not.toBeNull();
    expect(container.textContent ?? "").toContain("2 / 3");
  });

  it("returns to the previous step on back without losing progress", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    clickText(container, "A-ok"); // now on step 1
    clickText(container, "Back"); // back to step 0
    expect(container.textContent ?? "").toContain("Question A");
    // The furthest-reached step is remembered, so ArrowRight moves forward again
    // without re-answering step 0.
    pressKey(container, "ArrowRight");
    expect(container.textContent ?? "").toContain("Question B");
  });

  it("resumes at the stored position when mounted", () => {
    window.localStorage.setItem(STEP_KEY("cp"), "2");
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Learned R");
    expect(text).not.toContain("Question A");
  });

  it("calls onLessonComplete exactly once when the last step completes", () => {
    window.localStorage.setItem(STEP_KEY("cp"), "2");
    let completed = 0;
    const { container } = mount(
      createElement(LessonRunner, {
        lesson: checkpointLesson(),
        locale: "en",
        onLessonComplete: () => {
          completed += 1;
        },
      }),
    );
    clickText(container, "Continue");
    clickText(container, "Continue");
    expect(completed).toBe(1);
  });

  it("moves between completed steps with ArrowLeft and ArrowRight", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    clickText(container, "A-ok"); // step 1, reached 1
    clickText(container, "B-ok"); // step 2, reached 2
    pressKey(container, "ArrowLeft");
    expect(container.textContent ?? "").toContain("Question B");
    pressKey(container, "ArrowLeft");
    expect(container.textContent ?? "").toContain("Question A");
    pressKey(container, "ArrowRight");
    expect(container.textContent ?? "").toContain("Question B");
  });

  it("does not skip forward past the furthest completed step", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    // On the first step, nothing further has been reached.
    pressKey(container, "ArrowRight");
    expect(container.textContent ?? "").toContain("Question A");
    clickText(container, "A-ok"); // reached step 1
    // Step 2 is still unseen, so ArrowRight from step 1 must not jump to it.
    pressKey(container, "ArrowRight");
    expect(container.textContent ?? "").toContain("Question B");
    expect(container.textContent ?? "").not.toContain("Learned R");
  });

  it("applies the transition class by default", () => {
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    expect(container.querySelector(".engine-runner__step--animated")).not.toBeNull();
  });

  it("omits the transition class when prefers-reduced-motion is set", () => {
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (
      query: string,
    ) =>
      ({
        matches: query.includes("reduce"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
    try {
      const { container } = mount(
        createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
      );
      expect(container.querySelector(".engine-runner__step")).not.toBeNull();
      expect(container.querySelector(".engine-runner__step--animated")).toBeNull();
    } finally {
      delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    }
  });

  it("prefers initialStepIndex over the stored value, clamped to range", () => {
    window.localStorage.setItem(STEP_KEY("cp"), "2");
    const { container } = mount(
      createElement(LessonRunner, {
        lesson: checkpointLesson(),
        locale: "en",
        initialStepIndex: 1,
      }),
    );
    expect(container.textContent ?? "").toContain("Question B");
    expect(container.textContent ?? "").not.toContain("Learned R");
  });

  it("clamps an out-of-range initialStepIndex to the last step", () => {
    const { container } = mount(
      createElement(LessonRunner, {
        lesson: checkpointLesson(),
        locale: "en",
        initialStepIndex: 99,
      }),
    );
    expect(container.textContent ?? "").toContain("Learned R");
  });

  it("falls back to step 0 on a corrupt stored value without crashing", () => {
    window.localStorage.setItem(STEP_KEY("cp"), "banana");
    const { container } = mount(
      createElement(LessonRunner, { lesson: checkpointLesson(), locale: "en" }),
    );
    expect(container.textContent ?? "").toContain("Question A");
  });

  it("notifies onStepChange with the new index as the learner advances", () => {
    const seen: number[] = [];
    const { container } = mount(
      createElement(LessonRunner, {
        lesson: checkpointLesson(),
        locale: "en",
        onStepChange: (index) => {
          seen.push(index);
        },
      }),
    );
    clickText(container, "A-ok");
    expect(seen).toContain(1);
  });
});
