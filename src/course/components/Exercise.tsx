import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { opaqueTargetKey } from "../foundations/opaqueTargetKey";
import { getCourseCopy } from "../i18n/catalog";
import type { GeneratedExercise } from "./lessonExerciseModel";
import { exampleTokens, segmentToken } from "./lessonExerciseModel";
import {
  clearAnswer,
  initExerciseState,
  moveTile,
  placeTile,
  selectOption,
  setText,
  submitExercise,
  unplaceTile,
} from "./exerciseState";
import { ExerciseView } from "./ExerciseView";
import type { ExerciseItemData } from "./ExerciseView";
import type { AttemptOutcome } from "./exerciseState";

/**
 * The stateful container for one exercise (Slice C plan Task 4 step 3). It owns
 * the interactive {@link ExerciseUiState} through the pure reducer, resolves the
 * localized instruction/intent copy and the script setting, and reports every
 * valid attempt's outcome (`accepted`/`retry`) to its parent — the lesson wires
 * this to `recordAttempt`, review mode to `resolveReview`. It is deliberately
 * unaware of progress/context so the same container drives both the lesson and
 * the `Da ripassare` review surface. All answer logic lives in the reducer and
 * the shared engine; this component never reconstructs a canonical answer.
 */

export interface ExerciseProps {
  readonly exercise: GeneratedExercise;
  readonly index: number;
  readonly total: number;
  readonly idBase: string;
  readonly onAttempt: (
    outcome: Exclude<AttemptOutcome, null>,
    exercise: GeneratedExercise,
  ) => void;
  /** Optional visible activity label supplied by a host practice sequence. */
  readonly headerSupplement?: ReactNode;
}

export function Exercise({
  exercise,
  index,
  total,
  idBase,
  onAttempt,
  headerSupplement,
}: ExerciseProps): ReactElement {
  const { locale } = useLocale();
  const { script } = useScript();
  const copy = getCourseCopy(locale).exercises;
  const { prompt } = exercise;

  const [state, setState] = useState(() => initExerciseState(prompt));

  const instruction = exercise.instruction[locale];
  const intentText = exercise.intentText[locale];
  const feedbackDetail =
    state.status === "accepted"
      ? exercise.feedback[locale].accepted
      : state.status === "retry"
        ? exercise.feedback[locale].retry
        : null;
  // The only DOM-visible trace of the exercise's real target: an opaque,
  // non-reversible hash (never the raw Japanese `visibleTargetKey`) so an
  // e2e semantic-diversity audit can genuinely tell two `.lesson-exercise`
  // cards' targets apart, or the same target reused, on both the lesson
  // practice list and the `Da ripassare` review surface (both render
  // through this shared container).
  const itemData: ExerciseItemData = {
    "visible-target-key": opaqueTargetKey(exercise.visibleTargetKey),
    ...(exercise.practiceFunction === null
      ? {}
      : { "practice-function": exercise.practiceFunction }),
  };

  return (
    <ExerciseView
      prompt={prompt}
      targetExampleId={exercise.targetExampleId}
      state={state}
      index={index}
      total={total}
      script={script}
      copy={copy}
      instruction={instruction}
      intentText={intentText}
      idBase={idBase}
      tokenForTile={segmentToken}
      tokensForExample={exampleTokens}
      errorText={getCourseCopy(locale).lesson.contentFormattingError}
      feedbackDetail={feedbackDetail}
      itemData={itemData}
      headerSupplement={headerSupplement}
      handlers={{
        onPlaceTile: (tileId) => setState((s) => placeTile(s, tileId)),
        onUnplaceTile: (tileId) => setState((s) => unplaceTile(s, tileId)),
        onMoveTile: (tileId, direction) =>
          setState((s) => moveTile(s, tileId, direction)),
        onSelectOption: (optionId) => setState((s) => selectOption(s, optionId)),
        onSetText: (text) => setState((s) => setText(s, text)),
        onClear: () => setState((s) => clearAnswer(s)),
        onSubmit: () => {
          const result = submitExercise(prompt, state);
          setState(result.state);
          if (result.outcome) onAttempt(result.outcome, exercise);
        },
      }}
    />
  );
}
