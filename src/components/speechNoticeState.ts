import type { NoticeTone } from "./Notice";

/**
 * The three honest speech-synthesis states surfaced to the learner (design
 * spec §7.4). `unsupported` and `missing-voice` keep the text usable while
 * warning that audio is degraded; `failed` reports a real playback error.
 */
export type SpeechNoticeKind = "unsupported" | "missing-voice" | "failed";

export interface SpeechNoticeDescriptor {
  readonly kind: SpeechNoticeKind;
  readonly tone: NoticeTone;
}

export interface SpeechState {
  readonly supported: boolean;
  readonly japaneseVoiceAvailable: boolean;
  readonly playbackFailed: boolean;
}

/**
 * Pure resolver mapping a speech state to the single notice that should show,
 * or `null` when speech is fully available. Kept dependency-free so both the
 * Lab and the Syllabary can prove their honest degraded-audio behaviour
 * without a DOM. Precedence: an unsupported engine is reported first, then a
 * concrete playback failure, then a merely missing Japanese voice.
 */
export function resolveSpeechNotice(
  state: SpeechState,
): SpeechNoticeDescriptor | null {
  if (!state.supported) return { kind: "unsupported", tone: "warning" };
  if (state.playbackFailed) return { kind: "failed", tone: "error" };
  if (!state.japaneseVoiceAvailable) {
    return { kind: "missing-voice", tone: "info" };
  }
  return null;
}
