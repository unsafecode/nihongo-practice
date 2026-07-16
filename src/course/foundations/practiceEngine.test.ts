import { describe, expect, it } from "vitest";

import { fixtureFamily, foundationCatalogs, foundationLessons } from "./fixtures";
import { realizeVariant, type RealizeVariantCatalogs } from "./realizeFamily";
import type { ConceptId, PedagogicalUse, RealizedSentence, SentenceVariant } from "./types";
import { selectVariants, type PracticeCandidate, type SelectedPracticeTarget } from "./selectVariants";
import {
  buildFamilyExerciseDefinition,
  evaluateFamilyExercise,
  generateFamilyExercise,
  missingRealizedContextSentences,
  realizedExerciseExample,
  type FamilyPracticeContext,
} from "./practiceEngine";

// ---------------------------------------------------------------------------
// Synthetic sentence/target factories (see selectVariants.test.ts for the
// same convention: token `jp` values are opaque placeholder text, never real
// vocabulary, used only to prove identity/distinctness behavior).
// ---------------------------------------------------------------------------

interface Form {
  readonly polarity: "affirmative" | "negative";
  readonly tense: "present" | "past";
  readonly formality: "polite";
}

const DEFAULT_FORM: Form = { polarity: "affirmative", tense: "present", formality: "polite" };

function fingerprintFor(fields: {
  readonly familyId: string;
  readonly speakerRoleId: string;
  readonly predicateSenseId: string;
  readonly contextId: string;
  readonly form: Form;
}): string {
  return [
    `family=${fields.familyId}`,
    `speaker=${fields.speakerRoleId}`,
    `addressee=none`,
    `subjectReferent=none`,
    `subjectRealization=explicit`,
    `sense=${fields.predicateSenseId}`,
    `context=${fields.contextId}`,
    `form=${fields.form.polarity}:${fields.form.tense}:${fields.form.formality}`,
    `slots=`,
  ].join("|");
}

interface SentenceFields {
  readonly id: string;
  readonly familyId?: string;
  readonly predicateSenseId?: string;
  readonly speakerRoleId?: string;
  readonly contextId?: string;
  readonly canonicalJapanese?: string;
  readonly pedagogicalUse?: PedagogicalUse;
  readonly form?: Form;
  readonly tokens?: RealizedSentence["tokens"];
  readonly scenarioNoteCopyId?: string;
}

function makeSentence(fields: SentenceFields): RealizedSentence {
  const familyId = fields.familyId ?? "family-a";
  const predicateSenseId = fields.predicateSenseId ?? "sense-a";
  const speakerRoleId = fields.speakerRoleId ?? "role-a";
  const contextId = fields.contextId ?? "context-a";
  const pedagogicalUse = fields.pedagogicalUse ?? "model";
  const form = fields.form ?? DEFAULT_FORM;
  const canonicalJapanese = fields.canonicalJapanese ?? `${fields.id}-jp`;
  const tokens: RealizedSentence["tokens"] = fields.tokens ?? [
    {
      id: `${fields.id}::subject`,
      jp: `${fields.id}-subject`,
      romaji: `${fields.id}-subject`,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "test", referenceId: `${fields.id}::subject` },
    },
    {
      id: `${fields.id}::wa`,
      jp: "は",
      romaji: "wa",
      kind: "particle",
      boundaryBefore: "space",
      source: { domain: "test", referenceId: `${fields.id}::wa` },
    },
    {
      id: `${fields.id}::predicate`,
      jp: `${fields.id}-predicate`,
      romaji: `${fields.id}-predicate`,
      kind: "lexical",
      boundaryBefore: "space",
      source: { domain: "test", referenceId: `${fields.id}::predicate` },
    },
    {
      id: `${fields.id}::ending`,
      jp: "です",
      romaji: "desu",
      kind: "morpheme",
      boundaryBefore: "attach",
      source: { domain: "test", referenceId: `${fields.id}::ending` },
    },
  ];

  return {
    familyId,
    variantId: fields.id,
    tokens,
    canonicalJapanese,
    visibleTargetKey: canonicalJapanese,
    semanticFingerprint: fingerprintFor({ familyId, speakerRoleId, predicateSenseId, contextId, form }),
    predicateSenseId,
    discourse: {
      speakerRoleId,
      addresseeRoleId: null,
      subjectReferentId: null,
      subjectRealization: "explicit",
      scenarioNoteCopyId: fields.scenarioNoteCopyId ?? `${fields.id}-scenario`,
    },
    contextId,
    pedagogicalUse,
    usedConceptIds: [`${familyId}-concept`],
    usedLexemeSenseIds: [predicateSenseId],
  };
}

