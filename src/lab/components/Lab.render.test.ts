import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { it as itCopy } from "../../course/i18n/it";
import { Lab } from "./Lab";

function render(url: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(
        LocaleProvider,
        null,
        createElement(ScriptProvider, null, createElement(Lab)),
      ),
    ),
  );
}

const validPreset =
  "scenario=eat&form=past&time=today&slot.object=ramen&slot.place=";
const explore = "&from=%2Fpercorso%2Ftime%2Ftime-past%23explore";

describe("Lab guided context", () => {
  it("shows a styled return Action to the exact lesson explore section", () => {
    const html = render(`/pratica/laboratorio?${validPreset}${explore}`);
    expect(html).toContain('class="action');
    expect(html).toContain('href="/percorso/time/time-past#explore"');
    expect(html).toContain(itCopy.practice.backToLesson);
    expect(html).not.toContain(itCopy.practice.invalidPreset);
    expect(html).not.toContain(itCopy.practice.invalidReturn);
  });

  it("surfaces an invalid preset as a localized Notice and keeps a safe default board", () => {
    const html = render("/pratica/laboratorio?scenario=bad");
    expect(html).toContain(itCopy.practice.invalidPreset);
    expect(html).toContain("notice--warning");
    // Safe fallback: the scenario selector still renders (default selection).
    expect(html).toContain("scenario");
  });

  it("validates the return independently: an external return is a Notice, never a link", () => {
    const html = render(
      `/pratica/laboratorio?${validPreset}&from=https://evil.example.com`,
    );
    expect(html).toContain(itCopy.practice.invalidReturn);
    expect(html).not.toContain("evil.example.com");
    // The valid preset still parsed, so no invalid-preset notice appears.
    expect(html).not.toContain(itCopy.practice.invalidPreset);
  });
});
