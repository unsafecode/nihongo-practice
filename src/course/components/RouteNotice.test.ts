import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { it as itCopy } from "../i18n/it";
import { RouteNotice } from "./RouteNotice";

function renderRouteNotice(
  initialEntries: Array<string | { pathname: string; state?: unknown }>,
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries },
      createElement(LocaleProvider, null, createElement(RouteNotice)),
    ),
  );
}

describe("RouteNotice: Task 1 Notice primitive for invalid routes", () => {
  it("renders nothing when the location carries no invalid-path state", () => {
    const html = renderRouteNotice(["/percorso"]);
    expect(html).toBe("");
  });

  it("renders a warning-toned Notice with the invalid path in the body", () => {
    const html = renderRouteNotice([
      { pathname: "/percorso", state: { invalidPath: "/non-esiste" } },
    ]);
    expect(html).toContain(`class="notice notice--warning"`);
    expect(html).toContain(`role="status"`);
    expect(html).toContain(itCopy.home.invalidRouteTitle);
    expect(html).toContain(itCopy.home.invalidRoute("/non-esiste"));
  });

  it("renders an accessible dismiss action labelled with the localized dismiss copy", () => {
    const html = renderRouteNotice([
      { pathname: "/percorso", state: { invalidPath: "/non-esiste" } },
    ]);
    expect(html).toMatch(
      new RegExp(`class="action action--icon[^"]*"[^>]*aria-label="${itCopy.home.dismiss}"`),
    );
  });

  it("never renders the obsolete raw .route-notice markup", () => {
    const html = renderRouteNotice([
      { pathname: "/percorso", state: { invalidPath: "/non-esiste" } },
    ]);
    expect(html).not.toContain("route-notice");
  });
});
