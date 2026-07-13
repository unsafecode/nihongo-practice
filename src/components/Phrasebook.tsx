import { useState } from "react";
import { categories } from "../data/phrases";
import { useSpeech } from "../hooks/useSpeech";
import { CategoryNav } from "./CategoryNav";
import { SpeechNotice } from "./SpeechNotice";
import { PhraseCard } from "./PhraseCard";

/**
 * Modalità Frasario (v1): il frasario con audio. Estratto da App.tsx senza
 * cambiare comportamento — possiede il proprio stato `activeId` e usa useSpeech.
 */
export function Phrasebook() {
  const [activeId, setActiveId] = useState(categories[0].id);
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
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
  );
}
