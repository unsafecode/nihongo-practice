import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { it as itCopy } from "../i18n/it";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { FoundationFixturePage } from "./FoundationFixturePage";

// The LocaleProvider resolves to the default `it` locale in the test
// environment, so these assert the Italian copy the page composes.
function renderAt(fixtureId: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [`/__fixtures__/foundation/${fixtureId}`] },
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/__fixtures__/foundation/:fixtureId",
              element: createElement(FoundationFixturePage),
            }),
          ),
        ),
      ),
    ),
  );
}

describe("FoundationFixturePage", () => {
  it("composes the Can-do descriptor, matrix, guided board and both rounds", () => {
    const html = renderAt("fixture-a1-personal-details");
    expect(html).toContain(itCopy.foundation.matrixTitle);
    expect(html).toContain(itCopy.foundation.guidedTitle);
    expect(html).toContain(itCopy.foundation.roundOneTitle);
    expect(html).toContain(itCopy.foundation.roundTwoTitle);
    expect(html).toMatch(/<h1/);
  });

  it("shows the unavailable notice and no matrix for an unknown fixture", () => {
    const html = renderAt("fixture-does-not-exist");
    expect(html).toContain(itCopy.foundation.unavailableTitle);
    expect(html).not.toContain(itCopy.foundation.matrixTitle);
  });
});
