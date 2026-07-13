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
  supported: boolean;
  japaneseVoiceAvailable: boolean;
  speakingKey: string | null;
  playbackFailed: boolean;
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

export function shouldReportSpeechError(error: string): boolean {
  return error !== "canceled" && error !== "interrupted";
}

export function useSpeech(): UseSpeech {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);
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
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    setSpeakingKey(null);
    setPlaybackFailed(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      utteranceRef.current = null;
      synth.cancel();
      setSpeakingKey(null);
      setPlaybackFailed(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = opts.rate ?? 1;
      if (voice) utterance.voice = voice;

      const key = opts.key ?? text;
      utterance.onstart = () => {
        if (utteranceRef.current === utterance) setSpeakingKey(key);
      };
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeakingKey(null);
      };
      utterance.onerror = (event) => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeakingKey(null);
        if (shouldReportSpeechError(event.error)) setPlaybackFailed(true);
      };

      utteranceRef.current = utterance;
      try {
        synth.speak(utterance);
      } catch {
        utteranceRef.current = null;
        setSpeakingKey(null);
        setPlaybackFailed(true);
      }
    },
    [supported, voice],
  );

  return {
    supported,
    japaneseVoiceAvailable: voice !== null,
    speakingKey,
    playbackFailed,
    speak,
    cancel,
  };
}
