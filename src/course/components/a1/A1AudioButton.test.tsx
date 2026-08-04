/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { A1AudioButton } from "./A1AudioButton";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class FailingUtterance {
  lang = "";
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: Pick<SpeechSynthesisErrorEvent, "error">) => void) | null =
    null;

  constructor(readonly text: string) {}
}

function installStorage(initial: Readonly<Record<string, string>> = {}): Storage {
  const values = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("A1AudioButton playback failures", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: installStorage(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", FailingUtterance);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ lang: "ja-JP", name: "Test Japanese voice" }],
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        cancel: vi.fn(),
        speak: (utterance: FailingUtterance) =>
          utterance.onerror?.({ error: "synthesis-failed" }),
      },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it.each([
    ["en", "Audio playback failed. Try again."],
    ["it", "La riproduzione audio non è riuscita. Riprova."],
  ] as const)(
    "announces its own localized playback failure and remains retryable (%s)",
    (locale, expectedFailure) => {
      window.localStorage.setItem("nihongo.locale.primary", locale);

      act(() => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(A1AudioButton, {
              text: "こんにちは",
              audioKey: "a1-audio-button-test",
            }),
          ),
        );
      });

      const button = container.querySelector("button");
      const status = container.querySelector('[role="status"]');
      expect(button).not.toBeNull();
      expect(status).not.toBeNull();
      expect(button?.getAttribute("aria-describedby")).toBe(status?.id);

      act(() => button?.click());

      expect(status?.textContent).toBe(expectedFailure);
      expect(button?.disabled).toBe(false);
    },
  );
});
