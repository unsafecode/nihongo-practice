import { describe, expect, it } from "vitest";
import { normalizeAnswer } from "./normalizeAnswer";
import { generateExercise, evaluateExercise } from "./engine";
import type {
  ChoiceExerciseDefinition,
  CompletionExerciseDefinition,
  ConstrainedConstructionExerciseDefinition,
  ExerciseCatalogsInput,
  ExerciseDefinition,
  TileOrderingExerciseDefinition,
  TransformationExerciseDefinition,
} from "./types";

/**
 * Focused fixture catalogs (Slice C plan Task 1). These are small hand-built
 * concept/lexeme/example catalogs — the full 40-lesson exercise catalog is
 * authored in Task 2. Every canonical answer lives here once, as ordered kana
 * segments, exactly like the shared curriculum example catalog. Exercise
 * definitions reference this data by ID and never re-store a Japanese literal.
 */

type Kind = "word" | "particle" | "ending";

function segments(...raw: readonly (readonly [string, Kind])[]) {
  const counters: Record<Kind, number> = { word: 0, particle: 0, ending: 0 };
  const abbrev: Record<Kind, string> = { word: "w", particle: "p", ending: "e" };
  return raw.map(([jp, kind]) => {
    counters[kind] += 1;
    return { id: `${abbrev[kind]}${counters[kind]}`, jp, kind };
  });
}

function example(
  id: string,
  raw: readonly (readonly [string, Kind])[],
  lexemeIds: readonly string[],
  conceptIds: readonly string[],
) {
  const segs = segments(...raw);
  return {
    id,
    jp: segs.map((s) => s.jp).join(""),
    segments: segs,
    lexemeIds,
    conceptIds,
  };
}

const catalogs: ExerciseCatalogsInput = {
  concepts: [
    { id: "sentence-order" },
    { id: "topic-wa" },
    { id: "copula-desu" },
    { id: "object-o" },
    { id: "polite-masu" },
    { id: "negative-masen" },
  ],
  lexemes: [
    { id: "i" },
    { id: "student" },
    { id: "japanese-language" },
    { id: "study" },
    { id: "eat" },
    { id: "every-day" },
  ],
  examples: [
    example(
      "intro-base",
      [
        ["わたし", "word"],
        ["は", "particle"],
        ["がくせい", "word"],
        ["です", "ending"],
      ],
      ["i", "student"],
      ["sentence-order", "topic-wa", "copula-desu"],
    ),
    example(
      "study-base",
      [
        ["にほんご", "word"],
        ["を", "particle"],
        ["べんきょうし", "word"],
        ["ます", "ending"],
      ],
      ["japanese-language", "study"],
      ["object-o", "polite-masu"],
    ),
    example("p-ga", [["ほん", "word"], ["が", "particle"], ["あり", "word"], ["ます", "ending"]], [], []),
    example("p-wa2", [["きみ", "word"], ["は", "particle"]], [], []),
    example("trans-affirm", [["たべ", "word"], ["ます", "ending"]], ["eat"], ["polite-masu"]),
    example("trans-negative", [["たべ", "word"], ["ません", "ending"]], ["eat"], ["negative-masen"]),
    example(
      "wo-tile",
      [
        ["まいにち", "word"],
        ["にほんご", "word"],
        ["を", "particle"],
        ["べんきょうし", "word"],
        ["ます", "ending"],
      ],
      ["every-day", "japanese-language", "study"],
      ["object-o", "polite-masu"],
    ),
    example("kata-coffee", [["コーヒー", "word"]], [], []),
  ],
};

const tileOrdering: TileOrderingExerciseDefinition = {
  id: "ex-tile",
  kind: "tile-ordering",
  promptCopyId: "copy.tile.intro",
  targetExampleId: "intro-base",
  assessedConceptIds: ["sentence-order"],
  assessedLexemeIds: ["i", "student"],
};

