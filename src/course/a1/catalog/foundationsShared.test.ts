import { describe, expect, it } from "vitest";

import { a1LexemeById, a1LexemeByValueId } from "../curriculum/lexicon";
import { A1_EXPANDED_LESSON_IDS_BY_MODULE } from "../manifest";
import {
  a1CanonicalContexts,
  a1CanonicalLearningTargetSenses,
  a1LearningTargetSenses,
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
  FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON,
  a1ExpandedFoundationsLexemeById,
  a1ExpandedFoundationsLexemeByValueId,
  a1ExpandedFoundationsLexemes,
  FOUNDATIONS_LEXEME_IDS_BY_LESSON,
  FOUNDATIONS_LEXEMES_BY_LESSON,
  FOUNDATIONS_VOCABULARY_BY_LESSON,
} from "./foundationsShared";

const EXPECTED_LEXEME_IDS_BY_LESSON = {
  "sentence-foundations-1": [
    "a1-lexeme-desu",
    "a1-lexeme-watashi",
    "a1-lexeme-kore",
    "a1-lexeme-gakusei",
    "a1-lexeme-sensei",
  ],
  "sentence-foundations-2": [
    "a1-lexeme-yuki",
    "a1-lexeme-ken",
    "a1-lexeme-mina",
    "a1-lexeme-namae",
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
    "a1-lexeme-sore",
    "a1-lexeme-are",
    "a1-lexeme-dore",
    "a1-lexeme-koppu",
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
    "a1-lexeme-iku",
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
    "a1-lexeme-senshuu",
    "a1-lexeme-ototoi",
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

describe("published Foundations shared authoring data", () => {
  it("uses the exact ordered 4–6 lexeme vocabulary allocation for all Foundations lessons", () => {
    expect(FOUNDATIONS_LEXEME_IDS_BY_LESSON).toEqual(
      EXPECTED_LEXEME_IDS_BY_LESSON,
    );
    expect(Object.keys(FOUNDATIONS_LEXEME_IDS_BY_LESSON)).toEqual(
      EXPANDED_FOUNDATION_LESSON_IDS,
    );

    const lexemeIds = Object.values(FOUNDATIONS_LEXEME_IDS_BY_LESSON).flat();
    expect(lexemeIds).toHaveLength(66);
    expect(new Set(lexemeIds)).toHaveLength(66);
    for (const [lessonId, ids] of Object.entries(
      FOUNDATIONS_LEXEME_IDS_BY_LESSON,
    )) {
      expect(ids).toHaveLength(
        ["sentence-foundations-1", "polite-verbs-3"].includes(lessonId) ? 5 : 4,
      );
      for (const id of ids) {
        expect(id.startsWith("a1-lexeme-")).toBe(true);
        expect(FOUNDATIONS_LEXEMES_BY_LESSON[lessonId]?.some((lexeme) => lexeme.id === id)).toBe(
          true,
        );
      }
    }
  });

  it("keeps the staged verb and movement note sequence honest about every form and particle", () => {
    expect(
      [
        "polite-verbs-1",
        "polite-verbs-2",
        "polite-verbs-3",
        "polite-verbs-4",
        "time-movement-1",
        "time-movement-2",
        "time-movement-3",
        "time-movement-4",
      ].map((lessonId) => FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON[lessonId]),
    ).toEqual([
      "a1-note-dictionary-masu-classes",
      "a1-note-masu-object-o",
      "a1-note-masu-masen",
      "a1-note-location-ni-de-contrast",
      "a1-note-time-ni",
      "a1-note-mashita",
      "a1-note-mashita-masen-deshita",
      "a1-note-direction-transport-dialogue",
    ]);
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

  it("publishes routine rest ownership in the canonical lexicon", () => {
    const stagedYasumu = a1ExpandedFoundationsLexemeByValueId["a1-value-rest-routine"];

    expect(a1LexemeByValueId["a1-value-rest-routine"]).toBe(stagedYasumu);
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

  it("publishes the bare first use for polite verbs", () => {
    expect(a1LexemeById["a1-lexeme-iku"]).toMatchObject({
      valueIds: ["a1-value-go", "a1-value-accompany", "a1-value-go-bare"],
    });
    expect(a1ExpandedFoundationsLexemeById["a1-lexeme-iku"]).toMatchObject({
      valueIds: ["a1-value-go", "a1-value-accompany", "a1-value-go-bare"],
    });
    expect(a1LearningTargetSenses.some(({ id }) => id === "a1-sense-go-bare")).toBe(
      true,
    );
    expect(
      a1CanonicalLearningTargetSenses.some(({ id }) => id === "a1-sense-go-bare"),
    ).toBe(true);
    expect(a1SemanticValues.some(({ id }) => id === "a1-value-go-bare")).toBe(
      true,
    );
    expect(
      a1CanonicalSemanticValues.some(({ id }) => id === "a1-value-go-bare"),
    ).toBe(true);
  });

  it("publishes past-compatible day words without taking every day from routines", () => {
    expect(a1LexemeById["a1-lexeme-senshuu"]).toBeDefined();
    expect(a1ExpandedFoundationsLexemeById["a1-lexeme-senshuu"]).toMatchObject({
      valueIds: ["a1-value-time-last-week"],
      kana: "せんしゅう",
      romaji: "senshuu",
    });
    expect(a1LexemeById["a1-lexeme-ototoi"]).toBeDefined();
    expect(a1ExpandedFoundationsLexemeById["a1-lexeme-ototoi"]).toMatchObject({
      valueIds: ["a1-value-time-day-before-yesterday"],
      kana: "おととい",
      romaji: "ototoi",
    });
    expect(
      FOUNDATIONS_LEXEME_IDS_BY_LESSON["time-movement-3"],
    ).not.toContain("a1-lexeme-mainichi");
    expect(a1LexemeById["a1-lexeme-mainichi"]).toMatchObject({
      valueIds: ["a1-value-freq-everyday"],
    });
    expect(
      a1SemanticValues.some(({ id }) => id === "a1-value-time-last-week"),
    ).toBe(true);
    expect(
      a1CanonicalSemanticValues.some(({ id }) => id === "a1-value-time-last-week"),
    ).toBe(true);
    expect(
      a1SemanticValues.some(({ id }) => id === "a1-value-time-day-before-yesterday"),
    ).toBe(true);
    expect(
      a1CanonicalSemanticValues.some(
        ({ id }) => id === "a1-value-time-day-before-yesterday",
      ),
    ).toBe(true);
  });

  it("publishes Foundations referent forms and French language ownership", () => {
    const stagedValueIds = [
      "a1-value-name-subject",
      "a1-value-student-subject",
      "a1-value-dore",
      "a1-value-obj-french-language",
    ];

    for (const valueId of stagedValueIds) {
      expect(a1SemanticValues.some((value) => value.id === valueId)).toBe(true);
      expect(a1CanonicalSemanticValues.some((value) => value.id === valueId)).toBe(true);
    }
    expect(a1LexemeById["a1-lexeme-furansugo"]).toBeDefined();
    expect(a1LexemeByValueId["a1-value-obj-french-language"]).toBeDefined();
    expect(a1ExpandedFoundationsLexemeByValueId["a1-value-obj-french-language"]).toMatchObject({
      id: "a1-lexeme-furansugo",
      kana: "フランスご",
    });
  });

  it("publishes the no-name/no-title addressee context, role, and referent", () => {
    const stagedContextId = "a1-context-unidentified-addressee";
    const stagedRoleId = "a1-role-unidentified-addressee";
    const stagedReferentId = "a1-referent-unidentified-addressee";

    expect(a1Contexts.some(({ id }) => id === stagedContextId)).toBe(true);
    expect(a1PersonRoles.some(({ id }) => id === stagedRoleId)).toBe(true);
    expect(a1Referents.some(({ id }) => id === stagedReferentId)).toBe(true);
    expect(a1CanonicalContexts.some(({ id }) => id === stagedContextId)).toBe(true);
    expect(a1CanonicalPersonRoles.some(({ id }) => id === stagedRoleId)).toBe(true);
    expect(a1CanonicalReferents.some(({ id }) => id === stagedReferentId)).toBe(true);
  });
});
