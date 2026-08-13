import type { ReactElement } from "react";
import type { HookStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

export function HookStepView({ step, locale, onComplete }: StepViewProps<HookStep>): ReactElement {
  return (
    <section className="engine-step engine-step--hook">
      <p className="engine-label">{locale === "it" ? "In situazione" : "In context"}</p>
      <p className="engine-situation">{pick(step.situation, locale)}</p>
      <p className="engine-cando">{pick(step.canDo, locale)}</p>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Cominciamo" : "Let's start"}
      </button>
    </section>
  );
}