const choice: ChoiceExerciseDefinition = {
  id: "ex-choice",
  kind: "choice",
  promptCopyId: "copy.choice.wa",
  targetExampleId: "intro-base",
  blankSegmentId: "p1",
  distractorRefs: [
    { exampleId: "study-base", segmentId: "p1" },
    { exampleId: "p-ga", segmentId: "p1" },
  ],
  assessedConceptIds: ["topic-wa"],
  assessedLexemeIds: [],
};

const transformation: TransformationExerciseDefinition = {
  id: "ex-transform",
  kind: "transformation",
  promptCopyId: "copy.transform.polarity",
  promptExampleId: "trans-affirm",
  targetExampleId: "trans-negative",
  transformation: "polarity",
  assessedConceptIds: ["negative-masen"],
  assessedLexemeIds: ["eat"],
};

const completion: CompletionExerciseDefinition = {
  id: "ex-complete",
  kind: "completion",
  promptCopyId: "copy.complete.study",
  targetExampleId: "study-base",
  blankSegmentIds: ["w2", "e1"],
  assessedConceptIds: ["object-o"],
  assessedLexemeIds: ["study"],
};

const constrained: ConstrainedConstructionExerciseDefinition = {
  id: "ex-construct",
  kind: "constrained-construction",
  promptCopyId: "copy.construct.intro",
  intentCopyId: "copy.construct.intro.intent",
  targetExampleId: "intro-base",
  assessedConceptIds: ["copula-desu"],
  assessedLexemeIds: ["student"],
  acceptedVariants: [
    {
      id: "topic-omission",
      reason: "topic-omission",
      segmentRefs: [{ segmentId: "w2" }, { segmentId: "e1" }],
    },
  ],
};

function generateOk(definition: ExerciseDefinition) {
  const result = generateExercise(definition, catalogs);
  if (!result.ok) {
    throw new Error(`expected generation to succeed: ${JSON.stringify(result.error)}`);
  }
  return result.prompt;
}

describe("normalizeAnswer", () => {
  it("applies NFKC and collapses whitespace", () => {
    // Half-width katakana + full-width space normalize under NFKC.
    expect(normalizeAnswer("ｺｰﾋｰ")).toBe("コーヒー");
    expect(normalizeAnswer("  わたし　は  がくせい です  ")).toBe(
      "わたしはがくせいです",
    );
  });

  it("normalizes allowed Japanese punctuation without erasing assessed kana", () => {
    expect(normalizeAnswer("たべます.")).toBe("たべます。");
    expect(normalizeAnswer("ほん,ノート")).toBe("ほん、ノート");
  });

  it("preserves particle and ending distinctions", () => {
    expect(normalizeAnswer("は") === normalizeAnswer("が")).toBe(false);
    expect(normalizeAnswer("ます") === normalizeAnswer("ません")).toBe(false);
  });

  it("only folds katakana to hiragana when explicitly permitted", () => {
    expect(normalizeAnswer("コーヒー")).not.toBe(normalizeAnswer("こーひー"));
    expect(normalizeAnswer("コーヒー", { katakanaToHiragana: true })).toBe(
      normalizeAnswer("こーひー", { katakanaToHiragana: true }),
    );
  });
});