function makeTarget(
  sentence: RealizedSentence,
  overrides: Partial<SelectedPracticeTarget> = {},
): SelectedPracticeTarget {
  return {
    targetId: `round-1::${sentence.variantId}`,
    roundId: "round-1",
    variantId: sentence.variantId,
    sentenceFamilyId: sentence.familyId,
    visibleTargetKey: sentence.visibleTargetKey,
    semanticFingerprint: sentence.semanticFingerprint,
    predicateSenseId: sentence.predicateSenseId,
    speakerRoleId: sentence.discourse.speakerRoleId,
    contextId: sentence.contextId,
    pedagogicalUse: sentence.pedagogicalUse,
    exerciseKind: "tile-ordering",
    ...overrides,
  };
}

/** Wraps an already-built `RealizedSentence` into a `PracticeCandidate` for
 * feeding `selectVariants` directly (bypassing `realizeVariant`, same
 * convention as `selectVariants.test.ts`). */
function toCandidate(sentence: RealizedSentence, form: Form = DEFAULT_FORM): PracticeCandidate {
  return {
    variant: {
      id: sentence.variantId,
      sentenceFamilyId: sentence.familyId,
      discourse: sentence.discourse,
      contextId: sentence.contextId,
      slotValues: {},
      form,
      pedagogicalUse: sentence.pedagogicalUse,
    },
    sentence,
  };
}

/** Tokens with no `particle`/`morpheme` kind at all — no blankable token
 * exists, so `completion` must be ineligible for a sentence built from
 * these (see `selectVariants.test.ts`'s identical helper). */
function noBlankableTokens(id: string): RealizedSentence["tokens"] {
  return [
    {
      id: `${id}::a`,
      jp: `${id}-a`,
      romaji: `${id}-a`,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "test", referenceId: `${id}::a` },
    },
    {
      id: `${id}::b`,
      jp: `${id}-b`,
      romaji: `${id}-b`,
      kind: "lexical",
      boundaryBefore: "space",
      source: { domain: "test", referenceId: `${id}::b` },
    },
  ];
}

// ---------------------------------------------------------------------------
// realizedExerciseExample
// ---------------------------------------------------------------------------

describe("realizedExerciseExample", () => {
  it("maps token kinds (lexical->word, morpheme->ending, particle/punctuation unchanged) and derives every field from tokens", () => {
    const sentence = makeSentence({
      id: "map-test",
      tokens: [
        {
          id: "map-test::lex",
          jp: "たべ",
          romaji: "tabe",
          kind: "lexical",
          boundaryBefore: "attach",
          source: { domain: "test", referenceId: "map-test::lex" },
        },
        {
          id: "map-test::particle",
          jp: "を",
          romaji: "o",
          kind: "particle",
          boundaryBefore: "space",
          source: { domain: "test", referenceId: "map-test::particle" },
        },
        {
          id: "map-test::morph",
          jp: "ます",
          romaji: "masu",
          kind: "morpheme",
          boundaryBefore: "attach",
          source: { domain: "test", referenceId: "map-test::morph" },
        },
        {
          id: "map-test::punct",
          jp: "。",
          romaji: "",
          kind: "punctuation",
          boundaryBefore: "attach",
          source: { domain: "test", referenceId: "map-test::punct" },
        },
      ],
      canonicalJapanese: "たべを ます。",
    });

    const example = realizedExerciseExample(sentence);

    expect(example.id).toBe("map-test");
    expect(example.jp).toBe("たべを ます。");
    expect(example.segments).toEqual([
      { id: "map-test::lex", jp: "たべ", kind: "word" },
      { id: "map-test::particle", jp: "を", kind: "particle" },
      { id: "map-test::morph", jp: "ます", kind: "ending" },
      { id: "map-test::punct", jp: "。", kind: "punctuation" },
    ]);
    expect(example.lexemeIds).toEqual(sentence.usedLexemeSenseIds);
    expect(example.conceptIds).toEqual(sentence.usedConceptIds);
  });

  it("preserves an explicit reading when the token carries one", () => {
    const sentence = makeSentence({
      id: "reading-test",
      tokens: [
        {
          id: "reading-test::lex",
          jp: "京都",
          romaji: "kyouto",
          kind: "lexical",
          boundaryBefore: "attach",
          reading: "きょうと",
          source: { domain: "test", referenceId: "reading-test::lex" },
        },
      ],
    });
    const example = realizedExerciseExample(sentence);
    expect(example.segments[0]).toEqual({ id: "reading-test::lex", jp: "京都", kind: "word", reading: "きょうと" });
  });
});

