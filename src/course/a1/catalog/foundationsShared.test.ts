import { describe, expect, it } from "vitest";

import { a1LexemeById, a1LexemeByValueId } from "../curriculum/lexicon";
import { A1_EXPANDED_LESSON_IDS_BY_MODULE } from "../manifest";
import {
  a1CanonicalContexts,
  a1CanonicalPersonRoles,
  a1CanonicalReferents,
  a1CanonicalSemanticValues,
  a1Contexts,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
} from "./a1SemanticCatalog";
import {
  FOUNDATIONS_CANDO_IDS_BY_MODULE,
  a1ExpandedFoundationsLexemeByValueId,
  a1ExpandedFoundationsLexemes,
  FOUNDATIONS_LEXEME_IDS_BY_LESSON,
  FOUNDATIONS_LEXEMES_BY_LESSON,
  FOUNDATIONS_VOCABULARY_BY_LESSON,
} from "./foundationsShared";

const EXPECTED_LEXEME_IDS_BY_LESSON = {
  "sentence-foundations-1": [
    "a1-lexeme-watashi",
    "a1-lexeme-namae",
    "a1-lexeme-gakusei",
    "a1-lexeme-sensei",
  ],
  "sentence-foundations-2": [
    "a1-lexeme-yuki",
    "a1-lexeme-ken",
    "a1-lexeme-mina",
    "a1-lexeme-tomodachi",
  ],
  "sentence-foundations-3": [
    "a1-lexeme-anata",
    "a1-lexeme-kono-hito",
    "a1-lexeme-sono-hito",
    "a1-lexeme-ano-hito",
  ],
  "sentence-foundations-4": [
    "a1-lexeme-isha",
    "a1-lexeme-kaishain",
    "a1-lexeme-enjinia",
    "a1-lexeme-doukyuusei",
  ],
  "topic-questions-1": [
    "a1-lexeme-nihonjin",
    "a1-lexeme-itaria-jin",
    "a1-lexeme-amerika-jin",
    "a1-lexeme-furansujin",
  ],
  "topic-questions-2": [
    "a1-lexeme-nihongo",
    "a1-lexeme-eigo",
    "a1-lexeme-itaria-go",
    "a1-lexeme-furansugo",
  ],
  "topic-questions-3": [
    "a1-lexeme-dare",
    "a1-lexeme-nani",
    "a1-lexeme-nan",
    "a1-lexeme-doko",
  ],
  "topic-questions-4": [
    "a1-lexeme-kore",
    "a1-lexeme-sore",
    "a1-lexeme-are",
    "a1-lexeme-dore",
  ],
  "polite-verbs-1": [
    "a1-lexeme-hataraku",
    "a1-lexeme-benkyou-suru",
    "a1-lexeme-suru",
    "a1-lexeme-yasumu",
  ],
  "polite-verbs-2": [
    "a1-lexeme-taberu",
    "a1-lexeme-nomu",
    "a1-lexeme-yomu",
    "a1-lexeme-kaku",
  ],
  "polite-verbs-3": [
    "a1-lexeme-miru",
    "a1-lexeme-kiku",
    "a1-lexeme-kau",
    "a1-lexeme-kaeru",
  ],
  "polite-verbs-4": [
    "a1-lexeme-kaisha",
    "a1-lexeme-toshokan",
    "a1-lexeme-kafe",
    "a1-lexeme-gakkou",
  ],
  "time-movement-1": [
    "a1-lexeme-rokuji",
    "a1-lexeme-shichiji",
    "a1-lexeme-hachiji",
    "a1-lexeme-kuji",
  ],
  "time-movement-2": [
    "a1-lexeme-asa",
    "a1-lexeme-hiru",
    "a1-lexeme-ban",
    "a1-lexeme-yoru",
  ],
  "time-movement-3": [
    "a1-lexeme-kinou",
    "a1-lexeme-kyou",
    "a1-lexeme-ashita",
    "a1-lexeme-mainichi",
  ],
  "time-movement-4": [
    "a1-lexeme-eki",
    "a1-lexeme-densha",
    "a1-lexeme-basu",
    "a1-lexeme-jitensha",
  ],
} as const;

