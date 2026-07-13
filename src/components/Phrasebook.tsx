import { useState } from "react";
import { categories } from "../data/phrases";
import { useSpeech } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { CategoryNav } from "./CategoryNav";
import { PhraseCard } from "./PhraseCard";
import { SpeechNotice } from "./SpeechNotice";

export function Phrasebook() {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState(categories[0].id);
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();
  const ui = getCatalog(locale).ui;
  const active = categories.find((category) => category.id === activeId) ?? categories[0];

  return (
    <main className="app__main">
      <CategoryNav categories={categories} activeId={activeId} onSelect={setActiveId} />
      <section className="content">
        <SpeechNotice supported={supported} japaneseVoiceAvailable={japaneseVoiceAvailable} />
        <div className="content__head">
          <h2 className="content__title">
            <span aria-hidden="true">{active.emoji}</span>
            {active.labels[locale]}
            <span className="content__jp" lang="ja">{active.hiragana}</span>
          </h2>
          <p className="content__count">{active.phrases.length} {ui.common.phrases}</p>
        </div>
        <div className="grid">
          {active.phrases.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} phraseKey={phrase.id}
              isSpeaking={speakingKey === phrase.id} supported={supported} onSpeak={speak} />
          ))}
        </div>
      </section>
    </main>
  );
}
