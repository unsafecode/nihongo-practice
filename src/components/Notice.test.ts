import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Notice } from "./Notice";

describe("Notice", () => {
  it("renders each tone with its own modifier class and role", () => {
    const tones = ["info", "warning", "error"] as const;
    for (const tone of tones) {
      const html = renderToStaticMarkup(
        createElement(Notice, {
          tone,
          title: "Heads up",
          body: "Something to know.",
        }),
      );
      expect(html).toContain(`class="notice notice--${tone}"`);
      expect(html).toContain("Heads up");
      expect(html).toContain("Something to know.");
    }
  });

  it("uses an alert role for the error tone and status for info/warning", () => {
    const errorHtml = renderToStaticMarkup(
      createElement(Notice, { tone: "error", title: "Oops", body: "Failed." }),
    );
    expect(errorHtml).toContain('role="alert"');

    const infoHtml = renderToStaticMarkup(
      createElement(Notice, { tone: "info", title: "FYI", body: "Noted." }),
    );
    expect(infoHtml).toContain('role="status"');
  });

  it("renders no dismiss control when onDismiss is not provided", () => {
    const html = renderToStaticMarkup(
      createElement(Notice, { tone: "info", title: "FYI", body: "Noted." }),
    );
    expect(html).not.toContain("notice__dismiss");
  });

  it("renders a labeled dismiss action when onDismiss and dismissLabel are provided", () => {
    const onDismiss = vi.fn();
    const html = renderToStaticMarkup(
      createElement(Notice, {
        tone: "warning",
        title: "Careful",
        body: "Check this.",
        dismissLabel: "Dismiss",
        onDismiss,
      }),
    );
    expect(html).toContain("notice__dismiss");
    expect(html).toContain('aria-label="Dismiss"');
    expect(html).toContain("action action--icon");
  });
});
