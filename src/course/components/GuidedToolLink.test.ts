import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { lessonPath } from "../../routing/routePaths";
import { it as itCopy } from "../i18n/it";
import type { GuidedToolExploration } from "../data/types";
import { GuidedToolLink } from "./GuidedToolLink";

const exploration: GuidedToolExploration = {
  id: "exp-sounds-core",
  objectiveId: "sounds-core",
  target: "syllabary",
  returnTarget: {
    pathname: lessonPath("sounds", "sounds-core"),
    sectionId: "explore",
  },
};

function render(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(GuidedToolLink, {
            exploration,
            copyId: "sounds-core-explore",
          }),
        ),
      ),
    ),
  );
}

describe("GuidedToolLink", () => {
  it("renders an Action-styled link to the Syllabary, not a naked anchor", () => {
    const html = render();
    expect(html).toContain('class="action');
    expect(html).toContain("/pratica/sillabario");
    expect(html).toContain(itCopy.lesson.guided.openSyllabary);
  });

  it("describes what the link opens using the explore copy body", () => {
    const html = render();
    expect(html).toContain(itCopy.blocks["sounds-core-explore"].body ?? "");
  });

  it("never claims an in-page before/after transformation", () => {
    const html = render();
    expect(html).not.toContain(itCopy.lesson.comparison.before);
    expect(html).not.toContain(itCopy.lesson.guided.initial);
  });
});
