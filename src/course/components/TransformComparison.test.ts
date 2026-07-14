import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import { it as itCopy } from "../i18n/it";
import type { TransformComparisonData } from "../data/types";
import { TransformComparison } from "./TransformComparison";

/**
 * A real ending minimal pair from the course data (たべる -> たべます): the
 * only genuine delta is the ます ending (changed example segment id "1"), so
 * the renderer must mark exactly that one segment and nothing else.
 */
const comparison: TransformComparisonData = {
  id: "cmp-test",
  baseExampleId: "eat-dict",
  changedExampleId: "eat-masu",
  contrastDimension: "ending",
  changedGearIds: ["ます"],
  changedSegmentIds: ["1"],
};

function render(data: TransformComparisonData): string {
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
          createElement(TransformComparison, { comparison: data }),
        ),
      ),
    ),
  );
}

function marks(html: string): string[] {
  return [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map((m) => m[1]);
}

describe("TransformComparison", () => {
  it("renders localized before and after labels", () => {
    const html = render(comparison);
    expect(html).toContain(itCopy.lesson.comparison.before);
    expect(html).toContain(itCopy.lesson.comparison.after);
  });

  it("marks only the declared changed segment, not the unchanged stem", () => {
    const found = marks(render(comparison));
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("ます");
    expect(found[0]).not.toContain("たべ");
  });

  it("names the changed gear and its localized contrast dimension on the delta strip", () => {
    const html = render(comparison);
    expect(html).toContain(itCopy.lesson.comparison.changed);
    expect(html).toContain(itCopy.lesson.comparison.dimensions.ending);
    expect(html).toContain("ます");
  });

  it("renders Japanese with an explicit ja language tag", () => {
    expect(render(comparison)).toContain('lang="ja"');
  });

  it("renders two comparison cards in a single comparison container", () => {
    const html = render(comparison);
    expect(html).toContain("lesson-comparison");
    expect(
      [...html.matchAll(/lesson-comparison__card--/g)],
    ).toHaveLength(2);
  });
});
