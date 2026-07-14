import { useLocale } from "../i18n/LocaleContext";
import { getCatalog } from "../i18n/catalog";
import { Notice } from "./Notice";
import { resolveSpeechNotice, type SpeechNoticeKind } from "./speechNoticeState";

interface Props {
  supported: boolean;
  japaneseVoiceAvailable: boolean;
  playbackFailed: boolean;
}

/**
 * Renders the single honest speech-synthesis notice (if any) through the
 * shared Task 1 `Notice` primitive, so degraded-audio states look and behave
 * like every other styled notice. The which/whether decision lives in the
 * pure `resolveSpeechNotice` helper; this component only maps the resolved
 * kind to localized title/body copy.
 */
export function SpeechNotice({ supported, japaneseVoiceAvailable, playbackFailed }: Props) {
  const { locale } = useLocale();
  const speech = getCatalog(locale).ui.speech;
  const descriptor = resolveSpeechNotice({
    supported,
    japaneseVoiceAvailable,
    playbackFailed,
  });
  if (!descriptor) return null;

  const copy: Record<SpeechNoticeKind, { title: string; body: string }> = {
    unsupported: { title: speech.unsupportedTitle, body: speech.unsupported },
    "missing-voice": { title: speech.missingVoiceTitle, body: speech.missingVoice },
    failed: { title: speech.failedTitle, body: speech.failed },
  };
  const { title, body } = copy[descriptor.kind];

  return <Notice tone={descriptor.tone} title={title} body={body} />;
}
