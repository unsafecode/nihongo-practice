import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import { realizeVariant } from "../../foundations/realizeFamily";
import { a1FoundationCatalogs } from "./catalog";
import {
  a1CanonicalContexts,
  a1CanonicalLearningTargetSenses,
  a1CanonicalPersonRoles,
  a1CanonicalReferents,
  a1CanonicalSemanticValues,
  a1CanonicalSentenceFamilies,
} from "./a1SemanticCatalog";
import { FOUNDATIONS_LEXEME_IDS_BY_LESSON } from "./foundationsShared";
import {
  modulePoliteVerbsLessons,
  modulePoliteVerbsRecipe,
} from "./modulePoliteVerbs";
import {
  moduleTimeMovementLessons,
  moduleTimeMovementRecipe,
} from "./moduleTimeMovement";
import {
  a1FoundationsArea03to04Catalogs,
  a1FoundationsArea03to04Copy,
} from "../curriculum/foundationsArea03to04";
import { A1_EXPANDED_CANONICAL_POSITIONS } from "../manifest";

const EXPECTED_LESSON_IDS = [
  "polite-verbs-1",
  "polite-verbs-2",
  "polite-verbs-3",
  "polite-verbs-4",
  "time-movement-1",
  "time-movement-2",
  "time-movement-3",
  "time-movement-4",
] as const;

const builtLessons = [
  ...modulePoliteVerbsLessons,
  ...moduleTimeMovementLessons,
];

const variantById = new Map(
  builtLessons.flatMap(({ variants }) => variants).map((variant) => [variant.id, variant]),
);
const familyById = new Map(
  a1CanonicalSentenceFamilies.map((family) => [family.id, family]),
);

function realize(variantId: string) {
  const variant = variantById.get(variantId);
  const family = variant ? familyById.get(variant.sentenceFamilyId) : undefined;
  expect(variant, `variant ${variantId}`).toBeDefined();
  expect(family, `family for ${variantId}`).toBeDefined();
  if (!variant || !family) throw new Error(`Missing staged variant ${variantId}.`);

  const result = realizeVariant(
    family,
    variant,
    {
      contexts: a1CanonicalContexts,
      personRoles: a1CanonicalPersonRoles,
      referents: a1CanonicalReferents,
      semanticValues: a1CanonicalSemanticValues,
      learningTargetSenses: a1CanonicalLearningTargetSenses,
    },
    { availableConceptIds: family.requiredConceptIds },
  );
  if (!result.ok) {
    throw new Error(`Could not realize ${variantId}: ${JSON.stringify(result.errors)}`);
  }
  return result.sentence;
}

function modelSentences(lessonId: string) {
  const lesson = builtLessons.find(({ recipe }) => recipe.id === lessonId);
  if (!lesson) throw new Error(`Missing staged lesson ${lessonId}.`);
  return lesson.recipe.modelVariantIds.map(realize);
}

function translation(variantId: string, locale: "en" | "it") {
  const lesson = builtLessons.find(({ variants }) =>
    variants.some(({ id }) => id === variantId),
  );
  if (!lesson) throw new Error(`Missing staged variant ${variantId}.`);
  return lesson[locale][`${variantId}-translation`];
}

