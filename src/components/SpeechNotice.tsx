import { useLocale } from "../i18n/LocaleContext";
import { getCatalog } from "../i18n/catalog";

interface Props {
  supported: boolean;
  japaneseVoiceAvailable: boolean;
  playbackFailed: boolean;
}

export function SpeechNotice({ supported, japaneseVoiceAvailable, playbackFailed }: Props) {
  const { locale } = useLocale();
  const speech = getCatalog(locale).ui.speech;

  if (!supported) {
    return <div className="notice notice--warn" role="status">{speech.unsupported}</div>;
  }
  if (playbackFailed) {
    return <div className="notice notice--warn" role="alert">{speech.failed}</div>;
  }
  if (!japaneseVoiceAvailable) {
    return <div className="notice" role="status">{speech.missingVoice}</div>;
  }
  return null;
}
