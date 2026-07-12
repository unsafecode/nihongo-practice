import { useState } from "react";
import { categories } from "./data/phrases";
import { useSpeech } from "./hooks/useSpeech";
import { Header } from "./components/Header";
import { CategoryNav } from "./components/CategoryNav";
import { SpeechNotice } from "./components/SpeechNotice";
import { PhraseCard } from "./components/PhraseCard";

export default function App() {
  const [activeId, setActiveId] = useState(categories[0].id);
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <CategoryNav
          categories={categories}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <section className="content">
          <SpeechNotice
            supported={supported}
            japaneseVoiceAvailable={japaneseVoiceAvailable}
          />

          <div className="content__head">
            <h2 className="content__title">
              <span aria-hidden="true">{active.emoji}</span>
              {active.label}
              <span className="content__jp" lang="ja">
                {active.hiragana}
              </span>
            </h2>
            <p className="content__count">{active.phrases.length} frasi</p>
          </div>

          <div className="grid">
            {active.phrases.map((phrase, i) => {
              const key = `${active.id}-${i}`;
              return (
                <PhraseCard
                  key={key}
                  phrase={phrase}
                  phraseKey={key}
                  isSpeaking={speakingKey === key}
                  supported={supported}
                  onSpeak={speak}
                />
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Fatto per imparare · audio con la sintesi vocale del browser · solo
          hiragana
        </p>
      </footer>
    </div>
  );
}
