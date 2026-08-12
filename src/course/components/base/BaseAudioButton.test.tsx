/** @vitest-environment jsdom */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { BaseAudioButton } from "./BaseAudioButton";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STATUSES = ["idle", "playing", "stopped", "unavailable", "blocked", "failed"] as const;

function renderStatic(status: (typeof STATUSES)[number]): string {
  return renderToStaticMarkup(
    createElement(
      LocaleProvider,
      null,
      createElement(BaseAudioButton, {
        idBase: `audio-${status}`,
        status,
        onPlay: () => {},
        onRetry: () => {},
      }),
    ),
  );
}

describe("BaseAudioButton", () => {
  it.each(STATUSES)("renders a distinct localized label for the %s state", (status) => {
    const html = renderStatic(status);
    expect(html).toContain(`data-audio-status="${status}"`);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("disables the control only when unavailable", () => {
    for (const status of STATUSES) {
      const html = renderStatic(status);
      const disabled = html.includes("disabled=\"\"") || html.includes("disabled>");
      expect(disabled).toBe(status === "unavailable");
    }
  });

  it("offers a retry control only for blocked/failed states", () => {
    for (const status of STATUSES) {
      const html = renderStatic(status);
      const hasRetry = html.includes("base-audio-button__retry");
      expect(hasRetry).toBe(status === "blocked" || status === "failed");
    }
  });

  it("calls onPlay when the play control is activated", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    let played = 0;
    act(() => {
      root.render(
        createElement(
          LocaleProvider,
          null,
          createElement(BaseAudioButton, {
            idBase: "audio-click",
            status: "idle",
            onPlay: () => {
              played += 1;
            },
            onRetry: () => {},
          }),
        ),
      );
    });
    const button = container.querySelector<HTMLButtonElement>(
      ".base-audio-button__control",
    );
    act(() => button?.click());
    expect(played).toBe(1);
    act(() => root.unmount());
    container.remove();
  });

  it("never renders a distinct label for two different statuses that collide", () => {
    const labels = new Set(STATUSES.map((status) => renderStatic(status)));
    expect(labels.size).toBe(STATUSES.length);
  });
});