describe("generateExercise", () => {
  it("is deterministic: identical definition and catalogs produce identical prompts", () => {
    expect(generateExercise(tileOrdering, catalogs)).toEqual(
      generateExercise(tileOrdering, catalogs),
    );
    expect(generateExercise(choice, catalogs)).toEqual(
      generateExercise(choice, catalogs),
    );
  });

  it("resolves shared segments into a stably ordered tile set with the canonical order", () => {
    const prompt = generateOk(tileOrdering);
    expect(prompt.kind).toBe("tile-ordering");
    if (prompt.kind !== "tile-ordering") return;
    // Presentation order is a stable sort by kana, not the answer order.
    expect(prompt.tiles.map((tile) => tile.id)).toEqual([
      "intro-base#w2",
      "intro-base#e1",
      "intro-base#p1",
      "intro-base#w1",
    ]);
    expect(prompt.correctTileIds).toEqual([
      "intro-base#w1",
      "intro-base#p1",
      "intro-base#w2",
      "intro-base#e1",
    ]);
  });

  it("resolves choice options from shared data in a stable order", () => {
    const prompt = generateOk(choice);
    if (prompt.kind !== "choice") throw new Error("wrong kind");
    expect(prompt.options.map((option) => option.id)).toEqual([
      "p-ga#p1",
      "intro-base#p1",
      "study-base#p1",
    ]);
    expect(prompt.correctOptionId).toBe("intro-base#p1");
  });

  it("does not store canonical answer literals in the definition (answers derive from shared data)", () => {
    const prompt = generateOk(transformation);
    if (prompt.kind !== "transformation") throw new Error("wrong kind");
    expect(prompt.promptJp).toBe("たべます");
    expect(prompt.canonicalAnswer).toBe("たべません");
    // The definition itself carries only IDs, never the Japanese answer.
    expect(JSON.stringify(transformation)).not.toContain("たべません");
  });

  it("returns a structured error for an unresolved example reference", () => {
    const result = generateExercise(
      { ...transformation, targetExampleId: "ghost-example" },
      catalogs,
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "missing-example", definitionId: "ex-transform", referenceId: "ghost-example" },
    });
  });

  it("returns a structured error for an unresolved concept or lexeme", () => {
    expect(
      generateExercise({ ...choice, assessedConceptIds: ["ghost-concept"] }, catalogs),
    ).toEqual({
      ok: false,
      error: { code: "missing-concept", definitionId: "ex-choice", referenceId: "ghost-concept" },
    });
    expect(
      generateExercise({ ...completion, assessedLexemeIds: ["ghost-lexeme"] }, catalogs),
    ).toEqual({
      ok: false,
      error: { code: "missing-lexeme", definitionId: "ex-complete", referenceId: "ghost-lexeme" },
    });
  });

  it("returns a structured error for a missing segment reference", () => {
    const result = generateExercise({ ...choice, blankSegmentId: "p9" }, catalogs);
    expect(result).toEqual({
      ok: false,
      error: { code: "missing-segment", definitionId: "ex-choice", referenceId: "p9" },
    });
  });

  it("keeps generation failures as ExerciseGenerationError and unusable candidates as invalid-input", () => {
    const brokenDefinition = { ...transformation, targetExampleId: "ghost-example" };
    const generationResult = generateExercise(brokenDefinition, catalogs);
    expect(generationResult).toEqual({
      ok: false,
      error: {
        code: "missing-example",
        definitionId: "ex-transform",
        referenceId: "ghost-example",
      },
    });

    const promptResult = generateExercise(transformation, catalogs);
    expect(promptResult.ok).toBe(true);
    if (!promptResult.ok) return;
    expect(
      evaluateExercise(promptResult.prompt, { kind: "transformation", text: "   " }).status,
    ).toBe("invalid-input");
  });

  it("rejects a duplicate tile identity as a structured engine error", () => {
    const duplicated: TileOrderingExerciseDefinition = {
      ...tileOrdering,
      distractorRefs: [{ exampleId: "intro-base", segmentId: "w1" }],
    };
    const result = generateExercise(duplicated, catalogs);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("duplicate-segment");
  });

  it("rejects a distractor whose rendered text duplicates a target tile", () => {
    const duplicated: TileOrderingExerciseDefinition = {
      ...tileOrdering,
      id: "ex-tile-duplicate-rendered",
      distractorRefs: [{ exampleId: "p-wa2", segmentId: "p1" }],
    };
    const result = generateExercise(duplicated, catalogs);
    expect(result).toEqual({
      ok: false,
      error: {
        code: "duplicate-segment",
        definitionId: "ex-tile-duplicate-rendered",
        referenceId: "p-wa2#p1",
      },
    });
  });

  it("preserves repeated rendered text when the target needs multiple base tiles", () => {
    const repeatedTarget = example(
      "repeated-particle",
      [
        ["わたし", "word"],
        ["は", "particle"],
        ["きみ", "word"],
        ["は", "particle"],
      ],
      [],
      [],
    );
    const definition: TileOrderingExerciseDefinition = {
      ...tileOrdering,
      id: "ex-tile-repeated-base",
      targetExampleId: "repeated-particle",
      assessedLexemeIds: [],
    };
    const result = generateExercise(definition, {
      ...catalogs,
      examples: [...catalogs.examples, repeatedTarget],
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.prompt.kind !== "tile-ordering") return;
    expect(result.prompt.tiles.filter((tile) => tile.jp === "は")).toHaveLength(2);
    expect(result.prompt.correctTileIds).toEqual([
      "repeated-particle#w1",
      "repeated-particle#p1",
      "repeated-particle#w2",
      "repeated-particle#p2",
    ]);
  });

  it("returns an absent-target error for a segment-less tile-ordering target", () => {
    const definition: TileOrderingExerciseDefinition = {
      ...tileOrdering,
      id: "ex-tile-empty-target",
      targetExampleId: "empty-target",
      assessedLexemeIds: [],
    };
    const result = generateExercise(definition, {
      ...catalogs,
      examples: [...catalogs.examples, example("empty-target", [], [], [])],
    });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "absent-target",
        definitionId: "ex-tile-empty-target",
        referenceId: "empty-target",
      },
    });
  });

  it("rejects an impossible choice set (fewer than two options)", () => {
    const result = generateExercise({ ...choice, distractorRefs: [] }, catalogs);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("impossible-choice");
  });

  it("rejects an impossible choice set (a distractor duplicates the correct answer)", () => {
    const result = generateExercise(
      { ...choice, distractorRefs: [{ exampleId: "p-wa2", segmentId: "p1" }] },
      catalogs,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("impossible-choice");
  });

  it("rejects an implicit variant with no explicit shared segment references", () => {
    const result = generateExercise(
      {
        ...constrained,
        acceptedVariants: [{ id: "bad", reason: "topic-omission", segmentRefs: [] }],
      },
      catalogs,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("invalid-variant");
  });
});