describe("published Foundations modules 03–04", () => {
  it("keeps both modules in canonical published order", () => {
    expect(modulePoliteVerbsRecipe).toMatchObject({
      id: "polite-verbs",
      order: 4,
      prerequisiteIds: ["topic-questions"],
      lessonIds: EXPECTED_LESSON_IDS.slice(0, 4),
    });
    expect(moduleTimeMovementRecipe).toMatchObject({
      id: "time-movement",
      order: 5,
      prerequisiteIds: ["polite-verbs"],
      lessonIds: EXPECTED_LESSON_IDS.slice(4),
    });
    expect(
      a1FoundationsArea03to04Catalogs.lessonPositions.map(({ position }) => position),
    ).toEqual(EXPECTED_LESSON_IDS.map((id) => A1_EXPANDED_CANONICAL_POSITIONS[id]));
    expect(
      a1FoundationCatalogs.modules.some(({ id }) => id === "polite-verbs" || id === "time-movement"),
    ).toBe(true);
    expect(a1FoundationCatalogs.modules).toHaveLength(16);
    expect(a1FoundationCatalogs.lessonPositions).toHaveLength(64);
  });

  it("authors exactly eight models and five transfers for every Foundations lesson", () => {
    expect(builtLessons.map(({ recipe }) => recipe.id)).toEqual(EXPECTED_LESSON_IDS);

    for (const built of builtLessons) {
      const transfers = built.variants.filter(
        ({ pedagogicalUse }) => pedagogicalUse === "transfer",
      );
      expect(built.recipe.modelVariantIds, built.recipe.id).toHaveLength(8);
      expect(transfers, built.recipe.id).toHaveLength(5);
      expect(
        new Set([...built.recipe.modelVariantIds, ...transfers.map(({ id }) => id)]).size,
        built.recipe.id,
      ).toBe(13);
    }
  });

  it("realizes every allocated lexeme in that lesson's models", () => {
    for (const built of builtLessons) {
      const modelLexemeIds = new Set<string>();
      for (const variantId of built.recipe.modelVariantIds) {
        const variant = variantById.get(variantId);
        for (const token of realize(variantId).tokens) {
          if (token.kind !== "lexical" || token.source.domain !== "family") continue;
          const slotId = token.source.referenceId.split("/")[1];
          const valueId = slotId ? variant?.slotValues[slotId] : undefined;
          const lexeme =
            valueId === undefined
              ? undefined
              : a1FoundationsArea03to04Catalogs.lexemeByValueId[valueId];
          if (lexeme) modelLexemeIds.add(lexeme.id);
        }
      }

      expect([...FOUNDATIONS_LEXEME_IDS_BY_LESSON[built.recipe.id] ?? []].every((id) =>
        modelLexemeIds.has(id),
      ), built.recipe.id).toBe(true);
    }
  });

  it("keeps broad visible target diversity within each lesson", () => {
    for (const built of builtLessons) {
      const targets = built.variants.map((variant) => realize(variant.id).canonicalJapanese);
      expect(new Set(targets).size, built.recipe.id).toBeGreaterThanOrEqual(8);
    }
  });

  it("keeps the form and particle progression within what the staged sequence has taught", () => {
    const expectedFormByLesson = {
      "polite-verbs-1": { polarity: "affirmative", tense: "present" },
      "polite-verbs-2": { polarity: "affirmative", tense: "present" },
      "polite-verbs-3": { polarity: "negative", tense: "present" },
      "polite-verbs-4": { polarity: "affirmative", tense: "present" },
      "time-movement-1": { polarity: "affirmative", tense: "present" },
      "time-movement-2": { polarity: "affirmative", tense: "past" },
      "time-movement-3": { polarity: "negative", tense: "past" },
      "time-movement-4": { polarity: "affirmative", tense: "past" },
    } as const;
    const availableConceptIds = new Set([
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
      "a1-concept-nominative-ga",
      "a1-concept-interrogative-ka",
    ]);

    for (const built of builtLessons) {
      for (const conceptId of built.recipe.introducedConceptIds) {
        availableConceptIds.add(conceptId);
      }
      for (const variant of built.variants) {
        const expectedForm =
          expectedFormByLesson[
            built.recipe.id as keyof typeof expectedFormByLesson
          ];
        expect(variant.form).toMatchObject(expectedForm);
        const family = familyById.get(variant.sentenceFamilyId);
        for (const conceptId of family?.requiredConceptIds ?? []) {
          expect(
            availableConceptIds.has(conceptId),
            `${variant.id} uses future concept ${conceptId}`,
          ).toBe(true);
        }
      }
    }

    const pv1Particles = modelSentences("polite-verbs-1").flatMap(({ tokens }) =>
      tokens.filter(({ kind }) => kind === "particle").map(({ jp }) => jp),
    );
    expect(pv1Particles).not.toEqual(
      expect.arrayContaining(["を", "で", "に", "へ"]),
    );

    for (const sentence of modelSentences("polite-verbs-2")) {
      expect(sentence.tokens.some(({ kind, jp }) => kind === "particle" && jp === "を")).toBe(
        true,
      );
    }
    for (const sentence of modelSentences("polite-verbs-3")) {
      expect(sentence.canonicalJapanese.endsWith("ません")).toBe(true);
      expect(sentence.tokens.some(({ kind, jp }) => kind === "particle" && ["で", "に", "へ"].includes(jp))).toBe(false);
    }
    const pv4 = modelSentences("polite-verbs-4");
    expect(pv4.some(({ tokens }) => tokens.some(({ kind, jp }) => kind === "particle" && jp === "で"))).toBe(true);
    expect(pv4.some(({ tokens }) => tokens.some(({ kind, jp }) => kind === "particle" && jp === "に"))).toBe(true);

    for (const sentence of modelSentences("time-movement-1")) {
      expect(sentence.tokens.some(({ kind, jp }) => kind === "particle" && jp === "に")).toBe(
        true,
      );
      expect(sentence.canonicalJapanese.endsWith("ます")).toBe(true);
    }
    for (const sentence of modelSentences("time-movement-2")) {
      expect(sentence.canonicalJapanese.endsWith("ました")).toBe(true);
      expect(sentence.tokens.some(({ kind, jp }) => kind === "particle" && jp === "に")).toBe(false);
    }
    for (const sentence of modelSentences("time-movement-3")) {
      expect(sentence.canonicalJapanese.endsWith("ませんでした")).toBe(true);
    }
    const tm4 = modelSentences("time-movement-4");
    expect(tm4.some(({ tokens }) => tokens.some(({ kind, jp }) => kind === "particle" && jp === "へ"))).toBe(true);
    expect(tm4.some(({ tokens }) => tokens.some(({ kind, jp }) => kind === "particle" && jp === "で"))).toBe(true);
    expect(
      moduleTimeMovementLessons.map(
        ({ recipe }) => recipe.diversityConstraints.minPredicates,
      ),
    ).toEqual([2, 2, 3, 2]);
    expect(
      modulePoliteVerbsLessons.slice(2).map(
        ({ recipe }) => recipe.diversityConstraints.minPredicates,
      ),
    ).toEqual([3, 3]);
  });

  it("uses natural movement, time, and object-action models", () => {
    expect(realize("polite-verbs-2-m8").canonicalJapanese).toBe(
      "なまえをかきます",
    );
    expect(realize("polite-verbs-3-m5").canonicalJapanese).toBe(
      "ゆきはいきません",
    );
    expect(realize("polite-verbs-3-m6").canonicalJapanese).toBe(
      "えいごをききません",
    );
    expect(realize("time-movement-3-m4").canonicalJapanese).toBe(
      "みなはおとといかえりませんでした",
    );
    expect(realize("time-movement-4-m3").canonicalJapanese).toBe(
      "ゆきはバスでかいしゃにかえりました",
    );
    expect(translation("time-movement-4-m3", "en")).toBe(
      "Yuki returned to the company by bus.",
    );
    expect(translation("time-movement-4-m3", "it")).toBe(
      "Yuki è tornata in azienda in autobus.",
    );
    expect(translation("time-movement-3-m4", "en")).toBe(
      "Mina did not return the day before yesterday.",
    );
    expect(translation("time-movement-3-m4", "it")).toBe(
      "Mina non è tornata l'altro ieri.",
    );
    expect(
      modelSentences("time-movement-3").map(
        ({ canonicalJapanese }) => canonicalJapanese,
      ),
    ).not.toContain("みなはまいにちかえりませんでした");

    const stagedSentences = builtLessons.flatMap(({ variants }) =>
      variants.map(({ id }) => realize(id).canonicalJapanese),
    );
    expect(stagedSentences).not.toContain("テレビをききません");
    expect(stagedSentences).not.toContain("しゅくだいをかきます");

    const destinationSentences = builtLessons
      .filter(({ recipe }) =>
        ["polite-verbs-4", "time-movement-4"].includes(recipe.id),
      )
      .flatMap(({ variants }) =>
        variants.map(({ id }) => realize(id).canonicalJapanese),
      );
    const publicDestinationSentences = destinationSentences.filter((japanese) =>
      /(えき|としょかん|カフェ|がっこう)(に|へ)/.test(japanese),
    );

    expect(publicDestinationSentences).not.toHaveLength(0);
    for (const japanese of publicDestinationSentences) {
      expect(japanese).not.toMatch(/(えき|としょかん|カフェ|がっこう)(に|へ)かえ/);
      expect(japanese).toMatch(/(えき|としょかん|カフェ|がっこう)(に|へ)いき/);
    }
    expect(destinationSentences.some((japanese) => /かいしゃにかえ/.test(japanese))).toBe(
      true,
    );
  });

  it("realizes representative natural targets through the staged semantic catalog", () => {
    const expected = [
      ["polite-verbs-1-m1", "わたしははたらきます", "watashi wa hatarakimasu"],
      ["polite-verbs-2-m1", "すしをたべます", "sushi o tabemasu"],
      ["polite-verbs-3-m1", "これをみません", "kore o mimasen"],
      ["polite-verbs-4-m2", "かいしゃではたらきます", "kaisha de hatarakimasu"],
      ["time-movement-1-m1", "ろくじにべんきょうします", "rokuji ni benkyoushimasu"],
      ["time-movement-2-m1", "あさべんきょうしました", "asa benkyoushimashita"],
      ["time-movement-3-m1", "きのうべんきょうしませんでした", "kinou benkyoushimasen deshita"],
      ["time-movement-3-m4", "みなはおとといかえりませんでした", "mina wa ototoi kaerimasen deshita"],
      ["time-movement-4-m2", "でんしゃでえきにいきました", "densha de eki ni ikimashita"],
      ["time-movement-4-m3", "ゆきはバスでかいしゃにかえりました", "yuki wa basu de kaisha ni kaerimashita"],
    ] as const;

    for (const [variantId, japanese, romaji] of expected) {
      const sentence = realize(variantId);
      expect(sentence.canonicalJapanese).toBe(japanese);
      const formatted = formatRomaji(sentence.tokens);
      expect(formatted.ok).toBe(true);
      if (formatted.ok) expect(formatted.text).toBe(romaji);
    }
  });

  it("builds two generated targets in each round plus a spoken target without errors", () => {
    for (const lessonId of EXPECTED_LESSON_IDS) {
      const built = buildLessonViewModel({
        catalogs: a1FoundationsArea03to04Catalogs,
        copy: a1FoundationsArea03to04Copy,
        lessonId,
        locale: "en",
        catalogVersion: "a1-foundations-staged-03to04",
        seed: "a1-foundations-staged-03to04",
      });
      expect(built.ok, lessonId).toBe(true);
      if (!built.ok) continue;
      expect(built.model.rounds[0].targets).toHaveLength(2);
      expect(built.model.rounds[1].targets).toHaveLength(2);
      expect(built.model.tokensForExample(built.model.rounds[0].targets[0]!.targetExampleId)).toBeDefined();
      expect(
        built.model.tokensForExample(
          builtLessons.find(({ recipe }) => recipe.id === lessonId)?.recipe.spokenVariantId ?? "",
        ),
      ).toBeDefined();
    }
  });
});
