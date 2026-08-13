import type { ReactElement } from "react";
import type { RuleStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function RuleStepView({ step, locale, onComplete }: StepViewProps<RuleStep>): ReactElement {
  return (
    <section className="engine-step engine-step--rule">
      <p className="engine-label">{locale === "it" ? "Regola" : "Rule"}</p>
      <p className="engine-rule">{pick(step.statement, locale)}</p>
      <p className="engine-boundary">{pick(step.boundary, locale)}</p>
      <p className="engine-counter">{pick(step.counterExample, locale)}</p>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Ho capito" : "Got it"}
      </button>
    </section>
  );
}
