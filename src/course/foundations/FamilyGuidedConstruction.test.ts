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
    readonly script?: "hiragana" | "romaji";
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
      script: overrides.script ?? "hiragana",
      copy,
      errorText: "unavailable",
      idBase: "guided-a1",
    }),
  );
}

/**
 * Returns a copy of `row` with one token's `reading` field set, leaving every
 * other field (and every other token) untouched. Used only to exercise the
 * shared `JapaneseSegmentText` katakana-assist contract through
 * `FamilyGuidedConstruction`'s own row renderer — the live A1 catalog has no
 * reading-bearing tokens yet (Phase 2 §M2), so this synthetically augments a
 * Phase 1 fixture row rather than inventing A1 furigana.
 */
function withTokenReading(
  row: FoundationLocalizedRow,
  tokenId: string,
  reading: string,
): FoundationLocalizedRow {
  return {
    ...row,
    tokens: row.tokens.map((token) =>
      token.id === tokenId ? { ...token, reading } : token,
    ),
  };
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

/**
 * Locks `FamilyGuidedConstruction`'s row renderer's use of the shared
 * `JapaneseSegmentText` katakana-assist contract (design spec §7, §8.3) ahead
 * of A2, which is expected to introduce the level's first reading-bearing
 * tokens. The live A1 catalog carries no `reading` tokens today, so these
 * cases synthetically augment a Phase 1 fixture row via `withTokenReading`
 * rather than inventing A1 furigana.
 */
describe("FamilyGuidedConstruction – ruby/rt reading assistance (Phase 2 M2)", () => {
  it("wraps a changed token's reading in a semantic <ruby><rt> nested inside its changed <mark>", () => {
    const model = guided("en");
    const changedTokenId = model.targetChangedTokenIds[0];
    const target = withTokenReading(model.target, changedTokenId, "イシャ");
    const html = render("en", { target });
    expect(html).toContain(
      `<mark class="foundation-guided__changed"><ruby class="katakana-assist">${model.target.tokens.find((t) => t.id === changedTokenId)!.jp}<rt class="katakana-assist__reading">イシャ</rt></ruby></mark>`,
    );
  });

  it("renders an unchanged token's reading as a bare <ruby><rt> with no extra changed mark", () => {
    const model = guided("en");
    const unchangedToken = model.target.tokens.find(
      (token) => !model.targetChangedTokenIds.includes(token.id),
    );
    expect(unchangedToken).toBeDefined();
    const target = withTokenReading(model.target, unchangedToken!.id, "デス");
    const html = render("en", { target });
    expect(html).toContain(
      `<ruby class="katakana-assist">${unchangedToken!.jp}<rt class="katakana-assist__reading">デス</rt></ruby>`,
    );
    // No new <mark> was introduced for the unchanged, reading-bearing token.
    const marks = html.match(/<mark[^>]*>/g) ?? [];
    expect(marks.length).toBe(model.targetChangedTokenIds.length * 2);
  });

  it("keeps the initial row's matching token plain when only the target carries a reading", () => {
    const model = guided("en");
    const changedTokenId = model.targetChangedTokenIds[0];
    const target = withTokenReading(model.target, changedTokenId, "イシャ");
    const html = render("en", { target });
    // The initial row's own token (same family, unaugmented) never gained a
    // reading: JapaneseSegmentText is applied per-row from each row's own
    // token data, never copied across rows.
    const initialJp = model.initial.tokens.map((t) => t.jp).join("");
    expect(html).not.toContain(`>${initialJp}<rt`);
  });

  it("never renders ruby/rt markup at all when the reveal script is romaji-only", () => {
    const model = guided("en");
    const changedTokenId = model.targetChangedTokenIds[0];
    const target = withTokenReading(model.target, changedTokenId, "イシャ");
    const html = render("en", { target, script: "romaji" });
    expect(html).not.toContain("<ruby");
    expect(html).not.toContain("<rt");
    expect(html).not.toContain("foundation-guided__jp");
  });
});
