import { useRef, useState, type ReactElement } from "react";
import type { ComprehensionStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function ComprehensionStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<ComprehensionStep>): ReactElement {
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
    <section className="engine-step engine-step--comprehension">
      <p className="engine-label">{locale === "it" ? "Comprensione" : "Comprehension"}</p>
      <p className="engine-question">{pick(step.question, locale)}</p>
      <ul className="engine-options">
        {step.options.map((option, index) => (
          <li key={index} className="engine-options__item">
            <button type="button" className="engine-option" onClick={() => choose(index)}>
              {pick(option, locale)}
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
