import { describe, expect, it } from "vitest";
import * as sequenceRules from "./sequenceRules";
import type { AssembledToken } from "../../../romaji/types";
import {
  BASE_CONCEPT_BY_ID,
  BASE_RETRIEVAL_SYSTEM_BY_ID,
} from "../catalog/concepts";
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
  BaseVisibleTarget,
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

function visibleTarget(
  tokens: readonly AssembledToken[],
  overrides: Partial<BaseVisibleTarget> = {},
): BaseVisibleTarget {
  return {
    tokens,
    lexemeIds: ["verb-kaku"],
    conceptIds: ["dictionary-lemma"],
    formIds: ["masu-nonpast"],
    patternCellIds: ["cell-1"],
    semanticRoleIds: ["agent", "theme"],
    interpretationTags: ["habitual"],
    predicateAspect: "dynamic",
    discourseFrameId: "target-frame",
    ...overrides,
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

const NEW_CONTENT_EXAMPLES: readonly BaseExample[] = [
  {
    ...example(15),
    id: "adjective-takai-example",
    tokens: [token("adjective-takai-example-token", "高い")],
    lexemeIds: ["adjective-takai"],
    conceptIds: ["i-adjective-class"],
    formIds: ["i-adjective-tense-polarity"],
    predicateAspect: "adjectival",
    interpretationTags: ["present-state"],
    semanticRoleIds: [],
    discourseFrameId: "adjective-takai-frame",
  },
  {
    ...example(16),
    id: "adjective-oishii-example",
    tokens: [token("adjective-oishii-example-token", "おいしい")],
    lexemeIds: ["adjective-oishii"],
    conceptIds: ["i-adjective-class"],
    formIds: ["i-adjective-tense-polarity"],
    predicateAspect: "adjectival",
    interpretationTags: ["present-state"],
    semanticRoleIds: [],
    discourseFrameId: "adjective-oishii-frame",
  },
  {
    ...example(17),
    id: "adjective-ii-example",
    tokens: [token("adjective-ii-example-token", "いい")],
    lexemeIds: ["adjective-ii"],
    conceptIds: ["i-adjective-class"],
    formIds: ["i-adjective-tense-polarity"],
    predicateAspect: "adjectival",
    interpretationTags: ["present-state"],
    semanticRoleIds: [],
    discourseFrameId: "adjective-ii-frame",
  },
];

const NEW_CONTENT_TARGETS: readonly (readonly [string, BaseVisibleTarget])[] = [
  [
    "answer-adjective-takai",
    visibleTarget([token("answer-adjective-takai-token", "高いです")], {
      lexemeIds: ["adjective-takai"],
      conceptIds: ["i-adjective-class"],
      formIds: ["i-adjective-tense-polarity"],
      predicateAspect: "adjectival",
      interpretationTags: ["present-state"],
      semanticRoleIds: [],
      discourseFrameId: "answer-adjective-takai-frame",
    }),
  ],
  [
    "answer-adjective-oishii",
    visibleTarget([token("answer-adjective-oishii-token", "おいしいです")], {
      lexemeIds: ["adjective-oishii"],
      conceptIds: ["i-adjective-class"],
      formIds: ["i-adjective-tense-polarity"],
      predicateAspect: "adjectival",
      interpretationTags: ["present-state"],
      semanticRoleIds: [],
      discourseFrameId: "answer-adjective-oishii-frame",
    }),
  ],
  [
    "answer-adjective-ii",
    visibleTarget([token("answer-adjective-ii-token", "いいです")], {
      lexemeIds: ["adjective-ii"],
      conceptIds: ["i-adjective-class"],
      formIds: ["i-adjective-tense-polarity"],
      predicateAspect: "adjectival",
      interpretationTags: ["present-state"],
      semanticRoleIds: [],
      discourseFrameId: "answer-adjective-ii-frame",
    }),
  ],
];

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
  ...Array.from({ length: 17 }, (_, index) => [
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
  examples: new Map(
    [...EXAMPLES, ...NEW_CONTENT_EXAMPLES].map((entry) => [entry.id, entry]),
  ),
  dialogues: new Map([[DIALOGUE.id, DIALOGUE]]),
  audioTargets: new Map(
    Array.from({ length: 6 }, (_, index) => [
      `audio-${index + 1}`,
      visibleTarget([token(`audio-${index + 1}-token`, `音${index + 1}`)]),
    ]),
  ),
  activityPromptTargets: new Map(
    Array.from({ length: 11 }, (_, index) => [
      `activity-${index + 1}`,
      visibleTarget([token(`prompt-${index + 1}`, `問${index + 1}`)]),
    ]),
  ),
  copyIds: COPY_IDS,
  contrastMapIds: new Set(["contrast-map-1"]),
  referenceSnapshotIds: new Set(["reference-sentence-order"]),
  patternCellIds: new Set(["cell-1", "cell-2"]),
  systems: BASE_RETRIEVAL_SYSTEM_BY_ID,
  acceptedAnswerTargets: new Map(
    [
      ...Array.from({ length: 11 }, (_, index) => [
        `answer-${index + 1}`,
        visibleTarget([token(`answer-${index + 1}-token`, `答${index + 1}`)]),
      ] as const),
      ...NEW_CONTENT_TARGETS,
    ],
  ),
};

function systemLesson(): BaseSystemLessonContent {
  return {
    lessonId: "copula-adjectives-4",
    contract: "system",
    prerequisiteLessonIds: ["copula-adjectives-3"],
    activities: SEMANTIC_ACTIVITIES.map((entry, index) =>
      index < NEW_CONTENT_TARGETS.length
        ? { ...entry, targetId: NEW_CONTENT_TARGETS[index][0] }
        : entry,
    ),
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
    workedExampleIds: [
      ...NEW_CONTENT_EXAMPLES.map((entry) => entry.id),
      ...EXAMPLES.slice(0, 7).map((entry) => entry.id),
    ],
    dialogueId: "dialogue-1",
    referenceSnapshotIds: ["reference-sentence-order"],
    interactive: false,
    retrievedSystemIds: [],
  };
}

function hiddenSystemLesson(): BaseSystemLessonContent {
  return {
    ...systemLesson(),
    activities: SEMANTIC_ACTIVITIES,
    workedExampleIds: EXAMPLES.slice(0, 10).map((entry) => entry.id),
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

  it("requires declared semantic content to be visible and retrieved, not just counted", () => {
    const errors = validateBaseLessonDepth(hiddenSystemLesson(), CATALOGS);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "new-lexeme-not-visible",
          referenceId: "adjective-takai",
        }),
        expect.objectContaining({
          code: "new-lexeme-not-retrieved",
          referenceId: "adjective-oishii",
        }),
        expect.objectContaining({
          code: "introduced-content-not-visible",
          referenceId: "i-adjective-tense-polarity",
        }),
        expect.objectContaining({
          code: "introduced-content-not-retrieved",
          referenceId: "i-adjective-tense-polarity",
        }),
      ]),
    );
  });

  it("requires canonical synthesis systems to be visible and actively retrieved", () => {
    const systemIds = [
      "sentence-anatomy",
      "particle-atlas",
      "verb-classes-conjugation",
      "tense-polarity",
    ];
    const componentIds = [
      "sentence-chunks",
      "topic-wa",
      "dictionary-lemma",
      "four-polite-tense-cells",
    ];
    const systems = new Map(
      systemIds.map((id, index) => [
        id,
        {
          id,
          firstTeachLessonId: [
            "sentence-foundations-2",
            "argument-particles-4",
            "polite-verbs-1",
            "time-movement-3",
          ][index],
          componentContentIds: [componentIds[index]],
        },
      ]),
    );
    const retrievedExamples = componentIds.map((componentId, index) => ({
      ...EXAMPLES[index],
      id: `retrieved-system-example-${index + 1}`,
      tokens: [token(`retrieved-system-token-${index + 1}`, `系${index + 1}`)],
      conceptIds:
        componentId === "four-polite-tense-cells" ? [] : [componentId],
      formIds:
        componentId === "four-polite-tense-cells" ? [componentId] : [],
      discourseFrameId: `retrieved-system-frame-${index + 1}`,
    }));
    const catalogs = {
      ...CATALOGS,
      examples: new Map([
        ...CATALOGS.examples,
        ...retrievedExamples.map((entry) => [entry.id, entry] as const),
      ]),
      systems,
    } as unknown as BaseValidationCatalogs;
    const synthesis: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "base-synthesis-4",
      contract: "synthesis",
      newLexemeIds: [],
      introducedConceptIds: [],
      reviewedConceptIds: [],
      reviewLexemeIds: [
        "verb-kaku",
        "verb-oyogu",
        "verb-hanasu",
        "verb-matsu",
        "verb-shinu",
        "verb-asobu",
        "verb-nomu",
        "verb-kau",
        "verb-taberu",
        "verb-miru",
        "verb-suru",
        "verb-kuru",
      ],
      workedExampleIds: [
        ...retrievedExamples.map((entry) => entry.id),
        EXAMPLES[4].id,
        EXAMPLES[5].id,
      ],
      retrievedSystemIds: systemIds,
      activities: [
        ...SEMANTIC_ACTIVITIES,
        {
          ...activity(11, "cumulative-retrieval"),
          assessedConceptIds: componentIds,
        },
      ],
    };

    expect(
      validateBaseLessonDepth(
        { ...synthesis, retrievedSystemIds: ["invented-a", "invented-b", "invented-c", "invented-d"] },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "invented-a",
          detail: "retrieved system",
        }),
      ]),
    );
    expect(
      validateBaseLessonDepth(
        {
          ...synthesis,
          activities: [
            ...SEMANTIC_ACTIVITIES,
            { ...activity(11, "cumulative-retrieval"), assessedConceptIds: [] },
          ],
        },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "synthesis-system-not-retrieved",
          referenceId: "sentence-anatomy",
        }),
      ]),
    );
    expect(
      validateBaseLessonDepth(
        {
          ...synthesis,
          workedExampleIds: [EXAMPLES[0].id, EXAMPLES[1].id, EXAMPLES[2].id, EXAMPLES[3].id, EXAMPLES[4].id, EXAMPLES[5].id],
        },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "synthesis-system-not-visible",
          referenceId: "sentence-anatomy",
        }),
      ]),
    );
    const invalidComponentCatalogs = {
      ...catalogs,
      systems: new Map([
        ...systems,
        [
          "sentence-anatomy",
          {
            id: "sentence-anatomy",
            firstTeachLessonId: "sentence-foundations-2",
            componentContentIds: ["missing-system-component"],
          },
        ],
      ]),
    } as unknown as BaseValidationCatalogs;
    expect(validateBaseLessonDepth(synthesis, invalidComponentCatalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-system-component",
          detail: "retrieved system component",
        }),
      ]),
    );
    expect(validateBaseLessonDepth(synthesis, catalogs)).toEqual([]);
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

  it("requires distinct substantive phonetic evidence and catalogued references", () => {
    const lesson = phoneticLesson();
    if (lesson.contract !== "phonetic") throw new Error("fixture contract");
    const sameAudio = visibleTarget([token("same-phonetic-audio", "音")]);
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      audioTargets: new Map([
        ...CATALOGS.audioTargets,
        ...Array.from({ length: 6 }, (_, index) => [
          `same-audio-${index + 1}`,
          sameAudio,
        ] as const),
      ]),
    };
    const mutated: BaseLessonContent = {
      ...lesson,
      contrastiveItemIds: Array<string>(10).fill("contrast-1"),
      anchorLexemeIds: Array<string>(4).fill("verb-kaku"),
      audioExemplarIds: Array.from({ length: 6 }, (_, index) => `same-audio-${index + 1}`),
      phoneticExplanationCopyId: "missing-phonetic-explanation",
      contrastMapId: "missing-phonetic-map",
    };

    expect(validateBaseLessonDepth(mutated, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "phonetic-contrast-count" }),
        expect.objectContaining({ code: "phonetic-anchor-count" }),
        expect.objectContaining({ code: "phonetic-audio-count" }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-phonetic-explanation",
          detail: "phonetic explanation copy",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-phonetic-map",
          detail: "phonetic contrast map",
        }),
      ]),
    );
  });

  it("rejects blank phonetic contrast identifiers", () => {
    const lesson = phoneticLesson();
    if (lesson.contract !== "phonetic") throw new Error("fixture contract");
    const mutated: BaseLessonContent = {
      ...lesson,
      contrastiveItemIds: [
        "",
        "contrast-2",
        "contrast-3",
        "contrast-4",
        "contrast-5",
        "contrast-6",
        "contrast-7",
        "contrast-8",
        "contrast-9",
        "contrast-10",
      ],
    };

    expect(validateBaseLessonDepth(mutated, CATALOGS)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-phonetic-contrast-id",
          referenceId: "",
        }),
      ]),
    );
  });

  it("does not count an empty audio surface as phonetic evidence", () => {
    const lesson = phoneticLesson();
    if (lesson.contract !== "phonetic") throw new Error("fixture contract");
    const audioIds = [
      "empty-audio",
      "visible-audio-1",
      "visible-audio-2",
      "visible-audio-3",
      "visible-audio-4",
      "visible-audio-5",
    ];
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      audioTargets: new Map([
        ...CATALOGS.audioTargets,
        ["empty-audio", visibleTarget([token("empty-audio-token", " ")])],
        ...audioIds.slice(1).map((id, index) => [
          id,
          visibleTarget([token(`${id}-token`, `音${index + 1}`)]),
        ] as const),
      ]),
    };

    expect(
      validateBaseLessonDepth(
        { ...lesson, audioExemplarIds: audioIds },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "phonetic-audio-count" }),
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

  it("rejects visible target reuse across different valid operations and target aliases", () => {
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        ["visible-alias-meaning", visibleTarget([token("visible-meaning", "同")])],
        ["visible-alias-form", visibleTarget([token("visible-form", "同")])],
      ]),
    };
    const lesson = {
      ...systemLesson(),
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: "visible-alias-meaning" },
        SEMANTIC_ACTIVITIES[1],
        { ...SEMANTIC_ACTIVITIES[2], targetId: "visible-alias-form" },
        ...SEMANTIC_ACTIVITIES.slice(3),
      ],
    };

    const errors = validateBaseLessonDepth(lesson, catalogs);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-visible-target",
          referenceId: "visible-alias-form",
          detail: expect.stringContaining("activity-3"),
        }),
      ]),
    );
    expect(errors.map((error) => error.code)).not.toContain(
      "duplicate-target-operation",
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
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        [aliasId, visibleTarget(EXAMPLES[0].tokens)],
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

  it("does not let an activity-only example satisfy worked pattern-cell coverage", () => {
    const target: BaseExample = {
      ...EXAMPLES[10],
      id: "activity-only-pattern-example",
      patternCellIds: ["activity-only-cell"],
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [target.id, target]]),
      patternCellIds: new Set([...CATALOGS.patternCellIds, "activity-only-cell"]),
    };
    const lesson = {
      ...systemLesson(),
      patternCellIds: ["activity-only-cell"],
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: target.id },
        ...SEMANTIC_ACTIVITIES.slice(1),
      ],
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "system-pattern-cell-unrepresented",
          referenceId: "activity-only-cell",
        }),
      ]),
    );
  });

  it("accepts nine semantic nonspoken activities across at least six capped categories", () => {
    const lesson = {
      ...systemLesson(),
      activities: [
        ...systemLesson().activities,
        activity(11, "contextual-response"),
      ],
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

  it("requires two nonblank speakers for a dialogue with the required turn count", () => {
    const singleSpeaker: BaseDialogue = {
      ...DIALOGUE,
      id: "single-speaker-dialogue",
      turns: DIALOGUE.turns.map((turn) => ({
        ...turn,
        speakerId: "speaker-a",
      })),
    };
    const blankSpeaker: BaseDialogue = {
      ...DIALOGUE,
      id: "blank-speaker-dialogue",
      turns: DIALOGUE.turns.map((turn, index) => ({
        ...turn,
        speakerId: index === 0 ? "   " : index % 2 === 0 ? "speaker-a" : "speaker-b",
      })),
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      dialogues: new Map([
        [singleSpeaker.id, singleSpeaker],
        [blankSpeaker.id, blankSpeaker],
      ]),
    };
    const interactiveLesson = {
      ...systemLesson(),
      interactive: true,
    };

    expect(
      validateBaseLessonDepth(
        { ...interactiveLesson, dialogueId: singleSpeaker.id },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "dialogue-speaker-count",
          referenceId: singleSpeaker.id,
          detail: "1",
        }),
      ]),
    );
    expect(
      validateBaseLessonDepth(
        { ...interactiveLesson, dialogueId: blankSpeaker.id },
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-speaker",
          referenceId: `${blankSpeaker.id}:0`,
        }),
      ]),
    );
  });

  it("validates an activity-only example through the canonical depth and sequence paths once", () => {
    const target: BaseExample = {
      ...EXAMPLES[0],
      id: "activity-only-invalid-example",
      tokens: [
        {
          ...token("activity-only-invalid-token", "悪"),
          romaji: "",
          boundaryBefore: "space",
        },
      ],
      lexemeIds: ["missing-activity-target-lexeme"],
      conceptIds: ["missing-activity-target-concept"],
      formIds: ["te-imasu", "missing-activity-target-form"],
      patternCellIds: ["missing-activity-target-cell"],
      predicateAspect: "dynamic",
      interpretationTags: ["future"],
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: "goal-ni" },
      },
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [target.id, target]]),
    };
    const lesson: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "time-movement-4",
      newLexemeIds: [],
      introducedConceptIds: [],
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: target.id },
        ...SEMANTIC_ACTIVITIES.slice(1),
      ],
    };

    const depthErrors = validateBaseLessonDepth(lesson, catalogs);
    expect(depthErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: target.id,
          detail: expect.stringContaining("activity target example"),
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-activity-target-lexeme",
          detail: "activity target example lexeme",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-activity-target-concept",
          detail: "activity target example concept",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-activity-target-form",
          detail: "activity target example form",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-activity-target-cell",
          detail: "activity target example pattern cell",
        }),
        expect.objectContaining({
          code: "unlicensed-particle",
          referenceId: target.id,
        }),
      ]),
    );
    expect(
      depthErrors.filter(
        (error) =>
          error.code === "invalid-token-sequence" &&
          error.referenceId === target.id,
      ),
    ).toHaveLength(1);

    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "te-imasu",
          detail: expect.stringContaining("activity target example"),
        }),
        expect.objectContaining({
          code: "unlicensed-particle",
          referenceId: target.id,
        }),
      ]),
    );
  });

  it("validates activity prompts and accepted or audio target token sequences", () => {
    const invalid = {
      ...token("invalid-activity-token", "悪"),
      romaji: "",
      boundaryBefore: "space" as const,
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      activityPromptTargets: new Map([
        ...CATALOGS.activityPromptTargets,
        ["activity-1", visibleTarget([invalid])],
      ]),
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        ["invalid-accepted-target", visibleTarget([invalid])],
      ]),
      audioTargets: new Map([
        ...CATALOGS.audioTargets,
        ["invalid-audio-target", visibleTarget([invalid])],
      ]),
    };
    const lesson: BaseLessonContent = {
      ...systemLesson(),
      activities: [
        {
          ...SEMANTIC_ACTIVITIES[0],
          targetId: "invalid-accepted-target",
        },
        ...SEMANTIC_ACTIVITIES.slice(1, 9),
        { ...SEMANTIC_ACTIVITIES[9], targetId: "invalid-audio-target" },
      ],
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: "activity-1",
          detail: expect.stringContaining("activity prompt"),
        }),
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: "invalid-accepted-target",
          detail: expect.stringContaining("accepted"),
        }),
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: "invalid-audio-target",
          detail: expect.stringContaining("audio"),
        }),
      ]),
    );
  });

  it("validates an activity-only example in a phonetic lesson", () => {
    const target: BaseExample = {
      ...EXAMPLES[0],
      id: "phonetic-activity-only-invalid-example",
      tokens: [],
      lexemeIds: ["missing-phonetic-activity-lexeme"],
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [target.id, target]]),
    };
    const lesson = {
      ...phoneticLesson(),
      activities: [
        { ...phoneticLesson().activities[0], targetId: target.id },
        ...phoneticLesson().activities.slice(1),
      ],
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-token-sequence",
          referenceId: target.id,
          detail: expect.stringContaining("activity target example"),
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-phonetic-activity-lexeme",
          detail: "activity target example lexeme",
        }),
      ]),
    );
  });
});

