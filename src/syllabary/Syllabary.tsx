import { Fragment } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { useScript } from "../settings/ScriptContext";
import { SpeechNotice } from "../components/SpeechNotice";
import {
  GOJUON,
  DAKUTEN,
  YOON,
  VOWELS,
  YOON_VOWELS,
  NOTES,
  INTRO,
  type Kana,
  type KanaRow,
} from "./kana";
import "./syllabary.css";

/**
 * Modalità Sillabario: tavola hiragana interattiva. Ogni casella si pronuncia
 * al tocco (useSpeech). L'impostazione script decide solo quale testo è grande
 * (kana o rōmaji): entrambi restano sempre visibili, perché è una tavola per
 * imparare a leggere.
 */
export function Syllabary() {
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();
  const { script } = useScript();

  const cell = (c: Kana | null, key: string) => {
    if (!c) return <div className="kana-empty" key={key} aria-hidden="true" />;
    const active = speakingKey === c.kana;
    return (
      <button
        key={key}
        type="button"
        className={`kana${active ? " is-active" : ""}`}
        onClick={() => speak(c.kana, { key: c.kana })}
        disabled={!supported}
        aria-label={`${c.kana} (${c.romaji})`}
      >
        {script === "hiragana" ? (
          <>
            <span className="kana__main" lang="ja">{c.kana}</span>
            <span className="kana__sub">{c.romaji}</span>
          </>
        ) : (
          <>
            <span className="kana__main kana__main--romaji">{c.romaji}</span>
            <span className="kana__sub kana__sub--jp" lang="ja">{c.kana}</span>
          </>
        )}
      </button>
    );
  };

  const grid = (rows: KanaRow[], heads: string[]) => (
    <div
      className="kana-grid"
      style={{ gridTemplateColumns: `2.2rem repeat(${heads.length}, minmax(0, 1fr))` }}
    >
      <div className="kana-corner" aria-hidden="true" />
      {heads.map((h) => (
        <div className="kana-head" key={`h-${h}`}>{h}</div>
      ))}
      {rows.map((row, ri) => (
        <Fragment key={`r-${ri}`}>
          <div className="kana-rowlabel">{row.label}</div>
          {row.cells.map((c, ci) => cell(c, `${ri}-${ci}`))}
        </Fragment>
      ))}
    </div>
  );

  return (
    <main className="syllabary">
      <SpeechNotice supported={supported} japaneseVoiceAvailable={japaneseVoiceAvailable} />

      <div className="syllabary__intro">
        <h1>Sillabario · Hiragana</h1>
        <p>{INTRO}</p>
      </div>

      <section className="kana-section">
        <h2>Gojūon — le 46 sillabe di base</h2>
        {grid(GOJUON, VOWELS)}
      </section>

      <section className="kana-section">
        <h2>Dakuten · Handakuten — suoni sonori (゛) e ぱ (゜)</h2>
        {grid(DAKUTEN, VOWELS)}
      </section>

      <section className="kana-section">
        <h2>Yōon — sillabe con ゃ ゅ ょ piccoli</h2>
        {grid(YOON, YOON_VOWELS)}
      </section>

      <section className="kana-section">
        <h2>Da sapere</h2>
        <div className="kana-notes">
          {NOTES.map((n) => (
            <div className="kana-note" key={n.kana}>
              <span className="kana-note__glyph" lang="ja">{n.kana}</span>
              <div>
                <b>{n.title}</b>
                <p>{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
