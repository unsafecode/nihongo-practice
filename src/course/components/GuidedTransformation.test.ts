import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { lessonPath } from "../../routing/routePaths";
import { it as itCopy } from "../i18n/it";
import type { GuidedTransformationData } from "../data/types";
import { GuidedTransformation } from "./GuidedTransformation";

const authored: GuidedTransformationData = {
  id: "exp-actions-1",
  objectiveId: "actions-1",
  initialSelection: { exampleId: "actions-1-base", segmentIds: [] },
  targetSelection: { exampleId: "actions-1-changed", segmentIds: [] },
  changedGearIds: ["レストラン", "で"],
  returnTarget: {
    pathname: lessonPath("actions", "actions-1"),
    sectionId: "explore",
  },
};

const lab: GuidedTransformationData = {
  id: "exp-time-past",
  objectiveId: "time-past",
  initialSelection: {
    scenarioId: "eat",
    form: "pres",
    timeId: "today",
    options: { object: "ramen", place: null },
  },
  targetSelection: {
    scenarioId: "eat",
    form: "past",
    timeId: "today",
    options: { object: "ramen", place: null },
  },
  changedGearIds: ["ます", "ました"],
  returnTarget: {
    pathname: lessonPath("time", "time-past"),
    sectionId: "explore",
  },
};

function render(data: GuidedTransformationData): string {
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
          createElement(GuidedTransformation, { data }),
        ),
      ),
    ),
  );
}

/**
 * A minimal in-memory `Storage` so {@link renderWithScript} can force the
 * settings provider's initial script without touching real browser storage.
 */
function memoryStorage(initial: Record<string, string>): Storage {
  const values = new Map(Object.entries(initial));
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
      values.set(key, value);
    },
  };
}

/**
 * Forces `ScriptProvider`'s initial script for the duration of the render
 * (the settings provider reads a fake `window.localStorage` once,
 * synchronously, on mount). This test environment runs under Node (no real
 * `window`), and only the `mainField` script (default "hiragana") ever
 * carries the guided board's gear marks — so proving the romaji
 * `RomajiSequence` integration marks its highlighted token correctly
 * requires rendering with script "romaji" at least once.
 */
function renderWithScript(
  data: GuidedTransformationData,
  script: "hiragana" | "romaji",
): string {
  const globalWithWindow = globalThis as { window?: unknown };
  const original = globalWithWindow.window;
  globalWithWindow.window = {
    localStorage: memoryStorage({ "nihongo.script": script }),
  };
  try {
    return render(data);
  } finally {
    globalWithWindow.window = original;
  }
}

