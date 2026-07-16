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
const explore = "&from=%2Fpercorso%2Factions%2Factions-1%23explore";

describe("Lab guided context", () => {
  it("shows a styled return Action to the exact lesson explore section", () => {
    const html = render(`/pratica/laboratorio?${validPreset}${explore}`);
    expect(html).toContain('class="action');
    expect(html).toContain('href="/percorso/actions/actions-1#explore"');
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

  it("rejects a shape-valid but cross-module return as a Notice, never a return Action", () => {
    const html = render(
      `/pratica/laboratorio?${validPreset}&from=%2Fpercorso%2Fsounds%2Factions-1%23explore`,
    );
    expect(html).toContain(itCopy.practice.invalidReturn);
    expect(html).not.toContain('href="/percorso/sounds/actions-1#explore"');
    expect(html).not.toContain(itCopy.practice.backToLesson);
    expect(html).not.toContain(itCopy.practice.invalidPreset);
  });

  it("canonicalizes a legacy chapter return to the current module return Action", () => {
    const html = render(
      `/pratica/laboratorio?${validPreset}&from=%2Fpercorso%2Ftraps%2Ftraps-verbs%23explore`,
    );
    expect(html).toContain(
      'href="/percorso/capstones/capstones-travel-day#explore"',
    );
    expect(html).toContain(itCopy.practice.backToLesson);
    expect(html).not.toContain(itCopy.practice.invalidReturn);
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

/**
 * Semantic romaji rendering on the Lab board (Phase 0 Task 4, master spec
 * §13.2-13.3): the full sentence must render the real assembled token list
 * through the shared `RomajiSequence`, never a local join/hardcoded space —
 * so the verb attaches its polite ending ("tabemasu", never "tabe masu"),
 * and each isolated chip (its own lexical+particle or stem+morpheme token
 * subset) reads correctly with no meaningless leading space. Particle and
 * ending tokens keep their color-coded `<span>` wrapper (an existing,
 * unrelated cue), so readability assertions strip tags first.
 */
function textOnly(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function chipSubs(html: string): string[] {
  return [...html.matchAll(/<div class="chip__sub">([\s\S]*?)<\/div>/g)].map(
    (m) => textOnly(m[1]),
  );
}

describe("Lab board: semantic romaji rendering", () => {
  const presPreset =
    "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=";

  it("renders the full sentence's romaji as one readable, correctly-attached sequence", () => {
    const html = render(`/pratica/laboratorio?${presPreset}`);
    const match = html.match(
      /<div class="sentence__sub">([\s\S]*?)<\/div>/,
    );
    expect(match).not.toBeNull();
    const sub = textOnly(match![1]);
    expect(sub).toBe("kyō rāmen o tabemasu");
    expect(sub).not.toContain("tabe masu");
  });

  it("keeps the Japanese full sentence unspaced, exactly as before", () => {
    const html = render(`/pratica/laboratorio?${presPreset}`);
    const match = html.match(
      /<div class="sentence__main"[^>]*>([\s\S]*?)<\/div>/,
    );
    expect(match).not.toBeNull();
    expect(textOnly(match![1])).toBe("きょうらーめんをたべます");
  });

  it("gives the verb chip its attached ending with no leading space", () => {
    const html = render(`/pratica/laboratorio?${presPreset}`);
    // Chip order is time, object, verb — the verb chip is last.
    const verbSub = chipSubs(html).at(-1);
    expect(verbSub).toBe("tabemasu");
  });

  it("gives the object chip's romaji its particle attached with a single interior space, no leading space", () => {
    const html = render(`/pratica/laboratorio?${presPreset}`);
    const objectSub = chipSubs(html).at(1);
    expect(objectSub).toBe("rāmen o");
  });

  it("gives the isolated time chip's romaji with no leading space at all", () => {
    const html = render(`/pratica/laboratorio?${presPreset}`);
    const timeSub = chipSubs(html).at(0);
    expect(timeSub).toBe("kyō");
  });
});
