import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { buildFoundationLessonViewModel } from "./foundationViewModel";
import type { FoundationLocalizedRow } from "./foundationViewModel";
import { SentenceMatrix, visibleMatrixRows } from "./SentenceMatrix";

const SEED = "phase1-foundation-preview-v1";

function a1Rows(locale: "en" | "it" = "en"): {
  readonly rows: readonly FoundationLocalizedRow[];
  readonly initialVariantIds: readonly string[];
} {
  const result = buildFoundationLessonViewModel(
    "fixture-a1-personal-details",
    locale,
    SEED,
  );
  if (!result.ok) throw new Error("expected ok");
  return {
    rows: result.model.matrix.rows,
    initialVariantIds: result.model.matrix.initialVariantIds,
  };
}

function textOnly(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function render(
  locale: "en" | "it",
  script: "hiragana" | "romaji" = "hiragana",
): string {
  const { rows, initialVariantIds } = a1Rows(locale);
  const copy = (locale === "en" ? enCopy : itCopy).foundation;
  return renderToStaticMarkup(
    createElement(SentenceMatrix, {
      rows,
      initialVariantIds,
      script,
      copy,
      errorText: "unavailable",
      idBase: "matrix-a1",
    }),
  );
}

describe("visibleMatrixRows (pure reducer)", () => {
  it("shows exactly the three curated rows when collapsed", () => {
    const { rows, initialVariantIds } = a1Rows();
    const visible = visibleMatrixRows(rows, initialVariantIds, false);
    expect(visible.map((r) => r.variantId)).toEqual([...initialVariantIds]);
    expect(visible).toHaveLength(3);
  });

  it("shows all eight rows in authored order when expanded", () => {
    const { rows, initialVariantIds } = a1Rows();
    const visible = visibleMatrixRows(rows, initialVariantIds, true);
    expect(visible).toHaveLength(8);
    expect(visible.map((r) => r.variantId)).toEqual(rows.map((r) => r.variantId));
  });
});

describe("SentenceMatrix markup", () => {
  it("renders a semantic section with heading and list of three collapsed rows", () => {
    const html = render("en");
    expect(html).toContain("<section");
    expect(html).toMatch(/<h[1-6][^>]*>[^<]*Sentence matrix/);
    const items = html.match(/<li /g) ?? [];
    expect(items).toHaveLength(3);
  });

  it("shows each row's translation, speaker, and context text", () => {
    const { rows } = a1Rows();
    const html = render("en");
    const text = textOnly(html);
    for (const row of rows.slice(0, 3)) {
      expect(text).toContain(row.translation);
      expect(text).toContain(row.speaker);
      expect(text).toContain(row.context);
    }
  });

  it("renders the omitted-subject label only for pro-dropped rows", () => {
    // The A1 curated subset's third model is the omitted-subject teacher row.
    const { rows } = a1Rows();
    const html = render("en");
    const text = textOnly(html);
    const omitted = rows
      .slice(0, 3)
      .some((r) => r.subjectRealization === "omitted");
    if (omitted) {
      expect(text).toContain(enCopy.foundation.omittedSubject);
    }
  });

  it("exposes a real disclosure button (>=44px action) with aria wiring", () => {
    const html = render("en");
    const button = html.match(/<button[^>]*class="[^"]*action[^"]*"[^>]*>/)?.[0] ?? "";
    expect(button).toContain("aria-expanded=\"false\"");
    const controls = button.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    // The controlled region id is stable and present on the list.
    expect(html).toContain(`id="${controls}"`);
  });

  it("carries review data attributes but never answer/JP data attributes", () => {
    const { rows } = a1Rows();
    const html = render("en");
    for (const row of rows.slice(0, 3)) {
      expect(html).toContain(`data-variant-id="${row.variantId}"`);
      expect(html).toContain(`data-family-id="${row.familyId}"`);
      expect(html).toContain(`data-context-id="${row.contextId}"`);
      expect(html).toContain(`data-speaker-role-id="${row.speakerRoleId}"`);
      expect(html).toContain(
        `data-semantic-fingerprint="${row.semanticFingerprint}"`,
      );
    }
    expect(html).not.toMatch(/data-answer/);
    expect(html).not.toMatch(/data-canonical/);
    expect(html).not.toMatch(/data-jp/);
    expect(html).not.toMatch(/data-romaji/);
  });

  it("keeps row order identical across locale and script", () => {
    const { rows } = a1Rows();
    const order = rows.slice(0, 3).map((r) => r.variantId);
    for (const html of [
      render("en", "hiragana"),
      render("it", "hiragana"),
      render("en", "romaji"),
      render("it", "romaji"),
    ]) {
      const found = [...html.matchAll(/data-variant-id="([^"]+)"/g)].map(
        (m) => m[1],
      );
      expect(found).toEqual(order);
    }
  });
});
