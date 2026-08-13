/** @vitest-environment jsdom */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { routePaths } from "../../../routing/routePaths";
import { PILOT_LESSON_SLUGS, pilotLessonForSlug } from "./pilotCatalog";
import PilotLessonPage from "./PilotLessonPage";

// jsdom ships no localStorage here, so — like LessonRunner.test.tsx — install
// a memory-backed Storage on window and restore it afterwards.
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}

let storageDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage(),
  });
  // Deterministic locale so assertions on English copy don't depend on
  // whatever the previous test left behind.
  window.localStorage.setItem("nihongo.locale.primary", "en");
});

afterEach(() => {
  if (storageDescriptor) Object.defineProperty(window, "localStorage", storageDescriptor);
  else delete (window as { localStorage?: Storage }).localStorage;
});

function renderAt(path: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        LocaleProvider,
        null,
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: routePaths.pilotLesson,
            element: createElement(PilotLessonPage),
          }),
        ),
      ),
    ),
  );
}

describe("pilotCatalog", () => {
  it("resolves a lesson for every published pilot slug", () => {
    for (const slug of PILOT_LESSON_SLUGS) {
      expect(pilotLessonForSlug(slug)).toBeDefined();
    }
  });

  it("returns undefined for a slug that isn't in the catalog", () => {
    expect(pilotLessonForSlug("does-not-exist")).toBeUndefined();
  });

  it("returns undefined for an inherited Object.prototype property name, never leaking it as a lesson", () => {
    // A guard that degenerates to "anything not explicitly excluded" (rather
    // than "explicitly one of the known slugs") would let a key like
    // "constructor" or "toString" fall through plain-object indexing and
    // resolve to an inherited function instead of undefined.
    expect(pilotLessonForSlug("constructor")).toBeUndefined();
    expect(pilotLessonForSlug("toString")).toBeUndefined();
  });
});

describe("PilotLessonPage", () => {
  it("renders the polite-present-block pilot for its slug", () => {
    const html = renderAt("/anteprima/polite-present-block");
    // Distinctive to this lesson's opening hook step, nowhere in the other pilot.
    expect(html).toContain("narrate your everyday actions in a polite tone");
    expect(html).not.toContain("konbini");
  });

  it("renders the konbini-immersion pilot for its slug", () => {
    const html = renderAt("/anteprima/konbini-immersion");
    // Distinctive to this lesson's opening scene, nowhere in the other pilot.
    expect(html).toContain("A customer at the konbini speaks to the person at the till");
    expect(html).not.toContain("narrate your everyday actions");
  });

  it("renders the polite-present-block pilot with the editorial layout", () => {
    const html = renderAt("/anteprima/polite-present-block");
    expect(html).toContain("lesson-engine--editorial");
    expect(html).not.toContain("lesson-engine--stage");
  });

  it("renders the konbini-immersion pilot with the stage layout", () => {
    const html = renderAt("/anteprima/konbini-immersion");
    expect(html).toContain("lesson-engine--stage");
    expect(html).not.toContain("lesson-engine--editorial");
  });

  it("renders a visible error Notice for an unknown slug, and never the lesson runner", () => {
    const html = renderAt("/anteprima/does-not-exist");
    expect(html).toMatch(/role="alert"/);
    expect(html).not.toContain("lesson-runner");
    expect(html).not.toContain("lesson-engine");
  });

  it("never throws when rendering an unknown slug", () => {
    expect(() => renderAt("/anteprima/nonsense-slug")).not.toThrow();
  });
});
