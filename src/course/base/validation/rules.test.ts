import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import { BASE_CONCEPT_BY_ID } from "../catalog/concepts";
import { BASE_FIRST_TEACH_OWNERS } from "../catalog/firstTeach";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type {
  BaseActivityDefinition,
  BaseConcept,
  BaseDialogue,
  BaseExample,
  BaseLessonContent,
  BasePhoneticActivityOperation,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { validateBaseLessonDepth } from "./lessonRules";
import { validateFirstTeachOrder, visibleJapaneseFor } from "./sequenceRules";

function token(id: string, jp: string): AssembledToken {
  return {
    id,
    jp,
    romaji: `r-${id}`,
    kind: "lexical",
    boundaryBefore: "attach",
    source: { domain: "test", referenceId: id },
  };
}

function example(index: number): BaseExample {
  return {
    id: `example-${index}`,
    tokens: [token(`example-${index}-token`, `例${index}`)],
    lexemeIds: ["verb-kaku"],
    conceptIds: ["dictionary-lemma"],
    formIds: ["masu-nonpast"],
    patternCellIds: [index % 2 === 0 ? "cell-1" : "cell-2"],
    teachingPurposeCopyId: `purpose-${index}`,
    translationCopy: { copyId: `translation-${index}` },
    predicateAspect: "dynamic",
    interpretationTags: ["habitual"],
    semanticRoleIds: ["agent", "theme"],
    discourseFrameId: `example-frame-${index}`,
  } as BaseExample;
}

const EXAMPLES = Array.from({ length: 14 }, (_, index) => example(index + 1));

const DIALOGUE: BaseDialogue = {
  id: "dialogue-1",
  practicalOutcomeCopyId: "dialogue-outcome",
  turns: [1, 2, 3, 4].map((index) => ({
    speakerId: `speaker-${index}`,
    tokens: [token(`dialogue-${index}`, `会${index}`)],
    lexemeIds: ["verb-kaku"],
    conceptIds: ["dictionary-lemma"],
    formIds: ["masu-nonpast"],
    patternCellIds: ["cell-1"],
    predicateAspect: "dynamic",
    interpretationTags: ["habitual"],
    semanticRoleIds: ["agent", "theme"],
    discourseFrameId: `dialogue-frame-${index}`,
  })) as BaseDialogue["turns"],
};

const OPERATION_BY_CATEGORY = {
  "meaning-comprehension": "recognize-meaning",
  "form-function-discrimination": "discriminate-form-function",
  ordering: "order-chunks",
  "controlled-production": "produce-controlled",
  transformation: "transform-form",
  "error-diagnosis": "diagnose-error",
  "contextual-response": "select-contextual-response",
  "cumulative-retrieval": "retrieve-cumulative",
  listening: "identify-audio",
  spoken: "produce-spoken",
} as const;

const INTERACTION_BY_CATEGORY = {
  "meaning-comprehension": "choice",
  "form-function-discrimination": "choice",
  ordering: "tile-ordering",
  "controlled-production": "completion",
  transformation: "transformation",
  "error-diagnosis": "choice",
  "contextual-response": "choice",
  "cumulative-retrieval": "completion",
  listening: "listening",
  spoken: "spoken",
} as const;

function activity(
  index: number,
  category: BaseActivityDefinition["category"],
  mode: BaseActivityDefinition["mode"] = "non-spoken",
): BaseActivityDefinition {
  return {
    id: `activity-${index}`,
    category,
    interactionKind: INTERACTION_BY_CATEGORY[category],
    mode,
    targetId: mode === "audio" && category === "listening" ? "audio-1" : `answer-${index}`,
    operation: OPERATION_BY_CATEGORY[category],
    activityPromptTokens: [token(`prompt-${index}`, `問${index}`)],
    instructionCopyId: `instruction-${index}`,
    acceptedFeedbackCopyId: `accepted-${index}`,
    retryFeedbackCopyId: `retry-${index}`,
    assessedConceptIds: ["dictionary-lemma"],
    assessedLexemeIds: ["verb-kaku"],
  } as BaseActivityDefinition;
}

const SEMANTIC_ACTIVITIES: readonly BaseActivityDefinition[] = [
  activity(1, "meaning-comprehension"),
  activity(2, "meaning-comprehension"),
  activity(3, "form-function-discrimination"),
  activity(4, "form-function-discrimination"),
  activity(5, "ordering"),
  activity(6, "controlled-production"),
  activity(7, "transformation"),
  activity(8, "error-diagnosis"),
  activity(9, "listening", "audio"),
  activity(10, "spoken", "audio"),
];

const COPY_IDS = new Set([
  "recap",
  "main",
  "construction",
  "constraints",
  "common-error",
  "nearest-contrast",
  "dialogue-outcome",
  ...Array.from({ length: 14 }, (_, index) => [
    `purpose-${index + 1}`,
    `translation-${index + 1}`,
  ]).flat(),
  ...Array.from({ length: 11 }, (_, index) => [
    `instruction-${index + 1}`,
    `accepted-${index + 1}`,
    `retry-${index + 1}`,
  ]).flat(),
]);

const CATALOGS: BaseValidationCatalogs = {
  lexemes: BASE_LEXEME_BY_ID,
  concepts: BASE_CONCEPT_BY_ID,
  examples: new Map(EXAMPLES.map((entry) => [entry.id, entry])),
  dialogues: new Map([[DIALOGUE.id, DIALOGUE]]),
  audioTargets: new Map(
    Array.from({ length: 6 }, (_, index) => [
      `audio-${index + 1}`,
      [token(`audio-${index + 1}-token`, `音${index + 1}`)],
    ]),
  ),
  copyIds: COPY_IDS,
  referenceSnapshotIds: new Set(["reference-sentence-order"]),
  patternCellIds: new Set(["cell-1", "cell-2"]),
  acceptedAnswerTokens: new Map(
    Array.from({ length: 11 }, (_, index) => [
      `answer-${index + 1}`,
      [token(`answer-${index + 1}-token`, `答${index + 1}`)],
    ]),
  ),
};

function systemLesson(): BaseSystemLessonContent {
  return {
    lessonId: "copula-adjectives-4",
    contract: "system",
    prerequisiteLessonIds: ["copula-adjectives-3"],
    activities: SEMANTIC_ACTIVITIES,
    recapCopyId: "recap",
    newLexemeIds: ["adjective-takai", "adjective-oishii", "adjective-ii"],
    reviewLexemeIds: ["verb-kaku"],
    introducedConceptIds: ["i-adjective-tense-polarity"],
    reviewedConceptIds: ["affirmative-desu"],
    explanationBlockIds: {
      main: "main",
      construction: "construction",
      constraints: "constraints",
      commonError: "common-error",
      nearestContrast: "nearest-contrast",
    },
    patternCellIds: ["cell-1", "cell-2"],
    workedExampleIds: EXAMPLES.slice(0, 10).map((entry) => entry.id),
    dialogueId: "dialogue-1",
    referenceSnapshotIds: ["reference-sentence-order"],
    interactive: false,
    retrievedSystemIds: [],
  };
}

function phoneticLesson(): BaseLessonContent {
  return {
    lessonId: "sounds-2",
    contract: "phonetic",
    prerequisiteLessonIds: ["sounds-1"],
    activities: [
      ...PHONETIC_OPERATIONS.map((operation, index) => ({
        ...activity(index + 1, "meaning-comprehension"),
        operation,
      })),
      activity(7, "listening", "audio"),
      activity(8, "spoken", "audio"),
    ],
    recapCopyId: "recap",
    contrastiveItemIds: Array.from({ length: 10 }, (_, index) => `contrast-${index + 1}`),
    anchorLexemeIds: [
      "verb-kaku",
      "verb-taberu",
      "adjective-takai",
      "adjective-shizuka",
    ],
    audioExemplarIds: ["audio-1", "audio-2", "audio-3", "audio-4", "audio-5", "audio-6"],
    phoneticExplanationCopyId: "main",
    contrastMapId: "contrast-map-1",
  };
}

const PHONETIC_OPERATIONS = [
  "discriminate-sound",
  "segment-morae",
  "recognize-kana",
  "map-script",
  "match-sound-word",
  "assemble-reading",
] as const;

function phoneticLessonWithOperations(
  operations: readonly BasePhoneticActivityOperation[],
): BaseLessonContent {
  return {
    ...phoneticLesson(),
    activities: [
      ...operations.map(
        (operation, index) =>
          ({
            ...activity(index + 1, "meaning-comprehension"),
            id: `phonetic-${index + 1}`,
            targetId: `answer-${index + 1}`,
            operation,
          }),
      ),
      activity(9, "listening", "audio"),
      activity(10, "spoken", "audio"),
    ],
  };
}

function codes(lesson: BaseLessonContent): readonly string[] {
  return validateBaseLessonDepth(lesson, CATALOGS).map((error) => error.code);
}

describe("Base lesson depth rules", () => {
  it("accepts valid phonetic and system contracts using only catalog references", () => {
    expect(validateBaseLessonDepth(phoneticLesson(), CATALOGS)).toEqual([]);
    expect(validateBaseLessonDepth(systemLesson(), CATALOGS)).toEqual([]);
  });

  it("reports phonetic count, operation, and audio boundaries additively", () => {
    const lesson = phoneticLesson();
    if (lesson.contract !== "phonetic") throw new Error("fixture contract");
    const mutated: BaseLessonContent = {
      ...lesson,
      contrastiveItemIds: [...lesson.contrastiveItemIds, ...Array.from({ length: 7 }, (_, i) => `x-${i}`)],
      anchorLexemeIds: lesson.anchorLexemeIds.slice(0, 3),
      audioExemplarIds: lesson.audioExemplarIds.slice(0, 5),
      activities: lesson.activities.slice(0, 5),
    };

    expect(codes(mutated)).toEqual(
      expect.arrayContaining([
        "phonetic-contrast-count",
        "phonetic-anchor-count",
        "phonetic-audio-count",
        "phonetic-nonspoken-operations",
        "phonetic-listening-count",
        "phonetic-spoken-count",
      ]),
    );
  });

  it("reports substantive count and visible-example boundaries for content and synthesis", () => {
    const content: BaseLessonContent = { ...systemLesson(), contract: "content", newLexemeIds: ["verb-kaku"], workedExampleIds: EXAMPLES.slice(0, 11).map((entry) => entry.id) };
    const synthesis: BaseLessonContent = {
      ...systemLesson(),
      contract: "synthesis" as const,
      newLexemeIds: ["verb-kaku"],
      introducedConceptIds: ["dictionary-lemma"],
      reviewLexemeIds: EXAMPLES.slice(0, 11).map(() => "verb-kaku"),
      retrievedSystemIds: ["a", "b", "c"],
      workedExampleIds: EXAMPLES.slice(0, 11).map((entry) => entry.id),
      dialogueId: "dialogue-1",
    };

    expect(codes(content)).toEqual(
      expect.arrayContaining(["content-new-lexeme-count", "content-example-count"]),
    );
    expect(codes(synthesis)).toEqual(
      expect.arrayContaining([
        "synthesis-new-content",
        "synthesis-review-lexeme-count",
        "synthesis-retrieved-system-count",
        "synthesis-example-count",
      ]),
    );
  });

  it("rejects missing pattern cells, cosmetic duplicate fingerprints, category caps, dialogue overlap, and unresolved references", () => {
    const lesson = systemLesson();
    const duplicateExample = {
      ...EXAMPLES[0],
      id: "example-2",
      tokens: [token("duplicate-example-token", "例1")],
    } as BaseExample;
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([
        ...CATALOGS.examples,
        [duplicateExample.id, duplicateExample],
      ]),
      dialogues: new Map([
        [
          "dialogue-1",
          {
            ...DIALOGUE,
            turns: [
              {
                ...DIALOGUE.turns[0],
                tokens: [token("duplicate-dialogue-token", "例1")],
                formIds: EXAMPLES[0].formIds,
                semanticRoleIds: EXAMPLES[0].semanticRoleIds,
                discourseFrameId: EXAMPLES[0].discourseFrameId,
              },
            ],
          },
        ],
      ]),
    };
    const mutated = {
      ...lesson,
      activities: [
        ...lesson.activities,
        { ...lesson.activities[0], id: "activity-extra" },
      ],
      workedExampleIds: [
        "example-1",
        "example-2",
        "example-3",
        "example-4",
        "example-5",
        "example-6",
        "example-7",
        "example-8",
        "example-9",
        "missing-example",
      ],
      patternCellIds: ["cell-1", "cell-2", "missing-cell"],
      dialogueId: "dialogue-1",
    };

    expect(validateBaseLessonDepth(mutated, catalogs).map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "system-pattern-cell-unrepresented",
        "duplicate-semantic-fingerprint",
        "activity-category-cap",
        "dialogue-example-fingerprint-overlap",
        "unresolved-reference",
      ]),
    );
  });

  it("enforces semantic activity counts, unique operation targets, and reserves worked examples for teaching", () => {
    const lesson = systemLesson();
    const mutated = {
      ...lesson,
      activities: [
        { ...lesson.activities[0], targetId: "example-1" },
        ...lesson.activities.slice(1, 7),
        { ...lesson.activities[6], id: "activity-duplicate" },
      ],
    };

    expect(codes(mutated)).toEqual(
      expect.arrayContaining([
        "duplicate-target-operation",
        "worked-example-reused-by-activity",
        "semantic-spoken-audio-count",
      ]),
    );
  });

  it("rejects an accepted-answer alias that reuses a worked example's visible surface", () => {
    const aliasId = "alias-example-surface";
    const lesson = {
      ...systemLesson(),
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: aliasId },
        ...SEMANTIC_ACTIVITIES.slice(1),
      ],
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      acceptedAnswerTokens: new Map([
        ...CATALOGS.acceptedAnswerTokens,
        [aliasId, EXAMPLES[0].tokens],
      ]),
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "worked-example-reused-by-activity",
          referenceId: aliasId,
        }),
      ]),
    );
  });

  it("accepts nine semantic nonspoken activities across at least six capped categories", () => {
    const lesson = {
      ...systemLesson(),
      activities: [...SEMANTIC_ACTIVITIES, activity(11, "contextual-response")],
    };

    expect(validateBaseLessonDepth(lesson, CATALOGS)).toEqual([]);
  });

  it("does not count nonspoken listening or spoken activities toward semantic coverage", () => {
    const lesson = {
      ...systemLesson(),
      activities: [
        activity(1, "meaning-comprehension"),
        activity(2, "form-function-discrimination"),
        activity(3, "ordering"),
        activity(4, "controlled-production"),
        activity(5, "listening"),
        activity(6, "spoken"),
        activity(9, "listening", "audio"),
        activity(10, "spoken", "audio"),
      ],
    };

    expect(codes(lesson)).toEqual(
      expect.arrayContaining([
        "illegal-activity-combination",
        "semantic-category-coverage",
      ]),
    );
  });

  it("requires all six distinct closed phonetic operations, not six targets", () => {
    expect(
      codes(
        phoneticLessonWithOperations(
          Array<BasePhoneticActivityOperation>(6).fill("discriminate-sound"),
        ),
      ),
    ).toContain("phonetic-nonspoken-operations");
    expect(validateBaseLessonDepth(phoneticLessonWithOperations(PHONETIC_OPERATIONS), CATALOGS)).toEqual(
      [],
    );
  });

  it("derives example uniqueness and pattern coverage from canonical semantic data", () => {
    const cosmeticDuplicate = {
      ...EXAMPLES[0],
      id: "example-2",
      tokens: [token("cosmetic-token", "例1")],
      patternCellIds: ["cell-3"],
      teachingPurposeCopyId: "purpose-2",
      translationCopy: { copyId: "translation-2" },
      semanticFingerprint: "fake-cosmetic-fingerprint",
    } as unknown as BaseExample;
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [cosmeticDuplicate.id, cosmeticDuplicate]]),
      patternCellIds: new Set([...CATALOGS.patternCellIds, "cell-3"]),
    };

    expect(
      validateBaseLessonDepth(
        { ...systemLesson(), patternCellIds: ["cell-3"] },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-semantic-fingerprint" }),
        expect.objectContaining({
          code: "system-pattern-cell-unrepresented",
          referenceId: "cell-3",
        }),
      ]),
    );
  });

  it("does not let cosmetic token segmentation create a pattern-coverage cell", () => {
    const segmented = {
      ...EXAMPLES[0],
      id: "example-segmented",
      tokens: [
        token("segmented-stem", "例"),
        {
          ...token("segmented-ending", "1"),
          kind: "morpheme" as const,
          boundaryBefore: "attach" as const,
        },
      ],
      patternCellIds: ["cell-3"],
    } as BaseExample;
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [segmented.id, segmented]]),
      patternCellIds: new Set([...CATALOGS.patternCellIds, "cell-3"]),
    };
    const lesson = {
      ...systemLesson(),
      workedExampleIds: [
        "example-1",
        segmented.id,
        "example-2",
        "example-3",
        "example-4",
        "example-5",
        "example-6",
        "example-7",
        "example-8",
        "example-9",
      ],
      patternCellIds: ["cell-3"],
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-semantic-fingerprint" }),
        expect.objectContaining({
          code: "system-pattern-cell-unrepresented",
          referenceId: "cell-3",
        }),
      ]),
    );
  });

  it("does not collapse identical Japanese when form, roles, or discourse differ", () => {
    const semanticallyDistinct = {
      ...EXAMPLES[1],
      tokens: [token("distinct-token", "例1")],
      formIds: ["te-imasu"],
      semanticRoleIds: ["topic"],
      discourseFrameId: "different-frame",
      semanticFingerprint: "fake-distinct-fingerprint",
    } as unknown as BaseExample;
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [semanticallyDistinct.id, semanticallyDistinct]]),
    };

    expect(
      validateBaseLessonDepth(systemLesson(), catalogs).map((error) => error.code),
    ).not.toContain("duplicate-semantic-fingerprint");
  });

  it("derives dialogue and activity collisions without trusting authored labels or widgets", () => {
    const matchingTurn = {
      ...DIALOGUE.turns[0],
      speakerId: "another-speaker",
      tokens: [token("dialogue-cosmetic-token", "例1")],
      formIds: EXAMPLES[0].formIds,
      semanticRoleIds: EXAMPLES[0].semanticRoleIds,
      discourseFrameId: EXAMPLES[0].discourseFrameId,
      semanticFingerprint: "fake-dialogue-fingerprint",
    } as unknown as BaseDialogue["turns"][number];
    const duplicateActivity = {
      ...SEMANTIC_ACTIVITIES[0],
      id: "activity-cosmetic-duplicate",
      category: "ordering",
      interactionKind: "tile-ordering",
      targetId: "answer-1",
      operation: "recognize-meaning",
      targetOperationFingerprint: "fake-operation-fingerprint",
    } as unknown as BaseActivityDefinition;
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      dialogues: new Map([[DIALOGUE.id, { ...DIALOGUE, turns: [matchingTurn] }]]),
    };

    expect(
      validateBaseLessonDepth(
        { ...systemLesson(), activities: [...SEMANTIC_ACTIVITIES, duplicateActivity] },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "dialogue-example-fingerprint-overlap" }),
        expect.objectContaining({ code: "duplicate-target-operation" }),
        expect.objectContaining({ code: "activity-category-operation-mismatch" }),
      ]),
    );
  });

  it("validates every dialogue turn's references, particle frame, and token metadata", () => {
    const dialogue: BaseDialogue = {
      ...DIALOGUE,
      turns: [
        {
          ...DIALOGUE.turns[0],
          tokens: [
            {
              ...token("bad-turn-token", "悪"),
              romaji: "",
              boundaryBefore: "space",
            },
          ],
          lexemeIds: ["missing-turn-lexeme"],
          conceptIds: ["missing-turn-concept"],
          formIds: ["missing-turn-form"],
          patternCellIds: ["missing-turn-cell"],
          particleFrame: {
            predicateSenseId: "eat",
            provided: { theme: "goal-ni" },
          },
        },
      ],
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      dialogues: new Map([[dialogue.id, dialogue]]),
    };

    expect(validateBaseLessonDepth(systemLesson(), catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-turn-lexeme",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-turn-concept",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-turn-form",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-turn-cell",
        }),
        expect.objectContaining({
          code: "unlicensed-particle",
          referenceId: "dialogue-1:0",
        }),
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: "dialogue-1:0",
        }),
      ]),
    );
    expect(
      validateFirstTeachOrder([systemLesson()], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unlicensed-particle",
          referenceId: "dialogue-1:0",
        }),
      ]),
    );
  });
});

