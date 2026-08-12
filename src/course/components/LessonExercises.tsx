import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { Exercise } from "./Exercise";
import { getLessonExercises } from "./lessonExerciseModel";
import type { GeneratedExercise } from "./lessonExerciseModel";

/**
 * The in-lesson practice block (Slice C plan Task 4 step 3; design spec §5.3,
 * §10.1-§10.3, §11.1). It renders a lesson's 3-5 deterministic exercises nested
 * inside the existing `explore` section — no new route anchor (spec §5.3) — and
 * reports each valid attempt to `ProgressContext.recordAttempt` in lesson mode,
 * so accepted attempts advance practiced/consolidated evidence but never
 * silently resolve a `Da ripassare` review entry (only review mode does that).
 *
 * The lesson's truthful interaction-evidence state (visited / practiced /
 * consolidated, spec §11.1) is shown as a text-plus-shape badge — never colour
 * alone. A catalog generation error surfaces a localized notice while leaving
 * the rest of the lesson usable (spec §16); it never renders an empty success.
 */

type LessonEvidence = "visited" | "practiced" | "consolidated";

function evidenceState(
  lesson:
    | { visitedAt: string | null; practicedAt: string | null; consolidatedAt: string | null }
    | undefined,
): LessonEvidence | null {
  if (!lesson) return null;
  if (lesson.consolidatedAt) return "consolidated";
  if (lesson.practicedAt) return "practiced";
  if (lesson.visitedAt) return "visited";
  return null;
}

const STATE_GLYPH: Record<LessonEvidence, string> = {
  visited: "○",
  practiced: "◐",
  consolidated: "●",
};

export function LessonExercises({
  lessonId,
}: {
  readonly lessonId: string;
}): ReactElement | null {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const exerciseCopy = copy.exercises;
  const { lessonEvidence, recordAttempt, mutationError, clearMutationError } = useProgress();

  const model = getLessonExercises(lessonId);
  if (!model) return null;

  const state = evidenceState(lessonEvidence(lessonId));
  const stateLabel =
    state === "consolidated"
      ? exerciseCopy.statusConsolidated
      : state === "practiced"
        ? exerciseCopy.statusPracticed
        : state === "visited"
          ? exerciseCopy.statusVisited
          : null;

  const handleAttempt = (
    outcome: "accepted" | "retry",
    exercise: GeneratedExercise,
  ): void => {
    recordAttempt({
      lessonId,
      exerciseDefinitionId: exercise.definitionId,
      outcome,
      targetConceptIds: exercise.prompt.assessedConceptIds,
      targetLexemeIds: exercise.prompt.assessedLexemeIds,
    });
  };

  return (
    <div className="lesson-exercises">
      <div className="lesson-exercises__head">
        <h3 className="lesson-exercises__heading">{exerciseCopy.heading}</h3>
        {state && stateLabel ? (
          <p className="lesson-exercises__status" data-state={state}>
            <span className="lesson-exercises__status-label">
              {exerciseCopy.statusLabel}:
            </span>{" "}
            <span className="lesson-exercises__status-glyph" aria-hidden="true">
              {STATE_GLYPH[state]}
            </span>{" "}
            <span className="lesson-exercises__status-text">{stateLabel}</span>
          </p>
        ) : null}
      </div>

      <p className="lesson-exercises__intro">{exerciseCopy.intro}</p>

      {mutationError?.lessonId === lessonId ? (
        <Notice
          tone="error"
          title={copy.progressMutation.title}
          body={copy.progressMutation.body(lessonId)}
          dismissLabel={copy.progressMutation.dismiss}
          onDismiss={clearMutationError}
        />
      ) : null}

      {model.errors.length > 0 ? (
        <Notice
          tone="warning"
          title={exerciseCopy.unavailableTitle}
          body={exerciseCopy.unavailableBody}
        />
      ) : null}

      {model.exercises.length > 0 ? (
        <ol className="lesson-exercises__list">
          {model.exercises.map((exercise, position) => (
            <Exercise
              key={exercise.definitionId}
              exercise={exercise}
              index={position + 1}
              total={model.exercises.length}
              idBase={`ex-${exercise.definitionId}`}
              onAttempt={handleAttempt}
            />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
