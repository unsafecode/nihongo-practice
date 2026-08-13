import type { ReactElement } from "react";
import type { Step, StepKind } from "../types";
import type { Locale, StepViewProps } from "./stepView";
import { HookStepView } from "./HookStepView";
import { RuleStepView } from "./RuleStepView";
import { LexBatchStepView } from "./LexBatchStepView";
import "../engine.css";

type AnyStepView = (props: StepViewProps<never>) => ReactElement;

export const STEP_COMPONENTS: Partial<Record<StepKind, AnyStepView>> = {
  hook: HookStepView as AnyStepView,
  rule: RuleStepView as AnyStepView,
  lexBatch: LexBatchStepView as AnyStepView,
};

export function renderStep(
  step: Step,
  context: { locale: Locale; onComplete: () => void },
): ReactElement {
  const Component = STEP_COMPONENTS[step.kind];
  if (Component === undefined) {
    throw new Error(`No component registered for step kind: ${step.kind}`);
  }
  return <Component step={step as never} locale={context.locale} onComplete={context.onComplete} />;
}
