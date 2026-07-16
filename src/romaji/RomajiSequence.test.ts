import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RomajiSequence } from "./RomajiSequence";
import type { AssembledToken, RomajiTokenKind, TokenSourceRef } from "./types";

function source(
  domain: TokenSourceRef["domain"],
  referenceId: string,
): TokenSourceRef {
  return { domain, referenceId };
}

function token(
  id: string,
  jp: string,
  romaji: string,
  kind: RomajiTokenKind,
  boundaryBefore: "space" | "attach",
): AssembledToken {
  return { id, jp, romaji, kind, boundaryBefore, source: source("test", id) };
}

function renderSequence(
  tokens: readonly AssembledToken[],
  options: {
    readonly highlightedTokenIds?: readonly string[];
    readonly highlightClassName?: string;
    readonly errorText?: string;
    readonly renderToken?: (token: AssembledToken) => ReactNode;
  } = {},
): string {
  return renderToStaticMarkup(
    createElement(RomajiSequence, {
      tokens,
      highlightedTokenIds: options.highlightedTokenIds,
      highlightClassName: options.highlightClassName,
      errorText:
        options.errorText ?? "This Japanese example could not be displayed.",
      renderToken: options.renderToken,
    }),
  );
}

function renderSequenceInsideSpan(
  tokens: readonly AssembledToken[],
  options: Parameters<typeof renderSequence>[1] = {},
): string {
  return renderToStaticMarkup(
    createElement(
      "span",
      null,
      createElement(RomajiSequence, {
        tokens,
        highlightedTokenIds: options.highlightedTokenIds,
        highlightClassName: options.highlightClassName,
        errorText:
          options.errorText ?? "This Japanese example could not be displayed.",
        renderToken: options.renderToken,
      }),
    ),
  );
}

function markContents(html: string): string[] {
  return [...html.matchAll(/<mark[^>]*>([\s\S]*?)<\/mark>/g)].map(
    (match) => match[1],
  );
}

