import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SettingsDrawer } from "./SettingsDrawer";

describe("SettingsDrawer", () => {
  it("renders nothing when closed, without touching the DOM/portal", () => {
    const html = renderToStaticMarkup(
      createElement(SettingsDrawer, {
        open: false,
        triggerId: "settings-trigger",
        onClose: () => {},
        closeLabel: "Close settings",
        heading: "Settings",
        children: "content",
      }),
    );
    expect(html).toBe("");
  });
});
