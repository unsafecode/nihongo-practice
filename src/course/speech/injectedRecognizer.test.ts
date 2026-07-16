import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeechRecognizer } from "./SpeechRecognizer";
import {
  resolveInjectedSpeechRecognizer,
  SPEECH_RECOGNIZER_INJECTION_KEY,
} from "./injectedRecognizer";

/**
 * The E2E injection seam (Slice D plan Task 4). These prove the production-safe
 * default — no global means no injected recognizer, so the provider keeps the
 * real browser adapter — and that only a value satisfying the public
 * {@link SpeechRecognizer} contract is ever returned.
 */

const validRecognizer: SpeechRecognizer = {
  supported: true,
  recognize: () => Promise.resolve({ kind: "failure", failure: "service-error" }),
  abort: () => {},
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveInjectedSpeechRecognizer", () => {
  it("returns undefined with no browser environment", () => {
    // The node test environment has no `window`, exercising the SSR-safe guard.
    expect(typeof window).toBe("undefined");
    expect(resolveInjectedSpeechRecognizer()).toBeUndefined();
  });

  it("returns undefined when the global is absent in a browser-like environment", () => {
    vi.stubGlobal("window", {});
    expect(resolveInjectedSpeechRecognizer()).toBeUndefined();
  });

  it("returns the injected recognizer when it satisfies the public contract", () => {
    vi.stubGlobal("window", {
      [SPEECH_RECOGNIZER_INJECTION_KEY]: validRecognizer,
    });
    expect(resolveInjectedSpeechRecognizer()).toBe(validRecognizer);
  });

  it("ignores a value that does not satisfy the recognizer contract", () => {
    vi.stubGlobal("window", {
      [SPEECH_RECOGNIZER_INJECTION_KEY]: { supported: true, recognize: () => {} },
    });
    expect(resolveInjectedSpeechRecognizer()).toBeUndefined();

    vi.stubGlobal("window", { [SPEECH_RECOGNIZER_INJECTION_KEY]: "nope" });
    expect(resolveInjectedSpeechRecognizer()).toBeUndefined();

    vi.stubGlobal("window", { [SPEECH_RECOGNIZER_INJECTION_KEY]: null });
    expect(resolveInjectedSpeechRecognizer()).toBeUndefined();
  });
});
