/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { getCourseCopy } from "../i18n/catalog";
import { getLessonExercises } from "./lessonExerciseModel";
import { Exercise } from "./Exercise";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function a1ChoiceExercise() {
  const exercise = getLessonExercises("sounds-1")?.exercises.find(
    (candidate) =>
      candidate.prompt.kind === "choice" &&
      candidate.practiceFunction === "meaning-comprehension",
  );
  if (!exercise || exercise.prompt.kind !== "choice") {
    throw new Error("fixture assumption failed: no A1 meaning choice exercise");
  }
  return exercise;
}

function renderExercise(exercise = a1ChoiceExercise()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onAttempt = vi.fn();

  act(() => {
    root.render(
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(Exercise, {
            exercise,
            index: 1,
            total: 1,
            idBase: "exercise-test",
            onAttempt,
          }),
        ),
      ),
    );
  });

  return { container, root, onAttempt };
}

function selectOption(container: HTMLElement, optionId: string): void {
  const input = container.querySelector<HTMLInputElement>(`input[value="${optionId}"]`);
  if (!input) throw new Error(`option ${optionId} not found`);
  act(() => input.click());
}

function submit(container: HTMLElement): void {
  const button = container.querySelector<HTMLButtonElement>(".lesson-exercise__submit");
  if (!button) throw new Error("submit button not found");
  act(() => button.click());
}

function statusRegion(container: HTMLElement): HTMLElement {
  const region = container.querySelector<HTMLElement>(".lesson-exercise__feedback");
  if (!region) throw new Error("feedback region not found");
  return region;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("Exercise explanatory feedback", () => {
  it("shows localized accepted and retry explanations only after real submissions, and clears stale detail on edit", () => {
    const exercise = a1ChoiceExercise();
    const { container, root, onAttempt } = renderExercise(exercise);
    const prompt = exercise.prompt;
    if (prompt.kind !== "choice") throw new Error("fixture assumption failed: choice");
    const wrongOptionId = prompt.options.find(
      (option) => option.id !== prompt.correctOptionId,
    )!.id;

    expect(statusRegion(container).textContent).toBe("");
    expect(container.innerHTML).not.toContain(exercise.feedback.en.accepted);
    expect(container.innerHTML).not.toContain(exercise.feedback.en.retry);

    selectOption(container, prompt.correctOptionId);
    submit(container);
    expect(statusRegion(container).textContent).toContain(
      getCourseCopy("it").exercises.accepted,
    );
    expect(statusRegion(container).textContent).toContain(exercise.feedback.it.accepted);
    expect(onAttempt).toHaveBeenLastCalledWith("accepted", exercise);

    selectOption(container, wrongOptionId);
    expect(statusRegion(container).textContent).toBe("");
    submit(container);
    expect(statusRegion(container).textContent).toContain(getCourseCopy("it").exercises.retry);
    expect(statusRegion(container).textContent).toContain(exercise.feedback.it.retry);
    expect(onAttempt).toHaveBeenLastCalledWith("retry", exercise);
    expect(exercise.feedback.it.accepted).not.toContain(exercise.visibleTargetKey);
    expect(exercise.feedback.it.retry).not.toContain(exercise.visibleTargetKey);

    act(() => root.unmount());
  });

  it("keeps invalid input generic and does not reveal accepted or retry details", () => {
    const exercise = a1ChoiceExercise();
    const { container, root, onAttempt } = renderExercise(exercise);

    submit(container);

    expect(statusRegion(container).textContent).toContain(getCourseCopy("it").exercises.invalid);
    expect(statusRegion(container).textContent).not.toContain(exercise.feedback.it.accepted);
    expect(statusRegion(container).textContent).not.toContain(exercise.feedback.it.retry);
    expect(onAttempt).not.toHaveBeenCalled();

    act(() => root.unmount());
  });

  it("puts only an A1 practice function identifier on the card metadata", () => {
    const exercise = a1ChoiceExercise();
    const { container, root } = renderExercise(exercise);
    const card = container.querySelector<HTMLElement>(".lesson-exercise");

    expect(card?.getAttribute("data-practice-function")).toBe(
      exercise.practiceFunction,
    );
    expect(card?.getAttribute("data-visible-target-key")).not.toBe(
      exercise.visibleTargetKey,
    );

    act(() => root.unmount());
  });

  it("omits practice-function metadata for unchanged A2 exercises", () => {
    const exercise = getLessonExercises("connected-conversation-1")!.exercises[0]!;
    const { container, root } = renderExercise(exercise);

    expect(
      container.querySelector<HTMLElement>(".lesson-exercise")?.hasAttribute(
        "data-practice-function",
      ),
    ).toBe(false);

    act(() => root.unmount());
  });
});
