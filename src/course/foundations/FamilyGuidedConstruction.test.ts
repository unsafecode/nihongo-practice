import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import {
  buildFoundationLessonViewModel,
  foundationAxisLabel,
} from "./foundationViewModel";
import type {
  FoundationGuidedModel,
  FoundationLocalizedRow,
} from "./foundationViewModel";
import {
  FamilyGuidedConstruction,
  type GuidedAxisLabel,
} from "./FamilyGuidedConstruction";

const SEED = "phase1-foundation-preview-v1";

function guided(locale: "en" | "it" = "en"): FoundationGuidedModel {
  const result = buildFoundationLessonViewModel(
    "fixture-a1-personal-details",
    locale,
    SEED,
  );
  if (!result.ok) throw new Error("expected ok");
  return result.model.guided;
}

function axisLabels(
  model: FoundationGuidedModel,
  locale: "en" | "it",
): readonly GuidedAxisLabel[] {
  return model.activeAxes.map((id) => ({
    id,
    label: foundationAxisLabel(id, locale),
  }));
}

function render(
  locale: "en" | "it",
  overrides: {
    readonly initial?: FoundationLocalizedRow;
    readonly target?: FoundationLocalizedRow;
    readonly changedTokenIds?: readonly string[];
    readonly axes?: readonly GuidedAxisLabel[];
  } = {},
): string {
  const model = guided(locale);
  const copy = (locale === "en" ? enCopy : itCopy).foundation;
  return renderToStaticMarkup(
    createElement(FamilyGuidedConstruction, {
      initial: overrides.initial ?? model.initial,
      target: overrides.target ?? model.target,
      activeAxes: overrides.axes ?? axisLabels(model, locale),
      targetChangedTokenIds:
        overrides.changedTokenIds ?? model.targetChangedTokenIds,
      script: "hiragana",
      copy,
      errorText: "unavailable",
      idBase: "guided-a1",
    }),
  );
}

describe("FamilyGuidedConstruction valid same-family board", () => {
  it("renders the guided title, initial and target labels", () => {
    const html = render("en");
    expect(html).toMatch(/<h[1-6][^>]*>[^<]*Guided/);
    expect(html).toContain(enCopy.foundation.initialLabel);
    expect(html).toContain(enCopy.foundation.targetLabel);
  });

  it("lists every active axis as text (not colour alone)", () => {
    const model = guided("en");
    const html = render("en");
    expect(model.activeAxes.length).toBeGreaterThan(0);
    for (const axis of model.activeAxes) {
      expect(html).toContain(foundationAxisLabel(axis, "en"));
    }
    expect(html).toContain(enCopy.foundation.activeAxesLabel);
  });

  it("marks exactly the honestly-changed target tokens in the romaji", () => {
    const model = guided("en");
    const html = render("en");
    // Each changed token id becomes a <mark> in the target romaji sequence.
    const marks = html.match(/<mark[^>]*>/g) ?? [];
    // Japanese changed tokens + romaji changed tokens => two marks per token.
    expect(marks.length).toBe(model.targetChangedTokenIds.length * 2);
  });

  it("never places whitespace inside a <mark> boundary", () => {
    const html = render("en");
    expect(html).not.toMatch(/<mark[^>]*>\s/);
    expect(html).not.toMatch(/\s<\/mark>/);
  });

  it("carries the family id for review but no answer/JP data attributes", () => {
    const model = guided("en");
    const html = render("en");
    expect(html).toContain(`data-family-id="${model.familyId}"`);
    expect(html).not.toMatch(/data-answer/);
    expect(html).not.toMatch(/data-canonical/);
  });
});

describe("FamilyGuidedConstruction invalid inputs", () => {
  it("shows a single notice and no board when families differ", () => {
    const model = guided("en");
    const foreign: FoundationLocalizedRow = {
      ...model.target,
      familyId: "some-other-family",
    };
    const html = render("en", { target: foreign });
    expect(html).toContain(enCopy.foundation.unavailableTitle);
    expect(html).not.toContain(enCopy.foundation.initialLabel);
    expect(html).not.toContain(enCopy.foundation.activeAxesLabel);
  });

  it("shows a notice when no semantic axis changes", () => {
    const html = render("en", { axes: [], changedTokenIds: [] });
    expect(html).toContain(enCopy.foundation.unavailableTitle);
    expect(html).not.toContain(enCopy.foundation.targetLabel);
  });
});
