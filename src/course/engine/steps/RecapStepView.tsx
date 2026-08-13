import type { ReactElement } from "react";
import type { RecapStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function RecapStepView({ step, locale, onComplete }: StepViewProps<RecapStep>): ReactElement {
  return (
    <section className="engine-step engine-step--recap">
      <p className="engine-label">{locale === "it" ? "Ricapitolando" : "Recap"}</p>
      <ul className="engine-recap__learned">
        {step.learned.map((item, index) => (
          <li key={index} className="engine-recap__item">
            {pick(item, locale)}
          </li>
        ))}
      </ul>
      <p className="engine-recap__next">{pick(step.next, locale)}</p>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </section>
  );
}
