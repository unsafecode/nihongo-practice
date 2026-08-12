import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { useLocale } from "../../../i18n/LocaleContext";
import { useSpeech } from "../../../hooks/useSpeech";
import { getCourseCopy } from "../../i18n/catalog";
import type { AssembledToken } from "../../../romaji/types";
import {
  baseAudioRecordById,
  resolveBaseAudioAssetUrl,
} from "../../base/audio/catalog";

/**
 * Every truthful state Base's canonical playback controls can be in (Task
 * 14). `unavailable` covers both "no canonical asset/voice resolves" and "the
 * environment cannot play audio at all" — never silently substituted by a
 * different sound. `blocked` is a browser/user gesture rejection (e.g. an
 * autoplay policy); `failed` is any other genuine playback error (network,
 * decode). Neither ever falls back to a different, uncanonical sound while
 * still presenting as success.
 */
export type BaseAudioStatus =
  | "idle"
  | "playing"
  | "stopped"
  | "unavailable"
  | "blocked"
  | "failed";

export interface BaseAudioButtonProps {
  readonly idBase: string;
  readonly status: BaseAudioStatus;
  readonly onPlay: () => void;
  readonly onRetry: () => void;
}

/**
 * The pure, controlled canonical-audio control (Task 14). It never owns the
 * actual `<audio>` element or `useSpeech()` synthesis call itself — a
 * container (`useBaseAudioPlayback`) resolves the real canonical source and
 * feeds this component only the resulting truthful `status` — so every state
 * this component can show is unit-testable without a real audio backend.
 *
 * Failures never hide the surrounding Japanese/meaning/segmentation content:
 * this control is always a small, self-contained button + status region; it
 * never wraps or conditionally renders the caller's other content. A retry
 * control appears only for the two failure states (`blocked`/`failed`) so a
 * learner is never left with a dead control after a genuine failure.
 */
export function BaseAudioButton({
  idBase,
  status,
  onPlay,
  onRetry,
}: BaseAudioButtonProps): ReactElement {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale).baseLesson.audio;
  const statusId = useId();
  const disabled = status === "unavailable";
  const showRetry = status === "blocked" || status === "failed";

  const label: Record<BaseAudioStatus, string> = {
    idle: copy.idle,
    playing: copy.playing,
    stopped: copy.stopped,
    unavailable: copy.unavailable,
    blocked: copy.blocked,
    failed: copy.failed,
  };
  const buttonLabel = status === "playing" ? copy.playing : copy.idle;

  return (
    <span className="base-audio-button" data-audio-status={status} data-id-base={idBase}>
      <button
        type="button"
        className="base-audio-button__control"
        aria-describedby={statusId}
        disabled={disabled}
        onClick={onPlay}
      >
        {buttonLabel}
      </button>
      {showRetry ? (
        <button
          type="button"
          className="base-audio-button__retry"
          onClick={onRetry}
        >
          {copy.retry}
        </button>
      ) : null}
      <span
        id={statusId}
        className="base-audio-button__status"
        role="status"
        aria-live="polite"
      >
        {label[status]}
      </span>
    </span>
  );
}

export interface BaseAudioPlayback {
  readonly kind: "asset" | "synthesis";
  readonly assetId?: string;
  readonly tokens?: readonly AssembledToken[];
}

export interface UseBaseAudioPlaybackResult {
  readonly status: BaseAudioStatus;
  readonly play: () => void;
}

/**
 * Resolves one canonical playback source into the real, effectful `status`/
 * `play` a `BaseAudioButton` container renders. `asset` mode plays only the
 * real recorded canonical WAV (`resolveBaseAudioAssetUrl`) — never a
 * synthesized substitute presented as canonical. `synthesis` mode reuses the
 * existing `useSpeech()` browser synthesis (the same one `A1AudioButton`
 * already uses) for semantic listening comprehension, where the audio is a
 * rendering of already-canonical text rather than phonetic evidence itself.
 */
export function useBaseAudioPlayback(
  playback: BaseAudioPlayback,
  idBase: string,
): UseBaseAudioPlaybackResult {
  const speech = useSpeech();
  const [assetStatus, setAssetStatus] = useState<BaseAudioStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const record =
    playback.kind === "asset" && playback.assetId
      ? baseAudioRecordById(playback.assetId)
      : null;
  const assetUrl = record ? resolveBaseAudioAssetUrl(record.src) : null;

  useEffect(() => {
    if (playback.kind !== "asset" || !assetUrl) return undefined;
    const audio = new Audio(assetUrl);
    audioRef.current = audio;
    const onPlaying = () => setAssetStatus("playing");
    const onEnded = () => setAssetStatus("stopped");
    const onError = () => setAssetStatus("failed");
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.kind, assetUrl]);

  if (playback.kind === "synthesis") {
    const audioKey = `${idBase}-model`;
    const unavailable = !speech.supported || !speech.japaneseVoiceAvailable;
    const status: BaseAudioStatus = unavailable
      ? "unavailable"
      : speech.playbackFailed
        ? "failed"
        : speech.speakingKey === audioKey
          ? "playing"
          : "idle";
    const text = (playback.tokens ?? []).map((token) => token.jp).join("");
    return { status, play: () => speech.speak(text, { key: audioKey }) };
  }

  if (!record || !assetUrl) {
    return { status: "unavailable", play: () => {} };
  }

  return {
    status: assetStatus,
    play: () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch((error: unknown) => {
        const isBlocked =
          error instanceof DOMException && error.name === "NotAllowedError";
        setAssetStatus(isBlocked ? "blocked" : "failed");
      });
    },
  };
}
