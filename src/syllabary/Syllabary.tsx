import { Fragment } from "react";
import { SpeechNotice } from "../components/SpeechNotice";
import { useSpeech } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { useScript } from "../settings/ScriptContext";
import { DAKUTEN, GOJUON, INTRO, NOTES, VOWELS, YOON, YOON_VOWELS, type Kana, type KanaRow } from "./kana";
import "./syllabary.css";

export function Syllabary() {
  const { locale } = useLocale();
  const { script } = useScript();
  const { supported, japaneseVoiceAvailable, speakingKey, playbackFailed, speak } = useSpeech();
  const ui = getCatalog(locale).ui;

  const cell = (kana: Kana | null, key: string) => {
    if (!kana) {
      return <div className="kana-empty" key={key} aria-hidden="true" />;
    }
    const active = speakingKey === kana.kana;
    return (
      <button key={key} type="button" className={`kana${active ? " is-active" : ""}`}
        onClick={() => speak(kana.kana, { key: kana.kana })} disabled={!supported}
        aria-label={`${kana.kana} (${kana.romaji})`}>
        {script === "hiragana" ? (
          <>
            <span className="kana__main" lang="ja">{kana.kana}</span>
            <span className="kana__sub">{kana.romaji}</span>
          </>
        ) : (
          <>
            <span className="kana__main kana__main--romaji">{kana.romaji}</span>
            <span className="kana__sub kana__sub--jp" lang="ja">{kana.kana}</span>
          </>
        )}
      </button>
    );
  };

  const grid = (rows: KanaRow[], heads: string[]) => (
    <div className="kana-grid" style={{ gridTemplateColumns: `2.2rem repeat(${heads.length}, minmax(0, 1fr))` }}>
      <div className="kana-corner" aria-hidden="true" />
      {heads.map((head) => (<div className="kana-head" key={`head-${head}`}>{head}</div>))}
      {rows.map((row) => (
        <Fragment key={row.label}>
          <div className="kana-rowlabel">{row.label}</div>
          {row.cells.map((entry, index) => cell(entry, `${row.label}-${index}`))}
        </Fragment>
      ))}
    </div>
  );

  return (
    <main className="syllabary">
      <SpeechNotice supported={supported} japaneseVoiceAvailable={japaneseVoiceAvailable} playbackFailed={playbackFailed} />
      <div className="syllabary__intro">
        <h1>{ui.syllabary.title}</h1>
        <p>{INTRO[locale]}</p>
      </div>
      <section className="kana-section">
        <h2>Gojūon · {ui.syllabary.base}</h2>
        {grid(GOJUON, VOWELS)}
      </section>
      <section className="kana-section">
        <h2>{ui.syllabary.voiced}</h2>
        {grid(DAKUTEN, VOWELS)}
      </section>
      <section className="kana-section">
        <h2>Yōon · {ui.syllabary.combinations}</h2>
        {grid(YOON, YOON_VOWELS)}
      </section>
      <section className="kana-section">
        <h2>{ui.syllabary.notes}</h2>
        <div className="kana-notes">
          {NOTES.map((note) => (
            <div className="kana-note" key={note.kana}>
              <span className="kana-note__glyph" lang="ja">{note.kana}</span>
              <div>
                <b>{note.title[locale]}</b>
                <p>{note.body[locale]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
