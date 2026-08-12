/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { STORAGE_KEY as PROGRESS_STORAGE_KEY } from "../progress/ProgressContext";
import { routePaths } from "../../routing/routePaths";
import { BASE_DIAGNOSTIC_DIMENSION_IDS } from "../base/diagnostic/model";
import { it as itCopy } from "../i18n/it";
import {
  BASE_DIAGNOSTIC_STORAGE_KEY,
  BaseDiagnostic,
} from "./BaseDiagnostic";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function installStorage(initial: Readonly<Record<string, string>> = {}): Map<string, string> {
  const values = new Map<string, string>(Object.entries(initial));
  const storage: Storage = {
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
      values.set(key, value);
    },
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  return values;
}

let storageValues: Map<string, string>;

beforeEach(() => {
  storageValues = installStorage();
});
afterEach(() => {
  installStorage();
});

function renderStatic(): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [routePaths.baseDiagnostic] },
      createElement(
        LocaleProvider,
        null,
        createElement(BaseDiagnostic),
      ),
    ),
  );
}

function mount(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [routePaths.baseDiagnostic] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: routePaths.baseDiagnostic,
            element: createElement(
              LocaleProvider,
              null,
              createElement(BaseDiagnostic),
            ),
          }),
        ),
      ),
    );
  });
  return { container, root };
}

function unmount(handle: { container: HTMLDivElement; root: Root }): void {
  act(() => handle.root.unmount());
  handle.container.remove();
}

describe("BaseDiagnostic — static structure", () => {
  it("renders a heading, intro, one fieldset per dimension, and a skip control", () => {
    const html = renderStatic();
    expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
    expect(html).toContain(itCopy.baseDiagnostic.intro);
    for (const id of BASE_DIAGNOSTIC_DIMENSION_IDS) {
      expect(html, id).toContain(`data-dimension-id="${id}"`);
      expect(html, id).toContain(itCopy.baseDiagnostic.dimensions[id]);
    }
    expect(html).toContain(itCopy.baseDiagnostic.skip);
  });

  it("uses native, keyboard/touch-operable form controls — real radio inputs and real buttons", () => {
    const html = renderStatic();
    // Real <input type="radio"> per yes/no choice (natively focusable,
    // Tab/arrow-key and touch operable — no custom div-based control).
    const radioCount = (html.match(/<input[^>]*type="radio"[^>]*>/g) ?? []).length;
    expect(radioCount).toBe(BASE_DIAGNOSTIC_DIMENSION_IDS.length * 2);
    // Every question is inside a <fieldset>/<legend> pair for accessible
    // grouping, and answers use <label> so the hit target includes the text.
    expect(html.match(/<fieldset/g)?.length).toBe(BASE_DIAGNOSTIC_DIMENSION_IDS.length);
    expect(html.match(/<legend/g)?.length).toBe(BASE_DIAGNOSTIC_DIMENSION_IDS.length);
    // Real <button> elements for skip/submit (native Enter/Space + touch tap).
    expect(html).toMatch(/<button[^>]*>[^<]*<\/button>/);
  });

  it("disables the submit control until every dimension is answered", () => {
    const html = renderStatic();
    const submitMatch = html.match(/<button[^>]*type="submit"[^>]*>/);
    expect(submitMatch).not.toBeNull();
    expect(submitMatch![0]).toMatch(/disabled/);
  });
});

