import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import { BASE_CONCEPT_BY_ID } from "../catalog/concepts";
import { BASE_FIRST_TEACH_OWNERS } from "../catalog/firstTeach";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type {
  BaseActivityDefinition,
  BaseDialogue,
  BaseExample,
  BaseLessonContent,
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
    boundaryBefore: "space",
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
    semanticFingerprint: `example-fingerprint-${index}`,
    teachingPurposeCopyId: `purpose-${index}`,
    translationCopy: { copyId: `translation-${index}` },
    predicateAspect: "dynamic",
    interpretationTags: ["habitual"],
  };
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
    semanticFingerprint: `dialogue-fingerprint-${index}`,
  })),
};

function activity(
  index: number,
  category: BaseActivityDefinition["category"],
  mode: BaseActivityDefinition["mode"] = "non-spoken",
): BaseActivityDefinition {
  return {
    id: `activity-${index}`,
    category,
    interactionKind:
      category === "listening" ? "listening" : category === "spoken" ? "spoken" : "choice",
    mode,
    targetId: mode === "audio" && category === "listening" ? "audio-1" : `answer-${index}`,
    targetOperationFingerprint: `operation-${index}`,
    instructionCopyId: `instruction-${index}`,
    acceptedFeedbackCopyId: `accepted-${index}`,
    retryFeedbackCopyId: `retry-${index}`,
    assessedConceptIds: ["dictionary-lemma"],
    assessedLexemeIds: ["verb-kaku"],
  };
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
  ...Array.from({ length: 10 }, (_, index) => [
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
  audioIds: new Set(["audio-1", "audio-2", "audio-3", "audio-4", "audio-5", "audio-6"]),
  copyIds: COPY_IDS,
  referenceSnapshotIds: new Set(["reference-sentence-order"]),
  patternCellIds: new Set(["cell-1", "cell-2"]),
  acceptedAnswerTokens: new Map(
    Array.from({ length: 10 }, (_, index) => [
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
      activity(1, "meaning-comprehension"),
      activity(2, "form-function-discrimination"),
      activity(3, "ordering"),
      activity(4, "controlled-production"),
      activity(5, "transformation"),
      activity(6, "error-diagnosis"),
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
      ...EXAMPLES[1],
      semanticFingerprint: EXAMPLES[0].semanticFingerprint,
    };
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
            turns: [{ ...DIALOGUE.turns[0], semanticFingerprint: EXAMPLES[0].semanticFingerprint }],
          },
        ],
      ]),
    };
    const mutated = {
      ...lesson,
      activities: [
        ...lesson.activities,
        { ...lesson.activities[0], id: "activity-extra", targetOperationFingerprint: "operation-extra" },
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
        { ...lesson.activities[8], targetOperationFingerprint: "operation-7" },
      ],
    };

    expect(codes(mutated)).toEqual(
      expect.arrayContaining([
        "semantic-nonspoken-activity-count",
        "duplicate-target-operation",
        "worked-example-reused-by-activity",
        "semantic-spoken-audio-count",
      ]),
    );
  });
});

describe("Base sequence rules", () => {
  it("uses authoring catalog tokens as the only Japanese visibility surface", () => {
    const lesson = {
      ...systemLesson(),
      lessonId: "requests-connection-4",
      workedExampleIds: ["example-1"],
      activities: [{ ...SEMANTIC_ACTIVITIES[0], targetId: "answer-1" }],
    };

    expect(visibleJapaneseFor([lesson], CATALOGS)).toBe("例1会1会2会3会4答1");
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
