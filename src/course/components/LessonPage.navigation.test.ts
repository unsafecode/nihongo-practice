/** @vitest-environment jsdom */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HashRouter, MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { ProgressProvider } from "../progress/ProgressContext";
import { LEGACY_LESSON_ALIASES } from "../routing/lessonRouteResolution";
import { lessonPath } from "../../routing/routes";
import { courseModulesByLevel } from "../data/course";
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

function renderHashPath(path: string): string {
  const previousHash = window.location.hash;
  window.location.hash = path;
  try {
    return renderToStaticMarkup(
      createElement(
        HashRouter,
        null,
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
  } finally {
    window.location.hash = previousHash;
  }
}

describe("LessonPage legacy redirect navigation", () => {
  it("replaces a retained same-module alias without carrying a different-module notice state", () => {
    const html = render("/percorso/actions/actions-object");

    expect(html).toContain('data-to="/percorso/actions/actions-1"');
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

  it("redirects every retained-A1 legacy deep link to its canonical current route", () => {
    const retainedLessonIds = new Set(
      courseModulesByLevel.a1.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
    );
    for (const alias of LEGACY_LESSON_ALIASES.filter((item) =>
      retainedLessonIds.has(item.lessonId),
    )) {
      const html = renderHashPath(
        `#/percorso/${alias.legacyModuleId}/${alias.legacyLessonId}`,
      );
      expect(html, alias.legacyLessonId).toContain(
        `data-to="${lessonPath(alias.moduleId, alias.lessonId)}"`,
      );
      expect(html, alias.legacyLessonId).toContain('data-replace="true"');
    }
  });
});
