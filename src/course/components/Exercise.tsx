import { useState } from "react";
import type { ReactElement } from "react";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { getCourseCopy } from "../i18n/catalog";
import type { GeneratedExercise } from "./lessonExerciseModel";
import {
  exampleTokens,
  exerciseInstructionCopy,
  segmentToken,
} from "./lessonExerciseModel";
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
}

export function Exercise({
  exercise,
  index,
  total,
  idBase,
  onAttempt,
}: ExerciseProps): ReactElement {
  const { locale } = useLocale();
  const { script } = useScript();
  const copy = getCourseCopy(locale).exercises;
  const { prompt } = exercise;

  const [state, setState] = useState(() => initExerciseState(prompt));

  const instruction = exerciseInstructionCopy(locale, prompt.promptCopyId) ?? "";
  const intentText =
    prompt.kind === "constrained-construction"
      ? exerciseInstructionCopy(locale, prompt.intentCopyId) ?? null
      : null;

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