function marks(html: string): string[] {
  return [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map((m) => m[1]);
}

describe("GuidedTransformation (authored endpoints)", () => {
  it("renders a dark guided board with both endpoint labels", () => {
    const html = render(authored);
    expect(html).toContain("guided-board");
    expect(html).toContain(itCopy.lesson.guided.initial);
    expect(html).toContain(itCopy.lesson.guided.target);
  });

  it("shows both endpoints derived from the authored examples", () => {
    const html = render(authored);
    expect(html).toContain("たべ");
    expect(html).toContain("レストラン");
  });

  it("marks the introduced gears on the target endpoint only", () => {
    const found = marks(render(authored)).join("|");
    expect(found).toContain("レストラン");
    expect(found).toContain("で");
    // Both declared gears live in the target endpoint; the initial has none.
    expect(marks(render(authored))).toHaveLength(2);
  });

  it("lists the changed gears with a non-color text cue", () => {
    const html = render(authored);
    expect(html).toContain(itCopy.lesson.guided.changed);
    expect(html).toContain("guided-gear-chip");
  });
});

describe("GuidedTransformation (lab endpoints reuse the engine)", () => {
  it("renders both engine-built endpoints and marks each changed ending", () => {
    const html = render(lab);
    const found = marks(html).join("|");
    expect(found).toContain("ます");
    expect(found).toContain("ました");
  });

  it("offers a Lab action carrying the exact lesson explore return", () => {
    const html = render(lab);
    expect(html).toContain('class="action');
    expect(html).toContain("scenario=eat");
    expect(html).toContain("from=%2Fpercorso%2Ftime%2Ftime-past%23explore");
  });
});

/**
 * Assisted katakana first exposure on an authored guided board (design spec
 * §7, §8.3). The `authored` fixture's target endpoint is
 * "actions-1-changed", whose catalog segment carries レストラン with its
 * shared hiragana reading れすとらん, so the guided board must render the
 * same ruby annotation the comparison cards do — this is the same shared
 * `JapaneseSegmentText` renderer, not a duplicated rule.
 */
describe("GuidedTransformation: assisted katakana exposure", () => {
  it("shows レストラン with its ruby hiragana reading on the authored target endpoint", () => {
    const html = render(authored);
    expect(html).toMatch(/<ruby[^>]*>レストラン<rt[^>]*>れすとらん<\/rt><\/ruby>/);
  });

  it("does not invent aid for lab-engine endpoints, which carry no shared reading", () => {
    const html = render(lab);
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
  });
});

/**
 * Semantic romaji rendering (Phase 0 Task 4, master spec §13.2-13.3): the
 * romaji line must render the endpoint's real `AssembledToken`s through the
 * shared `RomajiSequence`, never a local fragment join — so the guided
 * action verb attaches its polite ending ("tabemasu", never "tabe masu")
 * and every gear mark keeps its separator outside the `<mark>`.
 */
describe("GuidedTransformation: semantic romaji rendering", () => {
  it("renders the target endpoint's full romaji sentence as one readable sequence, verb attached", () => {
    // "actions-1-changed" is the real catalog sentence レストランでごはんをたべます
    // — the reading line (romaji, default script "hiragana") must read it
    // back exactly, with the verb stem and its polite ending attached.
    const html = render(authored);
    expect(html).toContain("resutoran de gohan o tabemasu");
    expect(html).not.toContain("tabe masu");
  });

  it("marks the first highlighted gear token with the separator outside the mark", () => {
    const html = renderWithScript(
      { ...authored, changedGearIds: ["レストラン"] },
      "romaji",
    );
    expect(html).toContain(
      '<mark class="guided-board__gear">resutoran</mark> de gohan o tabemasu',
    );
  });

  it("marks a middle highlighted gear token with separators on both sides outside the mark", () => {
    const html = renderWithScript(
      { ...authored, changedGearIds: ["ごはん"] },
      "romaji",
    );
    expect(html).toContain(
      'resutoran de <mark class="guided-board__gear">gohan</mark> o tabemasu',
    );
  });

  it("marks the last highlighted gear token attached, with no injected space", () => {
    const html = renderWithScript(
      { ...authored, changedGearIds: ["ます"] },
      "romaji",
    );
    expect(html).toContain(
      'resutoran de gohan o tabe<mark class="guided-board__gear">masu</mark>',
    );
  });

  it("keeps mixed highlighted and unhighlighted runs readable, each separator outside its mark", () => {
    const html = renderWithScript(
      { ...authored, changedGearIds: ["で", "たべ"] },
      "romaji",
    );
    expect(html).toContain(
      'resutoran <mark class="guided-board__gear">de</mark> gohan o ' +
        '<mark class="guided-board__gear">tabe</mark>masu',
    );
  });

  it("never wraps leading or trailing whitespace inside a highlighted romaji gear", () => {
    for (const changedGearIds of [
      ["レストラン"],
      ["ごはん"],
      ["ます"],
      ["で", "たべ"],
    ]) {
      const html = renderWithScript({ ...authored, changedGearIds }, "romaji");
      for (const content of marks(html)) {
        expect(content).not.toMatch(/^\s|\s$/);
      }
    }
  });

  it("renders the Lab-engine target endpoint's romaji sentence readable too", () => {
    const html = render(lab);
    expect(html).toContain("kyō rāmen o tabemashita");
  });
});
