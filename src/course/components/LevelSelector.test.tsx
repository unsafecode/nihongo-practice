/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseLevelId } from "../levels/types";
import {
  COURSE_LEVEL_PREFERENCE_KEY,
} from "../levels/selection";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { coursePathForLevel } from "../../routing/routePaths";
import { LevelSelector } from "./LevelSelector";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const copy = enCopy.courseLevels;
const progressStorageKey = "nihongo.course.progress";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length(): number {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function renderStatic(
  level: CourseLevelId,
  recommendedLevel: CourseLevelId | null,
  initialPath = coursePathForLevel(level),
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      createElement(LevelSelector, { level, recommendedLevel, copy }),
    ),
  );
}

describe("LevelSelector — accessible three-option level control", () => {
  it("offers Base, A1, and A2 as directly routable enabled links", () => {
    const html = renderStatic("a1", "a0");
    expect(html).toContain(`href="${coursePathForLevel("a0")}"`);
    expect(html).toContain(`href="${coursePathForLevel("a1")}"`);
    expect(html).toContain(`href="${coursePathForLevel("a2")}"`);
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("aria-disabled");
  });

  it("marks only the selected URL level with aria-current and a selected data hook", () => {
    const html = renderStatic("a0", "a0");
    expect(html).toMatch(/data-level="a0"[^>]*aria-current="true"|aria-current="true"[^>]*data-level="a0"/);
    expect(html).toMatch(/data-level="a1"[^>]*data-selected="false"|data-selected="false"[^>]*data-level="a1"/);
    expect(html).toMatch(/data-level="a2"[^>]*data-selected="false"|data-selected="false"[^>]*data-level="a2"/);
  });

  it("shows each option's truthful hint and a visible recommended marker without disabling options", () => {
    const html = renderStatic("a1", "a2");
    expect(html).toContain(copy.baseAvailableHint);
    expect(html).toContain(copy.a1AvailableHint);
    expect(html).toContain(copy.a2RecommendedHint);
    expect(html).toContain(copy.recommendedMarker);
    expect(html).not.toContain("aria-disabled");
  });

  it("shows the A1 recommended hint instead of Base or availability copy when A1 is recommended", () => {
    const html = renderStatic("a1", "a1");
    expect(html).toContain(copy.recommendedMarker);
    expect(html).toContain(copy.a1RecommendedHint);
    expect(html).not.toContain(copy.baseRecommendedHint);
    expect(html).not.toContain(copy.a1AvailableHint);
  });

  it("names the selector group through visible text and aria-labelledby", () => {
    const html = renderStatic("a1", null);
    expect(html).toContain(`>${copy.selectorLabel}<`);
    expect(html).not.toContain(`aria-label="${copy.selectorLabel}"`);
    const labelledByMatch = html.match(/aria-labelledby="([^"]*)"/);
    expect(labelledByMatch).not.toBeNull();
    const labelledBy = labelledByMatch![1];
    expect(labelledBy).not.toBe("");
    const escapedLabel = copy.selectorLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const idMatch = html.match(new RegExp(`id="([^"]*)"[^>]*>${escapedLabel}<`));
    expect(idMatch).not.toBeNull();
    expect(labelledBy).toBe(idMatch![1]);
  });
});

describe("LevelSelector — URL navigation and preference persistence", () => {
  function LocationProbe() {
    const location = useLocation();
    return createElement(
      "output",
      { "data-testid": "loc" },
      `${location.pathname}${location.search}`,
    );
  }

  function BackButton() {
    const navigate = useNavigate();
    return createElement("button", { type: "button", onClick: () => navigate(-1) }, "Back");
  }

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: memoryStorage(),
      configurable: true,
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  async function clickAndFlush(link: HTMLAnchorElement) {
    await act(async () => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it("pushes distinct URLs for all three options, back restores the prior location, and stores the selected internal id", async () => {
    const consoleError = vi.spyOn(console, "error");
    window.localStorage.setItem(progressStorageKey, "untouched");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(
          MemoryRouter,
          { initialEntries: [coursePathForLevel("a1")] },
          createElement(LocationProbe),
          createElement(BackButton),
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: "/percorso",
              element: createElement(LevelSelector, {
                level: "a1" as const,
                recommendedLevel: "a0" as const,
                copy,
              }),
            }),
          ),
        ),
      );
    });

    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=a1",
    );

    const baseLink = container.querySelector<HTMLAnchorElement>('[data-level="a0"]');
    const a2Link = container.querySelector<HTMLAnchorElement>('[data-level="a2"]');
    const a1Link = container.querySelector<HTMLAnchorElement>('[data-level="a1"]');
    expect(baseLink).not.toBeNull();
    expect(a1Link).not.toBeNull();
    expect(a2Link).not.toBeNull();

    await clickAndFlush(baseLink!);
    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=base",
    );
    expect(window.localStorage.getItem(COURSE_LEVEL_PREFERENCE_KEY)).toBe("a0");
    expect(window.localStorage.getItem(progressStorageKey)).toBe("untouched");

    await clickAndFlush(a2Link!);
    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=a2",
    );
    expect(window.localStorage.getItem(COURSE_LEVEL_PREFERENCE_KEY)).toBe("a2");

    await clickAndFlush(a1Link!);
    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=a1",
    );
    expect(window.localStorage.getItem(COURSE_LEVEL_PREFERENCE_KEY)).toBe("a1");

    const back = container.querySelector<HTMLButtonElement>("button");
    await act(async () => {
      back!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.querySelector('[data-testid="loc"]')?.textContent).toBe(
      "/percorso?livello=a2",
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();

    const actWarnings = consoleError.mock.calls.filter((args) =>
      String(args[0]).includes("not wrapped in act"),
    );
    expect(actWarnings).toEqual([]);
  });
});

describe("LevelSelector — locale copy", () => {
  const forbidden = /\b(lock|locked|pass|passed|certif|bloccat|superat|certificat)\b/i;
  const japanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

  it.each([
    ["en", enCopy.courseLevels],
    ["it", itCopy.courseLevels],
  ] as const)("has complete option hints without Japanese or lock/pass/certification claims (%s)", (_locale, levels) => {
    const values = [
      levels.selectorLabel,
      levels.recommendedMarker,
      levels.base,
      levels.a1,
      levels.a2,
      levels.baseHeading,
      levels.a1Heading,
      levels.a2Heading,
      levels.baseBadge,
      levels.a2Badge,
      levels.baseAvailableHint,
      levels.baseRecommendedHint,
      levels.a1AvailableHint,
      levels.a1RecommendedHint,
      levels.a2AvailableHint,
      levels.a2RecommendedHint,
    ];
    for (const value of values) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value).not.toMatch(japanese);
      expect(value).not.toMatch(forbidden);
    }
  });
});
