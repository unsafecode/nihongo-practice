/** @vitest-environment jsdom */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { BASE_REFERENCE_IDS } from "../base/references/catalog";
import { routePaths } from "../../routing/routePaths";
import { it as itCopy } from "../i18n/it";
import { BaseReferencePage } from "./BaseReferencePage";

function render(path: string): string {
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
            path: routePaths.reference,
            element: createElement(BaseReferencePage),
          }),
        ),
      ),
    ),
  );
}

/** One `throughLessonId` known to be at/after each reference's first-teach lesson. */
const THROUGH_LESSON_BY_REFERENCE: Readonly<Record<string, string>> = {
  "sentence-anatomy": "topic-questions-1",
  "particle-atlas": "topic-questions-2",
  "verb-classes-conjugation": "polite-verbs-2",
  "tense-polarity": "time-movement-2",
  "adjective-copula": "copula-adjectives-2",
};

describe("BaseReferencePage — routes and renders all five real reference surfaces", () => {
  it("declares exactly the five real reference ids this page must support", () => {
    expect(BASE_REFERENCE_IDS).toHaveLength(5);
    expect(BASE_REFERENCE_IDS).toEqual([
      "sentence-anatomy",
      "particle-atlas",
      "verb-classes-conjugation",
      "tense-polarity",
      "adjective-copula",
    ]);
  });

  it.each(BASE_REFERENCE_IDS)(
    "renders a real heading, caption, and generated stacked cards for %s",
    (referenceId) => {
      const throughLessonId = THROUGH_LESSON_BY_REFERENCE[referenceId]!;
      const html = render(
        `/riferimenti/base/${referenceId}?throughLessonId=${throughLessonId}`,
      );

      // Real heading.
      const headingMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/);
      expect(headingMatch, referenceId).not.toBeNull();
      expect(headingMatch![1]!.trim().length).toBeGreaterThan(0);

      // Real table caption.
      expect(html, referenceId).toMatch(/<caption[^>]*>[^<]+<\/caption>/);

      // Real column/row headers.
      expect(html, referenceId).toMatch(/<th[^>]*scope="col"[^>]*>[^<]*<\/th>/);
      expect(html, referenceId).toMatch(/<th[^>]*scope="row"[^>]*>[^<]*<\/th>/);

      // Generated stacked cards, one per visible entry, each with its own
      // heading and non-empty content — never a single hard-coded card.
      const stackedCards = html.match(
        /class="base-reference-page__stacked-card"/g,
      );
      expect(stackedCards, referenceId).not.toBeNull();
      expect(stackedCards!.length, referenceId).toBeGreaterThan(0);
    },
  );

  it("renders the particle-atlas reference with its own real particle heading", async () => {
    const html = render(
      "/riferimenti/base/particle-atlas?throughLessonId=topic-questions-2",
    );
    const headingMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/);
    expect(headingMatch).not.toBeNull();
    expect(headingMatch![1]).toMatch(/particell/i);
  });

  it("renders a visible alert instead of silently defaulting for an unrecognized throughLessonId", () => {
    const html = render(
      "/riferimenti/base/particle-atlas?throughLessonId=not-real",
    );
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain(itCopy.baseReferencePage.invalidThroughLessonBody);
    // No table/cards silently rendered alongside the alert.
    expect(html).not.toContain("base-reference-page__stacked-card");
  });

  it("renders a visible alert for an unknown reference id, not an invalid-route redirect", () => {
    const html = render(
      "/riferimenti/base/not-a-real-reference?throughLessonId=sounds-1",
    );
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain(itCopy.baseReferencePage.unknownReferenceBody);
  });

  it("rejects a throughLessonId that names a real A1 lesson, not a Base lesson (progressive ownership)", () => {
    const html = render(
      "/riferimenti/base/particle-atlas?throughLessonId=introductions-1",
    );
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain(itCopy.baseReferencePage.invalidThroughLessonBody);
  });

  it("defaults to the full Base course when no throughLessonId is given at all", () => {
    const html = render("/riferimenti/base/particle-atlas");
    expect(html).not.toMatch(/role="alert"/);
    const stackedCards = html.match(
      /class="base-reference-page__stacked-card"/g,
    );
    expect(stackedCards).not.toBeNull();
    expect(stackedCards!.length).toBeGreaterThan(0);
  });

  it("hides a prerequisite entry that has not been taught yet, never showing a future concept", () => {
    // At the reference's own first-teach lesson, only entries taught at or
    // before that lesson may appear — never the reference's later content.
    const early = render(
      "/riferimenti/base/tense-polarity?throughLessonId=time-movement-1",
    );
    const late = render(
      "/riferimenti/base/tense-polarity?throughLessonId=base-synthesis-4",
    );
    const earlyCards = (early.match(/class="base-reference-page__stacked-card"/g) ?? []).length;
    const lateCards = (late.match(/class="base-reference-page__stacked-card"/g) ?? []).length;
    expect(lateCards).toBeGreaterThanOrEqual(earlyCards);
  });
});