// ---------------------------------------------------------------------------
// A1/A2 fixture-derived: every assigned kind generates successfully
// ---------------------------------------------------------------------------

const catalogs: RealizeVariantCatalogs = {
  contexts: foundationCatalogs.contexts,
  personRoles: foundationCatalogs.personRoles,
  referents: foundationCatalogs.referents,
  semanticValues: foundationCatalogs.semanticValues,
  learningTargetSenses: foundationCatalogs.learningTargetSenses,
};

function conceptIdsForLesson(lessonId: string): readonly ConceptId[] {
  const lesson = foundationLessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error(`Unknown fixture lesson id: ${lessonId}`);
  const ids = new Set<ConceptId>();
  for (const familyId of lesson.familyIds) {
    const family = fixtureFamily(familyId);
    for (const conceptId of family.requiredConceptIds) ids.add(conceptId);
  }
  return [...ids];
}

function realizeFixtureCandidates(lessonId: string, variants: readonly SentenceVariant[]): readonly PracticeCandidate[] {
  const availableConceptIds = conceptIdsForLesson(lessonId);
  return variants.map((variant) => {
    const family = fixtureFamily(variant.sentenceFamilyId);
    const result = realizeVariant(family, variant, catalogs, { availableConceptIds });
    if (!result.ok) throw new Error(`Fixture variant ${variant.id} failed to realize: ${JSON.stringify(result.errors)}`);
    return { variant, sentence: result.sentence };
  });
}

function lessonVariants(ids: readonly string[]): readonly SentenceVariant[] {
  return ids.map((id) => {
    const found = foundationCatalogs.sentenceVariants.find((variant) => variant.id === id);
    if (!found) throw new Error(`Unknown fixture variant id: ${id}`);
    return found;
  });
}

const FULL_LESSON_CONSTRAINTS = {
  minFamilies: 3,
  minPredicates: 3,
  minRoles: 3,
  minContexts: 2,
  minUniqueVisibleTargets: 5,
  maxVisibleReuse: 2,
  minTransferTargets: 0,
  requireControlledConstruction: false,
};

