import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { LessonPage } from "./LessonPage";

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router",
  );
  return {
    ...actual,
    Navigate: ({
      replace,
      state,
      to,
    }: {
      replace?: boolean;
      state?: unknown;
      to: string;
    }) =>
      createElement("output", {
        "data-replace": String(replace),
        "data-state": JSON.stringify(state ?? null),
        "data-to": to,
      }),
  };
});

function render(path: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(
            ProgressProvider,
            null,
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: "/percorso/:moduleId/:lessonId",
                element: createElement(LessonPage),
              }),
            ),
          ),
        ),
      ),
    ),
  );
}

describe("LessonPage legacy redirect navigation", () => {
  it("replaces a same-module alias without carrying a different-module notice state", () => {
    const html = render("/percorso/sounds/sounds-core");

    expect(html).toContain('data-to="/percorso/sounds/sounds-1"');
    expect(html).toContain('data-replace="true"');
    expect(html).toContain('data-state="null"');
  });

  it("replaces a cross-module alias with the existing notice state", () => {
    const html = render("/percorso/time/time-past");

    expect(html).toContain('data-to="/percorso/past-negative/past-negative-1"');
    expect(html).toContain('data-replace="true"');
    expect(html).toContain(
      'data-state="{&quot;legacyModuleRedirect&quot;:true}"',
    );
  });
});
