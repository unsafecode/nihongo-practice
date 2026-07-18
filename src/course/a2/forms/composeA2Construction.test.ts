import { describe, expect, it } from "vitest";
import { A2_CONSTRUCTIONS } from "./a2Constructions";
import { composeA2Construction } from "./composeA2Construction";

/**
 * The A2 construction registry + composer (Phase 3 Task 2, design spec
 * §7.1/§9.2-§9.4/§13). `A2_CONSTRUCTIONS` names all 15 grammar-spiral forms
 * (L2) with the Can-do each serves; `composeA2Construction` conjugates the
 * *correct* plain base (te/negative/past) for a `suffix` construction and
 * appends its fixed tail — proving the class-aware engine from
 * `a2Conjugation.ts` feeds these constructions correctly (e.g. 読む uses the
 * んで te-form, 行く uses the った past exception, 話す uses the して
 * te-form). Clause/connector/plain-inflection constructions are realized by
 * sentence families in a later task and are rejected here.
 */

const EXPECTED_ROWS: Readonly<
  Record<
    string,
    {
      readonly kind: "plain-inflection" | "suffix" | "clause" | "connector";
      readonly canDoId: string;
      readonly base?: "dictionary" | "negative" | "past" | "past-negative" | "te";
    }
  >
> = {
  "recognize-plain-forms": { kind: "plain-inflection", canDoId: "a2-cando-recognize-plain-forms" },
  "sequence-te": { kind: "suffix", canDoId: "a2-cando-sequence-te", base: "te" },
  "ongoing-teiru": { kind: "suffix", canDoId: "a2-cando-ongoing-teiru", base: "te" },
  "request-tekudasai": { kind: "suffix", canDoId: "a2-cando-request-tekudasai", base: "te" },
  "permission-temoii": { kind: "suffix", canDoId: "a2-cando-permission-temoii", base: "te" },
  "prohibition-tewaikenai": { kind: "suffix", canDoId: "a2-cando-prohibition-tewaikenai", base: "te" },
  "request-negative": { kind: "suffix", canDoId: "a2-cando-negative-request", base: "negative" },
  "experience-takoto": { kind: "suffix", canDoId: "a2-cando-experience-takoto", base: "past" },
  "intentions-plans": { kind: "clause", canDoId: "a2-cando-intentions-plans" },
  "reason-kara": { kind: "clause", canDoId: "a2-cando-reason-kara" },
  "reason-node": { kind: "clause", canDoId: "a2-cando-reason-node" },
  "opinion-toomou": { kind: "clause", canDoId: "a2-cando-opinion-toomou" },
  compare: { kind: "clause", canDoId: "a2-cando-compare" },
  possibility: { kind: "clause", canDoId: "a2-cando-possibility" },
  connectors: { kind: "connector", canDoId: "a2-cando-connectors" },
};

describe("A2 construction registry", () => {
  it("registers exactly the 15 spiral forms", () => {
    expect(Object.keys(A2_CONSTRUCTIONS)).toHaveLength(15);
    expect(Object.keys(A2_CONSTRUCTIONS).sort()).toEqual(Object.keys(EXPECTED_ROWS).sort());
  });

  it("declares the exact kind and served Can-do for every construction", () => {
    for (const [id, expected] of Object.entries(EXPECTED_ROWS)) {
      expect(A2_CONSTRUCTIONS[id].id).toBe(id);
      expect(A2_CONSTRUCTIONS[id].kind).toBe(expected.kind);
      expect(A2_CONSTRUCTIONS[id].canDoId).toBe(expected.canDoId);
    }
  });

  it("declares the correct plain base for each suffix construction only", () => {
    for (const [id, expected] of Object.entries(EXPECTED_ROWS)) {
      if (expected.kind === "suffix") {
        expect(A2_CONSTRUCTIONS[id].base).toBe(expected.base);
        expect(A2_CONSTRUCTIONS[id].tail).toBeDefined();
      } else {
        expect(A2_CONSTRUCTIONS[id].base).toBeUndefined();
        expect(A2_CONSTRUCTIONS[id].tail).toBeUndefined();
      }
    }
  });

  it("sequence-te's tail is empty (the bare て-form itself, no extra morpheme)", () => {
    expect(A2_CONSTRUCTIONS["sequence-te"].tail).toEqual([]);
  });
});

