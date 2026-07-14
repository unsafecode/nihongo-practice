import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { it as itCopy } from "../i18n/it";
import { LocaleProvider } from "../i18n/LocaleContext";
import { ScriptProvider } from "../settings/ScriptContext";
import { Header } from "./Header";

function renderHeader(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(ScriptProvider, null, createElement(Header)),
      ),
    ),
  );
}

describe("Header", () => {
  it("renders one stable header with brand, primary nav, and desktop settings regions", () => {
    const html = renderHeader();
    expect(html).toContain('class="header"');
    expect(html).toContain("header__brand");
    expect(html).toContain("header__settings--desktop");
    expect(html).toContain(`aria-label="${itCopy.ui.nav.primary}"`);
  });

  it("has no emoji glyphs and no legacy <details> mobile settings", () => {
    const html = renderHeader();
    expect(html).not.toMatch(/<details/);
    expect(html).not.toContain("⚙");
    expect(/\p{Extended_Pictographic}/u.test(html)).toBe(false);
  });

  it("exposes a real button drawer trigger describing the closed drawer state", () => {
    const html = renderHeader();
    expect(html).toMatch(
      /<button[^>]*class="[^"]*header__settings-trigger[^"]*"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="false"/,
    );
  });

  it("does not render drawer contents while closed", () => {
    const html = renderHeader();
    expect(html).not.toContain("settings-drawer__panel");
  });
});
