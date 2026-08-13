import { useRef, useState, type ReactElement } from "react";
import type { QuizStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function QuizStepView({ step, locale, onComplete }: StepViewProps<QuizStep>): ReactElement {
  const [feedback, setFeedback] = useState("");
  const completedRef = useRef(false);

  const choose = (index: number): void => {
    if (completedRef.current) return;
    if (index === step.correctIndex) {
      completedRef.current = true;
      setFeedback("");
      onComplete();
      return;
    }
    setFeedback(locale === "it" ? "Non è corretto. Riprova." : "Not quite. Try again.");
  };

  return (
    <section className="engine-step engine-step--quiz">
      <p className="engine-label">Quiz</p>
      <p className="engine-prompt">{pick(step.prompt, locale)}</p>
      <ul className="engine-options">
        {step.options.map((option, index) => (
          <li key={index} className="engine-options__item">
            <button
              type="button"
              className="engine-option"
              lang="ja"
              onClick={() => choose(index)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      <p className="engine-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
