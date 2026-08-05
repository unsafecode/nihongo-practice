import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import { realizeVariant } from "../../foundations/realizeFamily";
import { A1_EXPANDED_CANONICAL_POSITIONS } from "../manifest";
import { FOUNDATIONS_LEXEME_IDS_BY_LESSON } from "./foundationsShared";
import { a1FoundationCatalogs } from "./catalog";
import {
  moduleSentenceFoundationsLessons,
  moduleSentenceFoundationsRecipe,
} from "./moduleSentenceFoundations";
import {
  moduleTopicQuestionsLessons,
  moduleTopicQuestionsRecipe,
} from "./moduleTopicQuestions";
import {
  a1FoundationsArea01to02BuiltLessons,
  a1FoundationsArea01to02Catalogs,
  a1FoundationsArea01to02Copy,
  a1FoundationsArea01to02LessonContent,
} from "../curriculum/foundationsArea01to02";

const EXPECTED_LESSON_IDS = [
  "sentence-foundations-1",
  "sentence-foundations-2",
  "sentence-foundations-3",
  "sentence-foundations-4",
  "topic-questions-1",
  "topic-questions-2",
  "topic-questions-3",
  "topic-questions-4",
] as const;

const builtLessons = [
  ...moduleSentenceFoundationsLessons,
  ...moduleTopicQuestionsLessons,
];
const variantById = new Map(
  builtLessons.flatMap((lesson) => lesson.variants).map((variant) => [variant.id, variant]),
);
const familyById = new Map(
  a1FoundationsArea01to02Catalogs.sentenceFamilies.map((family) => [family.id, family]),
);

function realize(variantId: string) {
  const variant = variantById.get(variantId);
  const family = variant
    ? familyById.get(variant.sentenceFamilyId)
    : undefined;
  expect(variant, `variant ${variantId}`).toBeDefined();
  expect(family, `family for ${variantId}`).toBeDefined();
  if (!variant || !family) throw new Error(`Missing staged variant ${variantId}.`);

  const result = realizeVariant(
    family,
    variant,
    {
      contexts: a1FoundationsArea01to02Catalogs.contexts,
      personRoles: a1FoundationsArea01to02Catalogs.personRoles,
      referents: a1FoundationsArea01to02Catalogs.referents,
      semanticValues: a1FoundationsArea01to02Catalogs.semanticValues,
      learningTargetSenses: a1FoundationsArea01to02Catalogs.learningTargetSenses,
    },
    { availableConceptIds: family.requiredConceptIds },
  );
  if (!result.ok) {
    throw new Error(`Could not realize ${variantId}: ${JSON.stringify(result.errors)}`);
  }
  return result.sentence;
}

