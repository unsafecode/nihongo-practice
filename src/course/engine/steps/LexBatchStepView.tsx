import type { ReactElement } from "react";
import type { AssembledToken } from "../../../romaji/types";
import { BASE_LEXEME_BY_ID } from "../../base/catalog/lexicon";
import { resolveBaseCopyText } from "../../base/copy/resolveBaseCopy";
import { realizePoliteNonpast } from "../../base/forms/verbForms";
import { BaseAudioButton, useBaseAudioPlayback } from "../../components/base/BaseAudioButton";
import type { LexBatchStep } from "../types";
import { joinTokens, type Locale, type StepViewProps } from "./stepView";

/**
 * Only `BaseVerbLexeme` carries `dictionaryTokens`; nouns and expressions
 * expose just `kana`/`romaji`. Synthesis playback reads nothing but `.jp`, so
 * wrapping the lexeme's own verified kana in a single lexical token gives
 * those entries real audio instead of a permanently `unavailable` control.
 * The kana is still catalog content — nothing here is invented.
 */
function kanaToken(lexemeId: string, kana: string, romaji: string): readonly AssembledToken[] {
  return [
    {
      id: `${lexemeId}-kana`,
      jp: kana,
      romaji,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "catalog", referenceId: lexemeId },
    },
  ];
}

/**
 * Chooses the playback tokens and display surface for one lexeme.
 *
 * Verbs realize their polite ます form through the catalog's own tested
 * morphology engine. Nouns and expressions have no `dictionaryTokens` (only
 * `BaseVerbLexeme` carries them), so their verified kana is wrapped in a
 * single lexical token — synthesis reads nothing but `.jp`, and passing an
 * empty array instead would leave every noun and expression with a
 * permanently dead audio control.
 *
 * Exported for direct unit testing: the resulting `status` cannot be asserted
 * through the rendered component because jsdom provides no `speechSynthesis`,
 * so a DOM-level assertion would pass vacuously.
 */
export function tokensForLexeme(lexemeId: string): {
  readonly kana: string;
  readonly romaji: string;
  readonly tokens: readonly AssembledToken[];
} {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  const polite = realizePoliteNonpast(lexemeId);
  if (polite.ok) {
    const surface = joinTokens(polite.value);
    return { ...surface, tokens: polite.value };
  }
  const kana = lexeme?.kana ?? "";
  const romaji = lexeme?.romaji ?? "";
  return { kana, romaji, tokens: kanaToken(lexemeId, kana, romaji) };
}

interface LexRowProps {
  readonly lexemeId: string;
  readonly locale: Locale;
}

function LexRow({ lexemeId, locale }: LexRowProps): ReactElement | null {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  const { kana, romaji, tokens } = tokensForLexeme(lexemeId);

  // Called before any early return so hook order is unconditional.
  const { status, play } = useBaseAudioPlayback({ kind: "synthesis", tokens }, lexemeId);

  if (lexeme === undefined) return null;

  const gloss = resolveBaseCopyText(locale, `${lexemeId}-meaning`) ?? "";

  return (
    <div className="engine-lexrow">
      <span className="engine-lexrow__kana" lang="ja">
        {kana}
      </span>
      <span className="engine-lexrow__romaji">{romaji}</span>
      <span className="engine-lexrow__gloss">{gloss}</span>
      <BaseAudioButton idBase={lexemeId} status={status} onPlay={play} onRetry={play} />
    </div>
  );
}

export function LexBatchStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<LexBatchStep>): ReactElement {
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