describe("composeA2Construction — consumes the correctly conjugated base", () => {
  it("読む + ongoing-teiru → 読んでいます (て base)", () => {
    const r = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("読んでいます");
      expect(r.sentence.reading).toBe("よんでいます");
      expect(r.sentence.romaji).toBe("yondeimasu");
      expect(r.sentence.base).toBe("te");
      expect(r.sentence.canDoId).toBe("a2-cando-ongoing-teiru");
    }
  });

  it("読む + experience-takoto → 読んだことがあります (past base)", () => {
    const r = composeA2Construction({ constructionId: "experience-takoto", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("読んだことがあります");
      expect(r.sentence.romaji).toBe("yondakotogaarimasu");
      expect(r.sentence.base).toBe("past");
    }
  });

  it("行く + experience-takoto uses the 行った exception → 行ったことがあります", () => {
    const r = composeA2Construction({ constructionId: "experience-takoto", senseId: "a2-sense-iku" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("行ったことがあります");
      expect(r.sentence.romaji).toBe("ittakotogaarimasu");
    }
  });

  it("話す + prohibition-tewaikenai → 話してはいけません (て base + はいけません)", () => {
    const r = composeA2Construction({ constructionId: "prohibition-tewaikenai", senseId: "a2-sense-hanasu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("話してはいけません");
      expect(r.sentence.reading).toBe("はなしてはいけません");
      expect(r.sentence.romaji).toBe("hanashitewaikemasen");
    }
  });

  it("食べる + request-negative → 食べないでください (negative base)", () => {
    const r = composeA2Construction({ constructionId: "request-negative", senseId: "a2-sense-taberu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("食べないでください");
      expect(r.sentence.romaji).toBe("tabenaidekudasai");
      expect(r.sentence.base).toBe("negative");
    }
  });

  it("読む + sequence-te → 読んで (て base, empty tail — the bare て-form)", () => {
    const r = composeA2Construction({ constructionId: "sequence-te", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("読んで");
      expect(r.sentence.reading).toBe("よんで");
      expect(r.sentence.romaji).toBe("yonde");
      expect(r.sentence.base).toBe("te");
      expect(r.sentence.fragments.length).toBeGreaterThan(0);
    }
  });

  it("待つ + permission-temoii → 待ってもいいです (て base + も+いい+です)", () => {
    const r = composeA2Construction({ constructionId: "permission-temoii", senseId: "a2-sense-matsu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("待ってもいいです");
      expect(r.sentence.romaji).toBe("mattemoiidesu");
    }
  });

  it("書く + request-tekudasai → 書いてください (て base + ください)", () => {
    const r = composeA2Construction({ constructionId: "request-tekudasai", senseId: "a2-sense-kaku" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("書いてください");
      expect(r.sentence.romaji).toBe("kaitekudasai");
    }
  });

  it("rejects an unknown construction id", () => {
    expect(composeA2Construction({ constructionId: "not-a-real-construction", senseId: "a2-sense-yomu" })).toEqual({
      ok: false,
      error: "unknown-construction",
    });
  });

  it("rejects every non-suffix construction kind (clause, connector, plain-inflection) precisely", () => {
    expect(composeA2Construction({ constructionId: "reason-kara", senseId: "a2-sense-yomu" })).toEqual({
      ok: false,
      error: "not-a-suffix-construction",
    });
    expect(composeA2Construction({ constructionId: "connectors", senseId: "a2-sense-yomu" })).toEqual({
      ok: false,
      error: "not-a-suffix-construction",
    });
    expect(composeA2Construction({ constructionId: "recognize-plain-forms", senseId: "a2-sense-yomu" })).toEqual({
      ok: false,
      error: "not-a-suffix-construction",
    });
  });

  it("rejects an unknown verb for a valid suffix construction", () => {
    expect(composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-nope" })).toEqual({
      ok: false,
      error: "unknown-verb",
    });
  });
});
