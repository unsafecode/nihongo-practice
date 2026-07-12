import type { Phrase } from "../data/phrases";
import type { SpeakOptions } from "../hooks/useSpeech";

interface Props {
  phrase: Phrase;
  phraseKey: string;
  isSpeaking: boolean;
  supported: boolean;
  onSpeak: (text: string, opts: SpeakOptions) => void;
}

export function PhraseCard({
  phrase,
  phraseKey,
  isSpeaking,
  supported,
  onSpeak,
}: Props) {
  return (
    <article className={`card${isSpeaking ? " is-speaking" : ""}`}>
      <p className="card__hiragana" lang="ja">
        {phrase.hiragana}
      </p>
      <p className="card__romaji">{phrase.romaji}</p>
      <p className="card__it">{phrase.it}</p>
      {phrase.note && <p className="card__note">{phrase.note}</p>}

      <div className="card__actions">
        <button
          type="button"
          className="btn btn--play"
          disabled={!supported}
          onClick={() => onSpeak(phrase.hiragana, { rate: 1, key: phraseKey })}
          aria-label={`Ascolta: ${phrase.it}`}
        >
          <span aria-hidden="true">▶</span> Ascolta
        </button>
        <button
          type="button"
          className="btn btn--slow"
          disabled={!supported}
          onClick={() => onSpeak(phrase.hiragana, { rate: 0.6, key: phraseKey })}
          aria-label={`Ascolta lentamente: ${phrase.it}`}
        >
          <span aria-hidden="true">🐢</span> Lento
        </button>
      </div>
    </article>
  );
}
