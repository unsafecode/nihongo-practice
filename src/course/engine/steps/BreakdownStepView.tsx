import { useRef, useState, type ReactElement } from "react";
import type { BreakdownStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function BreakdownStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<BreakdownStep>): ReactElement {
  const total = step.parts.length;
  const [revealed, setRevealed] = useState(0);
  const completedRef = useRef(false);

  const revealNext = (): void => {
    if (revealed >= total) return;
    const next = revealed + 1;
    setRevealed(next);
    if (next >= total && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const shownParts = step.parts.slice(0, revealed);
  const allRevealed = revealed >= total;

  return (
    <section className="engine-step engine-step--breakdown">
      <p className="engine-label">{locale === "it" ? "Analisi" : "Breakdown"}</p>
      <p className="engine-breakdown__meaning">{pick(step.line.natural, locale)}</p>
      <ol className="engine-breakdown__parts">
        {shownParts.map((part, index) => (
          <li key={index} className="engine-breakdown__part">
            <span className="engine-breakdown__chunk" lang="ja">
              {part.chunk}
            </span>
            <span className="engine-breakdown__role">{pick(part.role, locale)}</span>
          </li>
        ))}
      </ol>
      {allRevealed ? (
        <p className="engine-breakdown__line" lang="ja">
          {step.line.kana}
        </p>
      ) : (
        <button type="button" className="engine-reveal" onClick={revealNext}>
          {locale === "it" ? "Rivela il prossimo" : "Reveal next"}
        </button>
      )}
    </section>
  );
}
