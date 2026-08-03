/** @vitest-environment jsdom */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";
import { formatRomaji } from "../../romaji/formatRomaji";
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

function renderDocument(
  locale: "en" | "it",
  script: "hiragana" | "romaji" = "hiragana",
): Document {
  return new DOMParser().parseFromString(render(locale, script), "text/html");
}

function visibleJapaneseText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("rt").forEach((reading) => reading.remove());
  return clone.textContent ?? "";
}

function expectedRomajiMarks(
  row: FoundationLocalizedRow,
): readonly string[] {
  const formatted = formatRomaji(row.tokens);
  if (!formatted.ok) throw new Error(`invalid romaji for ${row.variantId}`);
  const selected = new Set(row.comparisonTokenIds);
  return formatted.runs
    .filter((run) => selected.has(run.tokenId))
    .map((run) => run.text);
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
  it("renders a labelled section, semantic list, metadata, and collapsed authored order", () => {
    const { initialVariantIds } = a1Rows("en");
    const document = renderDocument("en");
    const section = document.querySelector("section.foundation-matrix");
    expect(section).not.toBeNull();
    const titleId = section?.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId ?? "")?.textContent).toBe(
      enCopy.foundation.matrixTitle,
    );

    const list = section?.querySelector("ul.foundation-matrix__rows");
    const items = list?.querySelectorAll(
      ":scope > li.foundation-matrix__row",
    );
    expect(items).toHaveLength(3);
    expect(
      [...(items ?? [])].map((item) => item.getAttribute("data-variant-id")),
    ).toEqual(initialVariantIds);
    expect(section?.querySelectorAll("ol")).toHaveLength(0);
    expect(section?.querySelectorAll("dl.foundation-matrix__meta")).toHaveLength(
      3,
    );
    expect(
      section?.querySelectorAll(".foundation-matrix__meta-pair > dt"),
    ).toHaveLength(6);
    expect(
      section?.querySelectorAll(".foundation-matrix__meta-pair > dd"),
    ).toHaveLength(6);
    expect(section?.querySelectorAll("button[aria-expanded='false']")).toHaveLength(
      1,
    );
  });

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

  it("marks the view-model comparison fragments in order in both hiragana lines", () => {
    const { rows } = a1Rows("en");
    const document = renderDocument("en", "hiragana");
    const renderedRows = document.querySelectorAll(
      ".foundation-matrix__row",
    );

    rows.slice(0, 3).forEach((row, index) => {
      const renderedRow = renderedRows[index];
      const selected = new Set(row.comparisonTokenIds);
      const expectedJapanese = row.tokens
        .filter((token) => selected.has(token.id))
        .map((token) => token.jp);
      const japaneseMarks = [
        ...renderedRow.querySelectorAll(
          ".foundation-matrix__jp mark.foundation-matrix__comparison-token",
        ),
      ].map(visibleJapaneseText);
      const romajiMarks = [
        ...renderedRow.querySelectorAll(
          ".foundation-matrix__romaji mark.foundation-matrix__comparison-token",
        ),
      ].map((mark) => mark.textContent ?? "");

      expect(japaneseMarks).toEqual(expectedJapanese);
      expect(romajiMarks).toEqual(expectedRomajiMarks(row));
      expect(
        renderedRow.querySelectorAll(
          ".foundation-matrix__jp mark, .foundation-matrix__romaji mark",
        ),
      ).toHaveLength(row.comparisonTokenIds.length * 2);
    });
  });

  it("renders romaji-only hierarchy with the same marked runs and intact spacing", () => {
    const { rows } = a1Rows("en");
    const document = renderDocument("en", "romaji");
    const section = document.querySelector("section.foundation-matrix");
    const renderedRows = document.querySelectorAll(
      ".foundation-matrix__row",
    );

    expect(section?.classList.contains("foundation-matrix--romaji")).toBe(true);
    expect(section?.querySelectorAll(".foundation-matrix__jp")).toHaveLength(0);
    expect(section?.querySelectorAll("ul > li")).toHaveLength(3);
    expect(section?.querySelectorAll("dl > div > dt")).toHaveLength(6);
    expect(section?.querySelectorAll("dl > div > dd")).toHaveLength(6);

    rows.slice(0, 3).forEach((row, index) => {
      const renderedRow = renderedRows[index];
      const marks = [
        ...renderedRow.querySelectorAll(
          ".foundation-matrix__romaji mark.foundation-matrix__comparison-token",
        ),
      ].map((mark) => mark.textContent ?? "");
      expect(marks).toEqual(expectedRomajiMarks(row));
      expect(
        renderedRow.querySelector(".foundation-matrix__romaji")?.textContent,
      ).toMatch(/\s/);
    });
  });

  it("never serializes answer text or comparison token IDs into DOM metadata", () => {
    const { rows } = a1Rows("en");
    for (const script of ["hiragana", "romaji"] as const) {
      const document = renderDocument("en", script);
      const attributes = [...document.querySelectorAll("*")].flatMap((element) =>
        [...element.attributes].map((attribute) => ({
          name: attribute.name,
          value: attribute.value,
        })),
      );
      const metadataValues = attributes
        .filter(
          ({ name }) =>
            name.startsWith("data-") ||
            name.startsWith("aria-") ||
            ["title", "value", "name"].includes(name),
        )
        .map(({ value }) => value);

      expect(
        attributes.filter(({ name }) =>
          /(answer|canonical|jp|romaji|comparison|token.?id)/i.test(name),
        ),
      ).toEqual([]);
      expect(
        attributes.filter(({ value }) =>
          /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u.test(value),
        ),
      ).toEqual([]);
      for (const row of rows.slice(0, 3)) {
        for (const token of row.tokens) {
          expect(metadataValues).not.toContain(token.jp);
          expect(metadataValues).not.toContain(token.romaji);
          if (row.comparisonTokenIds.includes(token.id)) {
            expect(
              attributes.some(({ value }) => value === token.id),
            ).toBe(false);
          }
        }
      }
    }
  });
});