function selectFixtureLesson(lessonId: string, seed: string) {
  const lesson = foundationLessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error(`Unknown fixture lesson id: ${lessonId}`);
  const round1 = lesson.practice.roundOne;
  const round2 = lesson.practice.roundTwo;
  const modelCandidates = realizeFixtureCandidates(lessonId, lessonVariants(round1.candidateVariantIds));
  const transferCandidates = realizeFixtureCandidates(lessonId, lessonVariants(round2.candidateVariantIds));

  const round1Result = selectVariants({
    catalogVersion: "catalog-v1",
    lessonId,
    round: round1,
    seed,
    candidates: modelCandidates,
    modelSemanticFingerprints: [],
    alreadySelected: [],
    constraints: FULL_LESSON_CONSTRAINTS,
  });
  if (!round1Result.ok) throw new Error(`round1 selection failed: ${JSON.stringify(round1Result.errors)}`);

  const round2Result = selectVariants({
    catalogVersion: "catalog-v1",
    lessonId,
    round: round2,
    seed,
    candidates: transferCandidates,
    modelSemanticFingerprints: modelCandidates.map((candidate) => candidate.sentence.semanticFingerprint),
    alreadySelected: round1Result.targets,
    constraints: { ...FULL_LESSON_CONSTRAINTS, minTransferTargets: 2, requireControlledConstruction: true },
  });
  if (!round2Result.ok) throw new Error(`round2 selection failed: ${JSON.stringify(round2Result.errors)}`);

  const allCandidates = [...modelCandidates, ...transferCandidates];
  const sentenceByVariantId = new Map(allCandidates.map((candidate) => [candidate.variant.id, candidate.sentence]));
  const allTargets = [...round1Result.targets, ...round2Result.targets];
  const realizedSentences = allCandidates.map((candidate) => candidate.sentence);

  return { targets: allTargets, sentenceByVariantId, realizedSentences };
}

describe("A1/A2 fixture lessons: every assigned kind generates successfully", () => {
  it.each([
    ["fixture-a1-personal-details", "a1-fixed-seed"],
    ["fixture-a2-routine-plans", "a2-fixed-seed"],
  ])("generates a valid exercise for every selected target in %s", (lessonId, seed) => {
    const { targets, sentenceByVariantId, realizedSentences } = selectFixtureLesson(lessonId, seed);
    const context: FamilyPracticeContext = { seed, realizedSentences };

    expect(targets).toHaveLength(10);
    for (const target of targets) {
      const sentence = sentenceByVariantId.get(target.variantId);
      expect(sentence).toBeDefined();
      const result = generateFamilyExercise(target, sentence!, context);
      expect(result.ok, `target ${target.variantId} (${target.exerciseKind}) failed: ${JSON.stringify(!result.ok && result.error)}`).toBe(true);
      if (!result.ok) continue;
      expect(result.prompt.kind).toBe(target.exerciseKind);
    }
  });

  it("never authors a literal Japanese string in any definition object across the whole A1 lesson", () => {
    const { targets, sentenceByVariantId, realizedSentences } = selectFixtureLesson("fixture-a1-personal-details", "a1-fixed-seed");
    const context: FamilyPracticeContext = { seed: "a1-fixed-seed", realizedSentences };
    const bannedJp = new Set<string>();
    for (const sentence of realizedSentences) {
      bannedJp.add(sentence.canonicalJapanese);
      for (const token of sentence.tokens) bannedJp.add(token.jp);
    }
    bannedJp.delete("");

    function scan(value: unknown, path: string): void {
      if (typeof value === "string") {
        expect(bannedJp.has(value), `literal JP string leaked into definition at ${path}: ${value}`).toBe(false);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry, index) => scan(entry, `${path}[${index}]`));
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, entry] of Object.entries(value)) scan(entry, `${path}.${key}`);
      }
    }

    for (const target of targets) {
      const sentence = sentenceByVariantId.get(target.variantId)!;
      const definitionResult = buildFamilyExerciseDefinition(target, sentence, context);
      expect(definitionResult.ok).toBe(true);
      if (!definitionResult.ok) continue;
      scan(definitionResult.definition, target.variantId);
    }
  });
});

// ---------------------------------------------------------------------------
// Kind-specific content/behavior
// ---------------------------------------------------------------------------

describe("constrained-construction", () => {
  it("has a canonical answer equal to the realized canonicalJapanese, while the definition stores only refs", () => {
    const sentence = makeSentence({ id: "cc-1", canonicalJapanese: "わたしはがくせいです" });
    const target = makeTarget(sentence, { exerciseKind: "constrained-construction" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };

    const definitionResult = buildFamilyExerciseDefinition(target, sentence, context);
    expect(definitionResult.ok).toBe(true);
    if (!definitionResult.ok) return;
    expect(definitionResult.definition.kind).toBe("constrained-construction");
    if (definitionResult.definition.kind === "constrained-construction") {
      expect(definitionResult.definition.targetExampleId).toBe("cc-1");
      expect(definitionResult.definition.intentCopyId).toBe("cc-1-scenario");
    }

    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt.kind).toBe("constrained-construction");
    if (result.prompt.kind === "constrained-construction") {
      expect(result.prompt.canonicalAnswer).toBe(sentence.canonicalJapanese);
    }
  });
});

