import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook che incapsula la Web Speech API (SpeechSynthesis) per far "sentire" le frasi.
 *
 * Scelte:
 * - v1 usa la sintesi vocale nativa del browser: zero configurazione, zero costi,
 *   funziona in locale. Su macOS la voce ja-JP (Kyoko) suona molto bene.
 * - L'audio è disaccoppiato dalla UI: in futuro si può sostituire `speak` con una
 *   TTS neurale in cloud (Azure / OpenAI / ElevenLabs) senza toccare i componenti.
 */

export interface SpeakOptions {
  /** Velocità di lettura (1 = normale, 0.6 = lenta per lo studio) */
  rate?: number;
  /** Chiave della frase in riproduzione, usata dalla UI per il feedback visivo */
  key?: string;
}

export interface UseSpeech {
  /** true se il browser supporta la sintesi vocale */
  supported: boolean;
  /** true se è disponibile almeno una voce giapponese */
  japaneseVoiceAvailable: boolean;
  /** chiave della frase attualmente in riproduzione (o null) */
  speakingKey: string | null;
  speak: (text: string, opts?: SpeakOptions) => void;
  cancel: () => void;
}

function pickJapaneseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const japanese = voices.filter((v) => v.lang.toLowerCase().startsWith("ja"));
  if (japanese.length === 0) return null;
  // Preferisci voci note di buona qualità, altrimenti la prima disponibile.
  const preferred = ["kyoko", "o-ren", "otoya", "google", "nanami", "ayumi"];
  for (const name of preferred) {
    const match = japanese.find((v) => v.name.toLowerCase().includes(name));
    if (match) return match;
  }
  return japanese[0];
}

export function useSpeech(): UseSpeech {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  // Mantiene un riferimento all'utterance per evitare che venga rimossa dal GC
  // (bug noto di Chrome in cui onend non viene mai chiamato).
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoice(pickJapaneseVoice(synth.getVoices()));

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingKey(null);
  }, [supported]);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      // Interrompe eventuali riproduzioni in corso (evita code / blocchi).
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = opts.rate ?? 1;
      if (voice) utterance.voice = voice;

      const key = opts.key ?? text;
      utterance.onstart = () => setSpeakingKey(key);
      utterance.onend = () => setSpeakingKey(null);
      utterance.onerror = () => setSpeakingKey(null);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [supported, voice],
  );

  return {
    supported,
    japaneseVoiceAvailable: voice !== null,
    speakingKey,
    speak,
    cancel,
  };
}