describe("evaluateExercise", () => {
  it("accepts the canonical tile order and asks for retry on a scramble", () => {
    const prompt = generateOk(tileOrdering);
    if (prompt.kind !== "tile-ordering") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, { kind: "tile-ordering", tileIds: prompt.correctTileIds }),
    ).toEqual({ status: "accepted" });

    const scrambled = evaluateExercise(prompt, {
      kind: "tile-ordering",
      tileIds: [...prompt.correctTileIds].reverse(),
    });
    expect(scrambled.status).toBe("retry");
    if (scrambled.status !== "retry") return;
    expect(scrambled.targetConceptIds).toEqual(["sentence-order"]);
  });

  it("accepts an explicit word-order variant tile sequence", () => {
    const definition: TileOrderingExerciseDefinition = {
      id: "ex-tile-wo",
      kind: "tile-ordering",
      promptCopyId: "copy.tile.wo",
      targetExampleId: "wo-tile",
      assessedConceptIds: ["object-o"],
      assessedLexemeIds: ["study"],
      acceptedVariants: [
        {
          id: "front-object",
          reason: "word-order",
          segmentRefs: [
            { segmentId: "w2" },
            { segmentId: "p1" },
            { segmentId: "w1" },
            { segmentId: "w3" },
            { segmentId: "e1" },
          ],
        },
      ],
    };
    const prompt = generateOk(definition);
    if (prompt.kind !== "tile-ordering") throw new Error("wrong kind");
    const variantOrder = [
      "wo-tile#w2",
      "wo-tile#p1",
      "wo-tile#w1",
      "wo-tile#w3",
      "wo-tile#e1",
    ];
    expect(
      evaluateExercise(prompt, { kind: "tile-ordering", tileIds: variantOrder }),
    ).toEqual({ status: "accepted" });
  });

  it("accepts the correct choice option and retries a wrong one, preserving the particle distinction", () => {
    const prompt = generateOk(choice);
    if (prompt.kind !== "choice") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, { kind: "choice", optionId: "intro-base#p1" }),
    ).toEqual({ status: "accepted" });
    expect(
      evaluateExercise(prompt, { kind: "choice", optionId: "p-ga#p1" }).status,
    ).toBe("retry");
  });

  it("accepts a transformed answer and retries the wrong polarity", () => {
    const prompt = generateOk(transformation);
    if (prompt.kind !== "transformation") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, { kind: "transformation", text: "たべません" }),
    ).toEqual({ status: "accepted" });
    // The affirmative form must NOT be accepted for a polarity transform.
    expect(
      evaluateExercise(prompt, { kind: "transformation", text: "たべます" }).status,
    ).toBe("retry");
  });

  it("accepts a completion of the blanked segments", () => {
    const prompt = generateOk(completion);
    if (prompt.kind !== "completion") throw new Error("wrong kind");
    expect(prompt.canonicalAnswer).toBe("べんきょうします");
    expect(
      evaluateExercise(prompt, { kind: "completion", text: "べんきょうします" }),
    ).toEqual({ status: "accepted" });
    expect(
      evaluateExercise(prompt, { kind: "completion", text: "べんきょうしません" }).status,
    ).toBe("retry");
  });

  it("accepts a constrained construction and its explicit topic-omission variant", () => {
    const prompt = generateOk(constrained);
    if (prompt.kind !== "constrained-construction") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, {
        kind: "constrained-construction",
        text: "わたしはがくせいです",
      }),
    ).toEqual({ status: "accepted" });
    // Explicit topic-omission variant assembled from shared segments.
    expect(
      evaluateExercise(prompt, {
        kind: "constrained-construction",
        text: "がくせいです",
      }),
    ).toEqual({ status: "accepted" });
    expect(
      evaluateExercise(prompt, {
        kind: "constrained-construction",
        text: "せんせいです",
      }).status,
    ).toBe("retry");
  });

  it("tolerates whitespace noise in a text answer without fuzzy scoring", () => {
    const prompt = generateOk(transformation);
    if (prompt.kind !== "transformation") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, { kind: "transformation", text: "  たべ ません  " }),
    ).toEqual({ status: "accepted" });
  });

  it("folds katakana to hiragana only when the definition permits it", () => {
    const permissive: ConstrainedConstructionExerciseDefinition = {
      id: "ex-kata",
      kind: "constrained-construction",
      promptCopyId: "copy.kata",
      intentCopyId: "copy.kata.intent",
      targetExampleId: "kata-coffee",
      assessedConceptIds: [],
      assessedLexemeIds: [],
      permitKatakanaToHiragana: true,
    };
    const strict: ConstrainedConstructionExerciseDefinition = {
      ...permissive,
      id: "ex-kata-strict",
      permitKatakanaToHiragana: false,
    };
    const permissivePrompt = generateOk(permissive);
    const strictPrompt = generateOk(strict);
    if (
      permissivePrompt.kind !== "constrained-construction" ||
      strictPrompt.kind !== "constrained-construction"
    ) {
      throw new Error("wrong kind");
    }
    expect(
      evaluateExercise(permissivePrompt, {
        kind: "constrained-construction",
        text: "こーひー",
      }),
    ).toEqual({ status: "accepted" });
    expect(
      evaluateExercise(strictPrompt, {
        kind: "constrained-construction",
        text: "こーひー",
      }).status,
    ).toBe("retry");
  });

  it("reports invalid-input for a candidate whose kind does not match the prompt", () => {
    const prompt = generateOk(choice);
    expect(
      evaluateExercise(prompt, { kind: "transformation", text: "は" }).status,
    ).toBe("invalid-input");
  });

  it("reports invalid-input for structurally unusable input", () => {
    const prompt = generateOk(transformation);
    if (prompt.kind !== "transformation") throw new Error("wrong kind");
    expect(
      evaluateExercise(prompt, { kind: "transformation", text: "   " }).status,
    ).toBe("invalid-input");

    const choicePrompt = generateOk(choice);
    expect(
      evaluateExercise(choicePrompt, { kind: "choice", optionId: "not-an-option" })
        .status,
    ).toBe("invalid-input");
  });
});