describe("BaseDiagnostic — completing the diagnostic", () => {
  it("answering all four dimensions and submitting shows a recommendation and writes only the diagnostic setting", () => {
    const handle = mount();
    const { container } = handle;

    for (const id of BASE_DIAGNOSTIC_DIMENSION_IDS) {
      const yesInput = container.querySelector<HTMLInputElement>(
        `input[name="${id}"][value="yes"]`,
      );
      expect(yesInput, id).not.toBeNull();
      act(() => {
        yesInput!.click();
      });
    }

    const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submit?.disabled).toBe(false);
    act(() => {
      submit?.click();
    });

    expect(container.textContent).toContain(itCopy.baseDiagnostic.resultHeading);
    expect(container.querySelector('[data-diagnostic-result="a1"]')).not.toBeNull();

    // Writes only its own separate setting — never learner progress/evidence.
    expect(storageValues.has(BASE_DIAGNOSTIC_STORAGE_KEY)).toBe(true);
    expect(storageValues.has(PROGRESS_STORAGE_KEY)).toBe(false);
    const stored = JSON.parse(storageValues.get(BASE_DIAGNOSTIC_STORAGE_KEY)!);
    expect(stored.status).toBe("completed");
    expect(stored.result.recommendedLevel).toBe("a1");

    unmount(handle);
  });

  it("recommends Base and its matching module when a dimension is answered no", () => {
    const handle = mount();
    const { container } = handle;

    for (const id of BASE_DIAGNOSTIC_DIMENSION_IDS) {
      const value = id === "particle-sense" ? "no" : "yes";
      const input = container.querySelector<HTMLInputElement>(
        `input[name="${id}"][value="${value}"]`,
      );
      act(() => {
        input!.click();
      });
    }
    const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]');
    act(() => {
      submit?.click();
    });

    expect(container.querySelector('[data-diagnostic-result="a0"]')).not.toBeNull();
    const stored = JSON.parse(storageValues.get(BASE_DIAGNOSTIC_STORAGE_KEY)!);
    expect(stored.result.recommendedLevel).toBe("a0");
    expect(stored.result.recommendedModuleId).toBe("argument-particles");
    expect(storageValues.has(PROGRESS_STORAGE_KEY)).toBe(false);

    unmount(handle);
  });

  it("re-answering a dimension before submitting keeps only the latest choice", () => {
    const handle = mount();
    const { container } = handle;

    const firstDimension = BASE_DIAGNOSTIC_DIMENSION_IDS[0];
    const yes = container.querySelector<HTMLInputElement>(
      `input[name="${firstDimension}"][value="yes"]`,
    )!;
    const no = container.querySelector<HTMLInputElement>(
      `input[name="${firstDimension}"][value="no"]`,
    )!;
    act(() => yes.click());
    expect(yes.checked).toBe(true);
    act(() => no.click());
    expect(no.checked).toBe(true);
    expect(yes.checked).toBe(false);

    unmount(handle);
  });
});

describe("BaseDiagnostic — skipping", () => {
  it("is optional and skippable without answering anything, and writes only the diagnostic setting as skipped", () => {
    const handle = mount();
    const { container } = handle;

    const skip = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === itCopy.baseDiagnostic.skip,
    );
    expect(skip).not.toBeUndefined();
    act(() => {
      skip?.click();
    });

    expect(container.textContent).toContain(itCopy.baseDiagnostic.skippedNotice);
    expect(storageValues.has(BASE_DIAGNOSTIC_STORAGE_KEY)).toBe(true);
    expect(storageValues.has(PROGRESS_STORAGE_KEY)).toBe(false);
    const stored = JSON.parse(storageValues.get(BASE_DIAGNOSTIC_STORAGE_KEY)!);
    expect(stored.status).toBe("skipped");
    expect(stored.result).toBeUndefined();

    unmount(handle);
  });

  it("never mutates course progress/evidence, only ever the separate baseDiagnostic setting", () => {
    storageValues = installStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify({ schemaVersion: 5, sentinel: true }) });
    const handle = mount();
    const { container } = handle;

    for (const id of BASE_DIAGNOSTIC_DIMENSION_IDS) {
      const input = container.querySelector<HTMLInputElement>(`input[name="${id}"][value="yes"]`);
      act(() => input!.click());
    }
    act(() => container.querySelector<HTMLButtonElement>('button[type="submit"]')?.click());

    expect(storageValues.get(PROGRESS_STORAGE_KEY)).toBe(
      JSON.stringify({ schemaVersion: 5, sentinel: true }),
    );

    unmount(handle);
  });
});
