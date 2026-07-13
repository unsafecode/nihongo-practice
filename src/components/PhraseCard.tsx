import type { Phrase } from "../data/phrases";
import type { SpeakOptions } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { useScript } from "../settings/ScriptContext";

interface Props {
  phrase: Phrase;
  phraseKey: string;
  isSpeaking: boolean;
  supported: boolean;
  onSpeak: (text: string, opts: SpeakOptions) => void;
}

export function PhraseCard({ phrase, phraseKey, isSpeaking, supported, onSpeak }: Props) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const ui = getCatalog(locale).ui;
  const translation = phrase.translations[locale];

  return (
    <article className={`card${isSpeaking ? " is-speaking" : ""}`}>
      {script === "hiragana" ? (
        <>
          <p className="card__hiragana" lang="ja">{phrase.hiragana}</p>
          <p className="card__romaji">{phrase.romaji}</p>
        </>
      ) : (
        <>
          <p className="card__hiragana card__hiragana--romaji">{phrase.romaji}</p>
          <p className="card__romaji card__romaji--jp" lang="ja">{phrase.hiragana}</p>
        </>
      )}
      <p className="card__translation">{translation}</p>
      {showReference ? (
        <p className="card__reference">
          <span>{referenceLocale.toUpperCase()}</span>{" "}
          {phrase.translations[referenceLocale]}
        </p>
      ) : null}
      {phrase.notes?.[locale] ? (<p className="card__note">{phrase.notes[locale]}</p>) : null}

      <div className="card__actions">
        <button type="button" className="btn btn--play" disabled={!supported}
          onClick={() => onSpeak(phrase.hiragana, { rate: 1, key: phraseKey })}
          aria-label={`${ui.common.listen}: ${translation}`}>
          <span aria-hidden="true">▶</span>{" "}{isSpeaking ? ui.common.playing : ui.common.listen}
        </button>
        <button type="button" className="btn btn--slow" disabled={!supported}
          onClick={() => onSpeak(phrase.hiragana, { rate: 0.6, key: phraseKey })}
          aria-label={`${ui.common.slow}: ${translation}`}>
          <span aria-hidden="true">🐢</span> {ui.common.slow}
        </button>
      </div>
    </article>
  );
}
