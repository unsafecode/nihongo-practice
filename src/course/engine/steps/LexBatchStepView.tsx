import type { ReactElement } from "react";
import { BASE_LEXEME_BY_ID } from "../../base/catalog/lexicon";
import { resolveBaseCopyText } from "../../base/copy/resolveBaseCopy";
import { realizePoliteNonpast } from "../../base/forms/verbForms";
import { BaseAudioButton, useBaseAudioPlayback } from "../../components/base/BaseAudioButton";
import type { LexBatchStep } from "../types";
import { joinTokens, type StepViewProps } from "./stepView";

interface LexRowProps {
  readonly lexemeId: string;
  readonly locale: "it" | "en";
}

function LexRow({ lexemeId, locale }: LexRowProps): ReactElement | null {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  if (lexeme === undefined) return null;

  const politeResult = realizePoliteNonpast(lexemeId);
  const { kana, romaji } = politeResult.ok
    ? joinTokens(politeResult.value)
    : { kana: lexeme.kana, romaji: lexeme.romaji };

  const tokens = politeResult.ok ? politeResult.value : [];
  const gloss = resolveBaseCopyText(locale, `${lexemeId}-meaning`) ?? "";

  const { status, play } = useBaseAudioPlayback({ kind: "synthesis", tokens }, lexemeId);

  return (
    <div className="engine-lexrow">
      <span className="engine-lexrow__kana">{kana}</span>
      <span className="engine-lexrow__romaji">{romaji}</span>
      <span className="engine-lexrow__gloss">{gloss}</span>
      <BaseAudioButton idBase={lexemeId} status={status} onPlay={play} onRetry={play} />
    </div>
  );
}

export function LexBatchStepView({ step, locale, onComplete }: StepViewProps<LexBatchStep>): ReactElement {
  return (
    <section className="engine-step engine-step--lexbatch">
      <div className="engine-lexgrid">
        {step.lexemes.map((id) => (
          <LexRow key={id} lexemeId={id} locale={locale} />
        ))}
      </div>
      <button type="button" className="engine-primary" onClick={onComplete}>
        {locale === "it" ? "Continua" : "Continue"}
      </button>
    </section>
  );
}
