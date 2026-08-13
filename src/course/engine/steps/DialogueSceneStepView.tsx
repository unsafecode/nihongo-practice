import type { ReactElement } from "react";
import type { DialogueSceneStep } from "../types";
import { pick, type StepViewProps } from "./stepView";
import { LineAudio } from "./lineAudio";

export function DialogueSceneStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<DialogueSceneStep>): ReactElement {
  return (
    <section className="engine-step engine-step--dialogue">
      <p className="engine-label">{locale === "it" ? "Scena" : "Scene"}</p>
      <p className="engine-setting">{pick(step.setting, locale)}</p>
      <ol className="engine-dialogue">
        {step.turns.map((turn, index) => (
          <li key={index} className="engine-turn">
            <span className="engine-turn__speaker" lang="ja">
              {turn.speaker}
            </span>
            <span className="engine-turn__kana" lang="ja">
              {turn.line.kana}
            </span>
            <span className="engine-turn__romaji">{turn.line.romaji}</span>
            <span className="engine-turn__natural">{pick(turn.line.natural, locale)}</span>
            <LineAudio idBase={`${step.id}-turn-${index}`} line={turn.line} />
          </li>
        ))}
      </ol>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </section>
  );
}