describe("staged Foundations modules 01–02", () => {
  it("keeps the two new modules in expanded order without publishing them", () => {
    expect(moduleSentenceFoundationsRecipe).toMatchObject({
      id: "sentence-foundations",
      order: 2,
      prerequisiteIds: ["sounds"],
      lessonIds: EXPECTED_LESSON_IDS.slice(0, 4),
    });
    expect(moduleTopicQuestionsRecipe).toMatchObject({
      id: "topic-questions",
      order: 3,
      prerequisiteIds: ["sentence-foundations"],
      lessonIds: EXPECTED_LESSON_IDS.slice(4),
    });
    expect(a1FoundationsArea01to02BuiltLessons.map(({ recipe }) => recipe.id)).toEqual(
      EXPECTED_LESSON_IDS,
    );
    expect(
      a1FoundationsArea01to02Catalogs.lessonPositions.map(({ position }) => position),
    ).toEqual(EXPECTED_LESSON_IDS.map((id) => A1_EXPANDED_CANONICAL_POSITIONS[id]));
    expect(
      a1FoundationsArea01to02Catalogs.lessonPositions.map(({ position }) => position),
    ).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(a1FoundationCatalogs.modules).toHaveLength(12);
    expect(a1FoundationCatalogs.lessonPositions).toHaveLength(48);
    expect(
      a1FoundationCatalogs.lessonPositions.some(({ lessonId }) =>
        lessonId.startsWith("sentence-foundations-"),
      ),
    ).toBe(false);
  });

  it("authors exactly eight models and five transfers for every lesson", () => {
    expect(builtLessons.map(({ recipe }) => recipe.id)).toEqual(EXPECTED_LESSON_IDS);

    for (const built of builtLessons) {
      const models = built.recipe.modelVariantIds;
      const transfers = built.variants
        .filter(({ pedagogicalUse }) => pedagogicalUse === "transfer")
        .map(({ id }) => id);
      expect(models, built.recipe.id).toHaveLength(8);
      expect(transfers, built.recipe.id).toHaveLength(5);
      expect(new Set([...models, ...transfers]).size, built.recipe.id).toBe(13);
    }
  });

  it("uses the exact four staged lexemes in each lesson and realizes each in its own models", () => {
    for (const built of builtLessons) {
      const allocated = FOUNDATIONS_LEXEME_IDS_BY_LESSON[built.recipe.id];
      expect(allocated, built.recipe.id).toHaveLength(4);

      const modelLexemeIds = new Set<string>();
      for (const variantId of built.recipe.modelVariantIds) {
        const sentence = realize(variantId);
        for (const token of sentence.tokens) {
          if (token.kind !== "lexical" || token.source.domain !== "family") continue;
          const slotId = token.source.referenceId.split("/")[1];
          if (!slotId) continue;
          const valueId = variantById.get(variantId)?.slotValues[slotId];
          const lexeme =
            valueId === undefined
              ? undefined
              : a1FoundationsArea01to02Catalogs.lexemeByValueId[valueId];
          if (lexeme) modelLexemeIds.add(lexeme.id);
        }
      }

      for (const lexemeId of allocated ?? []) {
        expect(modelLexemeIds.has(lexemeId), `${built.recipe.id} uses ${lexemeId}`).toBe(
          true,
        );
      }
    }
  });

  it("realizes every model and transfer through the staged catalog with representative natural copy", () => {
    for (const built of builtLessons) {
      for (const variant of built.variants) {
        const sentence = realize(variant.id);
        expect(sentence.canonicalJapanese).not.toBe("");
        const romaji = formatRomaji(sentence.tokens);
        expect(romaji.ok, variant.id).toBe(true);
      }
    }

    const expected = [
      [
        "sentence-foundations-1-m1",
        "わたしはがくせいです",
        "watashi wa gakusei desu",
        "I am a student.",
        "Sono uno studente.",
      ],
      [
        "sentence-foundations-2-m5",
        "がくせいです",
        "gakusei desu",
        "Yuki is a student.",
        "Yuki è una studentessa.",
      ],
      [
        "sentence-foundations-3-m1",
        "あなたはがくせいです",
        "anata wa gakusei desu",
        "You are a student.",
        "Tu sei uno studente.",
      ],
      [
        "sentence-foundations-4-m2",
        "かいしゃいんです",
        "kaishain desu",
        "I am an office worker.",
        "Sono un impiegato.",
      ],
      [
        "topic-questions-1-m1",
        "ゆきはにほんじんです",
        "yuki wa nihonjin desu",
        "Yuki is Japanese.",
        "Yuki è giapponese.",
      ],
      [
        "topic-questions-2-m2",
        "ゆきがにほんじんです",
        "yuki ga nihonjin desu",
        "Yuki is the one who is Japanese.",
        "Yuki è quella giapponese.",
      ],
      [
        "topic-questions-3-m1",
        "がくせいはだれですか",
        "gakusei wa dare desu ka",
        "Who is the student?",
        "Chi è lo studente?",
      ],
      [
        "topic-questions-4-m4",
        "どれがパンですか",
        "dore ga pan desu ka",
        "Which one is bread?",
        "Quale è il pane?",
      ],
    ] as const;
    for (const [variantId, japanese, expectedRomaji, english, italian] of expected) {
      const sentence = realize(variantId);
      expect(sentence.canonicalJapanese).toBe(japanese);
      const romaji = formatRomaji(sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (romaji.ok) expect(romaji.text).toBe(expectedRomaji);
      expect(a1FoundationsArea01to02Copy.en[`${variantId}-translation`]).toBe(english);
      expect(a1FoundationsArea01to02Copy.it[`${variantId}-translation`]).toBe(italian);
    }
  });

  it("keeps every visible lexical item within cumulative Foundations or published-sounds availability", () => {
    const availableLexemeIds = new Set<string>(["a1-lexeme-pan"]);
    const contentByLessonId = new Map(
      a1FoundationsArea01to02LessonContent.map((content) => [
        content.lessonId,
        content,
      ]),
    );

    for (const built of builtLessons) {
      const content = contentByLessonId.get(built.recipe.id);
      expect(content, built.recipe.id).toBeDefined();
      for (const lexemeId of content?.newLexemeIds ?? []) {
        availableLexemeIds.add(lexemeId);
      }
      for (const variant of built.variants) {
        const sentence = realize(variant.id);
        for (const token of sentence.tokens) {
          if (token.kind !== "lexical" || token.source.domain !== "family") continue;
          const slotId = token.source.referenceId.split("/")[1];
          const valueId = slotId ? variant.slotValues[slotId] : undefined;
          const lexeme =
            valueId === undefined
              ? undefined
              : a1FoundationsArea01to02Catalogs.lexemeByValueId[valueId];
          if (lexeme) {
            expect(
              availableLexemeIds.has(lexeme.id),
              `${variant.id} uses unavailable ${lexeme.id}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("keeps focus and clarification honest without a premature verbal understanding form", () => {
    const anata = variantById.get("sentence-foundations-3-m1");
    expect(anata?.contextId).toBe("a1-context-unidentified-addressee");
    expect(anata?.discourse.subjectReferentId).toBe(
      "a1-referent-unidentified-addressee",
    );
    expect(anata?.discourse.addresseeRoleId).toBe(
      "a1-role-unidentified-addressee",
    );

    const focus = realize("topic-questions-2-m2");
    expect(focus.tokens.some((token) => token.jp === "が")).toBe(true);
    expect(focus.canonicalJapanese).toBe("ゆきがにほんじんです");

    const topicQuestionVariants = moduleTopicQuestionsLessons.flatMap(({ variants }) => variants);
    const realizedTopicQuestions = topicQuestionVariants.map((variant) =>
      realize(variant.id).canonicalJapanese,
    );
    expect(realizedTopicQuestions.some((sentence) => sentence.includes("わか"))).toBe(false);
    expect(realizedTopicQuestions).not.toContain("これはどれですか");
  });

  it("provides complete, parity-preserving staged bilingual copy", () => {
    expect(Object.keys(a1FoundationsArea01to02Copy.en).sort()).toEqual(
      Object.keys(a1FoundationsArea01to02Copy.it).sort(),
    );
    for (const variant of a1FoundationsArea01to02Catalogs.sentenceVariants) {
      for (const suffix of ["translation", "scenario"]) {
        const copyId = `${variant.id}-${suffix}`;
        expect(a1FoundationsArea01to02Copy.en[copyId], copyId).toMatch(/\S/);
        expect(a1FoundationsArea01to02Copy.it[copyId], copyId).toMatch(/\S/);
      }
    }
  });

  it("stages only the grammar available at each lesson", () => {
    const forbiddenParticles = ["を", "で", "に", "へ"] as const;
    const anataVariantIds: string[] = [];
    const availableConceptIds = new Set<string>();

    for (const [lessonIndex, built] of builtLessons.entries()) {
      for (const conceptId of built.recipe.introducedConceptIds) {
        availableConceptIds.add(conceptId);
      }
      for (const variant of built.variants) {
        const family = familyById.get(variant.sentenceFamilyId);
        for (const conceptId of family?.requiredConceptIds ?? []) {
          expect(
            availableConceptIds.has(conceptId),
            `${variant.id} uses future concept ${conceptId}`,
          ).toBe(true);
        }
        const sentence = realize(variant.id);
        expect(
          sentence.tokens.some(
            (token) =>
              token.kind === "particle" &&
              forbiddenParticles.includes(
                token.jp as (typeof forbiddenParticles)[number],
              ),
          ),
          variant.id,
        ).toBe(false);
        expect(sentence.canonicalJapanese.includes("ます")).toBe(false);
        expect(sentence.canonicalJapanese.includes("ました")).toBe(false);
        expect(sentence.canonicalJapanese.includes("ません")).toBe(false);
        if (lessonIndex < 6) {
          expect(sentence.canonicalJapanese.endsWith("か"), variant.id).toBe(false);
        }
        if (sentence.canonicalJapanese.includes("あなた")) anataVariantIds.push(variant.id);
      }
    }

    expect(anataVariantIds).toEqual(["sentence-foundations-3-m1"]);
    expect(
      builtLessons
        .flatMap(({ variants }) => variants)
        .some((variant, index, all) =>
          variant.id.startsWith("sentence-foundations-3") &&
          all[index + 1]?.id.startsWith("sentence-foundations-3") &&
          realize(variant.id).canonicalJapanese.includes("あなた") &&
          realize(all[index + 1].id).canonicalJapanese.includes("あなた"),
        ),
    ).toBe(false);
  });

  it("builds generated practice through the catalog-neutral staged view model", () => {
    for (const lessonId of EXPECTED_LESSON_IDS) {
      const built = buildLessonViewModel({
        catalogs: a1FoundationsArea01to02Catalogs,
        copy: a1FoundationsArea01to02Copy,
        lessonId,
        locale: "en",
        catalogVersion: "a1-foundations-staged-01to02",
        seed: "a1-foundations-staged-01to02",
      });
      expect(built.ok, lessonId).toBe(true);
      if (!built.ok) continue;
      expect(built.model.rounds[0].targets).toHaveLength(2);
      expect(built.model.rounds[1].targets).toHaveLength(2);
      expect(built.model.matrix.rows).toHaveLength(8);
    }
  });
});
