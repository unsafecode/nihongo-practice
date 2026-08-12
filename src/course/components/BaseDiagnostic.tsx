import { useMemo, useState, type ReactElement } from "react";
import { ActionButton, ActionLink } from "../../components/actions/Action";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routePaths";
import { lessonPath } from "../../routing/routes";
import { browserStorage, writeSetting } from "../../settings/storage";
import { A1_RETAINED_LESSON_IDS_BY_MODULE } from "../a1/manifest";
import { BASE_LESSON_IDS_BY_MODULE } from "../base/manifest";
import {
  BASE_DIAGNOSTIC_DIMENSION_IDS,
  evaluateBaseDiagnostic,
  type BaseDiagnosticDimensionId,
  type BaseDiagnosticResult,
} from "../base/diagnostic/model";
import { getCourseCopy } from "../i18n/catalog";

/**
 * The single, separate setting the optional Base entry diagnostic ever
 * writes (Task 15). It is never the progress store (`ProgressContext`'s
 * `nihongo.course.progress`) and this component never imports
 * `useProgress`/`markVisited` — answering (or skipping) this diagnostic can
 * never mutate a learner's visited lessons, practice attempts, or Can-do
 * evidence.
 */
export const BASE_DIAGNOSTIC_STORAGE_KEY = "nihongo.course.baseDiagnostic";

type Answers = Partial<Record<BaseDiagnosticDimensionId, boolean>>;

export type BaseDiagnosticStorageValue =
  | { readonly status: "skipped" }
  | { readonly status: "completed"; readonly result: BaseDiagnosticResult };

function allAnswered(answers: Answers): answers is Record<BaseDiagnosticDimensionId, boolean> {
  return BASE_DIAGNOSTIC_DIMENSION_IDS.every((id) => typeof answers[id] === "boolean");
}

/** The first lesson of a diagnostic-recommended module, across either level. */
function firstLessonIdForModule(moduleId: string): string | null {
  const baseLessons = BASE_LESSON_IDS_BY_MODULE[moduleId];
  if (baseLessons) return baseLessons[0] ?? null;
  const retainedA1Lessons = A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId];
  return retainedA1Lessons ? retainedA1Lessons[0] ?? null : null;
}

/**
 * The optional, skippable Base entry diagnostic (`/percorso/diagnostica-base`,
 * Task 15). It asks four content-independent yes/no self-assessment
 * questions (`BASE_DIAGNOSTIC_DIMENSION_IDS`) and recommends either Base (at
 * the first unmet dimension's module) or A1 (`introductions`) — the same
 * fail-closed `evaluateBaseDiagnostic` the model layer already validates.
 *
 * Every control is a native `<input type="radio">` or `<button>`, so it is
 * keyboard-operable (native Tab/arrow-key/Enter/Space semantics, with no
 * custom `div`-based control standing in for a real form element) and
 * touch-operable (a native control's hit target responds to a tap exactly
 * like a click) without any extra handling.
 *
 * It writes only its own {@link BASE_DIAGNOSTIC_STORAGE_KEY} setting —
 * skipping or completing this diagnostic never touches
 * `ProgressContext`'s progress store, never calls `markVisited`, and never
 * records any Can-do evidence.
 */
export function BaseDiagnostic(): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const diagnosticCopy = copy.baseDiagnostic;
  const storage = useMemo(() => browserStorage(), []);

  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<BaseDiagnosticResult | null>(null);
  const [skipped, setSkipped] = useState(false);

  function persist(value: BaseDiagnosticStorageValue): void {
    writeSetting(storage, BASE_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(value));
  }

  function handleAnswer(id: BaseDiagnosticDimensionId, value: boolean): void {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function handleSubmit(): void {
    if (!allAnswered(answers)) return;
    const evaluated = evaluateBaseDiagnostic(answers);
    if (!evaluated || "error" in evaluated) return;
    persist({ status: "completed", result: evaluated });
    setResult(evaluated);
  }

  function handleSkip(): void {
    persist({ status: "skipped" });
    setSkipped(true);
  }

  if (skipped) {
    return (
      <main className="base-diagnostic" data-diagnostic-state="skipped">
        <h1>{diagnosticCopy.heading}</h1>
        <p className="base-diagnostic__skipped-notice">{diagnosticCopy.skippedNotice}</p>
        <ActionLink variant="primary" to={routePaths.course}>
          {diagnosticCopy.continueToCourse}
        </ActionLink>
      </main>
    );
  }

  if (result) {
    const targetLessonId = firstLessonIdForModule(result.recommendedModuleId);
    return (
      <main
        className="base-diagnostic"
        data-diagnostic-state="result"
        data-diagnostic-result={result.recommendedLevel}
      >
        <h1>{diagnosticCopy.resultHeading}</h1>
        <p className="base-diagnostic__result-body">
          {diagnosticCopy.resultBody(result.recommendedLevel)}
        </p>
        {targetLessonId ? (
          <ActionLink
            variant="primary"
            to={lessonPath(result.recommendedModuleId, targetLessonId)}
          >
            {diagnosticCopy.goToRecommendation}
          </ActionLink>
        ) : (
          <ActionLink variant="primary" to={routePaths.course}>
            {diagnosticCopy.continueToCourse}
          </ActionLink>
        )}
      </main>
    );
  }

  const answeredAll = allAnswered(answers);

  return (
    <main className="base-diagnostic" data-diagnostic-state="questions">
      <h1>{diagnosticCopy.heading}</h1>
      <p className="base-diagnostic__intro">{diagnosticCopy.intro}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {BASE_DIAGNOSTIC_DIMENSION_IDS.map((id) => (
          <fieldset key={id} className="base-diagnostic__question" data-dimension-id={id}>
            <legend>{diagnosticCopy.dimensions[id]}</legend>
            <label className="base-diagnostic__option">
              <input
                type="radio"
                name={id}
                value="yes"
                checked={answers[id] === true}
                onChange={() => handleAnswer(id, true)}
              />
              {diagnosticCopy.yes}
            </label>
            <label className="base-diagnostic__option">
              <input
                type="radio"
                name={id}
                value="no"
                checked={answers[id] === false}
                onChange={() => handleAnswer(id, false)}
              />
              {diagnosticCopy.no}
            </label>
          </fieldset>
        ))}
        <div className="base-diagnostic__actions">
          <ActionButton variant="secondary" type="button" onClick={handleSkip}>
            {diagnosticCopy.skip}
          </ActionButton>
          <ActionButton variant="primary" type="submit" disabled={!answeredAll}>
            {diagnosticCopy.submit}
          </ActionButton>
        </div>
      </form>
    </main>
  );
}
