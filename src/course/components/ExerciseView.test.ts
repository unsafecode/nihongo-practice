import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en as enCopy } from "../i18n/en";
import { exampleTokens, getLessonExercises, segmentToken } from "./lessonExerciseModel";
import { ExerciseView } from "./ExerciseView";
import type { ExerciseViewProps } from "./ExerciseView";
import { initExerciseState } from "./exerciseState";

function choiceExercise() {
  for (const lessonId of ["sounds-1", "introductions-1", "introductions-2"]) {
    const exercise = getLessonExercises(lessonId)?.exercises.find(
      (candidate) => candidate.prompt.kind === "choice",
    );
    if (exercise) return exercise;
  }
  throw new Error("fixture assumption failed: no A1 choice exercise");
}

const choice = choiceExercise();

function render(
  status: "idle" | "accepted" | "retry" | "invalid",
  feedbackDetail: string | null,
): string {
  const state = {
    ...initExerciseState(choice.prompt),
    status,
    ...(status === "invalid" ? { invalidReason: "unknown-option" as const } : {}),
  };
  const props: ExerciseViewProps & { readonly feedbackDetail?: string | null } = {
    prompt: choice.prompt,
    targetExampleId: choice.targetExampleId,
    state,
    index: 1,
    total: 1,
    script: "hiragana",
    copy: enCopy.exercises,
    instruction: choice.instruction.en,
    intentText: choice.intentText.en,
    idBase: "feedback-test",
    tokenForTile: segmentToken,
    tokensForExample: exampleTokens,
    errorText: enCopy.lesson.contentFormattingError,
    feedbackDetail,
    handlers: {
      onPlaceTile: () => undefined,
      onUnplaceTile: () => undefined,
      onMoveTile: () => undefined,
      onSelectOption: () => undefined,
      onSetText: () => undefined,
      onSubmit: () => undefined,
      onClear: () => undefined,
    },
  };
  return renderToStaticMarkup(createElement(ExerciseView, props));
}

describe("ExerciseView explanatory feedback", () => {
  it("keeps the generic accepted result and localized explanation in one polite status region", () => {
    const detail = "The taught form fits this meaning.";
    const html = render("accepted", detail);

    expect(html).toContain(enCopy.exercises.accepted);
    expect(html).toContain(detail);
    expect(html).toContain("lesson-exercise__feedback-detail");
    expect(html).toMatch(
      /<p[^>]*role="status"[^>]*aria-live="polite"|<p[^>]*aria-live="polite"[^>]*role="status"/,
    );
    expect(html).not.toMatch(/lesson-exercise__feedback[^>]*(?:autofocus|tabindex)/);
  });

  it("renders explanatory detail only for accepted and retry states", () => {
    expect(render("retry", "Check the taught form and try again.")).toContain(
      "Check the taught form and try again.",
    );
    expect(render("invalid", "Never show this detail.")).not.toContain(
      "Never show this detail.",
    );
    expect(render("idle", "Never show this detail.")).not.toContain(
      "Never show this detail.",
    );
  });
});
