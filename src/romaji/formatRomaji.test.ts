import { describe, expect, it } from "vitest";

import {
  boundaryBefore,
  formatRomaji,
} from "./formatRomaji";
import type { AssembledToken, RomajiTokenKind, TokenSourceRef } from "./types";

function source(domain: TokenSourceRef["domain"], referenceId: string): TokenSourceRef {
  return { domain, referenceId };
}

function token(
  id: string,
  jp: string,
  romaji: string,
  kind: RomajiTokenKind,
  boundaryBeforeValue: "space" | "attach",
  sourceRef: TokenSourceRef,
): AssembledToken {
  return { id, jp, romaji, kind, boundaryBefore: boundaryBeforeValue, source: sourceRef };
}

describe("boundaryBefore", () => {
  it("derives semantic defaults and respects explicit overrides", () => {
    expect(boundaryBefore("lexical", 0)).toBe("attach");
    expect(boundaryBefore("particle", 3)).toBe("space");
    expect(boundaryBefore("morpheme", 3)).toBe("attach");
    expect(boundaryBefore("punctuation", 3)).toBe("attach");
    expect(boundaryBefore("particle", 3, "attach")).toBe("attach");
  });
});

describe("formatRomaji", () => {
  it("formats the regression matrix with semantic boundaries", () => {
    expect(
      formatRomaji([
        token("t1", "これ", "kore", "lexical", "attach", source("catalog", "t1")),
        token("t2", "は", "wa", "particle", "space", source("catalog", "t2")),
        token("t3", "コーヒー", "koohii", "lexical", "space", source("catalog", "t3")),
        token("t4", "です", "desu", "morpheme", "space", source("catalog", "t4")),
        token("t5", "か", "ka", "particle", "space", source("catalog", "t5")),
      ]),
    ).toEqual({
      ok: true,
      text: "kore wa koohii desu ka",
      runs: [
        { tokenId: "t1", separatorBefore: "", text: "kore" },
        { tokenId: "t2", separatorBefore: " ", text: "wa" },
        { tokenId: "t3", separatorBefore: " ", text: "koohii" },
        { tokenId: "t4", separatorBefore: " ", text: "desu" },
        { tokenId: "t5", separatorBefore: " ", text: "ka" },
      ],
    });

    expect(
      formatRomaji([
        token("t6", "たべ", "tabe", "lexical", "attach", source("catalog", "t6")),
        token("t7", "ます", "masu", "morpheme", "attach", source("catalog", "t7")),
      ]),
    ).toEqual({
      ok: true,
      text: "tabemasu",
      runs: [
        { tokenId: "t6", separatorBefore: "", text: "tabe" },
        { tokenId: "t7", separatorBefore: "", text: "masu" },
      ],
    });

    expect(
      formatRomaji([
        token("t8", "ゆき", "yuki", "lexical", "attach", source("catalog", "t8")),
        token("t9", "は", "wa", "particle", "space", source("catalog", "t9")),
        token("t10", "いき", "iki", "lexical", "space", source("catalog", "t10")),
        token("t11", "ます", "masu", "morpheme", "attach", source("catalog", "t11")),
        token("t12", "。", ".", "punctuation", "attach", source("catalog", "t12")),
      ]),
    ).toEqual({
      ok: true,
      text: "yuki wa ikimasu.",
      runs: [
        { tokenId: "t8", separatorBefore: "", text: "yuki" },
        { tokenId: "t9", separatorBefore: " ", text: "wa" },
        { tokenId: "t10", separatorBefore: " ", text: "iki" },
        { tokenId: "t11", separatorBefore: "", text: "masu" },
        { tokenId: "t12", separatorBefore: "", text: "." },
      ],
    });
  });

  it("supports particle readings and rejects invalid content", () => {
    expect(
      formatRomaji([
        token("t13", "へ", "e", "particle", "attach", source("catalog", "t13")),
      ]),
    ).toEqual({
      ok: true,
      text: "e",
      runs: [{ tokenId: "t13", separatorBefore: "", text: "e" }],
    });

    expect(
      formatRomaji([
        token("t14", "コーヒー", "koohii", "lexical", "attach", source("catalog", "t14")),
      ]),
    ).toEqual({
      ok: true,
      text: "koohii",
      runs: [{ tokenId: "t14", separatorBefore: "", text: "koohii" }],
    });

    expect(
      formatRomaji([
        token("t15", "empty", "", "lexical", "attach", source("catalog", "t15")),
      ]),
    ).toEqual({
      ok: false,
      errors: [{ code: "empty-romaji", tokenId: "t15" }],
    });
  });

  it("formats family-sourced tokens with the same semantic spacing as any other domain", () => {
    const familySequence = formatRomaji([
      token("t19", "ゆき", "yuki", "lexical", "attach", source("family", "fixture-a1-value-yuki")),
      token("t20", "は", "wa", "particle", "space", source("family", "fixture-a1-slot-subject")),
      token("t21", "がくせい", "gakusei", "lexical", "space", source("family", "fixture-a1-value-student")),
      token("t22", "です", "desu", "morpheme", "space", source("family", "fixture-a1-value-be")),
      token("t23", "。", ".", "punctuation", "attach", source("family", "fixture-a1-punctuation")),
    ]);

    const catalogSequence = formatRomaji([
      token("t19b", "ゆき", "yuki", "lexical", "attach", source("catalog", "t19b")),
      token("t20b", "は", "wa", "particle", "space", source("catalog", "t20b")),
      token("t21b", "がくせい", "gakusei", "lexical", "space", source("catalog", "t21b")),
      token("t22b", "です", "desu", "morpheme", "space", source("catalog", "t22b")),
      token("t23b", "。", ".", "punctuation", "attach", source("catalog", "t23b")),
    ]);

    expect(familySequence).toEqual({
      ok: true,
      text: "yuki wa gakusei desu.",
      runs: [
        { tokenId: "t19", separatorBefore: "", text: "yuki" },
        { tokenId: "t20", separatorBefore: " ", text: "wa" },
        { tokenId: "t21", separatorBefore: " ", text: "gakusei" },
        { tokenId: "t22", separatorBefore: " ", text: "desu" },
        { tokenId: "t23", separatorBefore: "", text: "." },
      ],
    });

    // The domain a token was sourced from (family vs. catalog) must never
    // change the assembled spacing — only kind/boundaryBefore may.
    expect(familySequence.ok && catalogSequence.ok
      ? familySequence.text === catalogSequence.text
      : false).toBe(true);
  });

  it("reports boundary and reference validation errors in token order", () => {
    expect(
      formatRomaji([
        token("t16", "は", "wa", "particle", "space", source("catalog", "t16")),
      ]),
    ).toEqual({
      ok: false,
      errors: [{ code: "invalid-first-boundary", tokenId: "t16" }],
    });

    expect(
      formatRomaji([
        token("t17a", "ゆき", "yuki", "lexical", "attach", source("catalog", "t17a")),
        token("t17", "。", ".", "punctuation", "space", source("catalog", "t17")),
      ]),
    ).toEqual({
      ok: false,
      errors: [{ code: "illegal-punctuation-spacing", tokenId: "t17" }],
    });

    expect(
      formatRomaji([
        token("t18", "は", "wa", "particle", "attach", source("catalog", "")),
      ]),
    ).toEqual({
      ok: false,
      errors: [{ code: "unresolved-token", tokenId: "t18" }],
    });
  });

  it("rejects duplicate token ids and empty sequences", () => {
    expect(
      formatRomaji([
        token("dup", "これ", "kore", "lexical", "attach", source("catalog", "dup")),
        token("dup", "は", "wa", "particle", "space", source("catalog", "dup-2")),
      ]),
    ).toEqual({
      ok: false,
      errors: [{ code: "duplicate-token-id", tokenId: "dup" }],
    });

    expect(formatRomaji([])).toEqual({
      ok: false,
      errors: [{ code: "empty-sequence" }],
    });
  });
});
