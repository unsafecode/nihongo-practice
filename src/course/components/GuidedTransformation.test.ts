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
  id: "exp-actions-object",
  objectiveId: "actions-object",
  initialSelection: { exampleId: "eat-masu", segmentIds: [] },
  targetSelection: { exampleId: "eat-ramen", segmentIds: ["0", "1"] },
  changedGearIds: ["ラーメン", "を"],
  returnTarget: {
    pathname: lessonPath("actions", "actions-object"),
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
    expect(html).toContain("ラーメン");
  });

  it("marks the introduced gears on the target endpoint only", () => {
    const found = marks(render(authored)).join("|");
    expect(found).toContain("ラーメン");
    expect(found).toContain("を");
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
