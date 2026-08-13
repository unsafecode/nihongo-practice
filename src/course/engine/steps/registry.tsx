import type { ReactElement } from "react";
import type { Step, StepKind } from "../types";
import type { Locale, StepViewProps } from "./stepView";
import { HookStepView } from "./HookStepView";
import { RuleStepView } from "./RuleStepView";
import { LexBatchStepView } from "./LexBatchStepView";
import { GuidedBuildStepView } from "./GuidedBuildStepView";
import { ExamplesStepView } from "./ExamplesStepView";
import { DialogueSceneStepView } from "./DialogueSceneStepView";
import { ComprehensionStepView } from "./ComprehensionStepView";
import { BreakdownStepView } from "./BreakdownStepView";
import { QuizStepView } from "./QuizStepView";
import { RecapStepView } from "./RecapStepView";
import "../engine.css";

type AnyStepView = (props: StepViewProps<never>) => ReactElement;

export const STEP_COMPONENTS: Partial<Record<StepKind, AnyStepView>> = {
  hook: HookStepView as AnyStepView,
  rule: RuleStepView as AnyStepView,
  lexBatch: LexBatchStepView as AnyStepView,
  guidedBuild: GuidedBuildStepView as AnyStepView,
  examples: ExamplesStepView as AnyStepView,
  dialogueScene: DialogueSceneStepView as AnyStepView,
  comprehension: ComprehensionStepView as AnyStepView,
  breakdown: BreakdownStepView as AnyStepView,
  quiz: QuizStepView as AnyStepView,
  recap: RecapStepView as AnyStepView,
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
