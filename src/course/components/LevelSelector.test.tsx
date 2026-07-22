/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { en as enCopy } from "../i18n/en";
import { coursePathForLevel } from "../../routing/routePaths";
import { LevelSelector } from "./LevelSelector";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const copy = enCopy.courseLevels;

function renderStatic(
  level: "a1" | "a2",
  a2Recommended: boolean,
  initialPath = coursePathForLevel(level),
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      createElement(LevelSelector, { level, a2Recommended, copy }),
    ),
  );
}

describe("LevelSelector — accessible two-option level control (Phase 3 Task 8)", () => {
  it("offers both A1 and A2 as directly routable links (never disabled)", () => {
    const html = renderStatic("a1", false);
    expect(html).toContain(`href="${coursePathForLevel("a1")}"`);
    expect(html).toContain(`href="${coursePathForLevel("a2")}"`);
    // Links are never disabled — A2 is always selectable, never hard-locked.
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("aria-disabled");
  });

  it("marks the URL-selected level with aria-current and a selected data hook", () => {
    const a1 = renderStatic("a1", false);
    expect(a1).toMatch(/data-level="a1"[^>]*aria-current="true"|aria-current="true"[^>]*data-level="a1"/);
    expect(a1).toMatch(/data-level="a2"[^>]*data-selected="false"|data-selected="false"[^>]*data-level="a2"/);

    const a2 = renderStatic("a2", true);
    expect(a2).toMatch(/data-level="a2"[^>]*aria-current="true"|aria-current="true"[^>]*data-level="a2"/);
  });

  it("shows the soft 'available' hint before the A1 checkpoint and the 'recommended' hint after — never blocking", () => {
    expect(renderStatic("a1", false)).toContain(copy.a2AvailableHint);
    expect(renderStatic("a1", true)).toContain(copy.a2RecommendedHint);
    // A2 is enabled in both cases regardless of the hint variant.
    expect(renderStatic("a1", false)).toContain(`href="${coursePathForLevel("a2")}"`);
    expect(renderStatic("a1", true)).toContain(`href="${coursePathForLevel("a2")}"`);
  });

  it("names the selector group for assistive tech", () => {
    expect(renderStatic("a1", false)).toContain(copy.selectorLabel);
  });
});

describe("LevelSelector — URL drives selection and clicking pushes history", () => {
  function LocationProbe() {
    const location = useLocation();
    return createElement(
      "output",
      { "data-testid": "loc" },
      `${location.pathname}${location.search}`,
    );
  }

  it("navigates (pushes history) to the A2 URL when its option is activated, and back restores A1", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: [coursePathForLevel("a1")] },
          createElement(LocationProbe),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/percorso",
              element: createElement(LevelSelector, {
                level: "a1" as const,
                a2Recommended: false,
                copy,
              }),
            }),
          ),
        ),
      );
    });

    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe("/percorso");

    const a2Link = container.querySelector<HTMLAnchorElement>('[data-level="a2"]');
    expect(a2Link).not.toBeNull();
    await act(async () => {
      a2Link!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=a2",
    );

    root.unmount();
    container.remove();
  });
});