describe("RomajiSequence", () => {
  it("renders separators outside highlighted wrappers at the first, middle, and last boundaries", () => {
    const tokens = [
      token("w1", "これ", "kore", "lexical", "attach"),
      token("p1", "は", "wa", "particle", "space"),
      token("w2", "コーヒー", "koohii", "lexical", "space"),
    ] as const;

    const first = renderSequence(tokens, {
      highlightedTokenIds: ["w1"],
      highlightClassName: "hl",
    });
    const middle = renderSequence(tokens, {
      highlightedTokenIds: ["p1"],
      highlightClassName: "hl",
    });
    const last = renderSequence(tokens, {
      highlightedTokenIds: ["w2"],
      highlightClassName: "hl",
    });

    expect(first).toBe('<mark class="hl">kore</mark> wa koohii');
    expect(middle).toBe('kore <mark class="hl">wa</mark> koohii');
    expect(last).toBe('kore wa <mark class="hl">koohii</mark>');

    for (const html of [first, middle, last]) {
      expect(markContents(html)).toSatisfy((contents: string[]) =>
        contents.every((content) => !/^\s|\s$/.test(content)),
      );
    }
  });

  it("keeps mixed highlighted and unhighlighted runs readable", () => {
    const html = renderSequence(
      [
        token("w1", "これ", "kore", "lexical", "attach"),
        token("p1", "は", "wa", "particle", "space"),
        token("w2", "コーヒー", "koohii", "lexical", "space"),
        token("m1", "です", "desu", "morpheme", "space"),
        token("p2", "か", "ka", "particle", "space"),
      ],
      {
        highlightedTokenIds: ["p1", "m1"],
        highlightClassName: "hl",
      },
    );

    expect(html).toBe(
      'kore <mark class="hl">wa</mark> koohii <mark class="hl">desu</mark> ka',
    );
    expect(markContents(html)).toSatisfy((contents: string[]) =>
      contents.every((content) => !/^\s|\s$/.test(content)),
    );
  });

  it("keeps morphology and punctuation attached when highlighted", () => {
    const morphology = renderSequence(
      [
        token("w1", "たべ", "tabe", "lexical", "attach"),
        token("m1", "ます", "masu", "morpheme", "attach"),
      ],
      {
        highlightedTokenIds: ["m1"],
        highlightClassName: "hl",
      },
    );

    const punctuation = renderSequence(
      [
        token("w1", "ゆき", "yuki", "lexical", "attach"),
        token("p1", "は", "wa", "particle", "space"),
        token("w2", "いき", "iki", "lexical", "space"),
        token("m1", "ます", "masu", "morpheme", "attach"),
        token("x1", "。", ".", "punctuation", "attach"),
      ],
      {
        highlightedTokenIds: ["x1"],
        highlightClassName: "hl",
      },
    );

    expect(morphology).toBe('tabe<mark class="hl">masu</mark>');
    expect(punctuation).toBe('yuki wa ikimasu<mark class="hl">.</mark>');

    for (const html of [morphology, punctuation]) {
      expect(markContents(html)).toSatisfy((contents: string[]) =>
        contents.every((content) => !/^\s|\s$/.test(content)),
      );
    }
  });

  it("renders an isolated single token without a leading separator", () => {
    expect(
      renderSequence(
        [token("solo", "へ", "e", "particle", "attach")],
        {
          highlightedTokenIds: ["solo"],
          highlightClassName: "hl",
        },
      ),
    ).toBe('<mark class="hl">e</mark>');
  });

  it("supports custom token rendering while keeping separators and highlights outside wrappers", () => {
    const html = renderSequence(
      [
        token("w1", "これ", "kore", "lexical", "attach"),
        token("p1", "は", "wa", "particle", "space"),
        token("w2", "コーヒー", "koohii", "lexical", "space"),
      ],
      {
        highlightedTokenIds: ["p1"],
        highlightClassName: "hl",
        renderToken: (sequenceToken) =>
          createElement("span", { "data-jp": sequenceToken.jp }, sequenceToken.jp),
      },
    );

    expect(html).toBe(
      '<span data-jp="これ">これ</span> <mark class="hl"><span data-jp="は">は</span></mark> <span data-jp="コーヒー">コーヒー</span>',
    );
  });

  it("shows only the localized alert when the first boundary is invalid", () => {
    const html = renderSequence(
      [
        token("bad", "は", "wa", "particle", "space"),
        token("w2", "コーヒー", "koohii", "lexical", "space"),
      ],
      { errorText: "Localized content error." },
    );
    const wrappedHtml = renderSequenceInsideSpan(
      [
        token("bad", "は", "wa", "particle", "space"),
        token("w2", "コーヒー", "koohii", "lexical", "space"),
      ],
      { errorText: "Localized content error." },
    );

    expect(html).toContain('<span role="alert">');
    expect(html).not.toContain("<p role=\"alert\">");
    expect(html).toContain("Localized content error.");
    expect(html).not.toContain("wa");
    expect(html).not.toContain("koohii");
    expect(html).not.toContain("<mark");
    expect(wrappedHtml).toBe(
      '<span><span role="alert">Localized content error.</span></span>',
    );
  });

  it("shows only the localized alert when any token has empty romaji", () => {
    const html = renderSequence(
      [
        token("w1", "これ", "kore", "lexical", "attach"),
        token("bad", "です", "", "morpheme", "attach"),
      ],
      {
        errorText: "Localized content error.",
        highlightedTokenIds: ["w1"],
        renderToken: (sequenceToken) =>
          createElement("span", { "data-jp": sequenceToken.jp }, sequenceToken.jp),
      },
    );
    const wrappedHtml = renderSequenceInsideSpan(
      [
        token("w1", "これ", "kore", "lexical", "attach"),
        token("bad", "です", "", "morpheme", "attach"),
      ],
      {
        errorText: "Localized content error.",
        highlightedTokenIds: ["w1"],
        renderToken: (sequenceToken) =>
          createElement("span", { "data-jp": sequenceToken.jp }, sequenceToken.jp),
      },
    );

    expect(html).toContain('<span role="alert">');
    expect(html).not.toContain("<p role=\"alert\">");
    expect(html).toContain("Localized content error.");
    expect(html).not.toContain("kore");
    expect(html).not.toContain("これ");
    expect(html).not.toContain("<mark");
    expect(wrappedHtml).toBe(
      '<span><span role="alert">Localized content error.</span></span>',
    );
  });
});