describe("Base sequence rules", () => {
  it("includes phonetic prompts, accepted targets, and audio exemplars in review surfaces", () => {
    const phonetic = phoneticLesson();
    const brokenAudio = {
      ...phonetic,
      audioExemplarIds: [
        "audio-1",
        "audio-2",
        "audio-3",
        "audio-4",
        "audio-5",
        "missing-audio",
      ],
    } as BaseLessonContent;

    expect(visibleJapaneseFor([phonetic], CATALOGS)).toBe(
      "問1答1問2答2問3答3問4答4問5答5問6答6問7音1問8答8音2音3音4音5音6",
    );
    expect(validateBaseLessonDepth(brokenAudio, CATALOGS)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-audio",
          detail: "phonetic audio exemplar",
        }),
      ]),
    );
  });

  it("uses authoring catalog tokens as the only Japanese visibility surface", () => {
    const lesson = {
      ...systemLesson(),
      lessonId: "requests-connection-4",
      workedExampleIds: ["example-1"],
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: "answer-1" },
        SEMANTIC_ACTIVITIES[8],
      ],
    };

    expect(visibleJapaneseFor([lesson], CATALOGS)).toBe("例1会1会2会3会4問1答1問9音1");
  });

  it("rejects forward adjective cells, ongoing dynamic nonpast, forbidden explanatory forms, and unlicensed particles", () => {
    const ongoing = {
      ...EXAMPLES[0],
      formIds: ["te-imasu"],
      interpretationTags: ["ongoing-now"] as const,
    };
    const dynamicOngoing = {
      ...EXAMPLES[1],
      interpretationTags: ["ongoing-now"] as const,
    };
    const forbiddenAndParticle: BaseExample = {
      ...EXAMPLES[2],
      formIds: ["i-adjective-tense-polarity", "explanatory-no"],
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: "focus-subject-ga" },
      },
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([
        ...CATALOGS.examples,
        [ongoing.id, ongoing],
        [dynamicOngoing.id, dynamicOngoing],
        [forbiddenAndParticle.id, forbiddenAndParticle],
      ]),
    };
    const lesson = {
      ...systemLesson(),
      lessonId: "time-movement-4",
      workedExampleIds: [ongoing.id, dynamicOngoing.id, forbiddenAndParticle.id],
      introducedConceptIds: [],
      newLexemeIds: [],
    };

    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs).map(
        (error) => error.code,
      ),
    ).toEqual(
      expect.arrayContaining([
        "first-teach-before-owner",
        "adjective-cell-before-module-seven",
        "te-imasu-ongoing-before-requests-connection-4",
        "dynamic-nonpast-ongoing-now",
        "forbidden-explanatory-no",
        "unlicensed-particle",
      ]),
    );
  });

  it("permits dynamic ongoing-now only through te-imasu at its owning lesson", () => {
    const plainDynamic = {
      ...EXAMPLES[0],
      id: "plain-dynamic-ongoing",
      formIds: ["masu-nonpast"],
      interpretationTags: ["ongoing-now"] as const,
    };
    const teImasuAtOwner = {
      ...EXAMPLES[1],
      id: "te-imasu-ongoing-owner",
      formIds: ["te-imasu"],
      interpretationTags: ["ongoing-now"] as const,
    };
    const teImasuEarlier = {
      ...EXAMPLES[2],
      id: "te-imasu-ongoing-earlier",
      formIds: ["te-imasu"],
      interpretationTags: ["ongoing-now"] as const,
    };
    const teImasuHabitual = {
      ...EXAMPLES[3],
      id: "te-imasu-habitual-owner",
      formIds: ["te-imasu"],
      interpretationTags: ["habitual"] as const,
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([
        ...CATALOGS.examples,
        [plainDynamic.id, plainDynamic],
        [teImasuAtOwner.id, teImasuAtOwner],
        [teImasuEarlier.id, teImasuEarlier],
        [teImasuHabitual.id, teImasuHabitual],
      ]),
    };
    const lessonAtOwner = {
      ...systemLesson(),
      lessonId: "requests-connection-4",
      newLexemeIds: [],
      introducedConceptIds: [],
    };
    const errorsFor = (lessonId: string, exampleId: string) =>
      validateFirstTeachOrder(
        [{ ...lessonAtOwner, lessonId, workedExampleIds: [exampleId] }],
        BASE_FIRST_TEACH_OWNERS,
        catalogs,
      ).map((error) => error.code);

    expect(errorsFor("requests-connection-4", plainDynamic.id)).toContain(
      "dynamic-nonpast-ongoing-now",
    );
    expect(errorsFor("requests-connection-4", teImasuAtOwner.id)).not.toContain(
      "dynamic-nonpast-ongoing-now",
    );
    expect(errorsFor("requests-connection-4", teImasuAtOwner.id)).not.toContain(
      "te-imasu-ongoing-before-requests-connection-4",
    );
    expect(errorsFor("requests-connection-3", teImasuEarlier.id)).toContain(
      "te-imasu-ongoing-before-requests-connection-4",
    );
    expect(errorsFor("base-synthesis-1", teImasuAtOwner.id)).not.toContain(
      "te-imasu-ongoing-before-requests-connection-4",
    );
    expect(errorsFor("requests-connection-4", teImasuHabitual.id)).not.toContain(
      "dynamic-nonpast-ongoing-now",
    );
  });

  it("requires introduced targets to be owned by their declaring lesson", () => {
    const lesson = {
      ...systemLesson(),
      lessonId: "time-movement-4",
      introducedConceptIds: ["i-adjective-tense-polarity"],
    };

    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, CATALOGS),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "introduced-id-owner-mismatch",
          referenceId: "i-adjective-tense-polarity",
        }),
      ]),
    );
  });

  it("requires each new lexeme to be owned by the declaring lesson, not merely earlier", () => {
    const earlierLexemeIds = [
      "verb-kaku",
      "verb-oyogu",
      "verb-hanasu",
      "verb-matsu",
      "verb-shinu",
      "verb-asobu",
      "verb-nomu",
      "verb-kau",
    ];
    const lesson: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "requests-connection-2",
      contract: "content",
      newLexemeIds: earlierLexemeIds,
      introducedConceptIds: [],
      workedExampleIds: EXAMPLES.slice(0, 6).map((entry) => entry.id),
    };

    expect(
      validateBaseLessonDepth(lesson, CATALOGS).map((error) => error.code),
    ).not.toContain("content-new-lexeme-count");
    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, CATALOGS),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "new-lexeme-owner-mismatch",
          referenceId: "verb-kaku",
        }),
      ]),
    );
  });

  it("uses global course order when a Base lesson depends on an A1 owner", () => {
    const a1Concept: BaseConcept = {
      id: "fixture-a1-sequence-concept",
      kind: "concept",
      prerequisiteIds: [],
      firstTeachLessonId: "introductions-1",
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      concepts: new Map([...CATALOGS.concepts, [a1Concept.id, a1Concept]]),
    };
    const owners = [
      ...BASE_FIRST_TEACH_OWNERS,
      {
        contentId: a1Concept.id,
        levelId: "a1" as const,
        lessonId: a1Concept.firstTeachLessonId,
        kind: "concept" as const,
      },
    ];
    const baseLesson: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "base-synthesis-4",
      contract: "synthesis",
      newLexemeIds: [],
      introducedConceptIds: [],
      reviewedConceptIds: [a1Concept.id],
      workedExampleIds: [],
    };

    expect(validateFirstTeachOrder([baseLesson], owners, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: a1Concept.id,
        }),
      ]),
    );
  });

  it("applies first-teach visibility to dialogue turns as authored content", () => {
    const dialogue: BaseDialogue = {
      ...DIALOGUE,
      turns: [
        {
          ...DIALOGUE.turns[0],
          lexemeIds: ["adjective-takai"],
          formIds: ["i-adjective-tense-polarity"],
        },
      ],
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      dialogues: new Map([[dialogue.id, dialogue]]),
    };
    const lesson = {
      ...systemLesson(),
      lessonId: "time-movement-4",
      newLexemeIds: [],
      introducedConceptIds: [],
    };

    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "adjective-takai",
        }),
      ]),
    );
  });
});
