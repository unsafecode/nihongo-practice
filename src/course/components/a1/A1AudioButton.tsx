import { useId, type ReactElement } from "react";
import { ActionButton } from "../../../components/actions/Action";
import { useSpeech } from "../../../hooks/useSpeech";
import { useLocale } from "../../../i18n/LocaleContext";
import { getCourseCopy } from "../../i18n/catalog";

export interface A1AudioButtonProps {
  readonly text: string;
  readonly audioKey: string;
  readonly rate?: number;
}

/**
 * One truthful, Japanese-only playback control with its own status.
 */
export function A1AudioButton({
  text,
  audioKey,
  rate = 0.9,
}: A1AudioButtonProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale).a1Lesson.audio;
  const {
    supported,
    japaneseVoiceAvailable,
    speakingKey,
    playbackFailed,
    speak,
  } = useSpeech();
  const statusId = useId();
  const unavailable = !supported || !japaneseVoiceAvailable;
  const playing = speakingKey === audioKey;
  const status = unavailable
    ? copy.unavailable
    : playbackFailed
      ? copy.failed
      : playing
        ? copy.playing
        : "";

  return (
    <span className="a1-audio-button">
      <ActionButton
        type="button"
        variant="secondary"
        className="a1-audio-button__control"
        data-audio-key={audioKey}
        aria-describedby={statusId}
        disabled={unavailable}
        onClick={() => speak(text, { key: audioKey, rate })}
      >
        {playing ? copy.playing : copy.play}
      </ActionButton>
      <span
        id={statusId}
        className="a1-audio-button__status"
        role="status"
        aria-live="polite"
        aria-label={copy.statusLabel}
      >
        {status}
      </span>
    </span>
  );
}
