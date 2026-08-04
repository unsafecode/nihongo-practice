import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type {
  SentenceFamily,
  SentenceVariant,
} from "../../foundations/types";
import type { AssembledToken } from "../../../romaji/types";
import {
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
} from "../catalog/a1SemanticCatalog";
import { a1LexemeByValueId } from "./lexicon";
import { resolveLexeme } from "./resolveLexeme";

const family = requiredFamily("a1-family-object-action");
const explicitVariant: SentenceVariant = {
  id: "a1-lexeme-resolution-explicit",
  sentenceFamilyId: family.id,
  discourse: {
    speakerRoleId: "a1-role-learner",
    addresseeRoleId: null,
    subjectReferentId: "a1-referent-self",
    subjectRealization: "explicit",
    scenarioNoteCopyId: "test",
  },
  contextId: "a1-context-cafe",
  slotValues: {
    subject: "a1-value-watashi",
    predicate: "a1-value-eat",
    object: "a1-value-obj-sushi",
  },
  form: { polarity: "affirmative", tense: "present", formality: "polite" },
  pedagogicalUse: "model",
};

function requiredFamily(id: string): SentenceFamily {
  const result = a1SentenceFamilies.find((candidate) => candidate.id === id);
  if (!result) {
    throw new Error(`Missing family "${id}".`);
  }
  return result;
}

function realize(variant: SentenceVariant) {
  const result = realizeVariant(
    family,
    variant,
    {
      contexts: a1Contexts,
      personRoles: a1PersonRoles,
      referents: a1Referents,
      semanticValues: a1SemanticValues,
      learningTargetSenses: a1LearningTargetSenses,
    },
    { availableConceptIds: family.requiredConceptIds },
  );
  if (!result.ok) {
    throw new Error(JSON.stringify(result.errors));
  }
  return result.sentence;
}

function tokenFor(sentenceTokens: readonly AssembledToken[], segment: string): AssembledToken {
  const token = sentenceTokens.find((candidate) =>
    candidate.source.referenceId.endsWith(segment),
  );
  if (!token) {
    throw new Error(`Missing token source ending "${segment}".`);
  }
  return token;
}

describe("resolveLexeme", () => {
  it("resolves a noun slot through the variant's semantic value id", () => {
    const token = tokenFor(realize(explicitVariant).tokens, "/object");

    expect(resolveLexeme({ token, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({ ok: true, lexeme: a1LexemeByValueId["a1-value-obj-sushi"] });
  });

  it("resolves a verb stem token through the predicate slot", () => {
    const token = tokenFor(realize(explicitVariant).tokens, "/predicate");

    expect(resolveLexeme({ token, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({ ok: true, lexeme: a1LexemeByValueId["a1-value-eat"] });
  });

  it("resolves an explicit わたし subject through its source slot", () => {
    const token = tokenFor(realize(explicitVariant).tokens, "/subject");

    expect(resolveLexeme({ token, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({ ok: true, lexeme: a1LexemeByValueId["a1-value-watashi"] });
  });

  it("does not fabricate an omitted subject lexeme token", () => {
    const sentence = realize({
      ...explicitVariant,
      id: "a1-lexeme-resolution-omitted",
      discourse: { ...explicitVariant.discourse, subjectRealization: "omitted" },
    });

    expect(
      sentence.tokens.some((token) => token.source.referenceId.endsWith("/subject")),
    ).toBe(false);
  });

  it("returns non-lexical-token for a particle or bound ending", () => {
    const sentence = realize(explicitVariant);
    const particle = tokenFor(sentence.tokens, "/rule/o");
    const ending = tokenFor(sentence.tokens, "/rule/ending");

    expect(resolveLexeme({ token: particle, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({ ok: false, code: "non-lexical-token", referenceId: particle.source.referenceId });
    expect(resolveLexeme({ token: ending, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({ ok: false, code: "non-lexical-token", referenceId: ending.source.referenceId });
  });

  it("distinguishes an unrecognized source shape from a resolved value without a lexeme", () => {
    const nounToken = tokenFor(realize(explicitVariant).tokens, "/object");
    const unrecognized = {
      ...nounToken,
      source: { domain: "family" as const, referenceId: `${explicitVariant.id}/rule/unknown` },
    };

    expect(resolveLexeme({ token: unrecognized, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({
        ok: false,
        code: "unmapped-token-source",
        referenceId: unrecognized.source.referenceId,
      });
    const nonFamilySource = {
      ...nounToken,
      source: { domain: "test" as const, referenceId: `${explicitVariant.id}/object` },
    };
    expect(resolveLexeme({ token: nonFamilySource, variant: explicitVariant, family, semanticValues: a1SemanticValues }))
      .toEqual({
        ok: false,
        code: "unmapped-token-source",
        referenceId: nonFamilySource.source.referenceId,
      });
    expect(
      resolveLexeme({
        token: nounToken,
        variant: explicitVariant,
        family,
        semanticValues: a1SemanticValues,
        lexemeByValueId: Object.freeze({}),
      }),
    ).toEqual({ ok: false, code: "missing-lexeme", referenceId: "a1-value-obj-sushi" });
  });
});
