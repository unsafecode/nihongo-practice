import { describe, expect, it } from "vitest";
import { resolveSpeechNotice } from "./speechNoticeState";

describe("resolveSpeechNotice", () => {
  it("returns nothing when speech is fully available", () => {
    expect(
      resolveSpeechNotice({
        supported: true,
        japaneseVoiceAvailable: true,
        playbackFailed: false,
      }),
    ).toBeNull();
  });

  it("reports an unsupported engine as a warning, before any other state", () => {
    expect(
      resolveSpeechNotice({
        supported: false,
        japaneseVoiceAvailable: false,
        playbackFailed: true,
      }),
    ).toEqual({ kind: "unsupported", tone: "warning" });
  });

  it("reports a playback failure as an error", () => {
    expect(
      resolveSpeechNotice({
        supported: true,
        japaneseVoiceAvailable: true,
        playbackFailed: true,
      }),
    ).toEqual({ kind: "failed", tone: "error" });
  });

  it("reports a missing Japanese voice as an informational notice", () => {
    expect(
      resolveSpeechNotice({
        supported: true,
        japaneseVoiceAvailable: false,
        playbackFailed: false,
      }),
    ).toEqual({ kind: "missing-voice", tone: "info" });
  });

  it("prefers the failure over a missing voice when both are set", () => {
    expect(
      resolveSpeechNotice({
        supported: true,
        japaneseVoiceAvailable: false,
        playbackFailed: true,
      }),
    ).toEqual({ kind: "failed", tone: "error" });
  });
});
