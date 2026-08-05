import type { ReactElement } from "react";
import { Notice } from "../../../components/Notice";
import { useLocale } from "../../../i18n/LocaleContext";
import { getCourseCopy } from "../../i18n/catalog";
import { useProgress } from "../../progress/ProgressContext";
import { Exercise } from "../Exercise";
import type { GeneratedExercise } from "../lessonExerciseModel";
import { A1SpokenAttempt } from "../A1SpokenAttempt";
import { buildA1PracticeModel } from "../a1PracticeModel";

type LessonEvidence = "visited" | "practiced" | "consolidated";

function evidenceState(
  lesson:
    | {
        readonly visitedAt: string | null;
        readonly practicedAt: string | null;
        readonly consolidatedAt: string | null;
      }
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

function ExerciseFunctionLabel({
  functionId,
  label,
  title,
}: {
  readonly functionId: string;
  readonly label: string;
  readonly title: string;
}): ReactElement {
  return (
    <p
      className="a1-practice-ladder__function"
      data-practice-function={functionId}
    >
      <span>{label}: </span>
      <span>{title}</span>
    </p>
  );
}

export function A1PracticeLadder({
  lessonId,
}: {
  readonly lessonId: string;
}): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { progress, recordAttempt } = useProgress();
  const result = buildA1PracticeModel(lessonId);

  if (!result.ok) {
    return (
      <Notice
        tone="warning"
        title={copy.exercises.unavailableTitle}
        body={copy.exercises.unavailableBody}
      />
    );
  }

  const generatedActivities = result.model.activities.filter(
    (activity): activity is typeof activity & { readonly generatedExercise: GeneratedExercise } =>
      activity.generatedExercise !== undefined,
  );
  const spokenActivities = result.model.activities.filter(
    (activity) => activity.generatedExercise === undefined,
  );
  if (generatedActivities.length !== 4 || spokenActivities.length !== 1) {
    return (
      <Notice
        tone="warning"
        title={copy.exercises.unavailableTitle}
        body={copy.exercises.unavailableBody}
      />
    );
  }

  const state = evidenceState(progress.lessons[lessonId]);
  const stateLabel =
    state === "consolidated"
      ? copy.exercises.statusConsolidated
      : state === "practiced"
        ? copy.exercises.statusPracticed
        : state === "visited"
          ? copy.exercises.statusVisited
          : null;
  let exercisePosition = 0;

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
    <div className="a1-practice-ladder">
      <div className="a1-practice-ladder__head">
        <h3>{copy.exercises.heading}</h3>
        {state && stateLabel ? (
          <p className="a1-practice-ladder__status" data-state={state}>
            <span>{copy.exercises.statusLabel}: </span>
            <span aria-hidden="true">{STATE_GLYPH[state]}</span>{" "}
            <span>{stateLabel}</span>
          </p>
        ) : null}
      </div>
      <p className="a1-practice-ladder__intro">{copy.exercises.intro}</p>
      <ol className="a1-practice-ladder__list">
        {result.model.activities.map((activity) => {
          const functionLabel = copy.a1Lesson.practice.functions[activity.function];
          if (activity.generatedExercise) {
            exercisePosition += 1;
            return (
              <Exercise
                key={activity.id}
                exercise={activity.generatedExercise}
                index={exercisePosition}
                total={generatedActivities.length}
                idBase={`a1-ex-${activity.generatedExercise.definitionId}`}
                onAttempt={handleAttempt}
                headerSupplement={
                  <ExerciseFunctionLabel
                    functionId={activity.function}
                    label={copy.a1Lesson.practice.functionLabel}
                    title={functionLabel}
                  />
                }
              />
            );
          }

          return (
            <li
              key={activity.id}
              className="a1-practice-ladder__spoken"
              data-practice-function={activity.function}
            >
              <ExerciseFunctionLabel
                functionId={activity.function}
                label={copy.a1Lesson.practice.functionLabel}
                title={functionLabel}
              />
              <A1SpokenAttempt lessonId={lessonId} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
