import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { it as itPack } from "../i18n/it";
import { LocaleProvider } from "../i18n/LocaleContext";
import { ScriptProvider } from "../settings/ScriptContext";
import { Syllabary } from "./Syllabary";

function render(url: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(
        LocaleProvider,
        null,
        createElement(ScriptProvider, null, createElement(Syllabary)),
      ),
    ),
  );
}

const syl = itPack.ui.syllabary;
const exploreReturn = "from=%2Fpercorso%2Fsounds%2Fsounds-core%23explore";

describe("Syllabary group deep links", () => {
  it("gives every group a stable landmark id and labelled heading", () => {
    const html = render("/pratica/sillabario");
    for (const id of ["gojuon", "dakuten", "yoon", "special-notes"]) {
      expect(html).toContain(`id="syllabary-group-${id}"`);
      expect(html).toContain(`aria-labelledby="syllabary-group-${id}-heading"`);
      expect(html).toContain(`id="syllabary-group-${id}-heading"`);
    }
  });

  it("offers on-page navigation to every group", () => {
    const html = render("/pratica/sillabario");
    expect(html).toContain(syl.groupNavLabel);
    expect(html).toContain(syl.groups.gojuon);
    expect(html).toContain(syl.groups["special-notes"]);
  });

  it("marks and announces the targeted group and shows an exact return", () => {
    const html = render(`/pratica/sillabario?group=yoon&${exploreReturn}`);
    expect(html).toContain("is-targeted");
    expect(html).toContain(syl.targetAnnounce(syl.groups.yoon));
    expect(html).toContain('href="/percorso/sounds/sounds-core#explore"');
    expect(html).toContain(syl.backToLesson);
    expect(html).not.toContain(syl.invalidGroup);
    expect(html).not.toContain(syl.invalidReturn);
  });

  it("shows a localized Notice and the full chart for an unknown group", () => {
    const html = render("/pratica/sillabario?group=kanji");
    expect(html).toContain(syl.invalidGroup);
    expect(html).toContain("notice--warning");
    expect(html).toContain('id="syllabary-group-gojuon"');
    expect(html).not.toContain("is-targeted");
  });

  it("validates the return independently: external return is a Notice, not a link", () => {
    const html = render(
      "/pratica/sillabario?group=gojuon&from=https://evil.example.com",
    );
    expect(html).toContain(syl.invalidReturn);
    expect(html).not.toContain("evil.example.com");
    // The valid group still targets, proving preset/return are independent.
    expect(html).toContain("is-targeted");
  });
});
