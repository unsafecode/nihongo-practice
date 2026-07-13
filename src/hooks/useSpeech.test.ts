import { describe, expect, it } from "vitest";
import { shouldReportSpeechError } from "./useSpeech";

describe("speech error reporting", () => {
  it("ignores cancellation caused by replacing or stopping audio", () => {
    expect(shouldReportSpeechError("canceled")).toBe(false);
    expect(shouldReportSpeechError("interrupted")).toBe(false);
  });

  it("reports actionable playback failures", () => {
    expect(shouldReportSpeechError("audio-busy")).toBe(true);
    expect(shouldReportSpeechError("synthesis-failed")).toBe(true);
  });
});