const EXPANDED_FOUNDATION_LESSON_IDS = [
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["sentence-foundations"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["topic-questions"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["polite-verbs"],
  ...A1_EXPANDED_LESSON_IDS_BY_MODULE["time-movement"],
];

describe("staged Foundations shared authoring data", () => {
  it("uses the exact ordered four-lexeme vocabulary allocation for all expanded Foundations lessons", () => {
    expect(FOUNDATIONS_LEXEME_IDS_BY_LESSON).toEqual(
      EXPECTED_LEXEME_IDS_BY_LESSON,
    );
    expect(Object.keys(FOUNDATIONS_LEXEME_IDS_BY_LESSON)).toEqual(
      EXPANDED_FOUNDATION_LESSON_IDS,
    );

    const lexemeIds = Object.values(FOUNDATIONS_LEXEME_IDS_BY_LESSON).flat();
    expect(lexemeIds).toHaveLength(64);
    expect(new Set(lexemeIds)).toHaveLength(64);
    for (const [lessonId, ids] of Object.entries(
      FOUNDATIONS_LEXEME_IDS_BY_LESSON,
    )) {
      expect(ids).toHaveLength(4);
      for (const id of ids) {
        expect(id.startsWith("a1-lexeme-")).toBe(true);
        expect(FOUNDATIONS_LEXEMES_BY_LESSON[lessonId]?.some((lexeme) => lexeme.id === id)).toBe(
          true,
        );
      }
    }
  });

  it("exposes frozen lexical and Can-do lookup tables without leaking mutable Maps", () => {
    expect(FOUNDATIONS_VOCABULARY_BY_LESSON).toBe(
      FOUNDATIONS_LEXEME_IDS_BY_LESSON,
    );
    expect(FOUNDATIONS_CANDO_IDS_BY_MODULE).toEqual({
      "sentence-foundations": ["a1-can-do-sentence-foundations"],
      "topic-questions": ["a1-can-do-topic-questions"],
      "polite-verbs": ["a1-can-do-polite-verbs"],
      "time-movement": ["a1-can-do-time-movement"],
    });

    for (const table of [
      FOUNDATIONS_LEXEME_IDS_BY_LESSON,
      FOUNDATIONS_LEXEMES_BY_LESSON,
      FOUNDATIONS_CANDO_IDS_BY_MODULE,
    ]) {
      expect(Object.isFrozen(table)).toBe(true);
      expect(table).not.toBeInstanceOf(Map);
      for (const value of Object.values(table)) {
        expect(Object.isFrozen(value)).toBe(true);
      }
    }

    for (const [lessonId, lexemeIds] of Object.entries(
      FOUNDATIONS_LEXEME_IDS_BY_LESSON,
    )) {
      expect(FOUNDATIONS_LEXEMES_BY_LESSON[lessonId]?.map(({ id }) => id)).toEqual(
        lexemeIds,
      );
    }
  });

  it("keeps staged routine rest ownership in the expanded canonical lexicon only", () => {
    const stagedYasumu = a1ExpandedFoundationsLexemeByValueId["a1-value-rest-routine"];

    expect(a1LexemeByValueId["a1-value-rest-routine"]).toBeUndefined();
    expect(stagedYasumu).toMatchObject({
      id: "a1-lexeme-yasumu",
      valueIds: ["a1-value-rest-bare", "a1-value-rest-routine"],
    });
    expect(a1ExpandedFoundationsLexemes).toContain(stagedYasumu);
    expect(
      FOUNDATIONS_LEXEMES_BY_LESSON["polite-verbs-1"]?.find(
        ({ id }) => id === "a1-lexeme-yasumu",
      ),
    ).toBe(stagedYasumu);
  });

  it("keeps Foundations-only referent forms and French language ownership out of published indexes", () => {
    const stagedValueIds = [
      "a1-value-name-subject",
      "a1-value-student-subject",
      "a1-value-dore",
      "a1-value-obj-french-language",
    ];

    for (const valueId of stagedValueIds) {
      expect(a1SemanticValues.some((value) => value.id === valueId)).toBe(false);
      expect(a1CanonicalSemanticValues.some((value) => value.id === valueId)).toBe(true);
    }
    expect(a1LexemeById["a1-lexeme-furansugo"]).toBeUndefined();
    expect(a1LexemeByValueId["a1-value-obj-french-language"]).toBeUndefined();
    expect(a1ExpandedFoundationsLexemeByValueId["a1-value-obj-french-language"]).toMatchObject({
      id: "a1-lexeme-furansugo",
      kana: "フランスご",
    });
  });

  it("keeps the no-name/no-title addressee context, role, and referent staged", () => {
    const stagedContextId = "a1-context-unidentified-addressee";
    const stagedRoleId = "a1-role-unidentified-addressee";
    const stagedReferentId = "a1-referent-unidentified-addressee";

    expect(a1Contexts.some(({ id }) => id === stagedContextId)).toBe(false);
    expect(a1PersonRoles.some(({ id }) => id === stagedRoleId)).toBe(false);
    expect(a1Referents.some(({ id }) => id === stagedReferentId)).toBe(false);
    expect(a1CanonicalContexts.some(({ id }) => id === stagedContextId)).toBe(true);
    expect(a1CanonicalPersonRoles.some(({ id }) => id === stagedRoleId)).toBe(true);
    expect(a1CanonicalReferents.some(({ id }) => id === stagedReferentId)).toBe(true);
  });
});