describe("Base sequence rules", () => {
  it("rejects duplicate, self, unknown, and non-earlier lesson prerequisites", () => {
    const lesson: BaseLessonContent = {
      ...phoneticLesson(),
      prerequisiteLessonIds: [
        "sounds-1",
        "sounds-1",
        "sounds-2",
        "base-synthesis-4",
        "unknown-lesson",
      ],
    };

    expect(validateBaseLessonDepth(lesson, CATALOGS)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-prerequisite",
          referenceId: "sounds-1",
        }),
        expect.objectContaining({
          code: "self-prerequisite",
          referenceId: "sounds-2",
        }),
        expect.objectContaining({
          code: "future-prerequisite",
          referenceId: "base-synthesis-4",
        }),
        expect.objectContaining({
          code: "invalid-prerequisite",
          referenceId: "unknown-lesson",
        }),
      ]),
    );
  });

  it("reports two-node prerequisite cycles with their ordering faults", () => {
    const validateGraph = (
      sequenceRules as unknown as {
        validateBaseLessonPrerequisiteGraph?: (
          lessons: readonly BaseLessonContent[],
        ) => readonly { readonly code: string; readonly referenceId?: string }[];
      }
    ).validateBaseLessonPrerequisiteGraph;
    expect(validateGraph).toBeTypeOf("function");
    if (!validateGraph) return;

    const soundsOne: BaseLessonContent = {
      ...phoneticLesson(),
      lessonId: "sounds-1",
      prerequisiteLessonIds: ["base-synthesis-4"],
    };
    const synthesis: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "base-synthesis-4",
      contract: "synthesis",
      newLexemeIds: [],
      introducedConceptIds: [],
      prerequisiteLessonIds: ["sounds-1"],
    };

    expect(validateGraph([soundsOne, synthesis])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "lesson-prerequisite-cycle",
        }),
        expect.objectContaining({
          code: "future-prerequisite",
          referenceId: "base-synthesis-4",
        }),
      ]),
    );
  });

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

  it("enforces particle-sense owners and phonetic activity assessments before teaching", () => {
    const objectExample: BaseExample = {
      ...EXAMPLES[0],
      id: "object-particle-before-teach",
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: "object-o" },
      },
    };
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      examples: new Map([...CATALOGS.examples, [objectExample.id, objectExample]]),
    };
    const particleLesson: BaseLessonContent = {
      ...systemLesson(),
      lessonId: "polite-verbs-4",
      contract: "content",
      newLexemeIds: [],
      introducedConceptIds: [],
      workedExampleIds: [objectExample.id],
    };
    const phonetic = phoneticLesson();
    if (phonetic.contract !== "phonetic") throw new Error("fixture contract");
    const phoneticWithFutureAssessment: BaseLessonContent = {
      ...phonetic,
      activities: phonetic.activities.map((activity, index) => ({
        ...activity,
        assessedConceptIds: index === 0 ? ["te-imasu"] : [],
        assessedLexemeIds: index === 0 ? ["verb-taberu"] : [],
      })),
    };

    expect(
      validateFirstTeachOrder(
        [particleLesson],
        BASE_FIRST_TEACH_OWNERS,
        catalogs,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "object-o",
        }),
      ]),
    );
    expect(
      validateFirstTeachOrder(
        [phoneticWithFutureAssessment],
        BASE_FIRST_TEACH_OWNERS,
        CATALOGS,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "te-imasu",
          detail: expect.stringContaining("activity assessment"),
        }),
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "verb-taberu",
          detail: expect.stringContaining("activity assessment"),
        }),
      ]),
    );
  });

  it("uses prompt, accepted-answer, and audio target provenance for early phonetic ownership", () => {
    const futureTarget = {
      tokens: [token("future-target-token", "高い")],
      lexemeIds: ["adjective-takai"],
      conceptIds: [],
      formIds: ["i-adjective-tense-polarity"],
      patternCellIds: [],
      semanticRoleIds: [],
      interpretationTags: [],
    };
    const phonetic = phoneticLesson();
    if (phonetic.contract !== "phonetic") throw new Error("fixture contract");
    const lesson: BaseLessonContent = {
      ...phonetic,
      lessonId: "sounds-1",
      prerequisiteLessonIds: [],
      activities: phonetic.activities.map((entry, index) =>
        index === 1
          ? {
              ...entry,
              targetId: "future-accepted",
              assessedConceptIds: [],
              assessedLexemeIds: [],
            }
          : entry.category === "listening"
            ? {
                ...entry,
                targetId: "future-audio",
                assessedConceptIds: [],
                assessedLexemeIds: [],
              }
            : {
                ...entry,
                assessedConceptIds: [],
                assessedLexemeIds: [],
              },
      ),
    };
    const catalogs = {
      ...CATALOGS,
      activityPromptTargets: new Map([["activity-1", futureTarget]]),
      acceptedAnswerTargets: new Map([["future-accepted", futureTarget]]),
      audioTargets: new Map([["future-audio", futureTarget]]),
    } as unknown as BaseValidationCatalogs;

    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "adjective-takai",
          detail: "activity prompt",
        }),
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "adjective-takai",
          detail: "activity accepted target",
        }),
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "adjective-takai",
          detail: "activity audio target",
        }),
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "i-adjective-tense-polarity",
        }),
      ]),
    );
  });

  it("validates references and particle frames declared on accepted target provenance", () => {
    const invalidTarget = {
      tokens: [token("invalid-target-token", "悪")],
      lexemeIds: ["missing-target-lexeme"],
      conceptIds: ["missing-target-concept"],
      formIds: ["missing-target-form"],
      patternCellIds: ["missing-target-pattern"],
      semanticRoleIds: [],
      interpretationTags: [],
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: "goal-ni" },
      },
    };
    const lesson = {
      ...systemLesson(),
      activities: [
        { ...SEMANTIC_ACTIVITIES[0], targetId: "invalid-provenance-target" },
        ...SEMANTIC_ACTIVITIES.slice(1),
      ],
    };
    const catalogs = {
      ...CATALOGS,
      acceptedAnswerTargets: new Map([
        ["invalid-provenance-target", invalidTarget],
      ]),
    } as unknown as BaseValidationCatalogs;

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-target-lexeme",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-target-concept",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-target-form",
        }),
        expect.objectContaining({
          code: "unresolved-reference",
          referenceId: "missing-target-pattern",
        }),
        expect.objectContaining({
          code: "unlicensed-particle",
          referenceId: "invalid-provenance-target",
        }),
      ]),
    );
  });

  it("reports an explicit undefined particle role on target provenance without crashing", () => {
    const target = visibleTarget([token("undefined-particle-token", "悪")], {
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: undefined },
      },
    });
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        ["undefined-particle-target", target],
      ]),
    };
    const phonetic = phoneticLesson();
    const lesson: BaseLessonContent = {
      ...phonetic,
      activities: [
        { ...phonetic.activities[0], targetId: "undefined-particle-target" },
        ...phonetic.activities.slice(1),
      ],
    };

    expect(() => validateBaseLessonDepth(lesson, catalogs)).not.toThrow();
    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-particle-frame",
          referenceId: "undefined-particle-target",
          detail: "missing-role",
        }),
      ]),
    );
  });

  it("fails closed when sequence validation receives a nullish particle map", () => {
    const target = visibleTarget([token("null-particle-token", "悪")], {
      particleFrame: {
        predicateSenseId: "eat",
        provided: null,
      } as unknown as BaseVisibleTarget["particleFrame"],
    });
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        ["null-particle-target", target],
      ]),
    };
    const phonetic = phoneticLesson();
    const lesson: BaseLessonContent = {
      ...phonetic,
      activities: [
        { ...phonetic.activities[0], targetId: "null-particle-target" },
        ...phonetic.activities.slice(1),
      ],
    };

    expect(() =>
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).not.toThrow();
    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-particle-frame",
          referenceId: "null-particle-target",
        }),
      ]),
    );
  });

  it("checks canonical token-source references against explicit target provenance without deriving ownership from them", () => {
    const target = visibleTarget(
      [
        {
          ...token("source-backed-target-token", "高"),
          source: { domain: "test", referenceId: "adjective-takai" },
        },
      ],
      { lexemeIds: [] },
    );
    const catalogs: BaseValidationCatalogs = {
      ...CATALOGS,
      acceptedAnswerTargets: new Map([
        ...CATALOGS.acceptedAnswerTargets,
        ["source-backed-target", target],
      ]),
    };
    const phonetic = phoneticLesson();
    const lesson: BaseLessonContent = {
      ...phonetic,
      activities: [
        { ...phonetic.activities[0], targetId: "source-backed-target" },
        ...phonetic.activities.slice(1),
      ],
    };

    expect(validateBaseLessonDepth(lesson, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "target-provenance-mismatch",
          referenceId: "adjective-takai",
        }),
      ]),
    );
    expect(
      validateFirstTeachOrder([lesson], BASE_FIRST_TEACH_OWNERS, catalogs),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "first-teach-before-owner",
          referenceId: "adjective-takai",
        }),
      ]),
    );
  });
});
