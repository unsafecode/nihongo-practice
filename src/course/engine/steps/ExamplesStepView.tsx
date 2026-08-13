import type { ReactElement } from "react";
import type { ExamplesStep } from "../types";
import { pick, type StepViewProps } from "./stepView";
import { LineAudio } from "./lineAudio";

export function ExamplesStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<ExamplesStep>): ReactElement {
  return (
    <section className="engine-step engine-step--examples">
      <p className="engine-label">{locale === "it" ? "Esempi" : "Examples"}</p>
      <ul className="engine-examples">
        {step.lines.map((line, index) => (
          <li key={index} className="engine-example">
            <span className="engine-example__kana" lang="ja">
              {line.kana}
            </span>
            <span className="engine-example__romaji">{line.romaji}</span>
            <span className="engine-example__natural">{pick(line.natural, locale)}</span>
            <LineAudio idBase={`${step.id}-ex-${index}`} line={line} />
          </li>
        ))}
      </ul>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </section>
  );
}