describe("choice/completion/tile content derives strictly from realized tokens", () => {
  it("choice: blank and distractor jp text come from realized token text", () => {
    const target1 = makeSentence({ id: "choice-target" });
    const other = makeSentence({
      id: "choice-other",
      tokens: [
        {
          id: "choice-other::wa",
          jp: "が",
          romaji: "ga",
          kind: "particle",
          boundaryBefore: "space",
          source: { domain: "test", referenceId: "choice-other::wa" },
        },
      ],
    });
    const target = makeTarget(target1, { exerciseKind: "choice" });
    const context: FamilyPracticeContext = { seed: "choice-seed", realizedSentences: [target1, other] };

    const result = generateFamilyExercise(target, target1, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt.kind).toBe("choice");
    const prompt = result.prompt;
    if (prompt.kind === "choice") {
      const allTokenJp = new Set(target1.tokens.map((t) => t.jp).concat(other.tokens.map((t) => t.jp)));
      for (const option of prompt.options) {
        expect(allTokenJp.has(option.jp)).toBe(true);
      }
      const correct = prompt.options.find((option) => option.id === prompt.correctOptionId);
      expect(correct).toBeDefined();
      expect(target1.tokens.some((t) => t.jp === correct!.jp)).toBe(true);
    }
  });

  it("completion: blanks are drawn from the target sentence's own tokens", () => {
    const sentence = makeSentence({ id: "completion-1" });
    const target = makeTarget(sentence, { exerciseKind: "completion" });
    const context: FamilyPracticeContext = { seed: "completion-seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt.kind).toBe("completion");
    if (result.prompt.kind === "completion") {
      const tokenIds = new Set(sentence.tokens.map((t) => t.id));
      for (const blankId of result.prompt.blankSegmentIds) {
        expect(tokenIds.has(blankId)).toBe(true);
      }
      const tokensById = new Map(sentence.tokens.map((t) => [t.id, t]));
      const expectedAnswer = result.prompt.blankSegmentIds.map((id) => tokensById.get(id)!.jp).join("");
      expect(result.prompt.canonicalAnswer).toBe(expectedAnswer);
    }
  });

  it("tile-ordering: tiles come exactly from the target sentence's own tokens", () => {
    const sentence = makeSentence({ id: "tile-1" });
    const target = makeTarget(sentence, { exerciseKind: "tile-ordering" });
    const context: FamilyPracticeContext = { seed: "tile-seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt.kind).toBe("tile-ordering");
    if (result.prompt.kind === "tile-ordering") {
      expect(result.prompt.correctTileIds).toHaveLength(sentence.tokens.length);
      const tileJp = new Set(result.prompt.tiles.map((tile) => tile.jp));
      for (const token of sentence.tokens) expect(tileJp.has(token.jp)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism under reordering
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("produces the identical prompt regardless of context.realizedSentences array order", () => {
    const target1 = makeSentence({ id: "det-target" });
    const otherA = makeSentence({
      id: "det-other-a",
      tokens: [
        { id: "det-other-a::wa", jp: "が", romaji: "ga", kind: "particle", boundaryBefore: "space", source: { domain: "test", referenceId: "det-other-a::wa" } },
      ],
    });
    const otherB = makeSentence({
      id: "det-other-b",
      tokens: [
        { id: "det-other-b::wa", jp: "も", romaji: "mo", kind: "particle", boundaryBefore: "space", source: { domain: "test", referenceId: "det-other-b::wa" } },
      ],
    });
    const target = makeTarget(target1, { exerciseKind: "choice" });

    const forward: FamilyPracticeContext = { seed: "det-seed", realizedSentences: [target1, otherA, otherB] };
    const reversed: FamilyPracticeContext = { seed: "det-seed", realizedSentences: [otherB, otherA, target1] };

    const resultForward = generateFamilyExercise(target, target1, forward);
    const resultReversed = generateFamilyExercise(target, target1, reversed);
    expect(resultForward).toEqual(resultReversed);
  });

  it("produces the identical prompt regardless of token array insertion order within a sentence", () => {
    const tokensA: RealizedSentence["tokens"] = [
      { id: "order-1::a", jp: "あ", romaji: "a", kind: "particle", boundaryBefore: "attach", source: { domain: "test", referenceId: "order-1::a" } },
      { id: "order-1::b", jp: "い", romaji: "i", kind: "morpheme", boundaryBefore: "attach", source: { domain: "test", referenceId: "order-1::b" } },
    ];
    const tokensB: RealizedSentence["tokens"] = [tokensA[1], tokensA[0]];
    const sentenceA = makeSentence({ id: "order-1", tokens: tokensA });
    const sentenceB = makeSentence({ id: "order-1", tokens: tokensB });
    const target = makeTarget(sentenceA, { exerciseKind: "completion" });

    const resultA = generateFamilyExercise(target, sentenceA, { seed: "seed", realizedSentences: [sentenceA] });
    const resultB = generateFamilyExercise(target, sentenceB, { seed: "seed", realizedSentences: [sentenceB] });
    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (!resultA.ok || !resultB.ok) return;
    expect(resultA.prompt.kind).toBe("completion");
    expect(resultB.prompt.kind).toBe("completion");
    if (resultA.prompt.kind === "completion" && resultB.prompt.kind === "completion") {
      expect(resultA.prompt.canonicalAnswer).toBe(resultB.prompt.canonicalAnswer);
      expect([...resultA.prompt.blankSegmentIds].sort()).toEqual([...resultB.prompt.blankSegmentIds].sort());
    }
  });
});

// ---------------------------------------------------------------------------
// evaluateFamilyExercise acceptance/retry behavior
// ---------------------------------------------------------------------------

describe("evaluateFamilyExercise", () => {
  it("accepts the exact canonical answer for constrained-construction", () => {
    const sentence = makeSentence({ id: "eval-cc", canonicalJapanese: "わたしはがくせいです" });
    const target = makeTarget(sentence, { exerciseKind: "constrained-construction" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const generated = generateFamilyExercise(target, sentence, context);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const evaluation = evaluateFamilyExercise(generated.prompt, { kind: "constrained-construction", text: "わたしはがくせいです" });
    expect(evaluation.status).toBe("accepted");
  });

  it("accepts an answer with surrounding/interior whitespace", () => {
    const sentence = makeSentence({ id: "eval-ws", canonicalJapanese: "わたしはがくせいです" });
    const target = makeTarget(sentence, { exerciseKind: "constrained-construction" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const generated = generateFamilyExercise(target, sentence, context);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const evaluation = evaluateFamilyExercise(generated.prompt, {
      kind: "constrained-construction",
      text: " わたしは がくせい です ",
    });
    expect(evaluation.status).toBe("accepted");
  });

  it("retries (does not erase) an answer missing a required particle/ending", () => {
    const sentence = makeSentence({ id: "eval-missing", canonicalJapanese: "わたしはがくせいです" });
    const target = makeTarget(sentence, { exerciseKind: "constrained-construction" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const generated = generateFamilyExercise(target, sentence, context);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const evaluation = evaluateFamilyExercise(generated.prompt, { kind: "constrained-construction", text: "わたしはがくせい" });
    expect(evaluation.status).toBe("retry");
  });
});

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

describe("practice engine error codes", () => {
  it("missing-realized-target: sentence.variantId does not match selectedTarget.variantId", () => {
    const sentence = makeSentence({ id: "err-a" });
    const mismatchedTarget = makeTarget(sentence, { variantId: "different-id" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(mismatchedTarget, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-realized-target");
  });

  it("missing-realized-target: sentence absent from context.realizedSentences", () => {
    const sentence = makeSentence({ id: "err-b" });
    const target = makeTarget(sentence);
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-realized-target");
  });

  it("no-eligible-token: choice on a sentence with no particle/morpheme tokens", () => {
    const sentence = makeSentence({
      id: "err-c",
      tokens: [
        { id: "err-c::lex1", jp: "あ", romaji: "a", kind: "lexical", boundaryBefore: "attach", source: { domain: "test", referenceId: "err-c::lex1" } },
      ],
    });
    const target = makeTarget(sentence, { exerciseKind: "choice" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("no-eligible-token");
  });

  it("no-eligible-token: completion on a sentence with no particle/morpheme tokens", () => {
    const sentence = makeSentence({
      id: "err-d",
      tokens: [
        { id: "err-d::lex1", jp: "あ", romaji: "a", kind: "lexical", boundaryBefore: "attach", source: { domain: "test", referenceId: "err-d::lex1" } },
      ],
    });
    const target = makeTarget(sentence, { exerciseKind: "completion" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("no-eligible-token");
  });

  it("insufficient-distractors: choice with no other sentences in context", () => {
    const sentence = makeSentence({ id: "err-e" });
    const target = makeTarget(sentence, { exerciseKind: "choice" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("insufficient-distractors");
  });

  it("missing-transformation-source: selectedTarget.sourceVariantId is unset", () => {
    const sentence = makeSentence({ id: "err-f" });
    const target = makeTarget(sentence, { exerciseKind: "transformation" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-transformation-source");
  });

  it("missing-transformation-source: sourceVariantId does not resolve in context", () => {
    const sentence = makeSentence({ id: "err-g" });
    const target = makeTarget(sentence, { exerciseKind: "transformation", sourceVariantId: "ghost-source" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-transformation-source");
  });

  it("incompatible-transformation: sourceVariantId resolves but is not an honest single-axis form difference", () => {
    const target1 = makeSentence({ id: "err-h-target", familyId: "family-x" });
    const source = makeSentence({ id: "err-h-source", familyId: "family-y" }); // different family: no honest axis
    const target = makeTarget(target1, { exerciseKind: "transformation", sourceVariantId: "err-h-source" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [target1, source] };
    const result = generateFamilyExercise(target, target1, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("incompatible-transformation");
  });

  it("duplicate-realized-token: two context sentences share a token id", () => {
    const sentence = makeSentence({ id: "err-i" });
    const clashing = makeSentence({
      id: "err-i-other",
      tokens: [{ ...sentence.tokens[0], id: sentence.tokens[0].id }],
    });
    const target = makeTarget(sentence, { exerciseKind: "tile-ordering" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [sentence, clashing] };
    const result = generateFamilyExercise(target, sentence, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("duplicate-realized-token");
    expect(result.error.referenceId).toBe(sentence.tokens[0].id);
  });

  it("generation-failed: preserves the underlying generateExercise error code/reference", () => {
    const source = makeSentence({ id: "err-j-source", form: { polarity: "affirmative", tense: "present", formality: "polite" } });
    const target1 = makeSentence({
      id: "err-j-target",
      form: { polarity: "negative", tense: "present", formality: "polite" },
      canonicalJapanese: "", // forces the engine's own "absent-target" fault
    });
    const target = makeTarget(target1, { exerciseKind: "transformation", sourceVariantId: "err-j-source" });
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [source, target1] };
    const result = generateFamilyExercise(target, target1, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("generation-failed");
    expect(result.error.underlyingCode).toBe("absent-target");
  });
});

// ---------------------------------------------------------------------------
// Cross-round transformation source contract — `FamilyPracticeContext.
// realizedSentences` must carry every selected target's own sentence *plus*
// every `sourceVariantId` a `transformation` target points to, even when
// that source was selected/realized in an earlier round (or is a taught
// model, never itself "selected" at all). Never fabricate a source or
// silently downgrade the assigned kind when it's absent — that must fail.
// ---------------------------------------------------------------------------

describe("cross-round transformation source contract", () => {
  const priorRoundSource = makeSentence({
    id: "prior-round-source",
    familyId: "family-cross",
    predicateSenseId: "sense-cross",
    form: { polarity: "affirmative", tense: "present", formality: "polite" },
  });
  const round2Target = makeSentence({
    id: "round-2-target",
    familyId: "family-cross",
    predicateSenseId: "sense-cross",
    form: { polarity: "negative", tense: "present", formality: "polite" },
  });
  const selectedTarget = makeTarget(round2Target, {
    targetId: "round-2::round-2-target",
    roundId: "round-2",
    exerciseKind: "transformation",
    sourceVariantId: "prior-round-source",
  });

  it("returns missing-transformation-source when the prior-round source sentence is absent from context.realizedSentences", () => {
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [round2Target] };
    const result = generateFamilyExercise(selectedTarget, round2Target, context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-transformation-source");
    expect(result.error.referenceId).toBe("prior-round-source");
  });

  it("succeeds when the prior-round source sentence is included in context.realizedSentences", () => {
    const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [round2Target, priorRoundSource] };
    const result = generateFamilyExercise(selectedTarget, round2Target, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompt.kind).toBe("transformation");
  });

  describe("missingRealizedContextSentences", () => {
    it("reports the prior-round source id when it is absent", () => {
      const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [round2Target] };
      expect(missingRealizedContextSentences([selectedTarget], context)).toEqual(["prior-round-source"]);
    });

    it("reports nothing once the prior-round source is included", () => {
      const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [round2Target, priorRoundSource] };
      expect(missingRealizedContextSentences([selectedTarget], context)).toEqual([]);
    });

    it("also reports a missing target sentence itself, not only missing sources", () => {
      const context: FamilyPracticeContext = { seed: "seed", realizedSentences: [] };
      expect(missingRealizedContextSentences([selectedTarget], context)).toEqual(
        expect.arrayContaining(["round-2-target", "prior-round-source"]),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// No downstream generation-failed for selector-accepted targets — anything
// `selectVariants` returns `ok: true` for must actually generate.
// ---------------------------------------------------------------------------

describe("no downstream generation-failed for selector-accepted targets", () => {
  it("every target selectVariants accepts from a completion-only pool (some candidates with no blankable token) generates successfully", () => {
    const blankable = ["blank-1", "blank-2", "blank-3"].map((id) =>
      toCandidate(makeSentence({ id, familyId: `family-${id}`, predicateSenseId: `sense-${id}` })),
    );
    const noBlank = ["no-blank-1", "no-blank-2"].map((id) =>
      toCandidate(makeSentence({ id, familyId: `family-${id}`, predicateSenseId: `sense-${id}`, tokens: noBlankableTokens(id) })),
    );
    const pool: readonly PracticeCandidate[] = [...blankable, ...noBlank];

    const result = selectVariants({
      catalogVersion: "v1",
      lessonId: "lesson-1",
      round: {
        id: "round-completion-only",
        purpose: "guided-controlled",
        candidateVariantIds: pool.map((candidate) => candidate.variant.id),
        exerciseKinds: ["completion"],
        targetCount: 3,
      },
      seed: "gen-check-seed",
      candidates: pool,
      modelSemanticFingerprints: [],
      alreadySelected: [],
      constraints: {
        minFamilies: 1,
        minPredicates: 1,
        minRoles: 1,
        minContexts: 1,
        minUniqueVisibleTargets: 1,
        maxVisibleReuse: 3,
        minTransferTargets: 0,
        requireControlledConstruction: false,
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const realizedSentences = pool.map((candidate) => candidate.sentence);
    const context: FamilyPracticeContext = { seed: "gen-check-seed", realizedSentences };
    const sentenceByVariantId = new Map(realizedSentences.map((sentence) => [sentence.variantId, sentence]));

    for (const target of result.targets) {
      // The fix under test: selectVariants must never have accepted one of
      // the no-blankable-token candidates for a completion-only round.
      expect(target.variantId.startsWith("no-blank-")).toBe(false);
      const sentence = sentenceByVariantId.get(target.variantId);
      expect(sentence).toBeDefined();
      const generated = generateFamilyExercise(target, sentence!, context);
      expect(generated.ok, `target ${target.variantId} failed: ${JSON.stringify(!generated.ok && generated.error)}`).toBe(true);
    }
  });
});
